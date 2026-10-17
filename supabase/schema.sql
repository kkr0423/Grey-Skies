-- ============================================================
-- Grey Skies Looks — DBスキーマ
-- Supabase / PostgreSQL
--
-- 版: 0.4 (2026-09-26)
-- 関連: requirements.md / grey-skies-overview.md
--
-- 新規プロジェクトの初期スキーマ。
-- Supabase ダッシュボード > SQL Editor にそのまま貼って実行できる。
--
-- M1 で使うのは profiles / looks / look_images の3つのみ。
-- reports は M3、hypes と tags は M4 以降。
-- ============================================================


-- ------------------------------------------------------------
-- profiles  [M1]
--   Supabase の認証情報は auth.users にあるが、そこには
--   アプリ固有の列を足せない。public 側に profiles を作り、
--   同じ id を主キーとして 1対1 で紐づける。Supabase の定石。
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  bio          text,
  avatar_id    text,                       -- Cloudinary の public_id
  created_at   timestamptz not null default now()
);


-- ------------------------------------------------------------
-- looks  [M1]
--   worn_on   … 「いつ着たか」。アーカイブとして日付で並べるため
--   is_public … 非公開で始められるようにする。初期値 false
--   hype_count… M4 用のカウンタ。今は使わないが後付けが面倒なので置く
-- ------------------------------------------------------------
create table public.looks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  caption    text,
  worn_on    date not null default current_date,
  is_public  boolean not null default false,
  hype_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 自分のアーカイブを日付順に見る用
create index looks_user_worn_idx on public.looks (user_id, worn_on desc);
-- 公開フィード（新着順）用。部分インデックスにして公開分だけ持つ [M3]
create index looks_public_new_idx on public.looks (created_at desc) where is_public;
-- 公開フィード（人気順）用 [M4]
create index looks_public_hype_idx on public.looks (hype_count desc) where is_public;


-- ------------------------------------------------------------
-- look_images  [M1]
--   looks に image_1, image_2 ... と列を並べたくなるが、枚数が
--   変わるたびに列を足すことになるので必ず別テーブルにする。
--
--   画像は Cloudinary に type:authenticated で保存し、ここには
--   public_id だけを持つ。完全な配信URLは保存しない
--   （変換や配信設定を変えたときに全行の書き換えが必要になるため）。
--
--   width / height はレイアウトシフト防止（CLS）に使う。
--   M1 は position = 0 の1枚のみ。複数枚対応は M2。
-- ------------------------------------------------------------
create table public.look_images (
  id         uuid primary key default gen_random_uuid(),
  look_id    uuid not null references public.looks(id) on delete cascade,
  public_id  text not null,                -- Cloudinary public_id
  version    bigint,                       -- Cloudinary version（署名URL生成に使用）
  format     text,
  width      integer,
  height     integer,
  position   smallint not null default 0
);

create index look_images_look_idx on public.look_images (look_id, position);


-- ------------------------------------------------------------
-- reports  [M3]
--   公開ルックへの通報。UGCを公開する以上これなしでは出せない。
--   status は 'open' / 'actioned' / 'dismissed' を想定。
--   運営操作は当面 Supabase のコンソールから直接行う。
-- ------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  look_id     uuid not null references public.looks(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  detail      text,
  status      text not null default 'open',
  created_at  timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);


