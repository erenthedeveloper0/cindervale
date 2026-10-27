// Minimal PNG reader and writer for 8-bit RGB / RGBA images, which is what
// Chromium's screenshot API produces. Enough to crop screenshots and to run
// them through a color-vision simulation without an image library.
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Decode to { width, height, data } where data is RGBA, 4 bytes per pixel. */
export function decode(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG file');
  let offset = 8;
  let header;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  const { width, height, depth, color, interlace } = header;
  if (depth !== 8 || ![2, 6].includes(color) || interlace) throw new Error('Only 8-bit, non-interlaced RGB or RGBA PNGs are supported');
  const channels = color === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[x] = value & 255;
    }
  }
  if (channels === 4) return { width, height, data: pixels };
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
    data[j] = pixels[i];
    data[j + 1] = pixels[i + 1];
    data[j + 2] = pixels[i + 2];
    data[j + 3] = 255;
  }
  return { width, height, data };
}

function chunk(type, body) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed) >>> 0);
  return Buffer.concat([length, typed, crc]);
}

/** Encode an RGBA image as an opaque RGB PNG. */
export function encode({ width, height, data }) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const from = (y * width + x) * 4;
      const to = y * (stride + 1) + 1 + x * 3;
      raw[to] = data[from];
      raw[to + 1] = data[from + 1];
      raw[to + 2] = data[from + 2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

export function crop({ width, data }, left, top, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) data.copy(out, y * w * 4, ((top + y) * width + left) * 4, ((top + y) * width + left + w) * 4);
  return { width: w, height: h, data: out };
}

/** Downscale by an integer factor with a box filter (for 2× screenshots shown at 1×). */
export function shrink({ width, height, data }, factor) {
  const w = Math.floor(width / factor);
  const h = Math.floor(height / factor);
  const out = Buffer.alloc(w * h * 4);
  const n = factor * factor;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sum = [0, 0, 0, 0];
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = ((y * factor + dy) * width + x * factor + dx) * 4;
          for (let k = 0; k < 4; k++) sum[k] += data[i + k];
        }
      }
      for (let k = 0; k < 4; k++) out[(y * w + x) * 4 + k] = Math.round(sum[k] / n);
    }
  }
  return { width: w, height: h, data: out };
}
