import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const size = 192;
const input = path.join(root, "meeplez.jpg");

// 동그란 마스크 생성
const circle = Buffer.from(
  `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
);

sharp(input)
  .resize(size, size, { fit: "cover" })
  .composite([{ input: circle, blend: "dest-in" }])
  .png()
  .toFile(path.join(root, "public", "favicon.png"))
  .then(() => console.log("favicon.png generated"))
  .catch(console.error);
