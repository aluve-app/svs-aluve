/* ============================================================
   KONFIGURASI
   ============================================================ */
const WORKER_BASE_URL = 'https://svs-api.aluve.workers.dev';
const FIREBASE_API_KEY = 'AIzaSyByAh6qbd0YS4QcMI3WwBpPjbDU1jDAlWQ';

/* ============================================================
   1. STATE
   ============================================================ */
const State = {
  idToken: null,
  user: null, // { uid, name, role, business_id, sales_code, status, email }

  currentView: 'dashboard',
  currentProjectId: null,
  currentProjectName: '',
  currentProjectStage: 'New Visit',

  selectedProductTypes: [],
  selectedActivityType: null,
  selectedLostReason: null,
  selectedFollowupDate: null,
  pendingPhotos: [],
  pendingPhotosNewProject: [],

  quickFilter: 'Semua',
  filterStage: '',
  filterProduct: '',
  searchKeyword: '',

  summaryData: { today: {}, week: {}, month: {} },
  selectedSummaryPeriod: 'today',

  projectsCache: [],
  contactsSummary: {},
  lookups: {}
};

/* ============================================================
   ID GENERATOR (client-side, format sama dengan backend)
   ============================================================ */
const IdGen = {
  randomSuffix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  },
  formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return '' + yyyy + mm + dd;
  },
  formatDateTime(d) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return this.formatDate(d) + hh + mi + ss;
  },
  projectId() { return 'PRJ-' + this.formatDate(new Date()) + '-' + this.randomSuffix(); },
  activityId() { return 'ACT-' + this.formatDateTime(new Date()) + '-' + this.randomSuffix(); },
  photoId() { return 'PHT-' + this.formatDateTime(new Date()) + '-' + this.randomSuffix(); },
  contactId() { return 'CNT-' + this.formatDate(new Date()) + '-' + this.randomSuffix(); }
};

/* ============================================================
   ICONS (dipakai di konten yang di-render JS)
   ============================================================ */
/* ============================================================
   CLOUDINARY THUMBNAIL HELPER
   ============================================================
   Foto disimpan di Cloudinary dalam ukuran penuh (hasil kompresi
   client ±1280px), tapi di daftar/timeline cuma perlu ditampilkan
   kecil (±68px). Kalau langsung pakai url aslinya, browser tetap
   MENGUNDUH file penuh lalu mengecilkannya via CSS — boros bandwidth,
   yang berarti boros "credit" gratis Cloudinary.

   Fungsi ini menyisipkan instruksi resize LANGSUNG DI URL-nya
   (fitur bawaan Cloudinary, gratis dipakai dalam kuota transformasi) —
   supaya yang benar-benar diunduh browser sudah versi kecil.
   Foto ukuran PENUH tetap ada & bisa dibuka kalau diklik/di-zoom.
   ============================================================ */
function cloudinaryThumb(url, size) {
  if (!url || url.indexOf('/upload/') === -1) return url; // bukan url Cloudinary, kembalikan apa adanya
  const px = size || 150;
  return url.replace('/upload/', '/upload/w_' + px + ',h_' + px + ',c_fill,q_auto,f_auto/');
}

const Icons = {
  pin: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  folder: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  user: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  phone: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  message: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  arrowRight: '<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

/* ============================================================
   CACHE (localStorage) - dashboard, lookup, offline queue
   ============================================================ */
const DashboardCache = {
  STORAGE_KEY: 'svs_dashboard_cache_v1',
  save(data) { try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ data, savedAt: Date.now() })); } catch (e) {} },
  get() { try { const raw = localStorage.getItem(this.STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
};

const LookupCache = {
  STORAGE_KEY: 'svs_lookup_options_v1',
  DEFAULTS: {
    activity_type: ['Kunjungan Pertama', 'Follow Up', 'Presentasi Produk', 'Negosiasi', 'Survey Lokasi', 'Lainnya'],
    pipeline_stage: ['New Visit', 'Perlu Estimasi Harga', 'Penawaran Siap', 'Won', 'Lost'],
    activity_temperature: ['Cold', 'Warm', 'Hot'],
    project_category: ['Residensial', 'Komersial', 'Industrial', 'Villa'],
    construction_stage: ['Perencanaan', 'Pembangunan', 'Finishing', 'Selesai'],
    product_type: ['Jendela Aluminium', 'Pintu Aluminium', 'Curtain Wall', 'Facade', 'Partisi Kaca'],
    lead_source: ['Canvassing', 'Referral', 'Website', 'Pameran'],
    lost_reason: ['Harga Kalah Bersaing', 'Pilih Vendor Lain', 'Project Dibatalkan', 'Tidak Ada Kabar'],
    contact_role: ['Pemilik', 'Arsitek', 'Kontraktor', 'Interior Designer', 'Lainnya']
  },
  get() {
    try { const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY)); return saved || this.DEFAULTS; }
    catch (e) { return this.DEFAULTS; }
  },
  save(data) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data)); },
  async refresh() {
    const result = await Api.call('readLookupOptions', {}, { noQueue: true }).catch(() => null);
    if (result && result.success && result.data) { this.save(result.data); return result.data; }
    return null;
  }
};

/* ============================================================
   LOOKUP RENDERER
   ============================================================ */
