import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, ringColor = [245, 158, 11]) {
  // Create RGBA raw buffer
  const rowBytes = width * 4 + 1; // 1 filter byte per scanline
  const buffer = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.32;
  const innerR = width * 0.22;
  const gemR = width * 0.08;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    buffer[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check gem (top of the ring)
      const gemDx = x - cx;
      const gemDy = y - (cy - outerR + gemR * 0.5);
      const gemDist = Math.sqrt(gemDx * gemDx + gemDy * gemDy);

      if (gemDist <= gemR) {
        // Sparkling diamond gem (white/cyan)
        buffer[offset++] = 254; // R
        buffer[offset++] = 240; // G
        buffer[offset++] = 138; // B
        buffer[offset++] = 255; // A
      } else if (dist <= outerR && dist >= innerR) {
        // Gold band
        buffer[offset++] = ringColor[0];
        buffer[offset++] = ringColor[1];
        buffer[offset++] = ringColor[2];
        buffer[offset++] = 255;
      } else {
        // Background dark neutral
        buffer[offset++] = r;
        buffer[offset++] = g;
        buffer[offset++] = b;
        buffer[offset++] = 255;
      }
    }
  }

  // Compress IDAT
  const compressedIDAT = zlib.deflateSync(buffer);

  // Helper to write PNG chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);

    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([len, typeAndData, crc]);
  }

  // Simple CRC32
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte >>>= 1;
      }
    }
    return (crc ^ -1) | 0;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressedIDAT);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192 standard icon
const png192 = createPNG(192, 192, 18, 18, 18);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 512x512 standard icon
const png512 = createPNG(512, 512, 18, 18, 18);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Maskable icon with safe zone padding
const pngMaskable = createPNG(512, 512, 18, 18, 18, [245, 158, 11]);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Apple touch icon (180x180)
const appleIcon = createPNG(180, 180, 18, 18, 18);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('Successfully generated all PWA Android PNG icons!');
