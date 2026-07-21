/**
 * 生成应用图标
 * 输出: build/icon.png (512x512), build/icon.ico (256x256, 多尺寸)
 *
 * 不依赖第三方库，直接生成 PNG 和 ICO 二进制
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE_PNG = 512
const SIZE_ICO = 256

// 竹绿色主题色
const COLORS = {
  primary: [0x4A, 0x7C, 0x59],
  dark:    [0x3A, 0x63, 0x47],
  light:   [0x6B, 0x9B, 0x76],
  white:   [0xFF, 0xFF, 0xFF]
}

// 生成像素数据 (RGBA)
function generatePixels(size) {
  const pixels = Buffer.alloc(size * size * 4)
  const center = size / 2
  const r = size * 0.42  // 外圆半径

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = x - center
      const dy = y - center
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= r) {
        // 圆内 - 竹绿色渐变
        const t = dist / r
        const c1 = COLORS.primary
        const c2 = COLORS.dark
        pixels[idx]     = c1[0] + (c2[0] - c1[0]) * t
        pixels[idx + 1] = c1[1] + (c2[1] - c1[1]) * t
        pixels[idx + 2] = c1[2] + (c2[2] - c1[2]) * t
        pixels[idx + 3] = 255

        // 在中心绘制 "AI" 文字的简化版本 - 两个白色竖条
        const barW = size * 0.06
        const barH = size * 0.22
        const gap  = size * 0.04
        const topY = center - barH / 2
        const botY = center + barH / 2

        // 左竖条 (A 的左边)
        if (x >= center - gap - barW && x <= center - gap &&
            y >= topY && y <= botY) {
          pixels[idx]     = COLORS.white[0]
          pixels[idx + 1] = COLORS.white[1]
          pixels[idx + 2] = COLORS.white[2]
        }
        // 右竖条 (A 的右边)
        if (x >= center + gap && x <= center + gap + barW &&
            y >= topY && y <= botY) {
          pixels[idx]     = COLORS.white[0]
          pixels[idx + 1] = COLORS.white[1]
          pixels[idx + 2] = COLORS.white[2]
        }
        // 中间横条 (A 的横)
        const midY = center
        const midH = size * 0.04
        if (x >= center - gap - barW && x <= center + gap + barW &&
            y >= midY - midH / 2 && y <= midY + midH / 2) {
          pixels[idx]     = COLORS.white[0]
          pixels[idx + 1] = COLORS.white[1]
          pixels[idx + 2] = COLORS.white[2]
        }
      } else {
        // 圆外 - 透明
        pixels[idx + 3] = 0
      }
    }
  }
  return pixels
}

// 生成 PNG 文件
function generatePNG(size, pixels) {
  // PNG 签名
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)      // width
  ihdr.writeUInt32BE(size, 4)      // height
  ihdr.writeUInt8(8, 8)            // bit depth
  ihdr.writeUInt8(6, 9)            // color type (RGBA)
  ihdr.writeUInt8(0, 10)           // compression
  ihdr.writeUInt8(0, 11)           // filter
  ihdr.writeUInt8(0, 12)           // interlace

  // IDAT chunk - 像素数据每行前加 filter byte (0)
  const rawData = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    rawData[y * (size * 4 + 1)] = 0  // filter: None
    pixels.copy(rawData, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const compressed = zlib.deflateSync(rawData)

  // IEND chunk
  const iend = Buffer.alloc(0)

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', iend)
  ])
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([typeBuf, data]))
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc >>> 0, 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

// CRC32
const crcTable = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return crc ^ -1
}

// 生成 ICO 文件 (包含多尺寸 PNG)
function generateICO(sizes, allPixels) {
  const headerSize = 6
  const dirSize = sizes.length * 16
  let offset = headerSize + dirSize

  const dirEntries = []
  const imageDatas = []

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]
    const png = generatePNG(size, allPixels[i])
    imageDatas.push(png)

    dirEntries.push({
      width: size === 256 ? 0 : size,
      height: size === 256 ? 0 : size,
      size: png.length,
      offset: offset
    })
    offset += png.length
  }

  // ICO Header
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type (1 = icon)
  header.writeUInt16LE(sizes.length, 4)

  // Directory entries
  const dirBuf = Buffer.alloc(dirSize)
  for (let i = 0; i < sizes.length; i++) {
    const e = dirEntries[i]
    const off = i * 16
    dirBuf.writeUInt8(e.width, off)
    dirBuf.writeUInt8(e.height, off + 1)
    dirBuf.writeUInt8(0, off + 2)  // color count
    dirBuf.writeUInt8(0, off + 3)  // reserved
    dirBuf.writeUInt16LE(1, off + 4)  // planes
    dirBuf.writeUInt16LE(32, off + 6) // bit count
    dirBuf.writeUInt32LE(e.size, off + 8)
    dirBuf.writeUInt32LE(e.offset, off + 12)
  }

  return Buffer.concat([header, dirBuf, ...imageDatas])
}

// 主函数
const buildDir = path.join(__dirname, '..', 'build')
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true })

// 生成各尺寸像素
const sizes = [16, 32, 48, 64, 128, 256]
const allPixels = sizes.map(s => generatePixels(s))

// 生成 ICO
const ico = generateICO(sizes, allPixels)
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)
console.log(`生成 icon.ico (${ico.length} bytes, ${sizes.length} 尺寸)`)

// 生成 512x512 PNG (linux/macOS)
const png512 = generatePNG(SIZE_PNG, generatePixels(SIZE_PNG))
fs.writeFileSync(path.join(buildDir, 'icon.png'), png512)
console.log(`生成 icon.png (${png512.length} bytes, ${SIZE_PNG}x${SIZE_PNG})`)

console.log('图标生成完成')