const LookupRenderer = {
  renderAll(data) {
    const get = (key) => (data[key] && data[key].length > 0) ? data[key] : LookupCache.DEFAULTS[key];
    this.renderSelect('select-activity-type', get('activity_type'), 'Pilih Jenis Aktivitas');
    this.renderSelect('select-activity-type-new', get('activity_type'), null, 'Kunjungan Pertama');
    this.renderSelect('select-pipeline-stage', get('pipeline_stage'), null);
    this.renderSelect('select-temperature', get('activity_temperature'), '— Tidak diisi —', null, true);
    this.renderSelect('select-project-category', get('project_category'), 'Pilih');
    this.renderProductTypeChips(get('product_type'));
    this.renderLostReasonChips(get('lost_reason'));
    this.renderSelectWithPlaceholder('select-contact-role', get('contact_role'), 'Role Kontak (opsional)');
    this.renderSelectWithPlaceholder('select-contact-role-update', get('contact_role'), 'Role Kontak (opsional)');
    this.renderSelectPlain('ct2-role', get('contact_role'));
    this.renderSelect('select-lead-source', get('lead_source'), 'Pilih');
    this.renderConstructionStage(get('construction_stage'));
    this.renderFilterStageChips(get('pipeline_stage'));
    this.renderFilterProductChips(get('product_type'));
  },

  renderSelect(id, items, placeholder, defaultValue, keepFirstOptionAsIs) {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    let html = '';
    if (keepFirstOptionAsIs && select.options.length > 0) html += select.options[0].outerHTML;
    if (placeholder) html += '<option value="">' + placeholder + '</option>';
    html += items.map((t) => '<option value="' + t + '">' + t + '</option>').join('');
    select.innerHTML = html;
    if (items.includes(currentValue)) select.value = currentValue;
    else if (defaultValue && items.includes(defaultValue)) select.value = defaultValue;
  },

  renderSelectWithPlaceholder(id, items, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">' + placeholder + '</option>' + items.map((r) => '<option value="' + r + '">' + r + '</option>').join('');
    if (items.includes(currentValue)) select.value = currentValue;
  },

  renderSelectPlain(id, items) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Pilih</option>' + items.map((r) => '<option value="' + r + '">' + r + '</option>').join('');
  },

  renderConstructionStage(stages) {
    const select = document.getElementById('select-construction-stage');
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Pilih (opsional)</option>' + stages.map((s) => '<option value="' + s + '">' + s + '</option>').join('');
    if (stages.includes(currentValue)) select.value = currentValue;
  },

  renderProductTypeChips(products) {
    const container = document.getElementById('product-type-chips');
    container.innerHTML = products.map((p) => {
      const selectedClass = State.selectedProductTypes.includes(p) ? ' selected' : '';
      return '<button class="chip' + selectedClass + '" type="button" data-product="' + p + '">' + p + '</button>';
    }).join('');
  },

  renderLostReasonChips(reasons) {
    const container = document.getElementById('lost-reason-chips');
    container.innerHTML = reasons.map((r) => {
      const selectedClass = r === State.selectedLostReason ? ' selected' : '';
      return '<button class="chip' + selectedClass + '" type="button" data-lost-reason="' + r + '">' + r + '</button>';
    }).join('');
  },

  renderFilterStageChips(stages) {
    const container = document.getElementById('filter-stage-chips');
    const semuaChip = container.querySelector('[data-filter-stage=""]');
    container.innerHTML = '';
    if (semuaChip) container.appendChild(semuaChip);
    container.insertAdjacentHTML('beforeend', stages.map((s) => '<button class="chip" type="button" data-filter-stage="' + s + '">' + s + '</button>').join(''));
  },

  renderFilterProductChips(products) {
    const container = document.getElementById('filter-product-chips');
    const semuaChip = container.querySelector('[data-filter-product=""]');
    container.innerHTML = '';
    if (semuaChip) container.appendChild(semuaChip);
    container.insertAdjacentHTML('beforeend', products.map((p) => '<button class="chip" type="button" data-filter-product="' + p + '">' + p + '</button>').join(''));
  }
};

/* ============================================================
   UTILS
   ============================================================ */
const Utils = {
  formatShortDate(dateValue) {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '-';
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return d.getDate() + ' ' + bulan[d.getMonth()];
  },
  formatDateForInput(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  },
  healthDotClass(project) {
    if (project.pipeline_stage === 'Won') return 'dot-won';
    if (project.pipeline_stage === 'Lost') return 'dot-lost';
    if (project.health_status === 'Perlu Perhatian') return 'dot-perhatian';
    if (project.health_status === 'Stale') return 'dot-stale';
    return 'dot-aktif';
  },
  statusLabel(pipelineStage) {
    if (pipelineStage === 'Won') return 'Won';
    if (pipelineStage === 'Lost') return 'Lost';
    return 'Aktif';
  },
  statusGlowClass(pipelineStage) {
    if (pipelineStage === 'Won') return 'glow-warning';
    if (pipelineStage === 'Lost') return 'glow-danger';
    return 'glow-success';
  },
  compressAndReadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca file foto'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
        img.onload = () => {
          const maxDim = 1280;
          let { width, height } = img;
          if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, mimeType: 'image/jpeg', previewUrl: dataUrl });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
};

/* ============================================================
   OFFLINE QUEUE
   ============================================================ */
const OfflineQueue = {
  STORAGE_KEY: 'svs_offline_queue_v1',
  isSyncing: false,

  getAll() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; } catch (e) { return []; } },
  saveAll(queue) { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue)); this.updateBanner(); },

  add(action, payload) {
    const queue = this.getAll();
    queue.push({ type: 'single', action, payload, queuedAt: Date.now() });
    this.saveAll(queue);
  },

  addActivityWithPhotos(activityPayload, rawPhotos) {
    const queue = this.getAll();
    queue.push({ type: 'activityWithPhotos', activityPayload, rawPhotos, queuedAt: Date.now() });
    this.saveAll(queue);
  },

  count() { return this.getAll().length; },

  updateBanner() {
    const banner = document.getElementById('pending-sync-banner');
    if (!banner) return;
    if (this.isSyncing) {
      banner.innerHTML = '<span class="snackbar-spinner"></span>Menyinkronkan data...';
      banner.disabled = true; banner.hidden = false;
      return;
    }
    banner.disabled = false;
    const total = this.count();
    if (total > 0) {
      banner.innerHTML = '📤 <span id="pending-sync-count">' + total + '</span> data menunggu dikirim — Tap untuk sync sekarang';
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  },

  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.updateBanner();
    try {
      const queue = this.getAll();
      if (queue.length === 0) return;
      let successCount = 0;
      const remaining = [];
      for (const item of queue) {
        try {
          if (item.type === 'activityWithPhotos') {
            for (const photo of item.rawPhotos) {
              await Api.rawCall('uploadPhoto', { photo_id: photo.photoId, project_id: item.activityPayload.project_id, file_base64: photo.base64, mime_type: photo.mimeType });
            }
            await Api.rawCall('createActivity', item.activityPayload);
          } else {
            await Api.rawCall(item.action, item.payload);
          }
          successCount++;
        } catch (err) {
          remaining.push(item);
        }
      }
      this.saveAll(remaining);
      if (successCount > 0) {
        Snackbar.show(successCount + ' data tertunda berhasil disinkronkan', 'success');
        Router.refreshCurrentView();
      }
    } finally {
      this.isSyncing = false;
      this.updateBanner();
    }
  }
};

/* ============================================================
   API - komunikasi ke Cloudflare Workers (Bearer token)
   ============================================================ */
const Api = {
  TIMEOUT_MS: 15000,

  rawCall(action, payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    return fetch(WORKER_BASE_URL + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + State.idToken },
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    })
      .then((res) => res.json())
      .finally(() => clearTimeout(timeoutId));
  },

  async call(action, payload, options) {
    const queueableActions = ['createProject', 'createActivity', 'uploadPhoto', 'createContact', 'updateProject'];
    const opts = options || {};
    try {
      return await this.rawCall(action, payload);
    } catch (networkError) {
      if (queueableActions.includes(action) && !opts.noQueue) {
        OfflineQueue.add(action, payload);
        return { success: true, queued: true, data: null, message: 'Tersimpan lokal, akan dikirim otomatis saat online' };
      }
      throw networkError;
    }
  }
};

/* ============================================================
   SNACKBAR
   ============================================================ */
