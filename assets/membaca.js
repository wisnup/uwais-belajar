/* Uwais Belajar — modul membaca.
   Mencocokkan huruf, suku kata, kata, dan gambar. Tidak perlu jawaban lisan. */
(function () {
  'use strict';

  var LANG = window.UWAIS_LANG;
  var EN = LANG.isEN;
  var pick = LANG.pick;
  var STORAGE_KEY = 'uwais.membaca.v1' + (EN ? '.en' : '');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = window.UWAIS_ART;

  var CONS = ['b', 'c', 'd', 'm', 'p'];
  var VOWELS = ['a', 'i', 'u', 'e', 'o'];
  var SYLLABLES = [];
  CONS.forEach(function (c) {
    VOWELS.forEach(function (v) { SYLLABLES.push(c + v); });
  });

  /* Bahasa Inggris: keluarga kata (rime) dua huruf, bukan suku kata. */
  var RIMES = [
    'at', 'an', 'ap', 'am', 'ag', 'ad', 'ed', 'en', 'et', 'eg',
    'it', 'in', 'ig', 'ip', 'id', 'ot', 'og', 'op', 'ob',
    'ug', 'un', 'ut', 'up', 'ub'
  ];

  var WORDS_ID = [
    'bola', 'buku', 'susu', 'apel', 'bunga', 'ikan',
    'bebek', 'kucing', 'topi', 'meja', 'roti', 'mata'
  ];

  var WORDS_EN = [
    'ball', 'book', 'milk', 'apple', 'flower', 'fish',
    'duck', 'cat', 'hat', 'table', 'bread', 'eye'
  ];

  /* Kata Inggris memakai gambar yang sudah ada; kuncinya tetap bahasa Indonesia. */
  var ART_KEY = {
    ball: 'bola', book: 'buku', milk: 'susu', apple: 'apel',
    flower: 'bunga', fish: 'ikan', duck: 'bebek', cat: 'kucing',
    hat: 'topi', table: 'meja', bread: 'roti', eye: 'mata'
  };

  function artKey(label) {
    return EN ? (ART_KEY[label] || label) : label;
  }

  /* Huruf yang mudah tertukar, dipakai sebagai pengecoh pertama. */
  var LOOKALIKE = {
    A: ['V', 'H', 'N'], B: ['D', 'P', 'R'], C: ['G', 'O', 'Q'],
    D: ['B', 'P', 'O'], E: ['F', 'L', 'H'], F: ['E', 'P', 'T'],
    G: ['C', 'Q', 'O'], H: ['N', 'M', 'A'], I: ['L', 'J', 'T'],
    J: ['I', 'L', 'G'], K: ['X', 'R', 'H'], L: ['I', 'E', 'J'],
    M: ['N', 'W', 'H'], N: ['M', 'H', 'U'], O: ['Q', 'C', 'G'],
    P: ['B', 'D', 'R'], Q: ['O', 'G', 'C'], R: ['B', 'P', 'K'],
    S: ['Z', 'C', 'G'], T: ['I', 'L', 'F'], U: ['V', 'N', 'O'],
    V: ['U', 'Y', 'W'], W: ['M', 'V', 'N'], X: ['K', 'Y', 'Z'],
    Y: ['V', 'X', 'U'], Z: ['S', 'N', 'X']
  };

  var EN_LETTERS = {
    A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'ef', G: 'jee',
    H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en',
    O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you',
    V: 'vee', W: 'double-you', X: 'ex', Y: 'why', Z: 'zee'
  };

  var SETS_EN = [
    {
      id: 'huruf', title: 'Letters', short: 'Letters', picker: 'Choose a letter',
      kind: 'letter', unit: 'letter', units: 'letters', prompt: 'Find the same letter',
      items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    {
      id: 'suku', title: 'Word parts', short: 'Parts', picker: 'Choose a word part',
      kind: 'syllable', unit: 'word part', units: 'word parts', prompt: 'Find the same word part',
      items: RIMES
    },
    {
      id: 'kata', title: 'Words', short: 'Words', picker: 'Choose a word',
      kind: 'word', unit: 'word', units: 'words', prompt: 'Choose the matching word',
      items: WORDS_EN
    },
    {
      id: 'gambar', title: 'Pictures', short: 'Pictures', picker: 'Choose a word',
      kind: 'picture', unit: 'picture', units: 'pictures', prompt: 'Choose the matching picture',
      items: WORDS_EN
    }
  ];

  var SETS_ID = [
    {
      id: 'huruf', title: 'Huruf', short: 'Huruf', picker: 'Pilih huruf',
      kind: 'letter', unit: 'huruf', units: 'huruf', prompt: 'Cari huruf yang sama',
      items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    {
      id: 'suku', title: 'Suku kata', short: 'Suku', picker: 'Pilih suku kata',
      kind: 'syllable', unit: 'suku kata', units: 'suku kata', prompt: 'Cari suku kata yang sama',
      items: SYLLABLES
    },
    {
      id: 'kata', title: 'Kata', short: 'Kata', picker: 'Pilih kata',
      kind: 'word', unit: 'kata', units: 'kata', prompt: 'Pilih kata yang cocok',
      items: WORDS_ID
    },
    {
      id: 'gambar', title: 'Gambar', short: 'Gambar', picker: 'Pilih kata',
      kind: 'picture', unit: 'gambar', units: 'gambar', prompt: 'Pilih gambar yang cocok',
      items: WORDS_ID
    }
  ];

  var SETS = EN ? SETS_EN : SETS_ID;

  var LEVELS = {
    penuh: { label: pick('Penuh', 'Full'), choices: 2 },
    sedang: { label: pick('Sedang', 'Medium'), choices: 3 },
    mandiri: { label: pick('Mandiri', 'Solo'), choices: 4 }
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
  var stageEl = $('#stage');
  var successEl = $('#success');
  var successTextEl = $('#successText');
  var successTitleEl = $('#successTitle');
  var successArtEl = $('#successArt');
  var successWordEl = $('#successWord');
  var hearBtn = $('#btnHear');
  var resetProgressBtn = $('#btnResetProgress');
  var resetDialog = $('#resetDialog');
  var liveEl = $('#live');
  var helpDialog = $('#helpDialog');

  var rt = {
    setIndex: 0,
    index: 0,
    label: 'A',
    choices: [],
    solved: false,
    captionTimer: 0
  };

  /* ---------------- penyimpanan ---------------- */

  var state = loadState();

  function loadState() {
    var base = {
      level: 'penuh', sound: false, setId: 'huruf', itemId: 'A',
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
      var defaultSet = SETS.find(function (s) { return s.id === base.setId; });
      if (parsed.itemId && defaultSet.items.indexOf(String(parsed.itemId)) !== -1) {
        base.itemId = String(parsed.itemId);
      }
      if (parsed.done && typeof parsed.done === 'object') {
        SETS.forEach(function (set) {
          var list = parsed.done[set.id];
          if (Array.isArray(list)) {
            base.done[set.id] = list.map(String).filter(function (label) {
              return set.items.indexOf(label) !== -1;
            });
          }
        });
      }
      if (parsed.last && typeof parsed.last === 'object') {
        SETS.forEach(function (set) {
          var last = String(parsed.last[set.id]);
          if (set.items.indexOf(last) !== -1) base.last[set.id] = last;
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

  /* ---------------- pilihan jawaban ---------------- */

  function hashSeed(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rand) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function uniquePush(list, value, limit) {
    if (list.length >= limit) return false;
    if (list.indexOf(value) === -1) list.push(value);
    return list.length < limit;
  }

  function letterDistractors(label, pool, total, rand) {
    var out = [];
    var look = shuffle((LOOKALIKE[label] || []).slice(), rand);
    for (var i = 0; i < look.length; i++) uniquePush(out, look[i], total);
    var index = pool.indexOf(label);
    for (var d = 1; d <= 13 && out.length < total; d++) {
      uniquePush(out, pool[(index + d) % pool.length], total);
      uniquePush(out, pool[(index - d + pool.length) % pool.length], total);
    }
    return out.slice(0, total);
  }

  function syllableDistractors(label, pool, total, rand) {
    var close = pool.filter(function (x) {
      return x !== label && (x.charAt(0) === label.charAt(0) || x.charAt(1) === label.charAt(1));
    });
    close = shuffle(close, rand);
    var out = [];
    for (var i = 0; i < close.length; i++) uniquePush(out, close[i], total);
    var rest = shuffle(pool.filter(function (x) { return x !== label; }), rand);
    for (var j = 0; j < rest.length && out.length < total; j++) uniquePush(out, rest[j], total);
    return out.slice(0, total);
  }

  function wordDistractors(label, pool, total, rand) {
    var close = pool.filter(function (x) {
      return x !== label && (x.charAt(0) === label.charAt(0) || x.length === label.length);
    });
    close = shuffle(close, rand);
    var out = [];
    for (var i = 0; i < close.length; i++) uniquePush(out, close[i], total);
    var rest = shuffle(pool.filter(function (x) { return x !== label; }), rand);
    for (var j = 0; j < rest.length && out.length < total; j++) uniquePush(out, rest[j], total);
    return out.slice(0, total);
  }

  function makeChoices(set, label, total, seedText) {
    var rand = mulberry32(hashSeed(seedText));
    var distractors;
    if (set.kind === 'letter') distractors = letterDistractors(label, set.items, total - 1, rand);
    else if (set.kind === 'syllable') distractors = syllableDistractors(label, set.items, total - 1, rand);
    else distractors = wordDistractors(label, set.items, total - 1, rand);
    return shuffle([label].concat(distractors), rand);
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
      gain.gain.exponentialRampToValueAtTime(volume || 0.04, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.06);
    } catch (err) { /* suara opsional */ }
  }

  function playSuccessSound() {
    tone(523.25, 0.2, 0, 0.05);
    tone(659.25, 0.22, 0.12, 0.045);
    tone(783.99, 0.3, 0.25, 0.045);
  }

  function canSpeak() {
    return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
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

  function stopSpeech() {
    if (!canSpeak()) return;
    try { window.speechSynthesis.cancel(); } catch (err) { /* opsional */ }
  }

  function speakPair(idText, enText, force) {
    if (!force && !state.sound) return;
    if (!idText) return;
    if (!canSpeak()) return;
    var voice;
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (err) { voices = []; }
    var text = idText;
    var lang = EN ? 'en-US' : 'id-ID';
    if (EN) {
      voice = englishVoice() || voices[0] || null;
    } else {
      voice = indonesianVoice();
      if (!voice && voices.length) {
        text = enText || idText;
        voice = englishVoice() || voices[0];
        lang = 'en-US';
      }
    }
    try {
      var utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch (err) { /* suara opsional */ }
  }

  function spokenFallback() {
    var set = SETS[rt.setIndex];
    if (EN) return rt.label;
    if (set.kind === 'letter') return EN_LETTERS[rt.label] || rt.label;
    if (set.kind === 'syllable') return rt.label;
    return ART.en(artKey(rt.label)) || rt.label;
  }

  function speakItem(force) {
    if (!canSpeak()) return;
    if (!force) stopSpeech();
    speakPair(rt.label, spokenFallback(), force);
  }

  /* ---------------- bagian tampilan ---------------- */

  function cueLabel(text) {
    var label = document.createElement('p');
    label.className = 'answer-label';
    label.id = 'answerLabel';
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('class', 'cue-icon');
    icon.innerHTML = '<path d="M9 11V5.4a1.7 1.7 0 0 1 3.4 0v4.4"/>' +
      '<path d="M12.4 9.4a1.7 1.7 0 0 1 3.4 0v1.4M15.8 10.4a1.7 1.7 0 0 1 3.4 0v4.2a6 6 0 0 1-6 6h-1.4a5 5 0 0 1-3.9-1.9l-3.2-4.1a1.7 1.7 0 0 1 2.6-2.1L9 14.2"/>';
    label.appendChild(icon);
    label.appendChild(document.createTextNode(text));
    return label;
  }

  function choiceLabelText(set) {
    if (EN) {
      if (set.kind === 'letter') return 'Choose the same letter';
      if (set.kind === 'syllable') return 'Choose the same word part';
      if (set.kind === 'word') return 'Choose the matching word';
      return 'Choose the matching picture';
    }
    if (set.kind === 'letter') return 'Pilih huruf yang sama';
    if (set.kind === 'syllable') return 'Pilih suku kata yang sama';
    if (set.kind === 'word') return 'Pilih kata yang cocok';
    return 'Pilih gambar yang cocok';
  }

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
      shortLabel.textContent = set.short;
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

  function renderLevels() {
    levelsEl.innerHTML = '';
    Object.keys(LEVELS).forEach(function (key) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.textContent = LEVELS[key].label;
      btn.setAttribute('aria-pressed', state.level === key ? 'true' : 'false');
      btn.addEventListener('click', function () {
        if (state.level === key) return;
        state.level = key;
        saveState();
        hideSuccess();
        rt.solved = false;
        rt.choices = makeChoices(SETS[rt.setIndex], rt.label, LEVELS[key].choices, choiceSeed());
        renderLevels();
        renderStage();
        setCaption(defaultCaption(), false);
        announce(pick('Tingkat ' + LEVELS[key].label + '. ' + LEVELS[key].choices + ' pilihan jawaban.',
          LEVELS[key].label + ' level. ' + LEVELS[key].choices + ' answer choices.'));
      });
      levelsEl.appendChild(btn);
    });
  }

  function renderChips(center) {
    var set = SETS[rt.setIndex];
    chipsEl.innerHTML = '';
    set.items.forEach(function (label, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (label.length > 1 ? ' wide' : '');
      btn.textContent = label;
      btn.setAttribute('aria-current', i === rt.index ? 'true' : 'false');
      var done = isDone(set.id, label);
      if (done) {
        var tick = document.createElement('span');
        tick.className = 'tick';
        tick.setAttribute('aria-hidden', 'true');
        tick.textContent = '✓';
        btn.appendChild(tick);
      }
      btn.setAttribute('aria-label', set.unit + ' ' + label +
        (done ? pick(', sudah selesai', ', done') : ''));
      btn.addEventListener('click', function () {
        if (i !== rt.index) loadItem(label, true, false);
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
    var set = SETS[rt.setIndex];
    var total = set.items.length;
    var done = set.items.filter(function (label) { return isDone(set.id, label); }).length;
    progressEl.textContent = pick(done + ' dari ' + total + ' selesai', done + ' of ' + total + ' done');
    var dotsEl = $('#progressDots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      set.items.forEach(function (label) {
        var dot = document.createElement('span');
        dot.className = 'p-dot' + (isDone(set.id, label) ? ' done' : '');
        dotsEl.appendChild(dot);
      });
    }
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
    resetItem();
    announce(pick('Progres dihapus. Semua latihan bisa dimulai lagi.',
      'Progress cleared. Every exercise can start again.'));
  }

  function updateSoundButton() {
    var btn = $('#btnSound');
    btn.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    btn.setAttribute('aria-label', state.sound ? pick('Suara menyala', 'Sound on') : pick('Suara mati', 'Sound off'));
  }

  function announce(text) {
    liveEl.textContent = '';
    setTimeout(function () { liveEl.textContent = text; }, 40);
  }

  /* ---------------- papan latihan ---------------- */

  function choiceSeed() {
    return SETS[rt.setIndex].id + '|' + rt.label + '|' + state.level;
  }

  function buildTarget(set) {
    var card = document.createElement('div');
    card.className = 'target-card';

    if (set.kind === 'word') {
      var art = ART.svg(artKey(rt.label), 'target-art');
      art.removeAttribute('aria-hidden');
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', pick('Gambar ' + rt.label, 'Picture of ' + rt.label));
      card.appendChild(art);
    } else if (set.kind === 'picture') {
      var word = document.createElement('p');
      word.className = 'target-text word';
      word.textContent = rt.label;
      word.setAttribute('role', 'img');
      word.setAttribute('aria-label', pick('Kata ' + rt.label, 'Word ' + rt.label));
      card.appendChild(word);
    } else {
      var big = document.createElement('p');
      big.className = 'target-text';
      big.textContent = rt.label;
      big.setAttribute('role', 'img');
      big.setAttribute('aria-label', pick(
        (set.kind === 'letter' ? 'Huruf ' : 'Suku kata ') + rt.label,
        (set.kind === 'letter' ? 'Letter ' : 'Word part ') + rt.label));
      card.appendChild(big);
    }

    if (canSpeak()) {
      var hear = document.createElement('button');
      hear.type = 'button';
      hear.className = 'target-listen';
      hear.setAttribute('aria-label', pick('Dengarkan ' + rt.label, 'Listen to ' + rt.label));
      var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('class', 'icon');
      icon.innerHTML = '<path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4Z"/>' +
        '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/>';
      hear.appendChild(icon);
      hear.appendChild(document.createTextNode(pick('Dengar', 'Listen')));
      hear.addEventListener('click', function () { speakItem(true); });
      card.appendChild(hear);
    }

    return card;
  }

  function buildChoices(set) {
    var zone = document.createElement('div');
    zone.className = 'answer-zone';
    zone.appendChild(cueLabel(choiceLabelText(set)));

    var grid = document.createElement('div');
    grid.className = 'choice-grid cols-' + (rt.choices.length === 3 ? '3' : '2');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'answerLabel');

    rt.choices.forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn' + (set.kind === 'picture' ? ' pic-btn' : '');
      if (set.kind === 'picture') {
        btn.setAttribute('aria-label', pick('Gambar ' + value, 'Picture of ' + value));
        btn.appendChild(ART.svg(artKey(value)));
      } else {
        var text = document.createElement('span');
        text.className = 'choice-text' +
          (set.kind === 'letter' ? ' letter' : set.kind === 'word' ? ' word' : '');
        text.textContent = value;
        btn.appendChild(text);
        btn.setAttribute('aria-label', pick(
          (set.kind === 'letter' ? 'Huruf ' : set.kind === 'word' ? 'Kata ' : 'Suku kata ') + value,
          (set.kind === 'letter' ? 'Letter ' : set.kind === 'word' ? 'Word ' : 'Word part ') + value));
      }
      btn.addEventListener('click', function () { choose(btn, value); });
      grid.appendChild(btn);
    });

    zone.appendChild(grid);
    return zone;
  }

  function renderStage() {
    stageEl.innerHTML = '';
    var set = SETS[rt.setIndex];
    stageEl.className = 'stage mode-' + set.id;
    stageEl.appendChild(buildTarget(set));
    stageEl.appendChild(buildChoices(set));
  }

  function markTry(btn) {
    btn.classList.add('try');
    setTimeout(function () { btn.classList.remove('try'); }, 700);
  }

  function choose(btn, value) {
    if (rt.solved) return;
    if (value !== rt.label) {
      markTry(btn);
      setCaption(pick('Belum tepat. Lihat lagi dengan tenang.',
        'Not quite. Look again slowly.'), true);
      announce(pick('Belum tepat. Coba lagi.', 'Not quite. Try again.'));
      return;
    }
    btn.classList.add('right');
    solve();
  }

  function solve() {
    rt.solved = true;
    var set = SETS[rt.setIndex];
    var label = set.items[rt.index];
    var wasDone = isDone(set.id, label);
    markDone(set.id, label);
    saveState();
    renderChips(false);
    updateProgress();
    var allNow = !wasDone && state.done[set.id].length === set.items.length;
    showSuccess(allNow);
    setCaption(pick('Selesai. Tekan Lanjut.', 'Done. Tap Next.'), false);
    playSuccessSound();
    stopSpeech();
    speakItem(false);
    announce(successSentence(allNow));
  }

  function successSentence(allNow) {
    var set = SETS[rt.setIndex];
    var text = successBody();
    if (!allNow) return text;
    return text + ' ' + pick('Semua ' + set.units + ' selesai.', 'All the ' + set.units + ' are done.');
  }

  function successBody() {
    var set = SETS[rt.setIndex];
    if (EN) {
      if (set.kind === 'letter') return 'This is the letter ' + rt.label + '.';
      if (set.kind === 'syllable') return 'The word part is ' + rt.label + '.';
      return 'You found ' + rt.label + '.';
    }
    if (set.kind === 'letter') return 'Ini huruf ' + rt.label + '.';
    if (set.kind === 'syllable') return 'Suku kata ' + rt.label + '.';
    return 'Ini ' + rt.label + '.';
  }

  function showSuccess(allNow) {
    var set = SETS[rt.setIndex];
    successEl.classList.add('show');
    successEl.setAttribute('aria-hidden', 'false');
    successTitleEl.textContent = allNow ? pick('Semua selesai!', 'All done!') : pick('Hebat!', 'Great job!');
    successWordEl.textContent = rt.label;

    var showArt = (set.kind === 'word' || set.kind === 'picture') && ART.has(artKey(rt.label));
    if (successArtEl) {
      successArtEl.innerHTML = '';
      if (showArt) successArtEl.appendChild(ART.svg(artKey(rt.label), 'success-icon'));
      successArtEl.hidden = !showArt;
    }

    successTextEl.textContent = allNow
      ? pick('Semua ' + set.units + ' sudah selesai.', 'All the ' + set.units + ' are done.')
      : successBody();
    hearBtn.hidden = !canSpeak();
    if (canSpeak()) hearBtn.setAttribute('aria-label', pick('Dengarkan ' + rt.label, 'Listen to ' + rt.label));
  }

  function hideSuccess() {
    var active = document.activeElement;
    if (active && successEl.contains(active)) {
      try { stageEl.focus({ preventScroll: true }); } catch (err) { stageEl.focus(); }
    }
    successEl.classList.remove('show');
    successEl.setAttribute('aria-hidden', 'true');
  }

  function defaultCaption() {
    var set = SETS[rt.setIndex];
    if (EN) {
      if (set.kind === 'letter') return 'Find the same letter as the one above.';
      if (set.kind === 'syllable') return 'Find the same word part as the one above.';
      if (set.kind === 'word') return 'Look at the picture, then choose the word.';
      return 'Read the word above, then choose the picture.';
    }
    if (set.kind === 'letter') return 'Cari huruf yang sama dengan huruf di atas.';
    if (set.kind === 'syllable') return 'Cari suku kata yang sama dengan yang di atas.';
    if (set.kind === 'word') return 'Lihat gambar, lalu pilih katanya.';
    return 'Baca kata di atas, lalu pilih gambarnya.';
  }

  function setCaption(text, nudge) {
    captionEl.textContent = text;
    captionEl.classList.toggle('nudge', !!nudge);
    clearTimeout(rt.captionTimer);
    if (nudge) {
      rt.captionTimer = setTimeout(function () {
        captionEl.classList.remove('nudge');
        captionEl.textContent = defaultCaption();
      }, 2600);
    }
  }

  /* ---------------- memuat latihan ---------------- */

  function loadItem(label, center, quiet) {
    var set = SETS[rt.setIndex];
    var index = set.items.indexOf(label);
    if (index === -1) index = 0;
    rt.index = index;
    rt.label = set.items[index];
    rt.solved = false;
    rt.choices = makeChoices(set, rt.label, LEVELS[state.level].choices, choiceSeed());

    hideSuccess();
    stopSpeech();

    state.setId = set.id;
    state.itemId = rt.label;
    state.last[set.id] = rt.label;

    titleEl.textContent = set.prompt;
    metaEl.textContent = set.title + ' · ' + (index + 1) + ' ' + pick('dari', 'of') + ' ' + set.items.length;
    pickerTitleEl.textContent = set.picker;
    captionEl.classList.remove('nudge');
    setCaption(defaultCaption(), false);
    renderTabs();
    renderChips(center !== false);
    renderStage();
    saveState();
    updateHash();

    if (!quiet) {
      announce(set.title + '. ' + rt.label + '.');
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
    if (!target || set.items.indexOf(target) === -1) target = state.last[set.id];
    if (!target || set.items.indexOf(target) === -1) {
      target = set.items.find(function (item) { return !isDone(set.id, item); }) || set.items[0];
    }
    state.setId = set.id;
    loadItem(target, true, false);
  }

  function resetItem() {
    hideSuccess();
    rt.solved = false;
    stopSpeech();
    renderStage();
    captionEl.classList.remove('nudge');
    setCaption(defaultCaption(), false);
    announce(pick('Mulai lagi. ' + rt.label + '.', 'Start again. ' + rt.label + '.'));
  }

  function nextItem() {
    var set = SETS[rt.setIndex];
    var next = (rt.index + 1) % set.items.length;
    loadItem(set.items[next], true, false);
  }

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

  /* ---------------- peristiwa ---------------- */

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

  window.addEventListener('hashchange', function () {
    var parsed = parseHash();
    if (!parsed) return;
    if (parsed.setIndex !== rt.setIndex) {
      switchSet(parsed.setIndex, parsed.label);
    } else if (parsed.label && parsed.label !== state.itemId) {
      loadItem(parsed.label, true, false);
    }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* offline opsional */ });
    });
  }

  /* ---------------- mulai ---------------- */

  var parsed = parseHash();
  var initialSetIndex = parsed
    ? parsed.setIndex
    : Math.max(0, SETS.findIndex(function (s) { return s.id === state.setId; }));
  rt.setIndex = initialSetIndex;
  var initialSet = SETS[initialSetIndex];
  var initialLabel = (parsed && parsed.label) || state.last[initialSet.id] || state.itemId;
  if (initialSet.items.indexOf(initialLabel) === -1) {
    initialLabel = initialSet.items.find(function (item) {
      return !isDone(initialSet.id, item);
    }) || initialSet.items[0];
  }

  renderLevels();
  updateSoundButton();
  loadItem(initialLabel, true, true);
})();
