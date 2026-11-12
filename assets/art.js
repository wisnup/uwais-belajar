/* Uwais Belajar — gambar sederhana untuk modul berhitung dan membaca.
   Setiap soal memakai satu jenis gambar saja; jangan mencampur beberapa
   jenis gambar dalam satu soal karena menyulitkan penghitungan. */
(function () {
  'use strict';

  var ICONS = {
    bintang: {
      label: 'bintang', en: 'star', fill: '#f7e8c8', stroke: '#c98f2f',
      body: '<path d="M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.42l-5.88 3.09 1.12-6.55L2.48 9.32l6.58-.96L12 2.4Z"/>'
    },
    balon: {
      label: 'balon', en: 'bah-lon', fill: '#d9ece7', stroke: '#2c7a6e',
      body: '<ellipse cx="12" cy="8.8" rx="5.6" ry="6.5"/>' +
        '<path d="M12 15.1l-1.4 2h2.8l-1.4-2Z"/>' +
        '<path class="a-line" d="M12 17.1c0 2 1.8 2.4 1.5 4.3"/>'
    },
    ikan: {
      label: 'ikan', en: 'ee-kahn', fill: '#dbe7ee', stroke: '#4b7d92',
      body: '<path d="M3.4 12.2c2.8-3.6 6.4-5.4 10.2-5 1.8.2 3.4 1 4.6 2.2l2.9-2.1v9.8l-2.9-2.1c-1.2 1.2-2.8 2-4.6 2.2-3.8.4-7.4-1.4-10.2-5Z"/>' +
        '<circle class="a-dot" cx="7.6" cy="10.7" r=".75"/>' +
        '<path class="a-line" d="M10.4 14.3c1.3.6 2.6.6 3.9 0"/>'
    },
    bunga: {
      label: 'bunga', en: 'boo-ngah', fill: '#f6e0d4', stroke: '#c17a5a',
      body: '<circle cx="12" cy="6.6" r="3.1"/><circle cx="17.1" cy="10.4" r="3.1"/>' +
        '<circle cx="15.2" cy="16.2" r="3.1"/><circle cx="8.8" cy="16.2" r="3.1"/>' +
        '<circle cx="6.9" cy="10.4" r="3.1"/><circle class="a-dot" cx="12" cy="12" r="2.1"/>'
    },
    daun: {
      label: 'daun', en: 'dah-oon', fill: '#e4ebd2', stroke: '#6b8043',
      body: '<path d="M12 2.8c4.6 2.6 7 6.4 6.3 10.7-.4 2.6-2 4.8-4.3 6.2-1.9 1.1-4 1.2-5.9.2 4.2-1.6 6.5-4.8 6.8-9.5-2.3 3.2-5.3 5-9 5.2.1-4.5 2.3-8.1 6.1-12.8Z"/>' +
        '<path class="a-line" d="M5.9 20.6c1.1-3.7 3.2-6.8 6.4-9.3"/>'
    },
    kupu: {
      label: 'kupu-kupu', en: 'koo-poo koo-poo', fill: '#eadff0', stroke: '#8a6a9a',
      body: '<path d="M11.5 12.1C9.2 8.2 5.7 6.5 4.1 8c-1.6 1.5-.7 4.8 1.4 6.3 1.9 1.3 4.4.8 6-2.2Z"/>' +
        '<path d="M12.5 12.1c2.3-3.9 5.8-5.6 7.4-4.1 1.6 1.5.7 4.8-1.4 6.3-1.9 1.3-4.4.8-6-2.2Z"/>' +
        '<path d="M11.6 12.4c-1.4 1.5-2 3.3-1.3 4.7.4.9 1.1 1.5 1.9 1.7.8-.2 1.5-.8 1.9-1.7.7-1.4.1-3.2-1.3-4.7Z"/>' +
        '<path class="a-line" d="M12 3.2v3.2M8.8 3.6l1.3 2.6M15.2 3.6 13.9 6.2"/>'
    },
    bola: {
      label: 'bola', en: 'boh-lah', fill: '#e0efe9', stroke: '#2c7a6e',
      body: '<circle cx="12" cy="12" r="8.6"/>' +
        '<path class="a-line" d="M12 3.5c-4.4 4.6-4.4 12.4 0 17M12 3.5c4.4 4.6 4.4 12.4 0 17"/>'
    },
    apel: {
      label: 'apel', en: 'ah-pel', fill: '#f3ded8', stroke: '#b46a55',
      body: '<path d="M12 7.3c-1.7-1.7-4.4-1.8-6-.1-1.8 1.9-1.5 5.2.4 8.2 1.4 2.3 3.4 3.9 5.6 3.9s4.2-1.6 5.6-3.9c1.9-3 2.2-6.3.4-8.2-1.6-1.7-4.3-1.6-6 .1Z"/>' +
        '<path class="a-line" d="M12 7.3c0-1.7.9-3.1 2.5-4.1"/>' +
        '<path class="a-line" d="M14.4 4.2c1.7-.7 3.3-.4 4.2.4-.8 1.5-2.6 2.2-4.2.4Z"/>'
    },
    bebek: {
      label: 'bebek', en: 'beh-bek', fill: '#f7ecd2', stroke: '#c98f2f',
      body: '<ellipse cx="12.4" cy="15.4" rx="6.2" ry="4.6"/>' +
        '<circle cx="7.4" cy="9.6" r="3.2"/>' +
        '<path d="M4.5 9.1H2.3l1.6 2.2h1.4Z"/>' +
        '<circle class="a-dot" cx="8.2" cy="8.8" r=".65"/>' +
        '<path class="a-line" d="M17.6 12.5c1.4-.7 2.7-.5 3.5.1"/>'
    },
    awan: {
      label: 'awan', en: 'ah-wahn', fill: '#e7eef2', stroke: '#7d95a1',
      body: '<path d="M6.8 17.8a4.2 4.2 0 0 1-.3-8.4 5.6 5.6 0 0 1 10.6-1.1 4.3 4.3 0 0 1 .6 8.5c-.2.1-.5.2-.8.2H7.4c-.2 0-.4 0-.6-.1Z"/>'
    },
    buku: {
      label: 'buku', en: 'boo-koo', fill: '#e8e1d4', stroke: '#8a6f4d',
      body: '<path d="M4.5 5.5c2.5-.9 5-.7 7.5.6v13c-2.5-1.3-5-1.5-7.5-.6v-13Z"/>' +
        '<path d="M19.5 5.5c-2.5-.9-5-.7-7.5.6v13c2.5-1.3 5-1.5 7.5-.6v-13Z"/>' +
        '<path class="a-line" d="M12 6.1v13"/>'
    },
    susu: {
      label: 'susu', en: 'soo-soo', fill: '#eef2f4', stroke: '#6f8f9c',
      body: '<path d="M7.5 4.6h9l1.3 13c.1 1.1-.8 2.1-1.9 2.1H8.1c-1.1 0-2-1-1.9-2.1l1.3-13Z"/>' +
        '<path class="a-line" d="M8 8.8h8"/>'
    },
    kucing: {
      label: 'kucing', en: 'koo-ching', fill: '#f2e3d2', stroke: '#a97c4f',
      body: '<path d="M5.1 10.7 4.2 4.9l4.5 2.9h6.6l4.5-2.9-.9 5.8c.6 1.2.9 2.4.9 3.6 0 3.7-3.2 6.3-7.8 6.3S4.2 18 4.2 14.3c0-1.2.3-2.4.9-3.6Z"/>' +
        '<circle class="a-dot" cx="9.4" cy="12.6" r=".8"/>' +
        '<circle class="a-dot" cx="14.6" cy="12.6" r=".8"/>' +
        '<path class="a-line" d="M9.8 16c1.4.7 3 .7 4.4 0M12 14.6v1.1M3.2 12.2h2.4M18.4 12.2h2.4"/>'
    },
    topi: {
      label: 'topi', en: 'toh-pee', fill: '#dfe9e6', stroke: '#2c7a6e',
      body: '<path d="M4.4 12.8c0-4.1 3.2-7.4 7.3-7.4 3.4 0 6.3 2.3 7.1 5.5l1.9.5c.8.2 1.3 1.1 1 1.9-.2.7-.8 1.1-1.5 1.1H5.4c-.6 0-1-.5-1-1.1Z"/>' +
        '<path class="a-line" d="M4.6 12.9h10.2"/>'
    },
    meja: {
      label: 'meja', en: 'meh-jah', fill: '#eadfc9', stroke: '#8a6f4d',
      body: '<path d="M3.6 8.3c0-.7.6-1.3 1.3-1.3h14.2c.7 0 1.3.6 1.3 1.3v2.2H3.6V8.3Z"/>' +
        '<path class="a-line" d="M5.9 10.5v9M18.1 10.5v9"/>'
    },
    roti: {
      label: 'roti', en: 'roh-tee', fill: '#f0e2c4', stroke: '#b08a4f',
      body: '<path d="M4.4 12.3c0-3.9 3.4-6.9 7.6-6.9s7.6 3 7.6 6.9c0 2.9-1.4 5.5-3.6 6.9H8c-2.2-1.4-3.6-4-3.6-6.9Z"/>' +
        '<path class="a-line" d="M8.2 10.3c.8-.8 1.9-.8 2.7 0M13.1 8.9c.8-.8 1.9-.8 2.7 0"/>'
    },
    mata: {
      label: 'mata', en: 'mah-tah', fill: '#e6eef3', stroke: '#557f92',
      body: '<path d="M2.9 12S6.5 6.5 12 6.5 21.1 12 21.1 12s-3.6 5.5-9.1 5.5S2.9 12 2.9 12Z"/>' +
        '<circle cx="12" cy="12" r="3.2"/>' +
        '<circle class="a-dot" cx="12" cy="12" r="1.4"/>'
    }
  };

  var NS = 'http://www.w3.org/2000/svg';

  function svg(kind, extraClass) {
    var def = ICONS[kind] || ICONS.bintang;
    var node = document.createElementNS(NS, 'svg');
    node.setAttribute('viewBox', '0 0 24 24');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    node.setAttribute('class', 'art' + (extraClass ? ' ' + extraClass : ''));
    node.style.setProperty('--art-fill', def.fill);
    node.style.setProperty('--art-stroke', def.stroke);
    node.innerHTML = def.body;
    return node;
  }

  window.UWAIS_ART = {
    icons: ICONS,
    svg: svg,
    has: function (kind) { return !!ICONS[kind]; },
    label: function (kind) { return (ICONS[kind] || ICONS.bintang).label; },
    en: function (kind) { return (ICONS[kind] || ICONS.bintang).en; }
  };
})();