-- ------------------------------------------------------------
-- hypes  [M4]
--   主キーを (look_id, user_id) の複合にすることで
--   「同じ人が同じルックに2回hypeできない」がDBレベルで保証される。
--   アプリ側のチェックは同時リクエストで簡単に破られるので、
--   こういう制約は必ずDBに置く。
-- ------------------------------------------------------------
create table public.hypes (
  look_id    uuid not null references public.looks(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (look_id, user_id)
);


-- ------------------------------------------------------------
-- tags / look_tags  [M4]
-- ------------------------------------------------------------
create table public.tags (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table public.look_tags (
  look_id uuid not null references public.looks(id) on delete cascade,
  tag_id  uuid not null references public.tags(id) on delete cascade,
  primary key (look_id, tag_id)
);

create index look_tags_tag_idx on public.look_tags (tag_id);


-- ============================================================
-- hype_count 自動更新トリガ  [M4]
--   フィード表示のたびに count(*) を投げると、投稿が数万件に
--   なった時点で確実に遅くなる。カウンタを列で持ち、hypes の
--   増減に合わせて更新する。
--
--   security definer が重要：トリガは実行ユーザーの権限で動くため、
--   他人のルックの hype_count を更新できずRLSに弾かれる。
-- ============================================================
create function public.bump_hype_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.looks set hype_count = hype_count + 1 where id = new.look_id;
  elsif (tg_op = 'DELETE') then
    update public.looks set hype_count = hype_count - 1 where id = old.look_id;
  end if;
  return null;
end;
$$;

create trigger hypes_count_trigger
after insert or delete on public.hypes
for each row execute function public.bump_hype_count();


-- ============================================================
-- RLS (Row Level Security)
--   Supabase で最も重要な部分。フロントは anon key を持って
--   直接DBを叩くので、「誰がどの行を読み書きできるか」を
--   決めているのはこのポリシーだけ。書き忘れ = 全公開。
--
--   有効化した時点でデフォルトは「全拒否」。許可を1つずつ足す。
--
--   【必須】M2 の F-09 として、別アカウント2つを作り
--   「他人の非公開ルックが見えないこと」をブラウザで手動確認すること。
--   RLSの誤りは画面が正常に動くため、テストでは気づけない。
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.looks       enable row level security;
alter table public.look_images enable row level security;
alter table public.reports     enable row level security;
alter table public.hypes       enable row level security;
alter table public.tags        enable row level security;
alter table public.look_tags   enable row level security;


-- --- profiles ---
create policy "profiles: 誰でも読める"
  on public.profiles for select
  using (true);

create policy "profiles: 本人のみ作成"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "profiles: 本人のみ更新"
  on public.profiles for update
  using ((select auth.uid()) = id);


-- --- looks ---
-- 公開されているもの、または自分のもの
create policy "looks: 公開分と自分の分を読める"
  on public.looks for select
  using (is_public or (select auth.uid()) = user_id);

create policy "looks: 自分の分だけ作成"
  on public.looks for insert
  with check ((select auth.uid()) = user_id);

create policy "looks: 自分の分だけ更新"
  on public.looks for update
  using ((select auth.uid()) = user_id);

create policy "looks: 自分の分だけ削除"
  on public.looks for delete
  using ((select auth.uid()) = user_id);


-- --- look_images ---
-- 親の look が見えるなら画像も見える、という形に揃える
create policy "look_images: 親lookに従う"
  on public.look_images for select
  using (exists (
    select 1 from public.looks l
    where l.id = look_images.look_id
      and (l.is_public or l.user_id = (select auth.uid()))
  ));

create policy "look_images: 自分のlookにだけ追加"
  on public.look_images for insert
  with check (exists (
    select 1 from public.looks l
    where l.id = look_images.look_id
      and l.user_id = (select auth.uid())
  ));

create policy "look_images: 自分のlookのだけ削除"
  on public.look_images for delete
  using (exists (
    select 1 from public.looks l
    where l.id = look_images.look_id
      and l.user_id = (select auth.uid())
  ));


-- --- reports ---
-- 通報は投げられるが、読めるのは運営のみ（= クライアントからは読めない）
create policy "reports: ログインユーザーは通報できる"
  on public.reports for insert
  with check ((select auth.uid()) = reporter_id);

-- select ポリシーを意図的に作らない。
-- 運営は service_role キー経由（RLSを迂回）または Supabase コンソールで読む。


-- --- hypes ---
create policy "hypes: 誰でも読める"
  on public.hypes for select
  using (true);

create policy "hypes: 本人としてのみ追加"
  on public.hypes for insert
  with check ((select auth.uid()) = user_id);

create policy "hypes: 自分のだけ取り消せる"
  on public.hypes for delete
  using ((select auth.uid()) = user_id);


-- --- tags / look_tags ---
create policy "tags: 誰でも読める"
  on public.tags for select using (true);

create policy "tags: ログインユーザーは追加できる"
  on public.tags for insert
  with check ((select auth.uid()) is not null);

create policy "look_tags: 親lookに従う"
  on public.look_tags for select
  using (exists (
    select 1 from public.looks l
    where l.id = look_tags.look_id
      and (l.is_public or l.user_id = (select auth.uid()))
  ));

create policy "look_tags: 自分のlookにだけ付与"
  on public.look_tags for insert
  with check (exists (
    select 1 from public.looks l
    where l.id = look_tags.look_id
      and l.user_id = (select auth.uid())
  ));


-- ============================================================
-- 補足
--
-- 1. 画像は Cloudinary 側にあるため、Supabase Storage の
--    ポリシーは不要。代わりに Cloudinary の API Secret を
--    サーバー側に留めること（アップロードは必ずサーバーアクション経由）。
--
-- 2. Cloudinary の sign_url は改ざんを防ぐが有効期限を持たない。
--    生成URLを入手した者は無期限に再利用できる。
--    M3 で公開機能を入れる前に、この扱いを再検討すること。
--    （requirements.md 3.3「既知の制約」参照）
--
-- 3. auth.uid() を (select auth.uid()) と書いているのは実行計画上の
--    おまじない。行ごとに評価されるのを防ぐ。行数が増えると効いてくる。
-- ============================================================
