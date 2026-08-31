import sharp from "sharp";
import fs from "fs";
import path from "path";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#006F45"/>
  <circle cx="256" cy="256" r="180" fill="#ffffff"/>
  <path d="M280 146c-60.75 0-110 49.25-110 110s49.25 110 110 110c33.53 0 63.43-14.96 83.56-38.58-48.01 1.09-89.26-34.99-89.26-82.84 0-47.85 41.25-83.93 89.26-82.84C343.43 160.96 313.53 146 280 146z" fill="#ED1C24"/>
</svg>`;

async function run() {
  const publicDir = path.join(process.cwd(), "public");
  const svgBuf = Buffer.from(svg);
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Successfully generated PWA icons: icon-192.png, icon-512.png, apple-touch-icon.png");
}

run();