const Snackbar = {
  el: null, timer: null,
  init() { this.el = document.getElementById('snackbar'); },
  show(message, type, duration) {
    if (!this.el) return;
    clearTimeout(this.timer);
    this.el.className = 'snackbar show' + (type ? ' ' + type : '');
    this.el.textContent = message;
    this.timer = setTimeout(() => { this.el.classList.remove('show'); }, duration || 2500);
  },
  showPersistent(message) {
    if (!this.el) return;
    clearTimeout(this.timer);
    this.el.className = 'snackbar show';
    this.el.innerHTML = '<span class="snackbar-spinner"></span>' + message;
  }
};

/* ============================================================
   LOADING INDICATOR (dot animasi sederhana pada teks loading)
   ============================================================ */
const LoadingIndicator = {
  timer: null,
  start(el, baseText) {
    if (!el) return;
    this.stop();
    let dots = 0;
    this.timer = setInterval(() => {
      dots = (dots + 1) % 4;
      el.textContent = baseText + '.'.repeat(dots);
    }, 400);
  },
  stop() { clearInterval(this.timer); }
};

/* ============================================================
   DARK MODE
   ============================================================ */
const ThemeToggle = {
  STORAGE_KEY: 'svs_theme',
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    this.updateSwitchUI();
    document.getElementById('btn-theme-toggle').addEventListener('click', () => this.toggle());
  },
  isDark() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  toggle() {
    const next = this.isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(this.STORAGE_KEY, next);
    this.updateSwitchUI();
  },
  updateSwitchUI() {
    document.getElementById('btn-theme-toggle').classList.toggle('is-dark', this.isDark());
  }
};

/* ============================================================
   RENDER: DASHBOARD
   ============================================================ */
const DashboardView = {
  async load() {
    const followupEl = document.getElementById('followup-list');
    const cached = DashboardCache.get();

    if (cached) {
      this.renderFollowUps(cached.data.needs_followup || []);
      State.summaryData = cached.data.summary || { today: {}, week: {}, month: {} };
      this.renderSummary(State.selectedSummaryPeriod);
      this.updateNotificationBadge(cached.data.needs_followup || []);
    } else {
      followupEl.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-container-text">Memuat data</p></div>';
      LoadingIndicator.start(followupEl.querySelector('.loading-container-text'), 'Memuat data');
    }

    this.renderStageGrid();
    this.loadProjectsForStageGrid(); // ambil data project di background khusus untuk 4 kartu ini

    const result = await Api.call('readDashboard', {}, { noQueue: true }).catch(() => null);
    if (!cached) LoadingIndicator.stop();

    if (!result || !result.success) {
      if (!cached) {
        Snackbar.show('Gagal memuat dashboard. Menampilkan data terakhir yang tersimpan.', 'error');
        followupEl.innerHTML = '<p class="empty-state">Gagal memuat data. Coba refresh halaman.</p>';
      }
      return;
    }

    this.renderFollowUps(result.data.needs_followup || []);
    State.summaryData = result.data.summary || { today: {}, week: {}, month: {} };
    this.renderSummary(State.selectedSummaryPeriod);
    this.updateNotificationBadge(result.data.needs_followup || []);
    DashboardCache.save(result.data);
  },

  async loadProjectsForStageGrid() {
    const payload = {};
    if (State.user.role === 'sales') payload.sales_uid = State.user.uid;
    const result = await Api.call('filterProject', payload, { noQueue: true }).catch(() => null);
    if (result && result.success) {
      State.projectsCache = result.data || [];
      this.renderStageGrid();
    }
  },

  init() {
    document.querySelectorAll('#summary-period-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#summary-period-chips .chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        State.selectedSummaryPeriod = chip.dataset.period;
        this.renderSummary(State.selectedSummaryPeriod);
      });
    });
    document.querySelectorAll('.summary-item').forEach((item) => {
      item.addEventListener('click', () => this.openSummaryDetail(item.dataset.summaryType));
    });
  },

  renderStageGrid() {
    const projects = State.projectsCache.length ? State.projectsCache : [];
    let newLeads = 0, active = 0, won = 0, lost = 0;
    projects.forEach((p) => {
      if (p.pipeline_stage === 'New Visit') newLeads++;
      else if (p.pipeline_stage === 'Perlu Estimasi Harga' || p.pipeline_stage === 'Penawaran Siap') active++;
      else if (p.pipeline_stage === 'Won') won++;
      else if (p.pipeline_stage === 'Lost') lost++;
    });
    document.getElementById('stage-grid').innerHTML =
      '<div class="stage-card c-newleads"><div class="num">' + newLeads + '</div><div class="label">New Leads</div></div>' +
      '<div class="stage-card c-active"><div class="num">' + active + '</div><div class="label">Dalam Proses</div></div>' +
      '<div class="stage-card c-won"><div class="num">' + won + '</div><div class="label">Won</div></div>' +
      '<div class="stage-card c-lost"><div class="num">' + lost + '</div><div class="label">Lose</div></div>';
  },

  async openSummaryDetail(type) {
    const titles = { visit: 'Kunjungan', won: 'Deal Ditutup', lost: 'Deal Hilang' };
    const periodLabels = { today: 'Hari Ini', week: 'Minggu Ini', month: 'Bulan Ini' };
    const period = State.selectedSummaryPeriod;
    document.getElementById('summary-detail-title').textContent = titles[type] + ' — ' + periodLabels[period];

    const listEl = document.getElementById('summary-detail-list');
    listEl.innerHTML = '<p class="loading-text">Memuat data</p>';
    SheetManager.open('sheet-summary-detail');

    const result = await Api.call('readSummaryDetail', { period, type }, { noQueue: true }).catch(() => null);

    if (!result || !result.success || !result.data || result.data.length === 0) {
      listEl.innerHTML = '<p class="empty-state">Belum ada data untuk periode ini.</p>';
      return;
    }
    listEl.innerHTML = result.data.map((item) =>
      '<div class="card"><p class="card-title">' + item.project_name + '</p><p class="card-sub-light">' + Utils.formatShortDate(item.timestamp) + '</p></div>'
    ).join('');
  },

  renderFollowUps(items) {
    const container = document.getElementById('followup-list');
    const emptyEl = document.getElementById('followup-empty');
    container.innerHTML = '';
    if (items.length === 0) { emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    items.forEach((item) => {
      const urgency = item.overdue_days > 0 ? 'overdue' : 'today';
      const label = item.overdue_days > 0 ? 'Terlewat ' + item.overdue_days + ' hari 🔴' : 'Jatuh tempo hari ini';
      const card = document.createElement('div');
      card.className = 'card followup-card ' + urgency;
      card.innerHTML =
        '<h3 class="card-title">' + Icons.folder + ' ' + item.project_name + '</h3>' +
        '<p class="card-sub">' + label + '</p>' +
        '<div class="followup-card-action" data-open-activity="' + item.project_id + '" data-project-name="' + item.project_name + '">Catat Aktivitas ' + Icons.arrowRight + '</div>';
      container.appendChild(card);
    });

    container.querySelectorAll('[data-open-activity]').forEach((el) => {
      el.addEventListener('click', () => UpdateProgressSheet.open(el.dataset.openActivity, el.dataset.projectName, null));
    });
  },

  renderSummary(period) {
    const summary = State.summaryData[period] || {};
    document.getElementById('summary-visit').textContent = summary.visit_count || 0;
    document.getElementById('summary-won').textContent = summary.won_count || 0;
    document.getElementById('summary-lost').textContent = summary.lost_count || 0;
  },

  updateNotificationBadge(items) {
    const badge = document.getElementById('badge-notification-count');
    if (items.length > 0) { badge.textContent = items.length > 9 ? '9+' : String(items.length); badge.hidden = false; }
    else { badge.hidden = true; }
  }
};

