// Copies content/images/ to public/journal-images/ so journal images are
// served as static files. Runs before `next dev` and `next build`.
// public/journal-images/ is generated; edit content/images/ instead.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const from = "content/images";
const to = "public/journal-images";

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
if (existsSync(from)) {
  cpSync(from, to, {
    recursive: true,
    filter: (src) => !src.endsWith(".gitkeep"),
  });
}
