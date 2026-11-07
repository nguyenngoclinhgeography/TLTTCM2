(function (root) {
  'use strict';
  const FN = root.FIELDNOTE = root.FIELDNOTE || {};

  function valid(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function parse(raw) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const input = raw.trim();
    // Accept geographic coordinate pairs copied directly from Google Maps.
    const coordPattern = /^\s*(?:loc:)?\s*(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]+\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/i;
    const direct = input.match(coordPattern);
    if (direct) {
      const lat = Number(direct[1].replace(',', '.'));
      const lng = Number(direct[2].replace(',', '.'));
      if (valid(lat, lng)) return [lat, lng];
    }
    let url;
    try { url = new URL(input); } catch (_) { return null; }
    if (!/^https?:$/.test(url.protocol)) return null;
    // A place's !3d/!4d pair is preferable to the @... camera/viewport center.
    const decoded = decodeURIComponentSafe(url.href);
    const placeMatch = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (placeMatch && valid(+placeMatch[1], +placeMatch[2])) return [+placeMatch[1], +placeMatch[2]];
    for (const key of ['query', 'q', 'll', 'center', 'destination', 'daddr']) {
      const value = url.searchParams.get(key);
      if (!value) continue;
      const match = value.match(/(?:loc:)?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (match && valid(+match[1], +match[2])) return [+match[1], +match[2]];
    }
    const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch && valid(+atMatch[1], +atMatch[2])) return [+atMatch[1], +atMatch[2]];
    const queryMatch = decoded.match(/[?&#](?:lat|latitude)=(-?\d+(?:\.\d+)?)[&#].*?(?:lng|lon|longitude)=(-?\d+(?:\.\d+)?)/i);
    if (queryMatch && valid(+queryMatch[1], +queryMatch[2])) return [+queryMatch[1], +queryMatch[2]];
    return null;
  }

  function decodeURIComponentSafe(value) {
    try { return decodeURIComponent(value); } catch (_) { return value; }
  }

  function mapsLink(meta) {
    const lat = Number(meta.lat), lng = Number(meta.lng);
    const query = meta.lat !== '' && meta.lng !== '' && valid(lat, lng)
      ? `${lat},${lng}` : (meta.place || 'Việt Nam');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  }

  function dateText(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
  }

  function safeName(value) {
    return (String(value || 'minh-chung').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 88)) || 'minh-chung';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, chr => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[chr]);
  }

  FN.geo = { valid, parse, mapsLink, dateText, safeName, escapeHtml };
})(window);