/* ============================================================
   RENDER: PROJECT LIST
   ============================================================ */
const ProjectListView = {
  async load() {
    const listEl = document.getElementById('project-list');
    listEl.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-container-text">Memuat project</p></div>';
    LoadingIndicator.start(listEl.querySelector('.loading-container-text'), 'Memuat project');

    const payload = {};
    if (State.user.role === 'sales') payload.sales_uid = State.user.uid;
    if (State.filterStage) payload.pipeline_stage = State.filterStage;
    if (State.filterProduct) payload.product_type = State.filterProduct;

    const [result, contactsResult] = await Promise.all([
      Api.call('filterProject', payload, { noQueue: true }).catch(() => null),
      Api.call('readContactsSummary', {}, { noQueue: true }).catch(() => null)
    ]);
    LoadingIndicator.stop();

    if (!result || !result.success) {
      Snackbar.show('Gagal memuat daftar project', 'error');
      listEl.innerHTML = '<p class="empty-state">Gagal memuat data. Coba refresh halaman.</p>';
      return;
    }

    State.contactsSummary = (contactsResult && contactsResult.success) ? contactsResult.data : {};

    const serverProjects = result.data || [];
    const serverIds = new Set(serverProjects.map((p) => p.project_id));

    const pendingFromQueue = OfflineQueue.getAll()
      .filter((item) => item.type === 'single' && item.action === 'createProject')
      .map((item) => item.payload)
      .filter((p) => !serverIds.has(p.project_id))
      .map((p) => ({
        project_id: p.project_id, project_name: p.project_name, location_address: p.location_address,
        product_type: p.product_type, pipeline_stage: 'New Visit', estimated_value: '', health_status: 'Aktif',
        date_created: new Date().toISOString(), date_last_activity: new Date().toISOString(), _pendingSync: true
      }));

    const projects = serverProjects.slice().sort((a, b) => new Date(b.date_last_activity) - new Date(a.date_last_activity));

    State.projectsCache = pendingFromQueue.concat(projects);
    DashboardView.renderStageGrid();
    this.applyQuickFilterAndSearch();
  },

  applyQuickFilterAndSearch() {
    let list = State.projectsCache;
    if (State.quickFilter === 'Aktif') list = list.filter((p) => p.pipeline_stage !== 'Won' && p.pipeline_stage !== 'Lost');
    else if (State.quickFilter === 'Won') list = list.filter((p) => p.pipeline_stage === 'Won');
    else if (State.quickFilter === 'Lost') list = list.filter((p) => p.pipeline_stage === 'Lost');

    if (State.searchKeyword) {
      const kw = State.searchKeyword.toLowerCase();
      list = list.filter((p) => String(p.project_name).toLowerCase().includes(kw) || String(p.location_address).toLowerCase().includes(kw));
    }
    this.render(list);
  },

  render(projects) {
    const container = document.getElementById('project-list');
    const emptyEl = document.getElementById('project-list-empty');
    container.innerHTML = '';
    if (projects.length === 0) { emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    projects.forEach((p) => {
      const dotClass = Utils.healthDotClass(p);
      const valueText = p.estimated_value ? ('Rp ' + Number(p.estimated_value).toLocaleString('id-ID')) : '-';
      const pendingBadge = p._pendingSync ? '<span class="pending-badge">⏳ Menunggu Sync</span>' : '';
      const contact = State.contactsSummary[p.project_id];
      const contactLine = contact ? '<p class="card-sub-light">' + Icons.user + ' ' + contact.contact_name + ' (' + contact.role + ')</p>' : '';
      const statusLabel = Utils.statusLabel(p.pipeline_stage);
      const glowClass = Utils.statusGlowClass(p.pipeline_stage);
      const lastUpdateText = p.date_last_activity ? Utils.formatShortDate(p.date_last_activity) : '';

      const card = document.createElement('div');
      card.className = 'card ' + glowClass;
      card.setAttribute('data-open-project', p.project_id);
      card.setAttribute('data-project-name', p.project_name);
      card.setAttribute('data-project-address', p.location_address || '');
      card.setAttribute('data-project-stage', p.pipeline_stage);
      card.setAttribute('data-project-product', p.product_type || '');
      card.setAttribute('data-project-construction', p.construction_stage || '');
      card.innerHTML =
        '<h3 class="card-title"><span class="dot ' + dotClass + '"></span>' + p.project_name + ' <span class="card-status-suffix">(' + statusLabel + ')</span></h3>' +
        '<p class="card-sub">' + p.pipeline_stage + '</p>' +
        '<p class="card-sub-light">' + Icons.pin + ' ' + (p.location_address || '-') + '</p>' +
        (lastUpdateText ? '<p class="card-sub-light">🗓️ ' + lastUpdateText + '</p>' : '') +
        (p.estimated_value ? '<p class="card-sub-light">' + valueText + '</p>' : '') +
        contactLine + pendingBadge;
      container.appendChild(card);
    });

    container.querySelectorAll('[data-open-project]').forEach((el) => {
      el.addEventListener('click', () => {
        TimelineView.open(el.dataset.openProject, el.dataset.projectName, el.dataset.projectAddress, el.dataset.projectStage, el.dataset.projectProduct, el.dataset.projectConstruction);
      });
    });
  }
};

/* ============================================================
   RENDER: TIMELINE
   ============================================================ */
const TimelineView = {
  async open(projectId, projectName, address, stage, productType, constructionStage) {
    State.currentProjectId = projectId;
    State.currentProjectName = projectName;
    State.currentProjectStage = stage;

    document.getElementById('timeline-project-name').textContent = projectName;
    document.getElementById('timeline-project-meta').textContent = stage;
    document.getElementById('timeline-project-address').textContent = address || '-';

    const headerCard = document.querySelector('#view-timeline .timeline-header');
    headerCard.classList.remove('glow-success', 'glow-warning', 'glow-danger');
    headerCard.classList.add(Utils.statusGlowClass(stage));

    const detailParts = [];
    if (productType) detailParts.push('Jenis Produk: ' + productType);
    if (constructionStage) detailParts.push('Tahap Konstruksi: ' + constructionStage);
    document.getElementById('timeline-project-detail').textContent = detailParts.length > 0 ? 'Detail Proyek: ' + detailParts.join(' · ') : '';

    const listContainer = document.getElementById('timeline-list');
    listContainer.innerHTML = '<p id="timeline-loading" class="loading-text">Memuat riwayat aktivitas</p>';
    LoadingIndicator.start(document.getElementById('timeline-loading'), 'Memuat riwayat aktivitas');

    document.getElementById('timeline-project-contacts').innerHTML = '';
    this.loadContacts(projectId);

    Router.goTo('timeline');
  },

  async loadContacts(projectId) {
    const result = await Api.call('readProjectContacts', { project_id: projectId }, { noQueue: true }).catch(() => null);
    const container = document.getElementById('timeline-project-contacts');
    if (!result || !result.success || !result.data || result.data.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = result.data.map((c) => {
      const digits = String(c.phone_number).replace(/\D/g, '');
      const waNumber = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
      return '<div class="contact-item">' +
        '<div class="contact-name-row">' + Icons.user + ' ' + c.contact_name + ' (' + c.role + ')</div>' +
        '<a href="tel:' + digits + '" class="contact-link">' + Icons.phone + ' Telpon</a>' +
        '<a href="https://wa.me/' + waNumber + '" target="_blank" rel="noopener" class="contact-link">' + Icons.message + ' WhatsApp</a>' +
        '</div>';
    }).join('');
  },

  async load(projectId) {
    const result = await Api.call('readActivityTimeline', { project_id: projectId }, { noQueue: true }).catch(() => null);
    LoadingIndicator.stop();

    if (!result || !result.success) {
      Snackbar.show('Gagal memuat riwayat aktivitas', 'error');
      document.getElementById('timeline-list').innerHTML = '<p class="empty-state">Gagal memuat data. Coba lagi.</p>';
      return;
    }

    this.render(result.data || []);

    if (result.data && result.data.length > 0) {
      const latestStage = result.data[0].pipeline_stage_at_this_point;
      if (latestStage) {
        State.currentProjectStage = latestStage;
        document.getElementById('timeline-project-meta').textContent = latestStage;
        const headerCard = document.querySelector('#view-timeline .timeline-header');
        headerCard.classList.remove('glow-success', 'glow-warning', 'glow-danger');
        headerCard.classList.add(Utils.statusGlowClass(latestStage));
      }
    }
  },

  render(activities) {
    const container = document.getElementById('timeline-list');
    container.innerHTML = '';
    if (activities.length === 0) { container.innerHTML = '<p class="empty-state">Belum ada aktivitas tercatat untuk project ini.</p>'; return; }

    activities.forEach((a) => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      let photosHtml = '';
      if (a.photos && a.photos.length > 0) {
        photosHtml = a.photos.map((p) =>
          '<a class="timeline-photo-link" href="' + p.url + '" target="_blank" rel="noopener"><img class="timeline-photo" src="' + cloudinaryThumb(p.url, 150) + '" alt="Foto kunjungan" loading="lazy" /></a>'
        ).join('');
      }
      const tempLabel = a.temperature ? ' · Suhu: ' + a.temperature : '';
      item.innerHTML =
        '<p class="timeline-date">' + Utils.formatShortDate(a.timestamp) + ' · ' + a.activity_type + '</p>' +
        '<p class="timeline-note">' + a.activity_note + '</p>' +
        '<p class="card-sub-light">Status saat itu: ' + a.pipeline_stage_at_this_point + tempLabel +
        (a.next_followup_date ? ' · Follow up: ' + Utils.formatShortDate(a.next_followup_date) : '') + '</p>' +
        photosHtml;
      container.appendChild(item);
    });
  }
};

/* ============================================================
   SHEET: TAMBAH PROJECT
   ============================================================ */
const AddProjectSheet = {
  init() {
    document.getElementById('fab-add-project').addEventListener('click', () => this.open());

    document.getElementById('product-type-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chip.classList.toggle('selected');
      const value = chip.dataset.product;
      if (chip.classList.contains('selected')) State.selectedProductTypes.push(value);
      else State.selectedProductTypes = State.selectedProductTypes.filter((v) => v !== value);
    });

    document.getElementById('btn-take-photo-newproject').addEventListener('click', () => document.getElementById('input-photo-newproject').click());
    document.getElementById('btn-pick-gallery-newproject').addEventListener('click', () => document.getElementById('input-gallery-newproject').click());

    const handlePhotoFilesNewProject = async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        try {
          const { base64, mimeType, previewUrl } = await Utils.compressAndReadImage(file);
          State.pendingPhotosNewProject.push({ base64, mimeType, previewUrl });
        } catch (err) { Snackbar.show('Gagal memproses salah satu foto, dilewati', 'error'); }
      }
      this.renderPhotoThumbnails();
      e.target.value = '';
    };
    document.getElementById('input-photo-newproject').addEventListener('change', handlePhotoFilesNewProject);
    document.getElementById('input-gallery-newproject').addEventListener('change', handlePhotoFilesNewProject);

    document.getElementById('form-add-project').addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
  },

  open() {
    State.selectedProductTypes = [];
    State.pendingPhotosNewProject = [];
    document.getElementById('form-add-project').reset();
    document.querySelectorAll('#product-type-chips .chip').forEach((c) => c.classList.remove('selected'));
    this.renderPhotoThumbnails();
    document.getElementById('input-followup-newproject').value = Utils.formatDateForInput(new Date(Date.now() + 3 * 86400000));
    SheetManager.open('sheet-add-project');
  },

  renderPhotoThumbnails() {
    const container = document.getElementById('photo-thumbnail-list-newproject');
    container.innerHTML = '';
    State.pendingPhotosNewProject.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'photo-thumbnail-item';
      item.innerHTML = '<img src="' + photo.previewUrl + '" alt="Foto ' + (index + 1) + '" /><button type="button" class="photo-thumbnail-remove" data-remove-photo-index="' + index + '">✕</button>';
      container.appendChild(item);
    });
    container.querySelectorAll('[data-remove-photo-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        State.pendingPhotosNewProject.splice(parseInt(btn.dataset.removePhotoIndex, 10), 1);
        this.renderPhotoThumbnails();
      });
    });
  },

  async submit() {
    const name = document.getElementById('input-project-name').value.trim();
    const address = document.getElementById('input-project-address').value.trim();
    const activityType = document.getElementById('select-activity-type-new').value;
    const projectCategory = document.getElementById('select-project-category').value;
    const leadSource = document.getElementById('select-lead-source').value;
    const followupDate = document.getElementById('input-followup-newproject').value;
    const note = document.getElementById('input-activity-note-new').value.trim();

    if (!name || !address) { Snackbar.show('Nama project dan lokasi wajib diisi', 'error'); return; }
    if (!activityType) { Snackbar.show('Pilih jenis aktivitas terlebih dahulu', 'error'); return; }
    if (!projectCategory) { Snackbar.show('Pilih jenis project terlebih dahulu', 'error'); return; }
    if (State.selectedProductTypes.length === 0) { Snackbar.show('Pilih minimal 1 jenis produk', 'error'); return; }
    if (!leadSource) { Snackbar.show('Pilih sumber leads terlebih dahulu', 'error'); return; }
    if (!followupDate) { Snackbar.show('Tanggal follow-up wajib diisi', 'error'); return; }
    if (State.pendingPhotosNewProject.length === 0) { Snackbar.show('Foto kunjungan wajib diisi minimal 1', 'error'); return; }
    if (!note) { Snackbar.show('Catatan kunjungan wajib diisi', 'error'); return; }

    const projectId = IdGen.projectId();
    const activityId = IdGen.activityId();
    const photoAssignments = State.pendingPhotosNewProject.map((p) => ({ photoId: IdGen.photoId(), base64: p.base64, mimeType: p.mimeType }));

    const projectPayload = {
      project_id: projectId, project_name: name, location_address: address,
      product_type: State.selectedProductTypes.join(', '), project_category: projectCategory,
      construction_stage: document.getElementById('select-construction-stage').value, lead_source: leadSource
    };

    const activityPayload = {
      activity_id: activityId, project_id: projectId, activity_type: activityType, activity_note: note,
      pipeline_stage: 'New Visit', next_followup_date: followupDate, photo_ids: photoAssignments.map((p) => p.photoId)
    };

    const contactName = document.getElementById('input-contact-name').value.trim();
    const contactPhone = document.getElementById('input-contact-phone').value.trim();
    const contactRole = document.getElementById('select-contact-role').value;

    State.projectsCache.unshift({
      project_id: projectId, project_name: name, location_address: address, product_type: projectPayload.product_type,
      pipeline_stage: 'New Visit', estimated_value: '', health_status: 'Aktif',
      date_created: new Date().toISOString(), date_last_activity: new Date().toISOString(), _pendingSync: true
    });

    SheetManager.close('sheet-add-project');
    Router.refreshCurrentView();
    Snackbar.showPersistent('Menyimpan...');

    try {
      await Api.call('createProject', projectPayload);

      for (const photo of photoAssignments) {
        await Api.rawCall('uploadPhoto', { photo_id: photo.photoId, project_id: projectId, file_base64: photo.base64, mime_type: photo.mimeType });
      }

      const activityResult = await Api.rawCall('createActivity', activityPayload);
      if (!activityResult.success) Snackbar.show(activityResult.message || 'Gagal menyimpan aktivitas pertama', 'error');

      if (contactName && contactPhone && contactRole) {
        const contactResult = await Api.call('createContact', { contact_id: IdGen.contactId(), project_id: projectId, contact_name: contactName, phone_number: contactPhone, role: contactRole });
        if (!contactResult.success && !contactResult.queued) Snackbar.show('Gagal menyimpan info kontak: ' + (contactResult.message || ''), 'error');
      } else if (contactName || contactPhone || contactRole) {
        Snackbar.show('Info kontak tidak disimpan — Nama, Telepon, dan Role harus diisi semua', 'info');
      }

      Snackbar.show('Project baru tersimpan', 'success');
      Router.refreshCurrentView();
    } catch (networkError) {
      OfflineQueue.addActivityWithPhotos(activityPayload, photoAssignments);
      Snackbar.show('Tersimpan lokal — akan dikirim otomatis saat online', 'info');
      Router.refreshCurrentView();
    }
  }
};

