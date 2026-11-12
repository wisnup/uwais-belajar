/* Daftarkan service worker agar media bisa dibuka offline setelah kunjungan pertama. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* offline bersifat opsional */ });
  });
})();
