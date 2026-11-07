(function (root) {
  'use strict';
  const FN = root.FIELDNOTE = root.FIELDNOTE || {};
  const TILE_SIZE = 256;
  const DEFAULT = { lat: 15.75, lng: 107.85, zoom: 6 };

  function project(lat, lng, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const clippedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const latRad = clippedLat * Math.PI / 180;
    return {
      x: (lng + 180) / 360 * scale,
      y: (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * scale
    };
  }
  function unproject(x, y, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI;
    const lng = (x / scale) * 360 - 180;
    return { lat: Math.max(-85.05112878, Math.min(85.05112878, lat)), lng: ((lng + 540) % 360) - 180 };
  }

  class MapPicker {
    constructor(options) {
      this.viewport = options.viewport;
      this.tiles = options.tiles;
      this.pin = options.pin;
      this.hint = options.hint;
      this.centerLabel = options.centerLabel;
      this.onPick = options.onPick;
      this.center = { lat: DEFAULT.lat, lng: DEFAULT.lng };
      this.zoom = DEFAULT.zoom;
      this.selected = null;
      this.pointer = null;
      this.renderId = 0;
      this.resizeObserver = null;
      this.bind();
      this.render();
    }

    bind() {
      this.viewport.addEventListener('pointerdown', e => {
        if (e.button !== 0 && e.pointerType !== 'touch') return;
        const r = this.viewport.getBoundingClientRect();
        this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, rect: r, original: { ...this.center }, dragged: false };
        this.viewport.setPointerCapture(e.pointerId);
      });
      this.viewport.addEventListener('pointermove', e => {
        const p = this.pointer;
        if (!p || p.id !== e.pointerId) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) p.dragged = true;
        if (!p.dragged) return;
        this.viewport.classList.add('dragging');
        this.tiles.style.transform = `translate(${dx}px, ${dy}px)`;
        if (!this.pin.hidden) this.pin.style.translate = `${dx}px ${dy}px`;
      });
      const end = e => {
        const p = this.pointer;
        if (!p || p.id !== e.pointerId) return;
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        this.pointer = null;
        this.viewport.classList.remove('dragging');
        this.tiles.style.transform = '';
        this.pin.style.translate = '';
        if (p.dragged) {
          const orig = project(p.original.lat, p.original.lng, this.zoom);
          this.center = unproject(orig.x - dx, orig.y - dy, this.zoom);
          this.render();
        } else if (e.type === 'pointerup') {
          const position = this.screenToGeo(e.clientX - p.rect.left, e.clientY - p.rect.top);
          this.setMarker(position.lat, position.lng, false);
          if (typeof this.onPick === 'function') this.onPick(position.lat, position.lng);
        }
      };
      this.viewport.addEventListener('pointerup', end);
      this.viewport.addEventListener('pointercancel', end);
      this.viewport.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.setMarker(this.center.lat, this.center.lng, false);
          if (typeof this.onPick === 'function') this.onPick(this.center.lat, this.center.lng);
        }
      });
      this.viewport.tabIndex = 0;
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.render());
        this.resizeObserver.observe(this.viewport);
      } else {
        root.addEventListener('resize', () => this.render());
      }
    }

    screenToGeo(x, y) {
      const center = project(this.center.lat, this.center.lng, this.zoom);
      const rect = this.viewport.getBoundingClientRect();
      return unproject(center.x + x - rect.width / 2, center.y + y - rect.height / 2, this.zoom);
    }

    setView(lat, lng, zoom = this.zoom) {
      if (!FN.geo.valid(lat, lng)) return;
      this.center = { lat, lng };
      this.zoom = Math.max(3, Math.min(18, Math.round(zoom)));
      this.render();
    }

    setMarker(lat, lng, centerMap = true) {
      if (!FN.geo.valid(lat, lng)) return;
      this.selected = { lat, lng };
      if (centerMap) this.setView(lat, lng, Math.max(this.zoom, 12));
      else this.paintMarker();
    }

    clearMarker() {
      this.selected = null;
      this.paintMarker();
    }

    zoomBy(delta) {
      const zoom = Math.max(3, Math.min(18, this.zoom + delta));
      if (zoom !== this.zoom) {
        this.zoom = zoom;
        this.render();
      }
    }

    reset() { this.setView(DEFAULT.lat, DEFAULT.lng, DEFAULT.zoom); }

    paintMarker() {
      const value = this.selected;
      if (!value) { this.pin.hidden = true; return; }
      const center = project(this.center.lat, this.center.lng, this.zoom);
      const point = project(value.lat, value.lng, this.zoom);
      const rect = this.viewport.getBoundingClientRect();
      const world = TILE_SIZE * Math.pow(2, this.zoom);
      let dx = point.x - center.x;
      if (dx > world / 2) dx -= world;
      if (dx < -world / 2) dx += world;
      this.pin.style.left = (rect.width / 2 + dx) + 'px';
      this.pin.style.top = (rect.height / 2 + point.y - center.y) + 'px';
      this.pin.hidden = false;
    }

    render() {
      const width = this.viewport.clientWidth;
      const height = this.viewport.clientHeight;
      if (!width || !height) return;
      this.tiles.replaceChildren();
      this.tiles.style.transform = '';
      this.pin.style.translate = '';
      const center = project(this.center.lat, this.center.lng, this.zoom);
      const left = center.x - width / 2, top = center.y - height / 2;
      const world = Math.pow(2, this.zoom);
      const minX = Math.floor(left / TILE_SIZE), maxX = Math.floor((left + width) / TILE_SIZE);
      const minY = Math.floor(top / TILE_SIZE), maxY = Math.floor((top + height) / TILE_SIZE);
      const fragment = document.createDocumentFragment();
      const token = ++this.renderId;
      let loaded = false;
      const overlay = this.hint;
      overlay.hidden = false;
      overlay.textContent = 'Đang tải nền bản đồ…';
      // Requests only tiles in the visible viewport; no prefetch or offline tile download.
      for (let ty = minY; ty <= maxY; ty++) {
        if (ty < 0 || ty >= world) continue;
        for (let tx = minX; tx <= maxX; tx++) {
          const tileX = ((tx % world) + world) % world;
          const img = document.createElement('img');
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          img.style.left = (tx * TILE_SIZE - left) + 'px';
          img.style.top = (ty * TILE_SIZE - top) + 'px';
          img.addEventListener('load', () => {
            if (token !== this.renderId) return;
            loaded = true;
            overlay.hidden = true;
          }, { once: true });
          img.src = `https://tile.openstreetmap.org/${this.zoom}/${tileX}/${ty}.png`;
          fragment.appendChild(img);
        }
      }
      this.tiles.appendChild(fragment);
      this.paintMarker();
      this.centerLabel.textContent = `Trung tâm: ${this.center.lat.toFixed(4)}, ${this.center.lng.toFixed(4)} · Z${this.zoom}`;
      root.setTimeout(() => {
        if (token === this.renderId && !loaded) {
          overlay.hidden = false;
          overlay.textContent = 'Không tải được nền bản đồ. Vẫn có thể nhập tọa độ hoặc nhấp để đặt ghim.';
        }
      }, 2300);
    }
  }

  FN.MapPicker = MapPicker;
})(window);