/* ============================================================
   SHEET: UPDATE PROGRESS
   ============================================================ */
const UpdateProgressSheet = {
  init() {
    document.getElementById('select-activity-type').addEventListener('change', (e) => { State.selectedActivityType = e.target.value; });
    document.getElementById('btn-take-photo').addEventListener('click', () => document.getElementById('input-photo').click());
    document.getElementById('btn-pick-gallery').addEventListener('click', () => document.getElementById('input-gallery').click());

    const handlePhotoFiles = async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        try {
          const { base64, mimeType, previewUrl } = await Utils.compressAndReadImage(file);
          State.pendingPhotos.push({ base64, mimeType, previewUrl });
        } catch (err) { Snackbar.show('Gagal memproses salah satu foto, dilewati', 'error'); }
      }
      this.renderPhotoThumbnails();
      e.target.value = '';
    };
    document.getElementById('input-photo').addEventListener('change', handlePhotoFiles);
    document.getElementById('input-gallery').addEventListener('change', handlePhotoFiles);

    document.getElementById('select-pipeline-stage').addEventListener('change', (e) => {
      const stage = e.target.value;
      document.getElementById('lost-reason-group').hidden = stage !== 'Lost';
      const isClosing = stage === 'Won' || stage === 'Lost';
      document.getElementById('followup-date-group').hidden = isClosing;
      if (isClosing) { document.getElementById('input-followup-date').value = ''; State.selectedFollowupDate = null; }
    });

    document.getElementById('lost-reason-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#lost-reason-chips .chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      State.selectedLostReason = chip.dataset.lostReason;
    });

    document.querySelectorAll('#followup-quick-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#followup-quick-chips .chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        const days = parseInt(chip.dataset.followupDays, 10);
        const date = new Date(); date.setDate(date.getDate() + days);
        const formatted = Utils.formatDateForInput(date);
        document.getElementById('input-followup-date').value = formatted;
        State.selectedFollowupDate = formatted;
      });
    });

    document.getElementById('input-followup-date').addEventListener('change', (e) => {
      State.selectedFollowupDate = e.target.value;
      document.querySelectorAll('#followup-quick-chips .chip').forEach((c) => c.classList.remove('selected'));
    });

    document.getElementById('btn-add-activity-from-timeline').addEventListener('click', () => {
      this.open(State.currentProjectId, State.currentProjectName, State.currentProjectStage);
    });

    document.getElementById('form-update-progress').addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
  },

  open(projectId, projectName, currentStage) {
    State.currentProjectId = projectId;
    State.currentProjectName = projectName;
    State.selectedActivityType = null;
    State.selectedLostReason = null;
    State.selectedFollowupDate = null;
    State.pendingPhotos = [];

    document.getElementById('form-update-progress').reset();
    document.getElementById('update-progress-project-name').textContent = projectName;
    this.renderPhotoThumbnails();
    document.getElementById('lost-reason-group').hidden = true;
    document.getElementById('followup-date-group').hidden = false;
    document.querySelectorAll('#lost-reason-chips .chip').forEach((c) => c.classList.remove('selected'));
    document.querySelectorAll('#followup-quick-chips .chip').forEach((c) => c.classList.remove('selected'));
    document.getElementById('select-temperature').value = '';

    if (currentStage) document.getElementById('select-pipeline-stage').value = currentStage;

    const hasContact = !!(State.contactsSummary && State.contactsSummary[projectId]);
    document.getElementById('update-progress-contact-group').hidden = hasContact;

    SheetManager.open('sheet-update-progress');
  },

  renderPhotoThumbnails() {
    const container = document.getElementById('photo-thumbnail-list');
    container.innerHTML = '';
    State.pendingPhotos.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'photo-thumbnail-item';
      item.innerHTML = '<img src="' + photo.previewUrl + '" alt="Foto ' + (index + 1) + '" /><button type="button" class="photo-thumbnail-remove" data-remove-photo-index="' + index + '">✕</button>';
      container.appendChild(item);
    });
    container.querySelectorAll('[data-remove-photo-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        State.pendingPhotos.splice(parseInt(btn.dataset.removePhotoIndex, 10), 1);
        this.renderPhotoThumbnails();
      });
    });
  },

  async submit() {
    const note = document.getElementById('input-activity-note').value.trim();
    const stage = document.getElementById('select-pipeline-stage').value;
    const isClosing = stage === 'Won' || stage === 'Lost';
    const followupDate = document.getElementById('input-followup-date').value || State.selectedFollowupDate;
    const temperature = document.getElementById('select-temperature').value;

    if (!State.selectedActivityType) { Snackbar.show('Pilih jenis aktivitas terlebih dahulu', 'error'); return; }
    if (!note) { Snackbar.show('Catatan wajib diisi', 'error'); return; }
    if (!isClosing && !followupDate) { Snackbar.show('Pilih tanggal follow up berikutnya', 'error'); return; }
    if (stage === 'Lost' && !State.selectedLostReason) { Snackbar.show('Pilih alasan Lost terlebih dahulu', 'error'); return; }

    const activityId = IdGen.activityId();
    const photoAssignments = State.pendingPhotos.map((p) => ({ photoId: IdGen.photoId(), base64: p.base64, mimeType: p.mimeType }));

    const activityPayload = {
      activity_id: activityId, project_id: State.currentProjectId, activity_type: State.selectedActivityType,
      activity_note: note, pipeline_stage: stage, temperature: temperature,
      next_followup_date: isClosing ? '' : followupDate,
      lost_reason: stage === 'Lost' ? State.selectedLostReason : '',
      photo_ids: photoAssignments.map((p) => p.photoId)
    };

    const estimatedValue = document.getElementById('input-estimated-value').value;

    SheetManager.close('sheet-update-progress');
    Snackbar.showPersistent('Menyimpan...');

    if (estimatedValue) {
      Api.call('updateProject', { project_id: State.currentProjectId, estimated_value: estimatedValue }).then((result) => {
        if (!result.success && !result.queued) Snackbar.show('Gagal menyimpan nilai project: ' + (result.message || ''), 'error');
      });
    }

    if (!document.getElementById('update-progress-contact-group').hidden) {
      const contactName = document.getElementById('input-contact-name-update').value.trim();
      const contactPhone = document.getElementById('input-contact-phone-update').value.trim();
      const contactRole = document.getElementById('select-contact-role-update').value;
      if (contactName && contactPhone && contactRole) {
        Api.call('createContact', { contact_id: IdGen.contactId(), project_id: State.currentProjectId, contact_name: contactName, phone_number: contactPhone, role: contactRole }).then((result) => {
          if (!result.success && !result.queued) Snackbar.show('Gagal menyimpan info kontak: ' + (result.message || ''), 'error');
        });
      } else if (contactName || contactPhone || contactRole) {
        Snackbar.show('Info kontak tidak disimpan — Nama, Telepon, dan Role harus diisi semua', 'info');
      }
    }

    try {
      for (const photo of photoAssignments) {
        await Api.rawCall('uploadPhoto', { photo_id: photo.photoId, project_id: State.currentProjectId, file_base64: photo.base64, mime_type: photo.mimeType });
      }
      const activityResult = await Api.rawCall('createActivity', activityPayload);
      if (!activityResult.success) { Snackbar.show(activityResult.message || 'Gagal menyimpan aktivitas', 'error'); return; }
      Snackbar.show('Aktivitas tersimpan', 'success');
      Router.refreshCurrentView();
    } catch (networkError) {
      OfflineQueue.addActivityWithPhotos(activityPayload, photoAssignments);
      Snackbar.show('Tersimpan lokal (' + (photoAssignments.length + 1) + ' data) — akan dikirim otomatis saat online', 'info');
      Router.refreshCurrentView();
    }
  }
};

