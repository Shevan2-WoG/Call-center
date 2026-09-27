import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal CRC32 table & calculator
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, len + 8);
  chunk.writeUInt32BE(crc32(typeAndData), len + 8);
  return chunk;
}

function encodePNG(width, height, getPixel) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines (Filter byte 0 = None for each row)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Color palette
const C_DARK_BG = [36, 12, 84, 255]; // #240c54
const C_PURPLE = [108, 40, 245, 255]; // #6c28f5
const C_LIME = [136, 214, 0, 255]; // #88d600
const C_WHITE = [255, 255, 255, 255];
const C_PINK = [255, 42, 133, 255]; // #ff2a85

function renderAppIcon(x, y, w, h, isMaskable = false) {
  // Normalize to -1..1 coordinates
  const nx = (x - w / 2) / (w / 2);
  const ny = (y - h / 2) / (h / 2);
  const distCenter = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: dark purple with subtle radial lighting
  const gradT = (ny + 1) / 2; // 0 at top, 1 at bottom
  let bgR = Math.round(48 - gradT * 28 + (1 - distCenter) * 20);
  let bgG = Math.round(18 - gradT * 10 + (1 - distCenter) * 12);
  let bgB = Math.round(110 - gradT * 60 + (1 - distCenter) * 45);
  bgR = Math.max(0, Math.min(255, bgR));
  bgG = Math.max(0, Math.min(255, bgG));
  bgB = Math.max(0, Math.min(255, bgB));

  // If maskable, safe zone scale is tighter (~0.75 scale)
  const scale = isMaskable ? 0.72 : 0.88;
  const sx = nx / scale;
  const sy = ny / scale;
  const sDist = Math.sqrt(sx * sx + sy * sy);

  // Outer glowing circle
  if (sDist >= 0.82 && sDist <= 0.88) {
    return [108, 40, 245, 220];
  }

  // Inner central shield / circle
  if (sDist < 0.72) {
    // Phone handset silhouette approximation
    // Let's create a striking stylized phone emblem & radio waves
    const px = sx * 100;
    const py = sy * 100;

    // Center circular badge behind phone
    if (sDist < 0.58) {
      bgR = 30; bgG = 8; bgB = 70;
    }

    // Handset receiver geometry:
    // Left ear piece: (-25, -25) to (-10, -10)
    // Mouth piece: (-25, 25) to (-10, 10)
    // Handle arc linking them
    const hDist1 = Math.hypot(px - (-20), py - (-25));
    const hDist2 = Math.hypot(px - (-20), py - 25);
    const hDist3 = Math.hypot(px - (-12), py - 0);

    // Phone handset body
    if (
      (hDist1 < 16) ||
      (hDist2 < 16) ||
      (px > -32 && px < -12 && py >= -25 && py <= 25) ||
      (px >= -25 && px <= -5 && py >= -18 && py <= 18)
    ) {
      return C_LIME; // Neon lime phone handset
    }

    // Sound signal waves on right side
    const waveDist = Math.hypot(px - (-10), py - 0);
    // Wave 1
    if (px > 8 && waveDist >= 26 && waveDist <= 34 && Math.abs(py) <= 24) {
      return C_LIME;
    }
    // Wave 2
    if (px > 18 && waveDist >= 44 && waveDist <= 52 && Math.abs(py) <= 38) {
      return C_PINK;
    }
    // Wave 3
    if (px > 28 && waveDist >= 62 && waveDist <= 70 && Math.abs(py) <= 52) {
      return C_WHITE;
    }

    // Small status dot
    if (Math.hypot(px - 32, py - 40) < 6) {
      return C_LIME;
    }
  }

  // Bottom "KIU" bar if not maskable (maskable keeps outer clean)
  if (!isMaskable && ny > 0.65 && ny < 0.85 && Math.abs(nx) < 0.55) {
    return [108, 40, 245, 240];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192 PNG
const png192 = encodePNG(192, 192, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Generated pwa-192x192.png');

// 2. 512x512 PNG
const png512 = encodePNG(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Generated pwa-512x512.png');

// 3. 512x512 Maskable PNG (with 15% safe padding)
const pngMaskable = encodePNG(512, 512, (x, y, w, h) => renderAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('Generated pwa-maskable-512x512.png');

// 4. Apple Touch Icon 180x180 PNG
const appleIcon = encodePNG(180, 180, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Generated apple-touch-icon.png');

// 5. Favicon 64x64 PNG & copy as favicon.ico
const favicon = encodePNG(64, 64, (x, y, w, h) => renderAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
console.log('Generated favicon.ico');

console.log('All PWA icons generated successfully!');
