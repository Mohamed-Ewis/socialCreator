import { createReadStream } from "node:fs";
import { isRenderId } from "../../utils/vantaVideo.js";
import { stat } from "node:fs/promises";
import path from "node:path";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!isRenderId(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid render id.",
    });
  }

  const filePath = path.join(process.cwd(), "output", "renders", `${id}.mp4`);
  let info;

  try {
    info = await stat(filePath);
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: "Render file not found.",
    });
  }

  setHeader(event, "Content-Type", "video/mp4");
  setHeader(event, "Accept-Ranges", "bytes");

  const range = getRequestHeader(event, "range");
  const match = range ? /bytes=(\d+)-(\d*)/.exec(range) : null;

  if (match) {
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : info.size - 1;
    setResponseStatus(event, 206);
    setHeader(event, "Content-Range", `bytes ${start}-${end}/${info.size}`);
    setHeader(event, "Content-Length", String(end - start + 1));
    return sendStream(event, createReadStream(filePath, { start, end }));
  }

  setHeader(event, "Content-Length", String(info.size));
  return sendStream(event, createReadStream(filePath));
});
