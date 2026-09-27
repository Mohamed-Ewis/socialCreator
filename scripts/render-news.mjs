import { existsSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { narrateProps } from "./narrate.mjs";

const id = process.argv[2];
const root = process.cwd();
const renderDir = path.join(root, "output", "renders");
const propsPath = path.join(renderDir, `${id}.json`);
const statusPath = path.join(renderDir, `${id}.status.json`);
const outputLocation = path.join(renderDir, `${id}.mp4`);
const bundleDir = path.join(root, "output", "remotion-bundle");
const entryPoint = path.join(root, "remotion", "index.ts");

function assertId(value) {
  if (!/^[0-9a-f-]{36}$/i.test(value || "")) {
    throw new Error("A render id is required.");
  }
}

async function writeStatus(patch) {
  const current = existsSync(statusPath)
    ? JSON.parse(await readFile(statusPath, "utf8"))
    : { id };
  const next = {
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(statusPath, JSON.stringify(next));
}

function sourceIsNewer(bundleIndex) {
  const bundleTime = statSync(bundleIndex).mtimeMs;
  const files = ["remotion/index.ts", "remotion/Root.tsx", "remotion/NewsRundown.tsx"];
  return files.some((file) => statSync(path.join(root, file)).mtimeMs > bundleTime);
}

async function ensureBundle() {
  await mkdir(bundleDir, { recursive: true });
  const bundleIndex = path.join(bundleDir, "index.html");
  if (existsSync(bundleIndex) && !sourceIsNewer(bundleIndex)) {
    return bundleDir;
  }

  return bundle({
    entryPoint,
    outDir: bundleDir,
  });
}

async function main() {
  assertId(id);
  const inputProps = JSON.parse(await readFile(propsPath, "utf8"));
  await writeStatus({ status: "rendering", progress: 6, url: "", errorMessage: "" });

  const audioDir = path.join(renderDir, id, "audio");
  inputProps.tracks = await narrateProps(inputProps, audioDir, async (done, total) => {
    const progress = 6 + Math.round((done / Math.max(total, 1)) * 24);
    await writeStatus({ status: "rendering", progress, url: "", errorMessage: "" });
  });
  await writeFile(propsPath, JSON.stringify(inputProps));
  await writeStatus({ status: "rendering", progress: 32, url: "", errorMessage: "" });

  const serveUrl = await ensureBundle();
  const publicNarration = path.join(serveUrl, "public", "narration", id);
  await mkdir(publicNarration, { recursive: true });

  for (const track of inputProps.tracks || []) {
    if (!track.audioSrc) {
      continue;
    }

    const filename = path.basename(track.audioSrc);
    await copyFile(track.audioSrc, path.join(publicNarration, filename));
    track.audioSrc = `narration/${id}/${filename}`;
  }

  await writeFile(propsPath, JSON.stringify(inputProps));
  const composition = await selectComposition({
    serveUrl,
    id: "NewsRundown",
    inputProps,
  });

  let lastWrite = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    onProgress: ({ progress }) => {
      const now = Date.now();
      if (now - lastWrite < 700) {
        return;
      }
      lastWrite = now;
      const percent = Math.max(32, Math.min(99, 32 + Math.round(progress * 67)));
      writeStatus({ status: "rendering", progress: percent, url: "", errorMessage: "" }).catch(() => {});
    },
  });

  await writeStatus({
    status: "succeeded",
    progress: 100,
    url: `/renders/${id}`,
    errorMessage: "",
  });
}

main().catch(async (error) => {
  const message = error?.message || "Vanta render failed.";
  console.error("[render-news]", error);
  await writeStatus({
    status: "failed",
    progress: 100,
    url: "",
    errorMessage: message,
  }).catch(() => {});
  process.exitCode = 1;
});
