/* Uwais Belajar — mode fokus.
   Menyembunyikan daftar latihan agar layar hanya berisi satu tugas.
   Pilihan disimpan di perangkat dan berlaku di semua modul. */
(function () {
  'use strict';

  var LANG = window.UWAIS_LANG || { pick: function (id) { return id; } };
  var pick = LANG.pick;
  var KEY = 'uwais.focus';
  var topActions = document.querySelector('.top-actions');
  if (!topActions) return;

  var on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch (err) { /* abaikan */ }

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'icon-btn';
  btn.id = 'btnFocus';
  btn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9"/>' +
    '<path d="M15 4h3.4A1.6 1.6 0 0 1 20 5.6V9"/>' +
    '<path d="M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15"/>' +
    '<path d="M9 20H5.6A1.6 1.6 0 0 1 4 18.4V15"/>' +
    '</svg>';

  function apply() {
    document.body.classList.toggle('focus-mode', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on
      ? pick('Matikan mode fokus', 'Turn off focus mode')
      : pick('Nyalakan mode fokus', 'Turn on focus mode'));
    btn.title = on ? pick('Mode fokus aktif', 'Focus mode on') : pick('Mode fokus', 'Focus mode');
  }

  function announce(text) {
    var live = document.getElementById('live');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 40);
  }

  btn.addEventListener('click', function () {
    on = !on;
    apply();
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) { /* abaikan */ }
    announce(on
      ? pick('Mode fokus aktif. Daftar latihan disembunyikan.', 'Focus mode on. The exercise list is hidden.')
      : pick('Mode fokus mati. Daftar latihan kembali tampil.', 'Focus mode off. The exercise list is back.'));
  });

  apply();
  topActions.insertBefore(btn, topActions.firstChild);
})();
