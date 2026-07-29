import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve(".open-next/server-functions/default");
const handlerPath = path.join(outputDirectory, "handler.mjs");
const manifestPath = path.join(
  outputDirectory,
  ".next/server/middleware-manifest.json",
);

const [handler, manifestSource] = await Promise.all([
  readFile(handlerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);

const dynamicManifestLoad = "require(this.middlewareManifestPath)";
if (!handler.includes(dynamicManifestLoad)) {
  throw new Error(
    "The expected Next.js middleware manifest load was not found in the Cloudflare bundle.",
  );
}

const manifest = JSON.parse(manifestSource);
const patchedHandler = handler.replace(
  dynamicManifestLoad,
  `(${JSON.stringify(manifest)})`,
);

await writeFile(handlerPath, patchedHandler);
console.log("Bundled the Next.js middleware manifest for Cloudflare Workers.");
