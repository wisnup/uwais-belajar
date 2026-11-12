/* Uwais Belajar — pilihan bahasa Indonesia/Inggris.
   Teks statis di halaman memakai atribut data-en, data-en-html, data-en-aria,
   dan data-en-content. Teks dari JavaScript memakai UWAIS_LANG.pick().
   Bahasa bisa dipilih lewat tautan: ?lang=en atau ?lang=id.
   Tanpa parameter, pilihan disimpan di perangkat — tanpa akun dan tanpa pelacakan. */
(function () {
  'use strict';

  var KEY = 'uwais.lang';
  var code = 'id';
  var urlLang = '';
  try {
    urlLang = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  } catch (err) { /* abaikan */ }

  if (urlLang === 'en' || urlLang === 'id') {
    code = urlLang;
    try { localStorage.setItem(KEY, code); } catch (err) { /* abaikan */ }
  } else {
    try { if (localStorage.getItem(KEY) === 'en') code = 'en'; } catch (err) { /* abaikan */ }
  }

  function pick(idText, enText) {
    return code === 'en' ? (enText == null ? idText : enText) : idText;
  }

  var LANG = {
    code: code,
    isEN: code === 'en',
    pick: pick,
    set: function (next) {
      code = next === 'en' ? 'en' : 'id';
      LANG.code = code;
      LANG.isEN = code === 'en';
      try { localStorage.setItem(KEY, code); } catch (err) { /* abaikan */ }
    }
  };
  window.UWAIS_LANG = LANG;

  function each(attr, apply) {
    var nodes = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < nodes.length; i++) apply(nodes[i], nodes[i].getAttribute(attr));
  }

  function translateStatic() {
    each('data-en', function (node, value) { node.textContent = value; });
    each('data-en-html', function (node, value) { node.innerHTML = value; });
    each('data-en-aria', function (node, value) { node.setAttribute('aria-label', value); });
    each('data-en-content', function (node, value) { node.setAttribute('content', value); });
  }

  /* Tautan di dalam situs ikut membawa bahasa, supaya alamat halaman
     yang dibagikan tetap terbuka dalam bahasa yang sedang dipakai. */
  function carryLanguage() {
    if (!(code === 'en' || urlLang === 'en' || urlLang === 'id')) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('//') === 0 || /^[a-z]+:/i.test(href)) continue;
      try {
        var u = new URL(href, location.href);
        if (u.origin !== location.origin) continue;
        if (u.searchParams.get('lang') === code) continue;
        u.searchParams.set('lang', code);
        links[i].setAttribute('href', u.pathname + u.search + u.hash);
      } catch (err) { /* abaikan */ }
    }
  }

  function makeButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.id = 'btnLang';
    btn.textContent = code === 'en' ? 'ID' : 'EN';
    btn.title = code === 'en' ? 'Bahasa Indonesia' : 'English';
    btn.setAttribute('aria-label', code === 'en'
      ? 'Switch to Indonesian'
      : 'Ganti ke bahasa Inggris');
    btn.addEventListener('click', function () {
      LANG.set(code === 'en' ? 'id' : 'en');
      var query = '?lang=' + LANG.code;
      try {
        var params = new URLSearchParams(location.search);
        params.set('lang', LANG.code);
        query = '?' + params.toString();
      } catch (err) { /* pakai parameter tunggal */ }
      /* Hash latihan dibiarkan: modul memakai butir yang sama bila ada di
         bahasa tujuan, atau memilih butir lain dengan tenang bila tidak. */
      try {
        history.replaceState(null, '', location.pathname + query + location.hash);
      } catch (err) { /* abaikan */ }
      location.reload();
    });
    return btn;
  }

  if (code === 'en') {
    document.documentElement.lang = 'en';
    translateStatic();
  }
  carryLanguage();

  var actions = document.querySelector('.top-actions') || document.querySelector('.hub-actions');
  if (actions) actions.appendChild(makeButton());
})();