/* ============================================================
   SHEET: TAMBAH KONTAK (dari Timeline)
   ============================================================ */
const AddContactSheet = {
  init() {
    document.getElementById('btn-add-contact-from-timeline').addEventListener('click', () => this.open());
    document.getElementById('form-add-contact').addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
  },
  open() {
    document.getElementById('form-add-contact').reset();
    SheetManager.open('sheet-add-contact');
  },
  async submit() {
    const name = document.getElementById('ct2-name').value.trim();
    const phone = document.getElementById('ct2-phone').value.trim();
    const role = document.getElementById('ct2-role').value;
    if (!name || !phone || !role) { Snackbar.show('Nama, Telepon, dan Peran wajib diisi', 'error'); return; }

    SheetManager.close('sheet-add-contact');
    Snackbar.showPersistent('Menyimpan kontak...');
    try {
      const result = await Api.call('createContact', { contact_id: IdGen.contactId(), project_id: State.currentProjectId, contact_name: name, phone_number: phone, role: role });
      if (result.success || result.queued) {
        Snackbar.show(result.queued ? 'Tersimpan lokal, akan dikirim otomatis' : 'Kontak berhasil disimpan', result.queued ? 'info' : 'success');
        TimelineView.loadContacts(State.currentProjectId);
      } else {
        Snackbar.show(result.message || 'Gagal menyimpan kontak', 'error');
      }
    } catch (err) {
      Snackbar.show('Gagal menyimpan kontak: ' + err.message, 'error');
    }
  }
};

