(function (root) {
  'use strict';
  const FN = root.FIELDNOTE = root.FIELDNOTE || {};
  const encoder = new TextEncoder();
  const CRC_TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    CRC_TABLE[n] = c >>> 0;
  }

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  async function toBytes(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
    return encoder.encode(String(data ?? ''));
  }

  async function deflate(bytes) {
    if (!('CompressionStream' in root)) return null;
    try {
      const zipped = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(zipped).arrayBuffer());
    } catch (_) {
      return null;
    }
  }

  function dosTimeDate(date) {
    const year = Math.max(1980, Math.min(2107, date.getFullYear()));
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, day };
  }

  function localHeader(nameBytes, method, checksum, dataLength, rawLength, date) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    const dt = dosTimeDate(date);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);  // Minimum ZIP version.
    view.setUint16(6, 0x0800, true); // UTF-8 filenames.
    view.setUint16(8, method, true);
    view.setUint16(10, dt.time, true);
    view.setUint16(12, dt.day, true);
    view.setUint32(14, checksum, true);
    view.setUint32(18, dataLength, true);
    view.setUint32(22, rawLength, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    return header;
  }

  function centralHeader(nameBytes, method, checksum, dataLength, rawLength, offset, date) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);
    const dt = dosTimeDate(date);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, method, true);
    view.setUint16(12, dt.time, true);
    view.setUint16(14, dt.day, true);
    view.setUint32(16, checksum, true);
    view.setUint32(20, dataLength, true);
    view.setUint32(24, rawLength, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, offset, true);
    header.set(nameBytes, 46);
    return header;
  }

  class ZipWriter {
    constructor() { this.files = []; }
    add(filename, data) {
      if (typeof filename !== 'string' || !filename || filename.startsWith('/') || filename.includes('..')) {
        throw new Error('Đường dẫn trong ZIP không hợp lệ.');
      }
      this.files.push({ filename: filename.replace(/\\/g, '/'), data });
    }
    async blob(onProgress) {
      if (this.files.length > 65535) throw new Error('Quá nhiều file cho định dạng ZIP này.');
      const chunks = [];
      const central = [];
      let offset = 0;
      const now = new Date();
      for (let index = 0; index < this.files.length; index++) {
        const file = this.files[index];
        const name = encoder.encode(file.filename);
        const raw = await toBytes(file.data);
        const compressed = await deflate(raw);
        const useDeflate = !!compressed && compressed.length < raw.length;
        const body = useDeflate ? compressed : raw;
        if (raw.length > 0xFFFFFFFF || body.length > 0xFFFFFFFF || offset > 0xFFFFFFFF) {
          throw new Error('Bộ dữ liệu lớn hơn giới hạn ZIP 4 GB.');
        }
        const checksum = crc32(raw);
        const method = useDeflate ? 8 : 0;
        const local = localHeader(name, method, checksum, body.length, raw.length, now);
        chunks.push(local, body);
        central.push(centralHeader(name, method, checksum, body.length, raw.length, offset, now));
        offset += local.length + body.length;
        if (onProgress) onProgress(index + 1, this.files.length);
      }
      const centralSize = central.reduce((sum, part) => sum + part.length, 0);
      if (offset + centralSize > 0xFFFFFFFF) throw new Error('File ZIP quá lớn.');
      const end = new Uint8Array(22);
      const view = new DataView(end.buffer);
      view.setUint32(0, 0x06054b50, true);
      view.setUint16(8, this.files.length, true);
      view.setUint16(10, this.files.length, true);
      view.setUint32(12, centralSize, true);
      view.setUint32(16, offset, true);
      return new Blob([...chunks, ...central, end], { type: 'application/zip' });
    }
  }

  FN.ZipWriter = ZipWriter;
})(window);
