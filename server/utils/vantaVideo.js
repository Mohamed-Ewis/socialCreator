import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RENDER_DIR = path.join(process.cwd(), "output", "renders");
const SCRIPT = path.join(process.cwd(), "scripts", "render-news.mjs");
const pending = [];
let pumping = false;

function asString(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function isRenderId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
}

function statusPath(id) {
  return path.join(RENDER_DIR, `${id}.status.json`);
}

function propsPath(id) {
  return path.join(RENDER_DIR, `${id}.json`);
}

async function writeStatus(id, patch) {
  const file = statusPath(id);
  let current = { id };
  try {
    current = JSON.parse(await readFile(file, "utf8"));
  } catch {
    current = { id };
  }

  await writeFile(file, JSON.stringify({
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  }));
}

export function toRenderProps({ region, category, stories, script }) {
  return {
    region,
    category,
    stories: stories.map((story) => ({
      id: asString(story?.id),
      title: asString(story?.title),
      brief: asString(story?.brief),
      media: {
        kind: story?.media?.kind === "video" ? "video" : "image",
        url: asString(story?.media?.url) || asString(story?.image?.url),
      },
    })),
    script: script
      ? {
          language: asString(script.language) || (region === "world" ? "en" : "ar"),
          voice: asString(script.voice) || (region === "world" ? "american-conversational" : "egyptian-light"),
          hook: asString(script.hook),
          outro: asString(script.outro),
          beats: Array.isArray(script.beats)
            ? script.beats.map((beat) => ({
                storyId: asString(beat?.storyId),
                spoken: asString(beat?.spoken),
                onScreen: asString(beat?.onScreen),
                estimatedSeconds: Number(beat?.estimatedSeconds) || 0,
              }))
            : [],
        }
      : null,
  };
}

function runOne(id) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, id], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", async (error) => {
      await writeStatus(id, {
        status: "failed",
        progress: 100,
        url: "",
        errorMessage: error?.message || "Could not start the Vanta renderer.",
      }).catch(() => {});
      resolve();
    });

    child.on("close", async (code) => {
      if (code !== 0) {
        try {
          const current = JSON.parse(await readFile(statusPath(id), "utf8"));
          if (current.status === "rendering" || current.status === "planned") {
            await writeStatus(id, {
              status: "failed",
              progress: 100,
              url: "",
              errorMessage: current.errorMessage || `Vanta render exited with code ${code}.`,
            });
          }
        } catch {
          await writeStatus(id, {
            status: "failed",
            progress: 100,
            url: "",
            errorMessage: `Vanta render exited with code ${code}.`,
          }).catch(() => {});
        }
      }
      resolve();
    });
  });
}

async function pump() {
  if (pumping) {
    return;
  }

  pumping = true;
  while (pending.length) {
    const id = pending.shift();
    await runOne(id);
  }
  pumping = false;
}

export async function startVantaRender({ region, category, stories, script }) {
  const id = randomUUID();
  const props = toRenderProps({ region, category, stories, script });

  await mkdir(RENDER_DIR, { recursive: true });
  await writeFile(propsPath(id), JSON.stringify(props));
  await writeStatus(id, {
    status: "planned",
    progress: 1,
    url: "",
    errorMessage: "",
    category,
    region,
  });

  pending.push(id);
  void pump();

  return {
    id,
    status: "planned",
    url: "",
    category,
    region,
  };
}

export async function getVantaRender(id) {
  if (!isRenderId(id)) {
    return null;
  }

  try {
    return JSON.parse(await readFile(statusPath(id), "utf8"));
  } catch {
    return null;
  }
}
