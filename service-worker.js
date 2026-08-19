/**
 * ============================================================
 * SERVICE-WORKER.JS
 * ============================================================
 * Menyimpan "kerangka aplikasi" (HTML/CSS/JS/ikon) ke cache milik
 * browser, supaya aplikasi TETAP BISA DIBUKA walau HP sedang tidak
 * ada sinyal sama sekali (bukan cuma data-nya yang diantre kirim
 * belakangan seperti OfflineQueue di script.js — ini soal APLIKASINYA
 * sendiri yang tetap muncul).
 *
 * Data (project/aktivitas/dsb) TETAP selalu diambil langsung dari
 * server (tidak di-cache di sini) — supaya sales tidak pernah lihat
 * data basi. Yang di-cache cuma "cangkang" aplikasinya.
 * ============================================================ */

const CACHE_NAME = 'svs-shell-v8';
const APP_SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/logo.png',
  './assets/icons/logo-wordmark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // HANYA tangani file app-shell dari domain sendiri (GitHub Pages).
  // Semua request ke domain lain (Cloudflare Workers/API, Firebase
  // Auth, Cloudinary foto) dibiarkan lewat langsung ke jaringan —
  // TIDAK di-cache, supaya data selalu yang terbaru.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
