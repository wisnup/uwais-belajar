/* Uwais Belajar — cache sederhana untuk pemakaian offline. */
'use strict';

var CACHE = 'uwais-v14';
var CORE = [
  '/',
  '/menulis/',
  '/berhitung/',
  '/membaca/',
  '/404.html',
  '/manifest.webmanifest',
  '/assets/hub.css?v=14',
  '/assets/menulis.css?v=14',
  '/assets/berhitung.css?v=14',
  '/assets/membaca.css?v=14',
  '/assets/i18n.css?v=14',
  '/assets/art.js?v=14',
  '/assets/i18n.js?v=14',
  '/assets/focus.js?v=14',
  '/assets/glyphs.js?v=14',
  '/assets/menulis.js?v=14',
  '/assets/berhitung.js?v=14',
  '/assets/membaca.js?v=14',
  '/assets/register-sw.js?v=14',
  '/assets/fonts/nunito-latin.woff2',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(CORE.map(function (url) {
        return cache.add(url).catch(function () { /* lewati berkas yang gagal */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        /* Halaman sama untuk ?lang=en dan ?lang=id; simpan sekali saja. */
        caches.open(CACHE).then(function (cache) { cache.put(url.pathname, copy); });
        return response;
      }).catch(function () {
        return caches.match(request, { ignoreSearch: true }).then(function (cached) {
          return cached || caches.match(url.pathname) || caches.match('/') || caches.match('/404.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then(function (response) {
      if (response && response.status === 200 && response.type === 'basic') {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () {
      return caches.match(request);
    })
  );
});
