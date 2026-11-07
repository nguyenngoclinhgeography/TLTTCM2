(function (root) {
  'use strict';
  const FN = root.FIELDNOTE;
  const geo = FN.geo;
  const exp = FN.exporter;
  const $ = id => document.getElementById(id);
  const dates = { '1':'2026-09-13','2':'2026-09-14','3':'2026-09-15','4':'2026-09-16','5':'2026-09-17','6':'2026-09-18','7':'2026-09-19','8':'2026-09-20' };
  const fields = ['code','trip-day','title','place','date','time','author','description','lat','lng','maps-url','video-url'];
  const state = {
    kind: 'photo', imageFile: null, image: null, previewURL: null, loadToken: 0,
    editingId: null, entries: [], nextId: 1, map: null, previewTimer: null
  };

  function message(text = '', variant = '') {
    const elem = $('editor-status');
    elem.textContent = text;
    elem.className = 'status ' + variant;
  }

  function metaNow() {
    return {
      code: $('code').value.trim(), day: $('trip-day').value,
      title: $('title').value.trim(), place: $('place').value.trim(),
      date: $('date').value.trim(), time: $('time').value.trim(),
      author: $('author').value.trim(), description: $('description').value.trim(),
      lat: $('lat').value.trim(), lng: $('lng').value.trim(),
      mapsUrl: $('maps-url').value.trim(), videoUrl: $('video-url').value.trim()
    };
  }

  function nextCode(day) {
    const base = 'MC' + String(day).padStart(2, '0') + '-';
    let number = 1;
    const used = new Set(state.entries.map(item => item.meta.code.toUpperCase()));
    while (used.has((base + String(number).padStart(2, '0')).toUpperCase())) number++;
    return base + String(number).padStart(2, '0');
  }

  function typeChange(kind) {
    state.kind = kind;
    $('photo-fields').hidden = kind !== 'photo';
    $('video-fields').hidden = kind !== 'video';
    $('tab-photo').classList.toggle('is-active', kind === 'photo');
    $('tab-video').classList.toggle('is-active', kind === 'video');
    $('tab-photo').setAttribute('aria-pressed', String(kind === 'photo'));
    $('tab-video').setAttribute('aria-pressed', String(kind === 'video'));
    previewSoon();
  }

  function releaseDraft() {
    state.loadToken++;
    if (state.previewURL) URL.revokeObjectURL(state.previewURL);
    state.previewURL = null;
    state.imageFile = null;
    state.image = null;
  }

  async function chooseImage(file) {
    if (!file) return;
    if (!/^(image\/jpeg|image\/png|image\/webp)$/.test(file.type)) {
      message('Chỉ hỗ trợ ảnh JPG, PNG và WebP.', 'error');
      $('photo-file').value = '';
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      message('Ảnh vượt quá 35 MB. Hãy chọn ảnh nhỏ hơn.', 'error');
      $('photo-file').value = '';
      return;
    }
    releaseDraft();
    const token = state.loadToken;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (token !== state.loadToken) { URL.revokeObjectURL(url); return; }
      state.image = img;
      state.imageFile = file;
      state.previewURL = url;
      $('file-name').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB · ${img.naturalWidth} × ${img.naturalHeight}px`;
      message('Đã nhận ảnh. Bạn có thể điền thông tin và chọn tọa độ.', 'success');
      previewSoon();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      message('Không đọc được ảnh. Hãy thử ảnh JPG hoặc PNG khác.', 'error');
    };
    img.src = url;
  }

  function setCoordinates(lat, lng, centerMap = true) {
    if (!geo.valid(Number(lat), Number(lng))) return false;
    const a = Number(lat), b = Number(lng);
    $('lat').value = a.toFixed(6);
    $('lng').value = b.toFixed(6);
    state.map.setMarker(a, b, centerMap);
    previewSoon();
    return true;
  }

  function syncManualCoordinates() {
    const a = $('lat').value.trim(), b = $('lng').value.trim();
    if (!a && !b) {
      state.map.clearMarker();
      previewSoon();
      return;
    }
    if (!a || !b || !geo.valid(Number(a), Number(b))) {
      message('Vĩ độ cần nằm từ −90 đến 90; kinh độ từ −180 đến 180.', 'error');
      return;
    }
    setCoordinates(a, b, true);
    message('Đã cập nhật ghim từ tọa độ bạn nhập.', 'success');
  }

  function readGoogleMaps() {
    const raw = $('maps-url').value.trim();
    if (!raw) { message('Hãy dán cặp tọa độ hoặc liên kết Google Maps.', 'error'); return; }
    const coords = geo.parse(raw);
    if (!coords) {
      message('Chưa đọc được tọa độ. Với liên kết maps.app.goo.gl rút gọn, hãy mở link trên Google Maps, sao chép cặp vĩ độ, kinh độ và dán vào đây.', 'error');
      return;
    }
    setCoordinates(coords[0], coords[1], true);
    message('Đã lấy tọa độ. Hãy kiểm tra ghim trên bản đồ để xác nhận vị trí khảo sát.', 'success');
  }

  function previewSoon() {
    if (state.previewTimer) root.clearTimeout(state.previewTimer);
    state.previewTimer = root.setTimeout(renderPreview, 150);
  }

  function renderPreview() {
    const canvas = $('preview-canvas');
    const empty = $('preview-empty');
    if (state.kind !== 'photo' || !state.image) {
      canvas.style.display = 'none';
      empty.hidden = false;
      empty.querySelector('strong').textContent = state.kind === 'photo'
        ? 'Ảnh minh chứng hiển thị tại đây' : 'Liên kết video sẽ xuất trong danh mục';
      empty.querySelector('span').textContent = state.kind === 'photo'
        ? 'Tải ảnh lên để xem phần chú thích trước khi xuất.'
        : 'Có thể ghi chú và lưu đường dẫn video ở biểu mẫu.';
      $('download-one').disabled = true;
      return;
    }
    try {
      const rendered = exp.renderPhoto(state.image, metaNow(), true);
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      canvas.getContext('2d').drawImage(rendered, 0, 0);
      canvas.style.display = 'block';
      empty.hidden = true;
      $('download-one').disabled = false;
    } catch (err) {
      message('Không xem trước được ảnh: ' + err.message, 'error');
    }
  }

  function validate(meta) {
    if (!meta.title) return 'Bạn chưa nhập tên ảnh / tư liệu.';
    if (!meta.place) return 'Bạn chưa nhập địa điểm khảo sát.';
    if (!meta.code) return 'Bạn chưa nhập mã minh chứng.';
    if (state.entries.some(item => item.id !== state.editingId && item.meta.code.toLowerCase() === meta.code.toLowerCase())) {
      return 'Mã minh chứng đã tồn tại. Hãy chọn mã khác.';
    }
    if (meta.lat !== '' || meta.lng !== '') {
      if (meta.lat === '' || meta.lng === '' || !geo.valid(Number(meta.lat), Number(meta.lng))) {
        return 'Tọa độ chưa hợp lệ. Hãy nhập đủ vĩ độ và kinh độ, hoặc xóa cả hai ô.';
      }
    }
    if (state.kind === 'photo' && (!state.imageFile || !state.image)) return 'Bạn chưa tải ảnh hoặc ảnh chưa được đọc xong.';
    if (state.kind === 'video') {
      try {
        const url = new URL(meta.videoUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad');
      } catch (_) { return 'Bạn cần nhập liên kết video bắt đầu bằng https:// hoặc http://.'; }
    }
    return null;
  }

  function saveEntry() {
    const meta = metaNow();
    const error = validate(meta);
    if (error) { message(error, 'error'); return; }
    let item = state.entries.find(x => x.id === state.editingId);
    const edit = !!item;
    if (!item) {
      item = { id: state.nextId++ };
      state.entries.push(item);
    }
    if (item.thumbURL && (state.kind !== 'photo' || item.file !== state.imageFile)) {
      URL.revokeObjectURL(item.thumbURL);
      item.thumbURL = null;
    }
    item.kind = state.kind;
    item.meta = meta;
    if (state.kind === 'photo') {
      item.file = state.imageFile;
      item.image = state.image;
      if (!item.thumbURL) item.thumbURL = URL.createObjectURL(state.imageFile);
    } else {
      item.file = null;
      item.image = null;
    }
    renderEntries();
    resetForm();
    message(edit ? 'Đã cập nhật minh chứng.' : 'Đã lưu minh chứng vào danh sách.', 'success');
  }

  function resetForm() {
    const day = $('trip-day').value || '6';
    releaseDraft();
    $('photo-file').value = '';
    $('file-name').textContent = 'Chưa chọn ảnh';
    for (const field of fields) $(field).value = '';
    $('trip-day').value = day;
    $('date').value = dates[day];
    $('code').value = nextCode(day);
    state.editingId = null;
    $('save').textContent = '＋ Lưu minh chứng';
    state.map.clearMarker();
    typeChange('photo');
    message();
  }

  function editEntry(item) {
    releaseDraft();
    state.editingId = item.id;
    const m = item.meta;
    const values = {
      code:m.code, 'trip-day':m.day, title:m.title, place:m.place,
      date:m.date, time:m.time, author:m.author, description:m.description,
      lat:m.lat, lng:m.lng, 'maps-url':m.mapsUrl, 'video-url':m.videoUrl
    };
    for (const [field,value] of Object.entries(values)) $(field).value = value || '';
    if (item.kind === 'photo') {
      state.image = item.image;
      state.imageFile = item.file;
      $('file-name').textContent = `${item.file.name} · Đã lưu trong danh sách`;
    } else $('file-name').textContent = 'Chưa chọn ảnh';
    $('photo-file').value = '';
    typeChange(item.kind);
    if (m.lat !== '' && m.lng !== '' && geo.valid(Number(m.lat), Number(m.lng))) state.map.setMarker(Number(m.lat), Number(m.lng), true);
    else state.map.clearMarker();
    $('save').textContent = '✓ Cập nhật minh chứng';
    $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    message('Đang chỉnh sửa: ' + m.title, 'success');
    previewSoon();
  }

  function deleteEntry(item) {
    if (item.thumbURL) URL.revokeObjectURL(item.thumbURL);
    state.entries = state.entries.filter(x => x.id !== item.id);
    if (state.editingId === item.id) resetForm();
    renderEntries();
    message('Đã xóa một minh chứng khỏi danh sách.', 'success');
  }

  function renderEntries() {
    const target = $('entries');
    target.replaceChildren();
    $('count').textContent = String(state.entries.length);
    $('download-zip').disabled = !state.entries.length;
    if (!state.entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-list';
      empty.textContent = 'Chưa có minh chứng nào. Hãy nhập thông tin và nhấn “Lưu minh chứng”.';
      target.appendChild(empty);
      return;
    }
    for (const item of state.entries) {
      const card = document.createElement('div');
      card.className = 'entry';
      const thumb = document.createElement('div');
      thumb.className = 'entry-thumb';
      if (item.kind === 'photo') {
        const img = document.createElement('img');
        img.src = item.thumbURL;
        img.alt = 'Ảnh thu nhỏ: ' + item.meta.title;
        thumb.appendChild(img);
      } else thumb.textContent = '▶ VIDEO';
      card.appendChild(thumb);
      const content = document.createElement('div');
      content.className = 'entry-content';
      const title = document.createElement('strong');
      title.textContent = `${item.meta.code} · ${item.meta.title}`;
      const desc = document.createElement('p');
      desc.textContent = `${item.meta.place} · ${geo.dateText(item.meta.date) || 'Chưa ghi ngày'}`;
      const actions = document.createElement('div');
      actions.className = 'entry-actions';
      const edit = document.createElement('button');
      edit.type = 'button'; edit.textContent = 'Chỉnh sửa';
      edit.addEventListener('click', () => editEntry(item));
      actions.appendChild(edit);
      if (item.kind === 'photo') {
        const download = document.createElement('button');
        download.type = 'button'; download.textContent = 'Tải ảnh';
        download.addEventListener('click', () => downloadSaved(item));
        actions.appendChild(download);
      }
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'Xóa'; remove.className = 'delete';
      remove.addEventListener('click', () => deleteEntry(item));
      actions.appendChild(remove);
      content.append(title, desc, actions);
      card.appendChild(content);
      target.appendChild(card);
    }
  }

  async function downloadSaved(item) {
    try {
      const canvas = exp.renderPhoto(item.image, item.meta);
      const blob = await exp.canvasBlob(canvas);
      exp.download(blob, geo.safeName(item.meta.code + '-' + item.meta.title) + '.png');
      message('Đã tạo file ảnh PNG.', 'success');
    } catch (err) { message('Không xuất được ảnh: ' + err.message, 'error'); }
  }

  async function downloadCurrent() {
    if (state.kind !== 'photo' || !state.image) return;
    try {
      const canvas = exp.renderPhoto(state.image, metaNow());
      exp.download(await exp.canvasBlob(canvas), geo.safeName(($('code').value || 'MC') + '-' + ($('title').value || 'anh')) + '.png');
      message('Đã tạo ảnh PNG từ thông tin hiện tại.', 'success');
    } catch (err) { message('Không thể tạo ảnh: ' + err.message, 'error'); }
  }

  async function downloadZip() {
    const button = $('download-zip');
    if (!state.entries.length || button.disabled) return;
    button.disabled = true;
    button.textContent = 'Đang tạo ZIP…';
    message('Đang đóng gói các ảnh minh chứng và bảng danh mục…');
    try {
      const zip = new FN.ZipWriter();
      const rows = [];
      const usedNames = new Set();
      for (let i = 0; i < state.entries.length; i++) {
        const entry = state.entries[i];
        const row = { kind: entry.kind, meta: { ...entry.meta }, renderPath: '', originalPath: '' };
        if (entry.kind === 'photo') {
          let name = geo.safeName(entry.meta.code + '-' + entry.meta.title);
          const original = name;
          let suffix = 2;
          while (usedNames.has(name)) name = original + '-' + suffix++;
          usedNames.add(name);
          row.renderPath = 'anh-minh-chung/' + name + '.png';
          const extension = entry.file.type === 'image/png' ? '.png' : entry.file.type === 'image/webp' ? '.webp' : '.jpg';
          row.originalPath = 'anh-goc/' + name + '-goc' + extension;
          const output = await exp.canvasBlob(exp.renderPhoto(entry.image, entry.meta));
          zip.add(row.renderPath, output);
          zip.add(row.originalPath, entry.file);
        }
        rows.push(row);
        button.textContent = `Đang chuẩn bị ${i + 1}/${state.entries.length}…`;
        // Permit paint between expensive Canvas exports.
        await new Promise(resolve => root.setTimeout(resolve, 0));
      }
      const data = rows.map(row => ({
        type:row.kind, code:row.meta.code, day:row.meta.day, title:row.meta.title,
        place:row.meta.place, date:row.meta.date, time:row.meta.time,
        author:row.meta.author, description:row.meta.description,
        latitude:row.meta.lat, longitude:row.meta.lng,
        google_maps:geo.mapsLink(row.meta), original_google_url:row.meta.mapsUrl,
        video_url:row.meta.videoUrl, annotated_file:row.renderPath, original_file:row.originalPath
      }));
      zip.add('danh-muc-minh-chung.csv', exp.csv(rows));
      zip.add('danh-muc-minh-chung.json', JSON.stringify(data, null, 2));
      zip.add('thu-vien-minh-chung.html', exp.gallery(rows));
      zip.add('HUONG-DAN.txt', [
        'FIELDNOTE K49 - PHU LUC 3: BO ANH VA VIDEO MINH CHUNG',
        '',
        '1. Mo thu-vien-minh-chung.html de xem thu vien minh chung.',
        '2. Thu muc anh-minh-chung: anh PNG co dai thong tin o duoi.',
        '3. Thu muc anh-goc: anh nguyen ban de doi chieu.',
        '4. Danh muc CSV/JSON: ma, ngay, ten, dia diem, toa do va lien ket Google Maps.',
        '5. Video chi luu link trong danh muc va thu vien HTML (khong tai file video).',
        '6. Neu can xem qua QR: dang tai thu vien HTML va cac thu muc anh len hosting.',
        '7. Ngay, gio va toa do do nguoi dung nhap; can kiem tra voi tu lieu thuc.',
        '8. Khong chia se anh hoac dia chi rieng tu khi chua duoc dong y.'
      ].join('\r\n'));
      button.textContent = 'Đang nén dữ liệu…';
      const zipBlob = await zip.blob((processed, total) => {
        if (processed % 3 === 0 || processed === total) button.textContent = `Đang đóng gói ${processed}/${total}…`;
      });
      exp.download(zipBlob, 'FIELDNOTE-K49-PHU-LUC-3.zip');
      message(`Đã tạo ZIP gồm ${state.entries.length} minh chứng. Hãy kiểm tra ảnh và danh mục trước khi nộp.`, 'success');
    } catch (err) {
      console.error(err);
      message('Không xuất được ZIP: ' + err.message, 'error');
    } finally {
      button.textContent = '↓ Xuất toàn bộ ZIP';
      button.disabled = state.entries.length === 0;
    }
  }

  async function copyCoordinates() {
    const a = $('lat').value.trim(), b = $('lng').value.trim();
    if (!a || !b || !geo.valid(Number(a), Number(b))) {
      message('Hãy đặt ghim hoặc nhập tọa độ trước khi sao chép.', 'error');return;
    }
    const value = `${Number(a).toFixed(6)}, ${Number(b).toFixed(6)}`;
    try {
      if (navigator.clipboard && root.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const temporary = document.createElement('textarea');
        temporary.value = value;
        document.body.appendChild(temporary);
        temporary.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard không khả dụng');
        temporary.remove();
      }
      message('Đã sao chép tọa độ: ' + value, 'success');
    } catch (_) { message('Không tự sao chép được. Bạn có thể chọn và sao chép trực tiếp hai ô tọa độ.', 'error'); }
  }

  function bindEvents() {
    $('tab-photo').addEventListener('click', () => typeChange('photo'));
    $('tab-video').addEventListener('click', () => typeChange('video'));
    $('photo-file').addEventListener('change', e => chooseImage(e.target.files[0]));
    const zone = $('dropzone');
    ['dragenter', 'dragover'].forEach(name => zone.addEventListener(name, e => {e.preventDefault();zone.classList.add('dragging');}));
    ['dragleave', 'drop'].forEach(name => zone.addEventListener(name, e => {e.preventDefault();zone.classList.remove('dragging');}));
    zone.addEventListener('drop', e => chooseImage(e.dataTransfer.files[0]));
    for (const id of ['code','title','place','date','time','author','description']) $(id).addEventListener('input', previewSoon);
    $('trip-day').addEventListener('change', e => {
      const newDay = e.target.value;
      if (!$('date').value || Object.values(dates).includes($('date').value)) $('date').value = dates[newDay];
      if (!state.editingId) $('code').value = nextCode(newDay);
      previewSoon();
    });
    ['lat','lng'].forEach(id => {
      $(id).addEventListener('input', previewSoon);
      $(id).addEventListener('change', syncManualCoordinates);
    });
    $('read-maps').addEventListener('click', readGoogleMaps);
    $('maps-url').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); readGoogleMaps(); }
    });
    $('open-google').addEventListener('click', () => {
      root.open(geo.mapsLink(metaNow()), '_blank', 'noopener,noreferrer');
    });
    $('copy-coords').addEventListener('click', copyCoordinates);
    $('clear-coords').addEventListener('click', () => {
      $('lat').value = '';
      $('lng').value = '';
      state.map.clearMarker();
      previewSoon();
      message('Đã bỏ ghim tọa độ.', 'success');
    });
    $('zoom-in').addEventListener('click', () => state.map.zoomBy(1));
    $('zoom-out').addEventListener('click', () => state.map.zoomBy(-1));
    $('zoom-reset').addEventListener('click', () => state.map.reset());
    $('save').addEventListener('click', saveEntry);
    $('reset').addEventListener('click', resetForm);
    $('download-one').addEventListener('click', downloadCurrent);
    $('download-zip').addEventListener('click', downloadZip);
    $('clear-all').addEventListener('click', () => {
      if (!state.entries.length || !root.confirm('Bạn muốn xóa toàn bộ minh chứng trong tab này?')) return;
      for (const item of state.entries) if (item.thumbURL) URL.revokeObjectURL(item.thumbURL);
      state.entries = [];
      resetForm();
      renderEntries();
      message('Danh sách đã được làm trống.', 'success');
    });
    root.addEventListener('beforeunload', e => {
      if (state.entries.length) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  state.map = new FN.MapPicker({
    viewport: $('map-viewport'), tiles: $('map-tiles'), pin: $('map-pin'),
    hint: $('map-loading'), centerLabel: $('map-center'),
    onPick(lat, lng) {
      setCoordinates(lat, lng, false);
      message('Đã chọn vị trí từ bản đồ. Hãy đối chiếu với địa điểm bạn thực sự khảo sát.', 'success');
    }
  });
  bindEvents();
  renderEntries();
  previewSoon();
  FN.debug = { state, metaNow }; // Small, read-only-inspection hook for local quality checks.
})(window);
