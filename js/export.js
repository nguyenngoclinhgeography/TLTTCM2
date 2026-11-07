(function (root) {
  'use strict';
  const FN = root.FIELDNOTE = root.FIELDNOTE || {};
  const geo = FN.geo;

  function wrap(ctx, text, width, maxLines) {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      let proposed = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(proposed).width > width && line) {
        lines.push(line);
        line = words[i];
      } else line = proposed;
      if (lines.length >= maxLines) break;
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length > maxLines) lines.length = maxLines;
    const textContent = words.join(' ');
    if (lines.length === maxLines && lines.join(' ').length < textContent.length) {
      let last = lines[maxLines - 1];
      while (last && ctx.measureText(last + '…').width > width) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function renderPhoto(image, meta, preview = false) {
    if (!image || !image.naturalWidth || !image.naturalHeight) throw new Error('Ảnh chưa tải xong.');
    const maxSide = preview ? 1150 : 3200;
    const scale = Math.min(1, maxSide / image.naturalWidth, maxSide / image.naturalHeight);
    const w = Math.max(1, Math.round(image.naturalWidth * scale));
    const h = Math.max(1, Math.round(image.naturalHeight * scale));
    const unit = Math.max(14, Math.min(37, w * .026));
    const pad = Math.max(16, Math.round(unit * 1.05));
    const contentWidth = w - pad * 2;
    if (contentWidth <= 20) throw new Error('Kích thước ảnh không được hỗ trợ.');
    const h1 = unit * 1.38, sub = unit * .96, body = unit * .85, small = unit * .75;
    const gap = unit * .35;
    const test = document.createElement('canvas').getContext('2d');
    test.font = `700 ${h1}px "Segoe UI", Arial, sans-serif`;
    const place = wrap(test, String(meta.place || meta.title || 'MINH CHỨNG THỰC ĐỊA').toLocaleUpperCase('vi-VN'), contentWidth, 2);
    test.font = `600 ${sub}px "Segoe UI", Arial, sans-serif`;
    const title = wrap(test, meta.title || '', contentWidth, 2);
    test.font = `${body}px "Segoe UI", Arial, sans-serif`;
    const description = wrap(test, meta.description || '', contentWidth, 3);
    const date = geo.dateText(meta.date);
    const time = meta.time || '';
    const dateRow = [date ? `NGÀY: ${date}` : '', time ? `GIỜ: ${time}` : '', meta.author ? `ẢNH / NGUỒN: ${meta.author}` : ''].filter(Boolean).join('   ·   ');
    const lat = Number(meta.lat), lng = Number(meta.lng);
    const locationRow = (meta.lat !== '' && meta.lng !== '' && geo.valid(lat, lng))
      ? `TỌA ĐỘ ĐIỂM KHẢO SÁT: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : '';
    test.font = `${small}px "Segoe UI", Arial, sans-serif`;
    const dateLines = wrap(test, dateRow, contentWidth, 2);
    const coordinateLines = wrap(test, locationRow, contentWidth, 2);
    const headerHeight = unit * .90;
    const line = (count, size, multiple) => count * size * multiple;
    const stripHeight = Math.ceil(
      pad * 2 + headerHeight + unit * .70 +
      line(place.length, h1, 1.2) + gap +
      (title.length ? line(title.length, sub, 1.25) + gap : 0) +
      (description.length ? line(description.length, body, 1.38) + gap : 0) +
      unit * .63 +
      line(dateLines.length + coordinateLines.length, small, 1.42) +
      (dateLines.length && coordinateLines.length ? gap : 0)
    );
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h + stripHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas.');
    ctx.drawImage(image, 0, 0, w, h);
    ctx.fillStyle = '#122b40';
    ctx.fillRect(0, h, w, stripHeight);
    ctx.fillStyle = '#bf965f';
    ctx.fillRect(0, h, w, Math.max(3, unit * .12));

    let y = h + pad;
    ctx.textBaseline = 'top';
    ctx.font = `700 ${headerHeight}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#e3bd83';
    const badge = String(meta.code || 'MC').toUpperCase();
    let header = 'FIELDNOTE K49 · PHỤ LỤC 3';
    if (ctx.measureText(header).width > contentWidth * .70) header = 'THỰC ĐỊA K49';
    ctx.fillText(header, pad, y);
    ctx.textAlign = 'right';
    ctx.fillText(badge.slice(0, 28), w - pad, y);
    ctx.textAlign = 'left';
    y += headerHeight + unit * .70;

    ctx.font = `700 ${h1}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    for (const row of place) { ctx.fillText(row, pad, y); y += h1 * 1.2; }
    y += gap;
    ctx.font = `600 ${sub}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#ecf1f3';
    for (const row of title) { ctx.fillText(row, pad, y); y += sub * 1.25; }
    if (title.length) y += gap;
    ctx.font = `${body}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#d4e0e7';
    for (const row of description) { ctx.fillText(row, pad, y); y += body * 1.38; }
    if (description.length) y += gap;
    ctx.strokeStyle = '#4b667a';
    ctx.lineWidth = Math.max(1, unit * .04);
    ctx.beginPath();ctx.moveTo(pad, y + unit * .10);ctx.lineTo(w - pad, y + unit * .10);ctx.stroke();
    y += unit * .63;
    ctx.font = `${small}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = '#c6d6df';
    for (const row of dateLines) { ctx.fillText(row, pad, y); y += small * 1.42; }
    if (dateLines.length && coordinateLines.length) y += gap;
    for (const row of coordinateLines) { ctx.fillText(row, pad, y); y += small * 1.42; }
    return canvas;
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không chuyển được ảnh sang PNG.')), 'image/png');
    });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }

  function csv(entries) {
    const head = ['Mã minh chứng','Loại','Ngày khảo sát','Tên ảnh/tư liệu','Địa điểm','Ngày chụp','Giờ chụp','Người chụp / nguồn','Mô tả','Vĩ độ','Kinh độ','Google Maps','Video URL','Ảnh chú thích','Ảnh gốc'];
    const lines = entries.map(row => {
      const m = row.meta;
      return [m.code,row.kind,m.day,m.title,m.place,m.date,m.time,m.author,m.description,m.lat,m.lng,geo.mapsLink(m),row.kind === 'video' ? m.videoUrl : '',row.renderPath || '',row.originalPath || ''];
    });
    const quote = value => {
      let str = String(value ?? '');
      // Prevent spreadsheet formula injection for textual, user-authored values.
      if (/^[\s]*[=+@]/.test(str)) str = "'" + str;
      return '"' + str.replace(/"/g,'""') + '"';
    };
    return '\ufeff' + [head,...lines].map(row => row.map(quote).join(',')).join('\r\n');
  }

  function gallery(entries) {
    const esc = geo.escapeHtml;
    const cards = entries.map(row => {
      const m = row.meta;
      const evidence = row.kind === 'photo'
        ? `<a href="${esc(row.renderPath)}" target="_blank" rel="noopener"><img src="${esc(row.renderPath)}" alt="${esc(m.title)}" loading="lazy"></a>`
        : `<a class="video" href="${esc(m.videoUrl)}" target="_blank" rel="noopener noreferrer">▶ Mở video minh chứng</a>`;
      const text = [geo.dateText(m.date), m.time, m.author].filter(Boolean).join(' · ');
      return `<article>${evidence}<div class="inside"><div class="code">${esc(m.code)} · NGÀY ${esc(m.day)}</div><h2>${esc(m.title)}</h2><strong>${esc(m.place)}</strong><p>${esc(m.description)}</p><small>${esc(text)}</small><p><a href="${esc(geo.mapsLink(m))}" target="_blank" rel="noopener noreferrer">Xem vị trí trên Google Maps ↗</a></p></div></article>`;
    }).join('');
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thư viện minh chứng thực địa K49</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f7f3;color:#1a3346;font-family:Arial,sans-serif}header{background:#122b40;padding:33px max(22px,calc((100% - 1100px)/2));color:white}header h1{font-size:26px;margin:0 0 7px}header p{color:#c5d5df;font-size:13px}main{max-width:1140px;padding:23px 20px;margin:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:17px}article{background:#fff;border:1px solid #dce5e7;border-radius:10px;overflow:hidden}article img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#eef2f3}.inside{padding:17px}.code{font-size:10px;color:#b1844c;font-weight:bold;letter-spacing:.05em}.inside h2{font-size:18px;margin:8px 0}.inside strong{font-size:13px}p{font-size:12px;line-height:1.6;color:#596f80}small{font-size:11px;color:#708797}a{color:#306d88}a.video{display:block;background:#e8eff1;padding:70px 15px;text-align:center;font-weight:bold;text-decoration:none}</style></head><body><header><h1>PHỤ LỤC 3 · ẢNH VÀ VIDEO MINH CHỨNG</h1><p>Thực tế chuyên môn K49 · Hành trình Con đường Di sản Miền Trung · 13–20/09/2026</p></header><main>${cards}</main></body></html>`;
  }

  FN.exporter = { renderPhoto, canvasBlob, download, csv, gallery };
})(window);