/* ============================================================
   SHEET: FILTER
   ============================================================ */
const FilterSheet = {
  init() {
    document.getElementById('btn-open-filter').addEventListener('click', () => SheetManager.open('sheet-filter'));

    document.getElementById('filter-stage-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#filter-stage-chips .chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      State.filterStage = chip.dataset.filterStage;
    });

    document.getElementById('filter-product-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#filter-product-chips .chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      State.filterProduct = chip.dataset.filterProduct;
    });

    document.getElementById('btn-filter-reset').addEventListener('click', () => {
      State.filterStage = ''; State.filterProduct = '';
      document.querySelectorAll('#filter-stage-chips .chip, #filter-product-chips .chip').forEach((c) => {
        c.classList.toggle('selected', c.dataset.filterStage === '' || c.dataset.filterProduct === '');
      });
    });

    document.getElementById('btn-filter-apply').addEventListener('click', async () => {
      SheetManager.close('sheet-filter');
      await ProjectListView.load();
    });

    document.querySelectorAll('#quick-filter-chips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#quick-filter-chips .chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        State.quickFilter = chip.dataset.quickfilter;
        ProjectListView.applyQuickFilterAndSearch();
      });
    });

    document.getElementById('input-search-project').addEventListener('input', (e) => {
      State.searchKeyword = e.target.value;
      ProjectListView.applyQuickFilterAndSearch();
    });
  }
};

