import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const client = resolve(output, "client");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "server"), { recursive: true });
await mkdir(resolve(output, ".openai"), { recursive: true });
await mkdir(client, { recursive: true });
await mkdir(resolve(client, "Assets"), { recursive: true });

await Promise.all(
  ["index.html", "app.js", "styles.css", "favicon.svg"].map((file) =>
    cp(resolve(root, file), resolve(client, file)),
  ),
);
await cp(resolve(root, "js"), resolve(client, "js"), {
  recursive: true,
});
await cp(
  resolve(root, "Assets/Character"),
  resolve(client, "Assets/Character"),
  { recursive: true },
);

await cp(
  resolve(root, "sites/worker.js"),
  resolve(output, "server/index.js"),
);
await cp(
  resolve(root, ".openai/hosting.json"),
  resolve(output, ".openai/hosting.json"),
);
