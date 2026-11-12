/* Uwais Belajar — modul berhitung.
   Menghitung gambar (satu jenis per soal) dan mencocokkan jumlah dengan angka. */
(function () {
  'use strict';

  var LANG = window.UWAIS_LANG;
  var EN = LANG.isEN;
  var pick = LANG.pick;
  var STORAGE_KEY = 'uwais.berhitung.v1' + (EN ? '.en' : '');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ART = window.UWAIS_ART;

  /* Satu jenis gambar per soal. Jangan dicampur dalam satu soal. */
  var COUNT_ART = ['bintang', 'balon', 'ikan', 'bunga', 'daun', 'kupu', 'bola', 'apel', 'bebek', 'awan'];

  var NUMBERS_ID = [
    'nol', 'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'
  ];

  var NUMBERS_EN = [
    'zero', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten'
  ];

  var NUMBERS = EN ? NUMBERS_EN : NUMBERS_ID;

  var ART_EN = {
    bintang: 'star', balon: 'balloon', ikan: 'fish', bunga: 'flower', daun: 'leaf',
    kupu: 'butterfly', bola: 'ball', apel: 'apple', bebek: 'duck', awan: 'cloud'
  };

  var PLURAL_EN = {
    star: 'stars', balloon: 'balloons', fish: 'fish', flower: 'flowers',
    leaf: 'leaves', butterfly: 'butterflies', ball: 'balls', apple: 'apples',
    duck: 'ducks', cloud: 'clouds'
  };

  /* Cadangan bila perangkat hanya punya suara Inggris. */
  var EN_NUM = {
    1: 'sah-too', 2: 'doo-ah', 3: 'tee-gah', 4: 'ehm-paht', 5: 'lee-mah',
    6: 'eh-nahm', 7: 'too-joo', 8: 'deh-lah-pahn', 9: 'sehm-bee-lahn', 10: 'seh-poo-loo'
  };
  var ITEMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  var SETS = EN ? [
    { id: 'hitung', title: 'Count', short: 'Count', picker: 'Choose how many', items: ITEMS },
    { id: 'cocok', title: 'Match', short: 'Match', picker: 'Choose how many', items: ITEMS }
  ] : [
    { id: 'hitung', title: 'Hitung', short: 'Hitung', picker: 'Pilih jumlah', items: ITEMS },
    { id: 'cocok', title: 'Cocokkan', short: 'Cocokkan', picker: 'Pilih jumlah', items: ITEMS }
  ];

  var LEVELS = {
    penuh: { label: pick('Penuh', 'Full'), choices: 2, frame: true, numbers: true, dots: true },
    sedang: { label: pick('Sedang', 'Medium'), choices: 3, frame: false, numbers: false },
    mandiri: { label: pick('Mandiri', 'Solo'), choices: 4, frame: false, numbers: false }
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
  var successNumEl = $('#successNum');
  var progressDotsEl = $('#progressDots');
  var hearBtn = $('#btnHear');
  var resetProgressBtn = $('#btnResetProgress');
  var resetDialog = $('#resetDialog');
  var liveEl = $('#live');
  var helpDialog = $('#helpDialog');

  var rt = {
    setIndex: 0,
    index: 0,
    count: 1,
    choices: [],
    tapped: [],
    solved: false,
    captionTimer: 0
  };

  /* ---------------- penyimpanan ---------------- */

  var state = loadState();

  function loadState() {
    var base = {
      level: 'penuh', sound: false, setId: 'hitung', itemId: '1',
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
      if (ITEMS.indexOf(String(parsed.itemId)) !== -1) base.itemId = String(parsed.itemId);
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

  function makeChoices(target, total, seedText) {
    var rand = mulberry32(hashSeed(seedText));
    /* Selalu pilih pengecoh terdekat lebih dulu, dengan sisi kiri/kanan diacak. */
    var offsets = [];
    for (var d = 1; d <= 5; d++) {
      var pair = shuffle([d, -d], rand);
      offsets.push(pair[0], pair[1]);
    }
    var values = [target];
    for (var i = 0; i < offsets.length && values.length < total; i++) {
      var candidate = target + offsets[i];
      if (candidate >= 1 && candidate <= 10 && values.indexOf(candidate) === -1) {
        values.push(candidate);
      }
    }
    var extra = 1;
    while (values.length < total && extra <= 10) {
      if (values.indexOf(extra) === -1) values.push(extra);
      extra++;
    }
    return shuffle(values, rand);
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

  function playTapSound(count) {
    tone(480 + count * 38, 0.1, 0, 0.032);
  }

  function playSuccessSound() {
    tone(523.25, 0.2, 0, 0.05);
    tone(659.25, 0.22, 0.12, 0.045);
    tone(783.99, 0.3, 0.25, 0.045);
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
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch (err) { /* opsional */ }
  }

  function speakPair(idText, enText, force) {
    if (!force && !state.sound) return;
    if (!idText) return;
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
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
      utterance.rate = 0.88;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    } catch (err) { /* suara opsional */ }
  }

  function speakCount(count) {
    if (!count) return;
    stopSpeech();
    if (EN) speakPair(NUMBERS[count], NUMBERS[count], false);
    else speakPair(String(count), EN_NUM[count], false);
  }

  function successSpoken() {
    return amountWords(rt.count);
  }

  function successSpokenFallback() {
    return EN_NUM[rt.count] + ' ' + ART.en(artKind());
  }

  function speakSuccess(force) {
    speakPair(successSpoken(), successSpokenFallback(), force);
  }

  /* ---------------- gambar ---------------- */

  function artKind() {
    var offset = rt.setIndex === 0 ? 0 : 3;
    return COUNT_ART[(rt.count - 1 + offset) % COUNT_ART.length];
  }

  function artLabel() {
    return EN ? ART_EN[artKind()] : ART.label(artKind());
  }

  function artLabelPlural() {
    return EN ? (PLURAL_EN[artLabel()] || artLabel()) : artLabel();
  }

  /* Bahasa Inggris membedakan satu dan banyak. */
  function amount(n) {
    return n + ' ' + (n === 1 ? artLabel() : artLabelPlural());
  }

  function amountWords(n) {
    return NUMBERS[n] + ' ' + (n === 1 ? artLabel() : artLabelPlural());
  }

  function allCounted() {
    return rt.count === 1
      ? 'The ' + artLabel() + ' is counted. Choose the number.'
      : 'All the ' + artLabelPlural() + ' are counted. Choose the number.';
  }

  function buildArt(extraClass) {
    return ART.svg(artKind(), extraClass);
  }

  /* ---------------- render ---------------- */

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
        rt.tapped = [];
        rt.choices = makeChoices(rt.count, LEVELS[key].choices, choiceSeed());
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
      btn.setAttribute('aria-label', pick('Jumlah ', 'Amount ') + label + (done ? pick(', sudah selesai', ', done') : ''));
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
    if (progressDotsEl) {
      progressDotsEl.innerHTML = '';
      set.items.forEach(function (label) {
        var dot = document.createElement('span');
        dot.className = 'p-dot' + (isDone(set.id, label) ? ' done' : '');
        progressDotsEl.appendChild(dot);
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

  /* ---------------- papan hitung ---------------- */

  function choiceSeed() {
    return SETS[rt.setIndex].id + '|' + rt.count + '|' + state.level;
  }

  function buildObjectButton(index) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'obj';
    btn.dataset.index = String(index);
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', artLabel() + ' ' + (index + 1));    btn.appendChild(buildArt());
    var badge = document.createElement('span');
    badge.className = 'badge-num';
    badge.setAttribute('aria-hidden', 'true');
    btn.appendChild(badge);
    btn.addEventListener('click', function () { toggleObject(btn); });
    return btn;
  }

  function buildNumButton(value) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'num-btn';
    btn.appendChild(document.createTextNode(String(value)));
    if (LEVELS[state.level].dots) {
      var dots = document.createElement('span');
      dots.className = 'num-dots';
      dots.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < value; i++) dots.appendChild(document.createElement('i'));
      btn.appendChild(dots);
    }
    btn.setAttribute('aria-label', NUMBERS[value]);
    btn.addEventListener('click', function () { chooseValue(btn, value); });
    return btn;
  }

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

  function renderStage() {
    stageEl.innerHTML = '';
    var set = SETS[rt.setIndex];
    stageEl.className = 'stage mode-' + set.id;
    if (set.id === 'hitung') renderCounting(); else renderMatching();
  }

  function renderCounting() {
    var level = LEVELS[state.level];
    var objects = document.createElement('div');
    objects.className = 'objects ' + (level.frame ? 'ten' : 'free') + (level.numbers ? ' numbered' : '');
    objects.setAttribute('role', 'group');
    objects.setAttribute('aria-label', pick(rt.count + ' ' + artLabel() + ' untuk dihitung',
      amount(rt.count) + ' to count'));

    var slots = level.frame ? 10 : rt.count;
    for (var i = 0; i < slots; i++) {
      if (level.frame && i >= rt.count) {
        var cell = document.createElement('span');
        cell.className = 'cell';
        cell.setAttribute('aria-hidden', 'true');
        objects.appendChild(cell);
      } else {
        objects.appendChild(buildObjectButton(i));
      }
    }
    stageEl.appendChild(objects);

    var zone = document.createElement('div');
    zone.className = 'answer-zone';
    zone.appendChild(cueLabel(pick('Pilih angka', 'Choose the number')));

    var grid = document.createElement('div');
    grid.className = 'num-grid cols-' + rt.choices.length;
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'answerLabel');
    rt.choices.forEach(function (value) {
      grid.appendChild(buildNumButton(value));
    });
    zone.appendChild(grid);
    stageEl.appendChild(zone);
  }

  function renderMatching() {
    var zone = document.createElement('div');
    zone.className = 'answer-zone';
    zone.appendChild(cueLabel(pick('Pilih kelompok yang sama banyak', 'Choose the group with the same amount')));

    var grid = document.createElement('div');
    grid.className = 'group-grid';
    rt.choices.forEach(function (value) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'group-btn';
      btn.setAttribute('aria-label', pick('Kelompok dengan ' + value + ' ' + artLabel(),
        'Group with ' + amount(value)));
      var mini = document.createElement('span');
      mini.className = 'mini-stars';
      mini.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < value; i++) mini.appendChild(buildArt());
      btn.appendChild(mini);
      btn.addEventListener('click', function () { chooseValue(btn, value); });
      grid.appendChild(btn);
    });
    zone.appendChild(grid);
    stageEl.appendChild(zone);
  }

  function updateBadges() {
    var badges = stageEl.querySelectorAll('.obj .badge-num');
    for (var i = 0; i < badges.length; i++) badges[i].textContent = '';
    if (!LEVELS[state.level].numbers) return;
    rt.tapped.forEach(function (index, position) {
      var btn = stageEl.querySelector('.obj[data-index="' + index + '"]');
      if (!btn) return;
      var badge = btn.querySelector('.badge-num');
      if (badge) badge.textContent = String(position + 1);
    });
  }

  function toggleObject(btn) {
    if (rt.solved) return;
    var index = Number(btn.dataset.index);
    var at = rt.tapped.indexOf(index);
    if (at === -1) rt.tapped.push(index); else rt.tapped.splice(at, 1);
    var counted = at === -1;
    btn.classList.toggle('counted', counted);
    btn.setAttribute('aria-pressed', counted ? 'true' : 'false');
    btn.setAttribute('aria-label', artLabel() + ' ' + (index + 1) + (counted ? pick(', sudah dihitung', ', counted') : ''));
    updateBadges();

    if (state.sound) {
      if (counted) {
        playTapSound(rt.tapped.length);
        speakCount(rt.tapped.length);
      } else {
        stopSpeech();
      }
    }

    if (rt.tapped.length === rt.count) {
      setCaption(pick('Semua ' + artLabel() + ' sudah dihitung. Pilih angkanya.',
        allCounted()), false);
    } else {
      setCaption(defaultCaption(), false);
    }
    announce(pick(rt.tapped.length + ' ' + artLabel() + ' dihitung.',
      amount(rt.tapped.length) + ' counted.'));
  }

  function markTry(btn) {
    btn.classList.add('try');
    setTimeout(function () { btn.classList.remove('try'); }, 700);
  }

  function chooseValue(btn, value) {
    if (rt.solved) return;
    if (value !== rt.count) {
      markTry(btn);
      setCaption(pick('Belum tepat. Coba hitung lagi dengan tenang.',
        'Not quite. Count again slowly.'), true);
      announce(pick('Belum tepat. Coba hitung lagi.', 'Not quite. Count again.'));
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
    speakSuccess();
    announce(successSentence(allNow));
  }

  function successSentence(allNow) {
    var text;
    if (SETS[rt.setIndex].id === 'hitung') {
      text = pick('Ada ' + rt.count + ' ' + artLabel() + '.',
        (rt.count === 1 ? 'There is ' : 'There are ') + amount(rt.count) + '.');
    } else {
      text = pick('Angka ' + rt.count + ' cocok dengan ' + rt.count + ' ' + artLabel() + '.',
        'The number ' + rt.count + ' matches ' + amount(rt.count) + '.');
    }
    return allNow
      ? text + ' ' + pick('Semua hitungan selesai.', 'All the counting is done.')
      : text;
  }

  function successBody() {
    if (SETS[rt.setIndex].id === 'hitung') {
      return pick('Ada ' + rt.count + ' ' + artLabel() + '.',
        (rt.count === 1 ? 'There is ' : 'There are ') + amount(rt.count) + '.');
    }
    return pick('Angka ' + rt.count + ' cocok dengan ' + rt.count + ' ' + artLabel() + '.',
      'The number ' + rt.count + ' matches ' + amount(rt.count) + '.');
  }

  function showSuccess(allNow) {
    successEl.classList.add('show');
    successEl.setAttribute('aria-hidden', 'false');
    successTitleEl.textContent = allNow ? pick('Semua selesai!', 'All done!') : pick('Hebat!', 'Great job!');
    if (successArtEl) {
      successArtEl.innerHTML = '';
      successArtEl.appendChild(buildArt('success-icon'));
    }
    if (successNumEl) successNumEl.textContent = String(rt.count);
    successTextEl.textContent = allNow
      ? pick('Sepuluh hitungan sudah selesai.', 'All ten numbers are done.')
      : successBody();
    var canSpeak = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    hearBtn.hidden = !canSpeak;
    if (canSpeak) hearBtn.setAttribute('aria-label', pick('Dengarkan ' + successSpoken(), 'Listen to ' + successSpoken()));
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
    var name = artLabel();
    var plural = artLabelPlural();
    if (SETS[rt.setIndex].id === 'cocok') {
      return pick('Pilih kelompok yang berisi ' + rt.count + ' ' + name + '.',
        'Choose the group with ' + amount(rt.count) + '.');
    }
    return state.level === 'penuh'
      ? pick('Ketuk ' + name + ' satu per satu, lalu pilih angkanya.',
        'Tap each ' + name + ' once, then choose the number.')
      : pick('Hitung jumlah ' + name + ', lalu pilih angkanya.',
        'Count the ' + (rt.count === 1 ? name : plural) + ', then choose the number.');
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

  /* ---------------- memuat latihan ---------------- */

  function loadItem(label, center, quiet) {
    var set = SETS[rt.setIndex];
    var index = set.items.indexOf(label);
    if (index === -1) index = 0;
    rt.index = index;
    rt.count = Number(set.items[index]);
    rt.solved = false;
    rt.tapped = [];
    rt.choices = makeChoices(rt.count, LEVELS[state.level].choices, choiceSeed());

    hideSuccess();
    stopSpeech();

    state.setId = set.id;
    state.itemId = set.items[index];
    state.last[set.id] = set.items[index];

    titleEl.textContent = set.id === 'hitung' ? pick('Berapa banyak?', 'How many?') : String(rt.count);
    titleEl.style.setProperty('--label-size',
      set.id === 'hitung' ? 'clamp(27px, 5.6vw, 40px)' : 'clamp(46px, 10vw, 72px)');
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
      announce(set.id === 'hitung'
        ? pick('Hitung. ' + rt.count + ' ' + artLabel() + '. Pilih angka.',
          'Count. ' + amount(rt.count) + '. Choose the number.')
        : pick('Cocokkan. Angka ' + rt.count + '. Pilih kelompok yang sama banyak.',
          'Match. Number ' + rt.count + '. Choose the group with the same amount.'));
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
    rt.tapped = [];
    stopSpeech();
    renderStage();
    captionEl.classList.remove('nudge');
    setCaption(defaultCaption(), false);
    announce(pick('Mulai lagi. ' + (SETS[rt.setIndex].id === 'hitung'
      ? rt.count + ' ' + artLabel() + '.'
      : 'Angka ' + rt.count + '.'),
      'Start again. ' + (SETS[rt.setIndex].id === 'hitung'
        ? amount(rt.count) + '.'
        : 'Number ' + rt.count + '.')));
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
  hearBtn.addEventListener('click', function () { speakSuccess(true); });

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
