import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all(
  ["index.html", "app.js", "styles.css", "favicon.svg"].map((file) =>
    cp(resolve(root, file), resolve(output, file)),
  ),
);
await Promise.all(
  ["js", "Assets"].map((directory) =>
    cp(resolve(root, directory), resolve(output, directory), {
      recursive: true,
    }),
  ),
);