/* ============================================================
   SHEET MANAGER
   ============================================================ */
const SheetManager = {
  init() {
    document.querySelectorAll('[data-close-sheet]').forEach((btn) => btn.addEventListener('click', () => this.close(btn.dataset.closeSheet)));
    document.getElementById('sheet-overlay').addEventListener('click', () => this.closeAll());
  },
  open(sheetId) { document.getElementById('sheet-overlay').hidden = false; document.getElementById(sheetId).hidden = false; },
  close(sheetId) { document.getElementById(sheetId).hidden = true; document.getElementById('sheet-overlay').hidden = true; },
  closeAll() { document.querySelectorAll('.bottom-sheet').forEach((sheet) => { sheet.hidden = true; }); document.getElementById('sheet-overlay').hidden = true; }
};

/* ============================================================
   ROUTER
   ============================================================ */
const Router = {
  init() {
    document.querySelectorAll('.bottom-nav-item').forEach((btn) => btn.addEventListener('click', () => this.goTo(btn.dataset.nav)));
    document.getElementById('btn-back').addEventListener('click', () => this.goTo('projects'));
  },

  goTo(viewName) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
    State.currentView = viewName;

    const isTimeline = viewName === 'timeline';
    document.getElementById('btn-back').hidden = !isTimeline;

    const firstName = (State.user && State.user.name) ? State.user.name.split(' ')[0] : 'Sales';
    const titles = { dashboard: 'Halo, ' + firstName + ' 👋', projects: 'Project Saya', timeline: State.currentProjectName || 'Detail Project' };
    document.getElementById('header-title').textContent = titles[viewName] || 'SVS';

    document.querySelectorAll('.bottom-nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === viewName));
    document.getElementById('fab-add-project').hidden = isTimeline;

    this.refreshCurrentView();
  },

  refreshCurrentView() {
    if (State.currentView === 'dashboard') DashboardView.load();
    if (State.currentView === 'projects') ProjectListView.load();
    if (State.currentView === 'timeline' && State.currentProjectId) TimelineView.load(State.currentProjectId);
  }
};

/* ============================================================
   LOGIN
   ============================================================ */
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('btn-login');
  errorEl.textContent = '';

  if (!email || !password) { errorEl.textContent = 'Isi email dan password.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="snackbar-spinner"></span> Masuk...';

  try {
    const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ? json.error.message : 'Login gagal');

    State.idToken = json.idToken;

    const profileResult = await Api.rawCall('readMyProfile', {});
    if (!profileResult.success) throw new Error(profileResult.message || 'Gagal memuat profil');
    State.user = profileResult.data;

    document.getElementById('view-login').hidden = true;
    document.getElementById('app').hidden = false;
    initApp();
  } catch (err) {
    errorEl.textContent = (err.message.includes('INVALID') || err.message.includes('PASSWORD')) ? 'Email atau password salah.' : err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}

document.getElementById('btn-login').addEventListener('click', doLogin);
document.getElementById('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

/* ============================================================
   INIT (dipanggil SETELAH login berhasil)
   ============================================================ */
function initApp() {
  function safeInit(name, fn) { try { fn(); } catch (err) { console.error('Gagal inisialisasi ' + name + ':', err); } }

  safeInit('LookupRenderer (awal)', () => LookupRenderer.renderAll(LookupCache.get()));
  safeInit('Snackbar', () => Snackbar.init());
  safeInit('ThemeToggle', () => ThemeToggle.init());
  safeInit('Router', () => Router.init());
  safeInit('SheetManager', () => SheetManager.init());
  safeInit('DashboardView', () => DashboardView.init());
  safeInit('AddProjectSheet', () => AddProjectSheet.init());
  safeInit('UpdateProgressSheet', () => UpdateProgressSheet.init());
  safeInit('AddContactSheet', () => AddContactSheet.init());
  safeInit('FilterSheet', () => FilterSheet.init());

  document.getElementById('btn-logout').addEventListener('click', () => {
    State.idToken = null; State.user = null;
    document.getElementById('app').hidden = true;
    document.getElementById('view-login').hidden = false;
    document.getElementById('login-password').value = '';
  });

  LookupCache.refresh().then((freshData) => { if (freshData) LookupRenderer.renderAll(freshData); });

  const firstName = (State.user && State.user.name) ? State.user.name.split(' ')[0] : 'Sales';
  document.getElementById('header-title').textContent = 'Halo, ' + firstName + ' 👋';

  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const bulanPanjang = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  let jam12 = now.getHours() % 12; if (jam12 === 0) jam12 = 12;
  const menit = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() < 12 ? 'AM' : 'PM';
  document.getElementById('dashboard-date-subtitle').textContent =
    hari[now.getDay()] + ', ' + now.getDate() + ' ' + bulanPanjang[now.getMonth()] + ' ' + now.getFullYear() + ' • ' + jam12 + ':' + menit + ' ' + ampm;

  DashboardView.load();

  const offlineBanner = document.getElementById('offline-banner');
  function updateConnectionState() {
    offlineBanner.hidden = navigator.onLine;
    if (navigator.onLine) OfflineQueue.syncAll();
  }
  window.addEventListener('online', updateConnectionState);
  window.addEventListener('offline', updateConnectionState);
  updateConnectionState();

  document.getElementById('pending-sync-banner').addEventListener('click', () => OfflineQueue.syncAll());
  OfflineQueue.updateBanner();
}

/* ============================================================
   PWA: REGISTRASI SERVICE WORKER
   ============================================================
   Dijalankan SEKALI, di luar initApp() — supaya app-shell tetap
   ter-cache walau user belum sempat login (misal baru pertama kali
   buka linknya). Pendaftaran ini tidak butuh login sama sekali.
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // Kegagalan registrasi tidak menghentikan aplikasi — cuma berarti
      // dukungan offline-shell tidak aktif, aplikasi tetap bisa dipakai online.
    });
  });
}
