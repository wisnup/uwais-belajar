/* Uwais Belajar — modul menulis.
   Mesin penebalan titik: kanvas, deteksi goresan, progres, suara. */
(function () {
  'use strict';

  var G = window.UWAIS_GLYPHS;
  var TAU = Math.PI * 2;
  var LANG = window.UWAIS_LANG;
  var EN = LANG.isEN;
  var pick = LANG.pick;
  var STORAGE_KEY = 'uwais.menulis.v1' + (EN ? '.en' : '');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CONS = ['b', 'c', 'd', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't'];
  var VOWELS = ['a', 'i', 'u', 'e', 'o'];
  var SYLLABLES = [];
  CONS.forEach(function (c) {
    VOWELS.forEach(function (v) { SYLLABLES.push(c + v); });
  });

  /* Bahasa Inggris: keluarga kata (rime) dua huruf dan kata pendek. */
  var RIMES = [
    'at', 'an', 'ap', 'am', 'ag', 'ad', 'ed', 'en', 'et', 'eg',
    'it', 'in', 'ig', 'ip', 'id', 'ot', 'og', 'op', 'ob',
    'ug', 'un', 'ut', 'up', 'ub'
  ];

  var WORDS_ID = [
    'aku', 'api', 'ibu', 'dua', 'ini', 'itu', 'kue', 'mata', 'kaki', 'sapi',
    'bola', 'buku', 'susu', 'roti', 'meja', 'topi', 'nasi', 'gigi', 'jari',
    'kuda', 'baju', 'bibi', 'papa', 'mama', 'cuci', 'jaga'
  ];

  var WORDS_EN = ['cat', 'hat', 'dog', 'sun', 'cup', 'bed', 'pig', 'bus', 'map', 'red', 'egg', 'fish'];

  var SETS_EN = [
    {
      id: 'besar', title: 'Uppercase', short: 'ABC', picker: 'Choose a letter', source: 'upper',
      unit: 'letter', trace: 'uppercase letter', advance: 60,
      items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    {
      id: 'kecil', title: 'Lowercase', short: 'abc', picker: 'Choose a letter', source: 'lower',
      unit: 'letter', trace: 'lowercase letter', advance: 60,
      items: 'abcdefghijklmnopqrstuvwxyz'.split('')
    },
    {
      id: 'angka', title: 'Numbers', short: '123', picker: 'Choose a number', source: 'digits',
      unit: 'number', trace: 'number', advance: 60, items: '0123456789'.split('')
    },
    {
      id: 'suku', title: 'Word parts', short: 'Parts', picker: 'Choose a word part', source: 'lower',
      unit: 'word part', trace: 'word part', advance: 52, items: RIMES
    },
    {
      id: 'kata', title: 'Words', short: 'Words', picker: 'Choose a word', source: 'lower',
      unit: 'word', trace: 'word', advance: 46, items: WORDS_EN
    }
  ];

  var SETS_ID = [
    {
      id: 'besar', title: 'Huruf besar', short: 'Besar', picker: 'Pilih huruf', source: 'upper',
      unit: 'Huruf', advance: 60, items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    {
      id: 'kecil', title: 'Huruf kecil', short: 'Kecil', picker: 'Pilih huruf', source: 'lower',
      unit: 'Huruf', advance: 60, items: 'abcdefghijklmnopqrstuvwxyz'.split('')
    },
    {
      id: 'angka', title: 'Angka', short: 'Angka', picker: 'Pilih angka', source: 'digits',
      unit: 'Angka', advance: 60, items: '0123456789'.split('')
    },
    {
      id: 'suku', title: 'Suku kata', short: 'Suku', picker: 'Pilih suku kata', source: 'lower',
      unit: 'Suku kata', advance: 52, items: SYLLABLES
    },
    {
      id: 'kata', title: 'Kata', short: 'Kata', picker: 'Pilih kata', source: 'lower',
      unit: 'Kata', advance: 46, items: WORDS_ID
    }
  ];

  var SETS = EN ? SETS_EN : SETS_ID;

  var LEVELS = {
    penuh: { label: pick('Penuh', 'Full'), tol: 12.5, every: 6.5, dot: 1.8, future: 0.3, corridor: true, arrow: true, ghost: false },
    sedang: { label: pick('Sedang', 'Medium'), tol: 9.5, every: 8.5, dot: 1.7, future: 0.2, corridor: false, arrow: false, ghost: false },
    mandiri: { label: pick('Mandiri', 'Solo'), tol: 7.5, every: 13, dot: 1.55, future: 0, corridor: false, arrow: false, ghost: true },
    halaman: { label: pick('Halaman', 'Page'), page: true, tol: 12.5, every: 6.5, dot: 1.8, future: 0, corridor: false, arrow: false, ghost: false }
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  var setsEl = $('#sets');
  var levelsEl = $('#levels');
  var chipsEl = $('#chips');
  var titleEl = $('#itemTitle');
  var metaEl = $('#itemMeta');
  var captionEl = $('#caption');
  var progressEl = $('#progress');
  var pickerTitleEl = $('#pickerTitle');
  var boardEl = $('#board');
  var wrapEl = $('#boardWrap');
  var successEl = $('#success');
  var successTextEl = $('#successText');
  var successTitleEl = $('#successTitle');
  var hearBtn = $('#btnHear');
  var resetProgressBtn = $('#btnResetProgress');
  var resetDialog = $('#resetDialog');
  var liveEl = $('#live');
  var helpDialog = $('#helpDialog');
  var rotateNote = $('#rotateNote');
  var measureSvg = $('#measureSvg');
  var ctx = boardEl.getContext('2d');

  var view = { w: 0, h: 0, dpr: 1, scale: 0, ox: 0, oy: 0 };
  var rt = {
    setIndex: 0,
    itemIndex: 0,
    item: null,
    strokeIndex: 0,
    reach: 0,
    dragging: false,
    complete: false,
    demo: null,
    needDraw: false,
    captionTimer: 0,
    page: null
  };

  function isPage() {
    return state.level === 'halaman';
  }

  /* ---------------- penyimpanan ---------------- */

  var defaultState = {
    level: 'penuh',
    sound: false,
    setId: 'besar',
    itemId: 'A',
    done: {},
    last: {}
  };

  var state = loadState();

  function loadState() {
    var base = {
      level: 'penuh', sound: false, setId: 'besar', itemId: 'A',
      done: {}, last: {}
    };
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      base.level = LEVELS[parsed.level] ? parsed.level : 'penuh';
      base.sound = !!parsed.sound;
      if (SETS.some(function (s) { return s.id === parsed.setId; })) base.setId = parsed.setId;
      if (typeof parsed.itemId === 'string') base.itemId = parsed.itemId;
      if (parsed.done && typeof parsed.done === 'object') {
        SETS.forEach(function (set) {
          var list = parsed.done[set.id];
          if (Array.isArray(list)) {
            base.done[set.id] = list.filter(function (label) {
              return set.items.indexOf(label) !== -1;
            });
          }
        });
      }
      if (parsed.last && typeof parsed.last === 'object') {
        SETS.forEach(function (set) {
          if (set.items.indexOf(parsed.last[set.id]) !== -1) {
            base.last[set.id] = parsed.last[set.id];
          }
        });
      }
    } catch (err) { /* penyimpanan tidak tersedia */ }
    return base;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* abaikan */ }
  }

  function isDone(setId, label) {
    return (state.done[setId] || []).indexOf(label) !== -1;
  }

  function markDone(setId, label) {
    var list = state.done[setId] || (state.done[setId] = []);
    if (list.indexOf(label) === -1) list.push(label);
  }

  /* ---------------- geometri ---------------- */

  var sampleCache = {};

  function samplePath(d) {
    if (sampleCache[d]) return sampleCache[d];
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    measureSvg.appendChild(path);
    var length = 0;
    try { length = path.getTotalLength(); } catch (err) { length = 0; }
    var points = [];
    if (length > 0.2) {
      var step = 1.4;
      for (var at = 0; at <= length; at += step) {
        var pt = path.getPointAtLength(at);
        points.push({ x: pt.x, y: pt.y });
      }
      var end = path.getPointAtLength(length);
      var last = points[points.length - 1];
      if (!last || Math.abs(end.x - last.x) + Math.abs(end.y - last.y) > 0.4) {
        points.push({ x: end.x, y: end.y });
      }
    } else {
      points.push({ x: 0, y: 0 });
    }
    measureSvg.removeChild(path);
    sampleCache[d] = points;
    return points;
  }

  function prepStroke(points) {
    var pts = [];
    var cum = [];
    var total = 0;
    for (var i = 0; i < points.length; i++) {
      if (i > 0) {
        total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      }
      pts.push(points[i]);
      cum.push(total);
    }
    return { pts: pts, cum: cum, total: total };
  }

  function glyphPaths(set, ch) {
    var map = set.source === 'digits' ? G.digits : set.source === 'upper' ? G.upper : G.lower;
    return map[ch] || G.lower[ch] || G.upper[ch] || [];
  }

  function buildItem(set, label) {
    var letters = label.split('');
    var strokes = [];
    letters.forEach(function (ch, gi) {
      var dx = gi * set.advance;
      glyphPaths(set, ch).forEach(function (d) {
        var raw = samplePath(d);
        var moved = raw.map(function (p) { return { x: p.x + dx, y: p.y }; });
        strokes.push(prepStroke(moved));
      });
    });
    return {
      set: set,
      label: label,
      letters: letters,
      strokes: strokes,
      width: (letters.length - 1) * set.advance + G.boxWidth,
      height: G.boxHeight
    };
  }

  var itemCache = {};

  function getItem(set, label) {
    var key = set.id + '/' + label;
    if (!itemCache[key]) itemCache[key] = buildItem(set, label);
    return itemCache[key];
  }

  function pointAtDistance(stroke, distance) {
    if (distance <= 0) return stroke.pts[0];
    var last = stroke.pts.length - 1;
    if (distance >= stroke.cum[last]) return stroke.pts[last];
    var lo = 0;
    var hi = last;
    while (lo < hi - 1) {
      var mid = (lo + hi) >> 1;
      if (stroke.cum[mid] < distance) lo = mid; else hi = mid;
    }
    var span = stroke.cum[hi] - stroke.cum[lo] || 0.0001;
    var t = (distance - stroke.cum[lo]) / span;
    return {
      x: stroke.pts[lo].x + (stroke.pts[hi].x - stroke.pts[lo].x) * t,
      y: stroke.pts[lo].y + (stroke.pts[hi].y - stroke.pts[lo].y) * t
    };
  }

  /* ---------------- suara ---------------- */

  var audioCtx = null;

  function ensureAudio() {
    if (state.sound && !audioCtx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) {
        try { audioCtx = new Ctor(); } catch (err) { audioCtx = null; }
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
    return audioCtx;
  }

  function tone(freq, duration, delay, volume) {
    if (!state.sound) return;
    var ac = ensureAudio();
    if (!ac) return;
    try {
      var t0 = ac.currentTime + (delay || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume || 0.05, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.06);
    } catch (err) { /* suara opsional */ }
  }

  function playStrokeSound() {
    tone(587.33, 0.14, 0, 0.045);
  }

  function playSuccessSound() {
    tone(523.25, 0.2, 0, 0.05);
    tone(659.25, 0.22, 0.12, 0.045);
    tone(783.99, 0.3, 0.25, 0.045);
  }

  /* Nama yang diucapkan: huruf memakai ejaan Indonesia (A -> "a", B -> "be").
     Dalam bahasa Inggris, label sudah berupa ejaan Inggris yang benar. */
  function spokenName() {
    if (!rt.item) return '';
    var set = rt.item.set;
    var label = rt.item.label;
    if (EN) return label;
    if (set.id === 'besar' || set.id === 'kecil') {
      return G.names[label.toUpperCase()] || label;
    }
    if (set.id === 'angka') return G.names[label] || label;
    return label;
  }

  function indonesianVoice() {
    var voices;
    try { voices = window.speechSynthesis.getVoices() || []; } catch (err) { return null; }
    var matches = voices.filter(function (v) { return /^id([-_]|$)/i.test(v.lang || ''); });
    if (!matches.length) return null;
    var local = matches.filter(function (v) { return v.localService; });
    return local[0] || matches[0];
  }

  function englishVoice() {
    var voices;
    try { voices = window.speechSynthesis.getVoices() || []; } catch (err) { return null; }
    var matches = voices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ''); });
    if (!matches.length) return null;
    var local = matches.filter(function (v) { return v.localService; });
    return local[0] || matches[0];
  }

  /* Cadangan bila perangkat hanya punya suara Inggris: tuliskan bunyi Indonesia. */
  var EN_LETTER = {
    A: 'ah', B: 'bay', C: 'chay', D: 'day', E: 'ay', F: 'eff', G: 'gay',
    H: 'hah', I: 'ee', J: 'jay', K: 'kah', L: 'ell', M: 'em', N: 'en',
    O: 'oh', P: 'pay', Q: 'kee', R: 'ar', S: 'ess', T: 'tay', U: 'oo',
    V: 'vay', W: 'way', X: 'eks', Y: 'yay', Z: 'zet'
  };
  var EN_DIGIT = {
    '0': 'nol', '1': 'sah-too', '2': 'doo-ah', '3': 'tee-gah', '4': 'ehm-paht',
    '5': 'lee-mah', '6': 'eh-nahm', '7': 'too-joo', '8': 'deh-lah-pahn', '9': 'sehm-bee-lahn'
  };
  var EN_CONSONANT = { b: 'b', c: 'ch', d: 'd', g: 'g', h: 'h', j: 'j', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', r: 'r', s: 's', t: 't' };
  var EN_VOWEL = { a: 'ah', i: 'ee', u: 'oo', e: 'eh', o: 'oh' };
  var EN_WORD = {
    aku: 'ah-koo', api: 'ah-pee', ibu: 'ee-boo', dua: 'doo-ah', ini: 'ee-nee',
    itu: 'ee-too', kue: 'koo-ay', mata: 'mah-tah', kaki: 'kah-kee', sapi: 'sah-pee',
    bola: 'boh-lah', buku: 'boo-koo', susu: 'soo-soo', roti: 'roh-tee', meja: 'may-jah',
    topi: 'toh-pee', nasi: 'nah-see', gigi: 'ghee-ghee', jari: 'jah-ree', kuda: 'koo-dah',
    baju: 'bah-joo', bibi: 'bee-bee', papa: 'pah-pah', mama: 'mah-mah', cuci: 'choo-chee',
    jaga: 'jah-gah'
  };

  function englishName() {
    var set = rt.item.set;
    var label = rt.item.label;
    if (set.id === 'besar' || set.id === 'kecil') return EN_LETTER[label.toUpperCase()] || label;
    if (set.id === 'angka') return EN_DIGIT[label] || label;
    if (set.id === 'suku') {
      var first = label.charAt(0);
      var second = label.charAt(1);
      var consonant = EN_CONSONANT[first] || first;
      if (first === 'g' && (second === 'i' || second === 'e')) consonant = 'gh';
      return consonant + (EN_VOWEL[second] || second);
    }
    return EN_WORD[label] || label;
  }

  function stopSpeech() {
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch (err) { /* opsional */ }
  }

  function speakItem(force) {
    if (!force && !state.sound) return;
    if (!rt.item) return;
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
    var text = spokenName();
    if (!text) return;
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (err) { voices = []; }
    var voice = EN ? (englishVoice() || voices[0] || null) : indonesianVoice();
    if (!EN && !voice && voices.length) {
      text = englishName();
      voice = englishVoice() || voices[0];
    }
    try {
      var utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = EN || (voice && !/^id([-_]|$)/i.test(voice.lang || '')) ? 'en-US' : 'id-ID';
      utterance.rate = 0.88;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch (err) { /* suara opsional */ }
  }

  /* ---------------- render ---------------- */

  function sx(x) { return view.ox + x * view.scale; }
  function sy(y) { return view.oy + y * view.scale; }

  function computeView() {
    if (!rt.item || view.w < 10 || view.h < 10) return;
    var pad = Math.max(14, Math.min(54, Math.min(view.w, view.h) * 0.07));
    var cw = rt.item.width;
    var ch = rt.item.height;
    var scale = Math.min((view.w - pad * 2) / cw, (view.h - pad * 2) / ch);
    view.scale = Math.max(scale, 0.1);
    view.ox = (view.w - cw * view.scale) / 2;
    view.oy = (view.h - ch * view.scale) / 2;
  }

  function resize() {
    var rect = wrapEl.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var bw = Math.round(rect.width * dpr);
    var bh = Math.round(rect.height * dpr);
    if (boardEl.width !== bw || boardEl.height !== bh) {
      boardEl.width = bw;
      boardEl.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = rect.width;
    view.h = rect.height;
    view.dpr = dpr;
    computeView();
    draw();
  }

  function requestDraw() {
    if (rt.needDraw) return;
    rt.needDraw = true;
    requestAnimationFrame(function () {
      rt.needDraw = false;
      draw();
    });
  }

  function drawPolyline(stroke, endIndex, color, width, alpha) {
    var pts = stroke.pts;
    if (endIndex < 0) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, width * view.scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (var i = 1; i <= endIndex && i < pts.length; i++) {
      ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawDots(stroke, every, radius, color) {
    if (!every || every <= 0) return;
    var pts = stroke.pts;
    var next = 0;
    var lastDrawn = -1;
    ctx.save();
    ctx.fillStyle = color;
    for (var i = 0; i < pts.length; i++) {
      if (stroke.cum[i] >= next - 0.01) {
        ctx.beginPath();
        ctx.arc(sx(pts[i].x), sy(pts[i].y), radius * view.scale, 0, TAU);
        ctx.fill();
        lastDrawn = i;
        next += every;
      }
    }
    var last = pts.length - 1;
    if (last !== lastDrawn && stroke.cum[last] - stroke.cum[lastDrawn] > 1.4) {
      ctx.beginPath();
      ctx.arc(sx(pts[last].x), sy(pts[last].y), radius * view.scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStartMarker(stroke, level) {
    if (!stroke || !stroke.pts.length) return;
    var index = Math.min(rt.reach, stroke.pts.length - 1);
    var p = stroke.pts[index];
    var scale = view.scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 5.6 * scale, 0, TAU);
    ctx.fillStyle = 'rgba(44, 122, 110, 0.15)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 3.7 * scale, 0, TAU);
    ctx.fillStyle = '#fffdf7';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 2.15 * scale, 0, TAU);
    ctx.fillStyle = '#2c7a6e';
    ctx.fill();
    ctx.restore();

    if (level.arrow && rt.reach < 3) {
      var remaining = stroke.total - stroke.cum[index];
      if (remaining > 20) {
        var base = pointAtDistance(stroke, stroke.cum[index] + 10.5);
        var tip = pointAtDistance(stroke, stroke.cum[index] + 17.5);
        var angle = Math.atan2(tip.y - base.y, tip.x - base.x);
        var half = 2.35;
        var leftX = base.x + Math.cos(angle + Math.PI / 2) * half;
        var leftY = base.y + Math.sin(angle + Math.PI / 2) * half;
        var rightX = base.x + Math.cos(angle - Math.PI / 2) * half;
        var rightY = base.y + Math.sin(angle - Math.PI / 2) * half;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(sx(leftX), sy(leftY));
        ctx.lineTo(sx(tip.x), sy(tip.y));
        ctx.lineTo(sx(rightX), sy(rightY));
        ctx.strokeStyle = 'rgba(255, 253, 247, 0.85)';
        ctx.lineWidth = Math.max(1, 2.3 * scale);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(44, 122, 110, 0.55)';
        ctx.lineWidth = Math.max(1, 1.15 * scale);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawDemoMarker(p) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 5.4 * view.scale, 0, TAU);
    ctx.fillStyle = 'rgba(44, 122, 110, 0.14)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 3.2 * view.scale, 0, TAU);
    ctx.fillStyle = '#2c7a6e';
    ctx.fill();
    ctx.restore();
  }

  function drawDemo() {
    var totalPoints = 0;
    rt.item.strokes.forEach(function (s) { totalPoints += s.pts.length; });
    var left = Math.floor((rt.demo ? rt.demo.progress : 0) * totalPoints);
    var marker = null;

    rt.item.strokes.forEach(function (stroke) {
      if (left >= stroke.pts.length) {
        drawPolyline(stroke, stroke.pts.length - 1, '#2c7a6e', 7, 0.32);
        left -= stroke.pts.length;
      } else if (left > 0) {
        drawPolyline(stroke, left, '#2c7a6e', 7, 0.42);
        marker = stroke.pts[Math.min(left, stroke.pts.length - 1)];
        left = 0;
      } else if (!marker) {
        marker = stroke.pts[0];
      }
    });

    if (rt.demo && rt.demo.progress >= 1) {
      var lastStroke = rt.item.strokes[rt.item.strokes.length - 1];
      if (lastStroke) marker = lastStroke.pts[lastStroke.pts.length - 1];
    }
    if (marker) drawDemoMarker(marker);
  }

  function draw() {
    if (!rt.item || !view.scale) return;
    ctx.clearRect(0, 0, view.w, view.h);
    if (isPage()) {
      drawPage();
      return;
    }
    var level = LEVELS[state.level];

    /* garis bantu tipis */
    ctx.save();
    ctx.strokeStyle = 'rgba(38, 52, 59, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(G.baseline));
    ctx.lineTo(sx(rt.item.width), sy(G.baseline));
    ctx.stroke();
    ctx.restore();

    rt.item.strokes.forEach(function (stroke, i) {
      var done = i < rt.strokeIndex || rt.complete;
      var current = i === rt.strokeIndex && !rt.complete && !rt.demo;

      if (done) {
        drawPolyline(stroke, stroke.pts.length - 1, '#2c7a6e', 8, 1);
        return;
      }

      if (current) {
        if (level.ghost) {
          drawPolyline(stroke, stroke.pts.length - 1, 'rgba(83, 105, 99, 0.22)', 1.7);
        }
        if (level.corridor) {
          drawPolyline(stroke, stroke.pts.length - 1, 'rgba(44, 122, 110, 0.065)', 21);
        }
        drawDots(stroke, level.every, level.dot, 'rgba(83, 105, 99, 0.55)');
        if (rt.reach > 0) {
          drawPolyline(stroke, rt.reach, '#2c7a6e', 8, 1);
        }
        drawStartMarker(stroke, level);
      } else if (level.ghost) {
        drawPolyline(stroke, stroke.pts.length - 1, 'rgba(83, 105, 99, 0.16)', 1.5);
      } else if (level.future > 0) {
        drawDots(stroke, level.every, level.dot * 0.82, 'rgba(83, 105, 99, ' + level.future + ')');
      }
    });

    if (rt.demo) drawDemo();
  }

  /* ---------------- halaman kotak ---------------- */

  function pageLayout() {
    if (!rt.item || view.w < 10 || view.h < 10) return null;
    var padX = Math.max(10, Math.min(18, view.w * 0.035));
    var padY = Math.max(10, Math.min(18, view.h * 0.035));
    var uw = view.w - padX * 2;
    var uh = view.h - padY * 2;
    var aspect = rt.item.width / rt.item.height;
    var cols, rows, cw, ch;
    if (aspect <= 0.9) {
      var rowCount;
      if (view.w < 560) {
        cols = 4;
        rowCount = Math.max(2, Math.min(5, Math.round(uh / 78)));
      } else {
        cols = Math.max(4, Math.min(8, Math.floor(uw / 95)));
        rowCount = Math.max(2, Math.min(5, Math.round(uh / 96)));
      }
      var square = Math.min(uw / cols, uh / rowCount, 128);
      cw = ch = Math.max(42, square);
      rows = Math.max(2, Math.min(rowCount, Math.floor(uh / ch)));
    } else {
      var target = view.w < 560 ? rt.item.width * 0.9 : rt.item.width * 1.3;
      cols = Math.max(2, Math.min(5, Math.floor(uw / target)));
      cw = uw / cols;
      ch = cw / aspect;
      if (ch > uh / 2) { ch = uh / 2; cw = ch * aspect; }
      rows = Math.max(2, Math.min(5, Math.floor(uh / ch)));
    }
    var w = cols * cw;
    var h = rows * ch;
    return {
      cols: cols, rows: rows, cw: cw, ch: ch,
      ox: (view.w - w) / 2, oy: (view.h - h) / 2, w: w, h: h
    };
  }

  function ensurePage() {
    var L = pageLayout();
    if (!rt.page) rt.page = { strokes: [], active: null, layout: L, cols: 0, rows: 0 };
    rt.page.layout = L;
    if (!L) {
      rt.page.cols = 0;
      rt.page.rows = 0;
      return rt.page;
    }
    if (rt.page.cols !== L.cols || rt.page.rows !== L.rows) {
      var total = L.cols * L.rows;
      rt.page.strokes = rt.page.strokes.filter(function (s) { return s.cell < total; });
      if (rt.page.active && rt.page.active.cell >= total) rt.page.active = null;
      rt.page.cols = L.cols;
      rt.page.rows = L.rows;
      updatePageLabel();
    }
    return rt.page;
  }

  function pageCounts() {
    var L = rt.page && rt.page.layout;
    if (!L) return { filled: 0, total: 0 };
    var total = L.cols * L.rows;
    var seen = {};
    rt.page.strokes.forEach(function (s) {
      if (s.cell < total) seen[s.cell] = true;
    });
    return { filled: Object.keys(seen).length, total: total };
  }

  function updatePageLabel() {
    if (!rt.item || !rt.page) return;
    var counts = pageCounts();
    boardEl.setAttribute('aria-label', pick(
      'Halaman kotak untuk ' + rt.item.set.unit.toLowerCase() + ' ' + rt.item.label +
        '. ' + counts.filled + ' dari ' + counts.total + ' kotak terisi.',
      'Grid page for ' + rt.item.set.trace + ' ' + rt.item.label +
        '. ' + counts.filled + ' of ' + counts.total + ' boxes filled.'
    ));
  }

  function cellGlyph(x, y, w, h) {
    var scale = Math.min((w * 0.84) / rt.item.width, (h * 0.84) / rt.item.height);
    return {
      scale: scale,
      ox: x + (w - rt.item.width * scale) / 2,
      oy: y + (h - rt.item.height * scale) / 2
    };
  }

  function roundRectPath(x, y, w, h, radius) {
    var rr = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawItemInCell(x, y, w, h, color, width, alpha) {
    var g = cellGlyph(x, y, w, h);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    rt.item.strokes.forEach(function (stroke) {
      var pts = stroke.pts;
      ctx.beginPath();
      ctx.moveTo(g.ox + pts[0].x * g.scale, g.oy + pts[0].y * g.scale);
      for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(g.ox + pts[i].x * g.scale, g.oy + pts[i].y * g.scale);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawPageStroke(stroke) {
    var L = rt.page && rt.page.layout;
    if (!L || stroke.cell >= L.cols * L.rows) return;
    var c = stroke.cell % L.cols;
    var r = Math.floor(stroke.cell / L.cols);
    var x = L.ox + c * L.cw;
    var y = L.oy + r * L.ch;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, L.cw, L.ch);
    ctx.clip();
    ctx.strokeStyle = '#2c7a6e';
    ctx.lineWidth = Math.max(2.6, Math.min(7, L.cw * 0.075));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var i = 0; i < stroke.pts.length; i++) {
      var px = x + stroke.pts[i].x * L.cw;
      var py = y + stroke.pts[i].y * L.ch;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPage() {
    var page = ensurePage();
    var L = page.layout;
    if (!L) return;

    /* lembar kertas di atas papan */
    ctx.save();
    ctx.fillStyle = '#fffdf8';
    ctx.strokeStyle = 'rgba(120, 104, 78, 0.18)';
    ctx.lineWidth = 1;
    roundRectPath(L.ox - 7, L.oy - 7, L.w + 14, L.h + 14, 16);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    for (var r = 0; r < L.rows; r++) {
      for (var c = 0; c < L.cols; c++) {
        var x = L.ox + c * L.cw;
        var y = L.oy + r * L.ch;
        var first = c === 0 && r === 0;

        ctx.save();
        ctx.strokeStyle = 'rgba(120, 104, 78, 0.32)';
        ctx.lineWidth = 1;
        roundRectPath(x + 0.5, y + 0.5, L.cw - 1, L.ch - 1, 8);
        ctx.stroke();
        ctx.restore();

        var g = cellGlyph(x, y, L.cw, L.ch);
        ctx.save();
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = 'rgba(120, 104, 78, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + L.cw * 0.2, g.oy + G.baseline * g.scale);
        ctx.lineTo(x + L.cw * 0.8, g.oy + G.baseline * g.scale);
        ctx.stroke();
        ctx.restore();

        drawItemInCell(x, y, L.cw, L.ch,
          first ? '#2c7a6e' : 'rgba(83, 105, 99, 1)',
          Math.max(1.3, L.cw * (first ? 0.035 : 0.028)),
          first ? 0.34 : 0.13);
      }
    }

    page.strokes.forEach(drawPageStroke);
    if (page.active) drawPageStroke(page.active);
  }

  /* ---------------- UI ---------------- */

  function renderTabs() {
    setsEl.innerHTML = '';
    SETS.forEach(function (set, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab';
      var longLabel = document.createElement('span');
      longLabel.className = 'tab-long';
      longLabel.textContent = set.title;
      var shortLabel = document.createElement('span');
      shortLabel.className = 'tab-short';
      shortLabel.textContent = set.short || set.title;
      btn.appendChild(longLabel);
      btn.appendChild(shortLabel);
      btn.setAttribute('aria-label', set.title);
      btn.setAttribute('aria-pressed', i === rt.setIndex ? 'true' : 'false');
      btn.addEventListener('click', function () {
        if (i !== rt.setIndex) switchSet(i);
      });
      setsEl.appendChild(btn);
    });
    centerActiveTab();
  }

  function centerActiveTab() {
    var active = setsEl.querySelector('.tab[aria-pressed="true"]');
    if (!active) return;
    var tabRect = active.getBoundingClientRect();
    var listRect = setsEl.getBoundingClientRect();
    if (tabRect.left >= listRect.left - 2 && tabRect.right <= listRect.right + 2) return;
    var target = setsEl.scrollLeft + (tabRect.left - listRect.left) -
      (setsEl.clientWidth - tabRect.width) / 2;
    target = Math.max(0, target);
    try {
      setsEl.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch (err) {
      setsEl.scrollLeft = target;
    }
  }

  function setLevel(key) {
    if (state.level === key || !LEVELS[key]) return;
    var wasPage = isPage();
    state.level = key;
    var nowPage = isPage();
    document.body.classList.toggle('page-mode', nowPage);
    if (nowPage !== wasPage) {
      hideSuccess();
      stopDemo(true);
      stopSpeech();
      rt.page = null;
      rt.complete = false;
      rt.strokeIndex = 0;
      rt.reach = 0;
      rt.dragging = false;
    }
    renderLevels();
    setCaption(defaultCaption(), false);
    updateBoardLabel();
    saveState();
    resize();
  }

  function renderLevels() {
    levelsEl.innerHTML = '';
    Object.keys(LEVELS).forEach(function (key) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.textContent = LEVELS[key].label;
      btn.dataset.level = key;
      btn.setAttribute('aria-pressed', state.level === key ? 'true' : 'false');
      btn.addEventListener('click', function () { setLevel(key); });
      levelsEl.appendChild(btn);
    });
  }

  function renderChips(center) {
    var set = rt.item.set;
    chipsEl.innerHTML = '';
    set.items.forEach(function (label, i) {
      var startsGroup = EN
        ? (i === 0 || label.charAt(1) !== set.items[i - 1].charAt(1))
        : i % VOWELS.length === 0;
      if (set.id === 'suku' && i > 0 && startsGroup) {
        var gap = document.createElement('span');
        gap.className = 'group-gap';
        gap.setAttribute('aria-hidden', 'true');
        chipsEl.appendChild(gap);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (label.length > 1 ? ' wide' : '');
      btn.textContent = label;
      btn.setAttribute('aria-current', i === rt.itemIndex ? 'true' : 'false');
      var done = isDone(set.id, label);
      if (done) {
        var tick = document.createElement('span');
        tick.className = 'tick';
        tick.setAttribute('aria-hidden', 'true');
        tick.textContent = '✓';
        btn.appendChild(tick);
      }
      btn.setAttribute('aria-label', set.unit + ' ' + label + (done ? pick(', sudah selesai', ', done') : ''));
      btn.addEventListener('click', function () {
        if (i !== rt.itemIndex) loadItem(label, true);
      });
      chipsEl.appendChild(btn);
    });
    updateProgress();
    if (center) centerCurrentChip();
  }

  function centerCurrentChip() {
    var chip = chipsEl.querySelector('[aria-current="true"]');
    if (!chip) return;
    var chipRect = chip.getBoundingClientRect();
    var listRect = chipsEl.getBoundingClientRect();
    var target = chipsEl.scrollLeft + (chipRect.left - listRect.left) -
      (chipsEl.clientWidth - chipRect.width) / 2;
    target = Math.max(0, target);
    try {
      chipsEl.scrollTo({ left: target, behavior: reducedMotion ? 'auto' : 'smooth' });
    } catch (err) {
      chipsEl.scrollLeft = target;
    }
  }

  function updateProgress() {
    var set = rt.item.set;
    var total = set.items.length;
    var done = set.items.filter(function (label) { return isDone(set.id, label); }).length;
    progressEl.textContent = pick(done + ' dari ' + total + ' selesai', done + ' of ' + total + ' done');
    updateResetButton();
  }

  function hasAnyProgress() {
    return SETS.some(function (set) {
      return (state.done[set.id] || []).length > 0;
    });
  }

  function updateResetButton() {
    resetProgressBtn.disabled = !hasAnyProgress();
  }

  function clearProgress() {
    state.done = {};
    saveState();
    renderChips(false);
    updateProgress();
    if (rt.complete) resetItem();
    announce(pick('Progres dihapus. Semua latihan bisa dimulai lagi.',
      'Progress cleared. Every exercise can start again.'));
  }

  function updateSoundButton() {
    var btn = $('#btnSound');
    btn.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    btn.setAttribute('aria-label', state.sound ? pick('Suara menyala', 'Sound on') : pick('Suara mati', 'Sound off'));
  }

  function updateBoardLabel() {
    if (!rt.item) return;
    if (isPage()) {
      ensurePage();
      updatePageLabel();
      return;
    }
    var total = rt.item.strokes.length;
    var current = rt.complete ? total : Math.min(rt.strokeIndex + 1, total);
    boardEl.setAttribute(
      'aria-label',
      pick('Area menebalkan ' + rt.item.set.title.toLowerCase() + ' ' + rt.item.label +
        '. Goresan ' + current + ' dari ' + total + '.',
      'Tracing area for ' + rt.item.set.trace + ' ' + rt.item.label +
        '. Stroke ' + current + ' of ' + total + '.')
    );
  }

  function defaultCaption() {
    if (isPage()) {
      return pick('Isi semua kotak. Ikuti huruf samarnya.',
        'Fill every box. Follow the faint letter.');
    }
    if (EN) {
      return state.level === 'mandiri'
        ? 'Write it yourself. Start at the green dot.'
        : 'Start at the green dot, then follow the dots.';
    }
    return state.level === 'mandiri'
      ? 'Tulis sendiri. Mulai dari titik hijau.'
      : 'Mulai dari titik hijau, lalu ikuti titik-titik.';
  }

  function setCaption(text, nudge) {
    captionEl.textContent = text;
    captionEl.classList.toggle('nudge', !!nudge);
    clearTimeout(rt.captionTimer);
    if (nudge) {
      rt.captionTimer = setTimeout(function () {
        captionEl.classList.remove('nudge');
        captionEl.textContent = defaultCaption();
      }, 2400);
    }
  }

  function announce(text) {
    liveEl.textContent = '';
    setTimeout(function () { liveEl.textContent = text; }, 40);
  }

  function showSuccess() {
    successEl.classList.add('show');
    successEl.setAttribute('aria-hidden', 'false');
    successTitleEl.textContent = isPage() ? pick('Halaman penuh!', 'Page full!') : pick('Hebat!', 'Great job!');
    successTextEl.textContent = successSentence();
    var canSpeak = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    hearBtn.hidden = !canSpeak;
    if (canSpeak) hearBtn.setAttribute('aria-label', pick('Dengarkan ' + spokenName(), 'Listen to ' + spokenName()));
  }

  function successSentence() {
    var set = rt.item.set;
    var label = rt.item.label;
    if (isPage()) {
      if (EN) return 'You filled the page with ' + set.trace + ' ' + label + '.';
      if (set.id === 'angka') return 'Halaman angka ' + label + ' sudah penuh.';
      if (set.id === 'suku') return 'Halaman suku kata ' + label + ' sudah penuh.';
      if (set.id === 'kata') return 'Halaman kata ' + label + ' sudah penuh.';
      return 'Halaman huruf ' + label + ' sudah penuh.';
    }
    if (EN) return 'You finished ' + set.trace + ' ' + label + '.';
    if (set.id === 'angka') return 'Angka ' + label + ' sudah selesai.';
    if (set.id === 'suku') return 'Suku kata ' + label + ' sudah selesai.';
    if (set.id === 'kata') return 'Kata ' + label + ' sudah selesai.';
    return 'Huruf ' + label + ' sudah selesai.';
  }

  function hideSuccess() {
    successEl.classList.remove('show');
    successEl.setAttribute('aria-hidden', 'true');
  }

  function setLabelSize(label) {
    var size;
    if (label.length <= 1) size = 'clamp(40px, 8vw, 54px)';
    else if (label.length === 2) size = 'clamp(34px, 7vw, 48px)';
    else if (label.length === 3) size = 'clamp(30px, 6vw, 42px)';
    else size = 'clamp(26px, 5.4vw, 38px)';
    titleEl.style.setProperty('--label-size', size);
  }

  function updateRotateNote() {
    var isWord = rt.item && rt.item.set.id === 'kata';
    var portrait = window.innerHeight > window.innerWidth;
    var narrow = window.innerWidth < 640;
    rotateNote.hidden = !(isWord && portrait && narrow);
  }

  function loadItem(label, center, quiet) {
    var set = SETS[rt.setIndex];
    var index = set.items.indexOf(label);
    if (index === -1) index = 0;
    rt.itemIndex = index;
    rt.item = getItem(set, set.items[index]);
    rt.strokeIndex = 0;
    rt.reach = 0;
    rt.dragging = false;
    rt.complete = false;
    rt.demo = null;
    rt.page = null;
    stopSpeech();

    state.setId = set.id;
    state.itemId = rt.item.label;
    state.last[set.id] = rt.item.label;
    hideSuccess();

    titleEl.textContent = rt.item.label;
    setLabelSize(rt.item.label);
    metaEl.textContent = set.title + ' · ' + (index + 1) + ' ' + pick('dari', 'of') + ' ' + set.items.length;
    pickerTitleEl.textContent = set.picker;
    captionEl.classList.remove('nudge');
    setCaption(defaultCaption(), false);
    renderTabs();
    renderChips(center !== false);
    updateBoardLabel();
    updateRotateNote();
    saveState();
    updateHash();
    resize();

    if (!quiet) {
      announce(pick(set.title + ' ' + rt.item.label + '. ' + rt.item.strokes.length + ' goresan.',
        set.title + ' ' + rt.item.label + '. ' + rt.item.strokes.length + ' strokes.'));
    }
  }

  function updateHash() {
    var hash = '#' + state.setId + '/' + encodeURIComponent(state.itemId);
    if (location.hash !== hash) {
      try { history.replaceState(null, '', hash); } catch (err) { location.hash = hash.slice(1); }
    }
  }

  function switchSet(index, label) {
    rt.setIndex = index;
    var set = SETS[index];
    var target = label;
    if (!target || set.items.indexOf(target) === -1) {
      target = state.last[set.id];
    }
    if (!target || set.items.indexOf(target) === -1) {
      target = set.items.find(function (item) { return !isDone(set.id, item); }) || set.items[0];
    }
    state.setId = set.id;
    loadItem(target, true, false);
  }

  function resetItem() {
    if (!rt.item) return;
    hideSuccess();
    rt.strokeIndex = 0;
    rt.reach = 0;
    rt.dragging = false;
    rt.complete = false;
    rt.page = null;
    stopDemo(true);
    stopSpeech();
    captionEl.classList.remove('nudge');
    setCaption(defaultCaption(), false);
    updateBoardLabel();
    resize();
    announce(pick('Mulai lagi. ' + rt.item.set.title + ' ' + rt.item.label + '.',
      'Start again. ' + rt.item.set.title + ' ' + rt.item.label + '.'));
  }

  function nextItem() {
    var set = SETS[rt.setIndex];
    var next = (rt.itemIndex + 1) % set.items.length;
    hideSuccess();
    loadItem(set.items[next], true, false);
  }

  /* ---------------- menebalkan ---------------- */

  function pointerToGlyph(event) {
    var rect = boardEl.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - view.ox) / view.scale,
      y: (event.clientY - rect.top - view.oy) / view.scale
    };
  }

  function pointerToBoard(event) {
    var rect = boardEl.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function pageCellAt(p) {
    var L = rt.page && rt.page.layout;
    if (!L) return -1;
    if (p.x < L.ox || p.y < L.oy || p.x >= L.ox + L.w || p.y >= L.oy + L.h) return -1;
    var c = Math.floor((p.x - L.ox) / L.cw);
    var r = Math.floor((p.y - L.oy) / L.ch);
    if (c < 0 || c >= L.cols || r < 0 || r >= L.rows) return -1;
    return r * L.cols + c;
  }

  function pageDown(event) {
    ensurePage();
    if (rt.complete || !rt.item || !rt.page || !rt.page.layout) return;
    if (rt.dragging || event.isPrimary === false) return;
    if (typeof event.button === 'number' && event.button !== 0) return;
    var p = pointerToBoard(event);
    var cell = pageCellAt(p);
    if (cell === -1) return;
    if (rt.demo) stopDemo(true);
    var L = rt.page.layout;
    var c = cell % L.cols;
    var r = Math.floor(cell / L.cols);
    var x = (p.x - L.ox - c * L.cw) / L.cw;
    var y = (p.y - L.oy - r * L.ch) / L.ch;
    rt.page.active = {
      cell: cell,
      pts: [{ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }]
    };
    rt.dragging = true;
    try { boardEl.setPointerCapture(event.pointerId); } catch (err) { /* diabaikan */ }
    requestDraw();
  }

  function pageMove(event) {
    if (!rt.dragging || rt.complete || !rt.page || !rt.page.active) return;
    if (event.isPrimary === false) return;
    var L = rt.page.layout;
    var stroke = rt.page.active;
    var c = stroke.cell % L.cols;
    var r = Math.floor(stroke.cell / L.cols);
    var events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    if (!events.length) events = [event];
    var changed = false;
    for (var i = 0; i < events.length; i++) {
      var p = pointerToBoard(events[i]);
      var x = Math.max(0, Math.min(1, (p.x - L.ox - c * L.cw) / L.cw));
      var y = Math.max(0, Math.min(1, (p.y - L.oy - r * L.ch) / L.ch));
      var last = stroke.pts[stroke.pts.length - 1];
      if (Math.hypot(x - last.x, y - last.y) >= 0.012) {
        stroke.pts.push({ x: x, y: y });
        changed = true;
      }
    }
    if (changed) requestDraw();
  }

  function pageUp() {
    rt.dragging = false;
    if (!rt.page || !rt.page.active) return;
    var stroke = rt.page.active;
    rt.page.active = null;
    if (stroke.pts.length < 2) {
      requestDraw();
      return;
    }
    var already = rt.page.strokes.some(function (s) { return s.cell === stroke.cell; });
    rt.page.strokes.push(stroke);
    if (!already) {
      playStrokeSound();
      updatePageLabel();
      var counts = pageCounts();
      if (counts.filled >= counts.total) {
        completePage();
        return;
      }
      announce(pick(counts.filled + ' dari ' + counts.total + ' kotak terisi.',
        counts.filled + ' of ' + counts.total + ' boxes filled.'));
    }
    requestDraw();
  }

  function completePage() {
    rt.complete = true;
    rt.dragging = false;
    markDone(rt.item.set.id, rt.item.label);
    saveState();
    renderChips(false);
    updateProgress();
    showSuccess();
    setCaption(pick('Halaman penuh. Tekan Lanjut.', 'Page full. Tap Next.'), false);
    updateBoardLabel();
    draw();
    playSuccessSound();
    speakItem();
    announce(successSentence());
  }

  function onPointerDown(event) {
    if (isPage()) { pageDown(event); return; }
    if (event.isPrimary === false) return;
    if (typeof event.button === 'number' && event.button !== 0) return;
    if (rt.demo) stopDemo(true);
    if (rt.complete || !rt.item) return;
    var stroke = rt.item.strokes[rt.strokeIndex];
    if (!stroke) return;

    var p = pointerToGlyph(event);
    var level = LEVELS[state.level];
    var anchor = stroke.pts[Math.min(rt.reach, stroke.pts.length - 1)];
    var dist = Math.hypot(p.x - anchor.x, p.y - anchor.y);

    if (dist > level.tol * 1.75) {
      setCaption(pick('Mulai dari titik hijau.', 'Start at the green dot.'), true);
      return;
    }

    rt.dragging = true;
    try { boardEl.setPointerCapture(event.pointerId); } catch (err) { /* diabaikan */ }

    if (stroke.pts.length < 6) {
      finishStroke();
      return;
    }
    processPoint(p);
  }

  function onPointerMove(event) {
    if (isPage()) { pageMove(event); return; }
    if (!rt.dragging || rt.complete) return;
    if (event.isPrimary === false) return;
    var events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    if (!events.length) events = [event];
    for (var i = 0; i < events.length; i++) {
      processPoint(pointerToGlyph(events[i]));
      if (rt.complete || !rt.dragging) break;
    }
  }

  function onPointerUp() {
    if (isPage()) { pageUp(); return; }
    rt.dragging = false;
    if (!rt.complete && rt.item) {
      var stroke = rt.item.strokes[rt.strokeIndex];
      if (stroke && rt.reach > 0 && rt.reach < stroke.pts.length - 5) {
        setCaption(pick('Lanjutkan dari titik hijau.', 'Keep going from the green dot.'), false);
      }
    }
  }

  function processPoint(p) {
    var stroke = rt.item.strokes[rt.strokeIndex];
    if (!stroke) return;
    var len = stroke.pts.length;
    var level = LEVELS[state.level];
    var from = Math.max(0, rt.reach - 6);
    var to = Math.min(len - 1, rt.reach + 70);
    var best = -1;
    var bestDist = Infinity;

    for (var i = from; i <= to; i++) {
      var dx = p.x - stroke.pts[i].x;
      var dy = p.y - stroke.pts[i].y;
      var d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    if (best === -1 || bestDist > level.tol * level.tol) return;

    var capped = Math.min(best, rt.reach + 55);
    if (capped > rt.reach) {
      rt.reach = capped;
      if (rt.reach >= len - 4) {
        finishStroke();
      } else {
        requestDraw();
      }
    }
  }

  function finishStroke() {
    var stroke = rt.item.strokes[rt.strokeIndex];
    if (!stroke) return;
    rt.reach = stroke.pts.length - 1;
    rt.strokeIndex += 1;
    rt.reach = 0;
    rt.dragging = false;
    playStrokeSound();

    if (rt.strokeIndex >= rt.item.strokes.length) {
      completeItem();
      return;
    }

    setCaption(pick('Bagus. Lanjut goresan berikutnya.', 'Nice. Next stroke.'), false);
    updateBoardLabel();
    requestDraw();
  }

  function completeItem() {
    rt.complete = true;
    rt.dragging = false;
    rt.reach = 0;
    markDone(rt.item.set.id, rt.item.label);
    saveState();
    renderChips(false);
    updateProgress();
    showSuccess();
    setCaption(pick('Selesai. Tekan Lanjut.', 'Done. Tap Next.'), false);
    updateBoardLabel();
    draw();
    playSuccessSound();
    speakItem();
    announce(successSentence());
  }

  /* ---------------- contoh animasi ---------------- */

  function startDemo() {
    if (!rt.item || isPage()) return;
    if (rt.complete) {
      rt.complete = false;
      rt.strokeIndex = 0;
      rt.reach = 0;
      hideSuccess();
      renderChips(false);
      updateBoardLabel();
    }
    stopDemo(true);
    stopSpeech();
    var totalPoints = rt.item.strokes.reduce(function (sum, stroke) { return sum + stroke.pts.length; }, 0);
    rt.demo = {
      start: performance.now(),
      duration: Math.min(3200, 1300 + totalPoints * 5),
      progress: 0,
      raf: 0
    };
    setCaption(pick('Perhatikan contohnya.', 'Watch the example.'), false);
    rt.demo.raf = requestAnimationFrame(demoLoop);
  }

  function demoLoop(now) {
    if (!rt.demo) return;
    var elapsed = now - rt.demo.start;
    var progress = Math.min(1, elapsed / rt.demo.duration);
    rt.demo.progress = progress;
    draw();
    if (progress < 1 || elapsed < rt.demo.duration + 700) {
      rt.demo.raf = requestAnimationFrame(demoLoop);
    } else {
      rt.demo = null;
      setCaption(defaultCaption(), false);
      requestDraw();
    }
  }

  function stopDemo(silent) {
    if (!rt.demo) return;
    cancelAnimationFrame(rt.demo.raf);
    rt.demo = null;
    if (!silent) setCaption(defaultCaption(), false);
    requestDraw();
  }

  /* ---------------- peristiwa ---------------- */

  boardEl.addEventListener('pointerdown', onPointerDown);
  boardEl.addEventListener('pointermove', onPointerMove);
  boardEl.addEventListener('pointerup', onPointerUp);
  boardEl.addEventListener('pointercancel', onPointerUp);
  boardEl.addEventListener('pointerleave', function (e) {
    if (e.buttons === 0) onPointerUp();
  });
  boardEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  $('#btnDemo').addEventListener('click', startDemo);
  $('#btnReset').addEventListener('click', resetItem);
  $('#btnNext').addEventListener('click', nextItem);
  $('#btnAgain').addEventListener('click', function () { hideSuccess(); resetItem(); });
  $('#btnContinue').addEventListener('click', nextItem);
  hearBtn.addEventListener('click', function () { speakItem(true); });

  resetProgressBtn.addEventListener('click', function () {
    if (typeof resetDialog.showModal === 'function') resetDialog.showModal();
    else resetDialog.setAttribute('open', '');
  });
  $('#btnCloseReset').addEventListener('click', function () { resetDialog.close(); });
  $('#btnCancelReset').addEventListener('click', function () { resetDialog.close(); });
  resetDialog.addEventListener('click', function (event) {
    if (event.target === resetDialog) resetDialog.close();
  });
  $('#btnConfirmReset').addEventListener('click', function () {
    resetDialog.close();
    clearProgress();
  });

  $('#btnSound').addEventListener('click', function () {
    state.sound = !state.sound;
    updateSoundButton();
    saveState();
    if (state.sound) {
      ensureAudio();
      tone(659.25, 0.16, 0, 0.04);
    } else {
      stopSpeech();
    }
  });

  $('#btnHelp').addEventListener('click', function () {
    if (typeof helpDialog.showModal === 'function') helpDialog.showModal();
    else helpDialog.setAttribute('open', '');
  });
  $('#btnCloseHelp').addEventListener('click', function () { helpDialog.close(); });
  helpDialog.addEventListener('click', function (event) {
    if (event.target === helpDialog) helpDialog.close();
  });

  window.addEventListener('resize', function () {
    resize();
    updateRotateNote();
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { resize(); updateRotateNote(); }, 240);
  });

  window.addEventListener('hashchange', function () {
    var parsed = parseHash();
    if (!parsed) return;
    if (parsed.setIndex !== rt.setIndex) {
      switchSet(parsed.setIndex, parsed.label);
    } else if (parsed.label && parsed.label !== rt.item.label) {
      loadItem(parsed.label, true, false);
    }
  });

  function parseHash() {
    var raw = location.hash.replace(/^#/, '');
    if (!raw) return null;
    try { raw = decodeURIComponent(raw); } catch (err) { /* gunakan apa adanya */ }
    var parts = raw.split('/');
    var index = SETS.findIndex(function (set) { return set.id === parts[0]; });
    if (index === -1) return null;
    var label = parts[1] || null;
    if (label && SETS[index].items.indexOf(label) === -1) label = null;
    return { setIndex: index, label: label };
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { resize(); }).observe(wrapEl);
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline opsional */ });
    });
  }

  /* ---------------- mulai ---------------- */

  var parsed = parseHash();
  var initialSetIndex = parsed ? parsed.setIndex : Math.max(0, SETS.findIndex(function (s) { return s.id === state.setId; }));
  rt.setIndex = initialSetIndex;
  var initialSet = SETS[initialSetIndex];
  var initialLabel = (parsed && parsed.label) || state.last[initialSet.id] || state.itemId;
  if (initialSet.items.indexOf(initialLabel) === -1) {
    initialLabel = initialSet.items.find(function (item) { return !isDone(initialSet.id, item); }) || initialSet.items[0];
  }

  document.body.classList.toggle('page-mode', isPage());
  renderLevels();
  updateSoundButton();
  loadItem(initialLabel, true, true);
  resize();
})();
