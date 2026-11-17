(() => {
'use strict';
const root = document.querySelector('#aixovall');
const A = window.AXR;
if (!root || !A || root.dataset.initialized) return;
root.dataset.initialized = 'true';
const T = A.i18n;
const tr = (k, v) => { let s = T[k] === undefined ? k : T[k]; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
const OV = new Set(A.assets.ov || []);
const asset = rel => (OV.has(rel) ? A.assets.uploads : A.assets.plugin) + rel;
const img = name => asset('img/' + name);
const $ = s => root.querySelector(s);
const $$ = s => [...root.querySelectorAll(s)];
const format = new Intl.NumberFormat(A.locale, { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat(A.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const FLOOR_IMG = { '-1': 'floor-minus1.webp', '0': 'floor-ground.webp', '1': 'floor-first.webp', '2': 'floor-second-third.webp', '3': 'floor-second-third.webp', '4': 'floor-attic.webp' };
const PLAN3D_BY_TYPE = { 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 4, 9: 5, 10: 7 };
const PLANS3D = { 3: 'plan3d-t3.webp', 4: 'plan3d-t4.webp', 5: 'plan3d-t5.webp', 7: 'plan3d-t7.webp' };
const SPACES = ['hero', 'living', 'living-reverse-t4', 'living-sofa-t4', 'bedroom', 'living-t5', 'terrace-t5', 'room-t5', 'living-t7', 'family', 'room', 'terrace', 'manifesto', 'kitchen', 'window', 'building'];
const media = [
  ...(A.video ? [{ kind: 'video', image: 'hero-poster', caption: tr('m_video') }] : []),
  ...SPACES.map(image => ({ kind: 'space', src: image + '.webp', image, caption: tr('m_' + image) })),
  ...[3, 4, 5, 7].map(t => ({ kind: 'plan', src: 'plan3d-t' + t + '.webp', image: 'plan3d-t' + t, caption: tr('m_plan', { t }) }))
];
const WA_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 9.5c.3 2 2.2 4.2 4.6 4.8l1-1.1 1.8.8"/></svg>';
let currentFloor = '1', previousFocus, previousOverflow;
const dialog = $('#ax-dialog');
const hero = $('#ax-hero-video'), toggle = $('#ax-video-toggle');

function node(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function openDialog(title, content, note) {
  previousFocus = document.activeElement;
  $('#ax-dialog-title').textContent = title;
  $('#ax-dialog-content').replaceChildren(content);
  $('#ax-dialog-note').textContent = note;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  if (hero) hero.pause();
  dialog.showModal();
  $('#close-dialog').focus();
}
function planContent(src, alt) {
  const wrap = node('div');
  const image = node('img'); image.src = img(src); image.alt = alt; image.className = 'ax-modal-plan'; image.decoding = 'async';
  const link = node('a', tr('open_tab'), 'ax-modal-download');
  link.href = img(src); link.target = '_blank'; link.rel = 'noopener';
  wrap.append(image, link); return wrap;
}
const floorTitle = key => tr('floor_' + key + '_t');
function setFloor(key) {
  if (!FLOOR_IMG[key]) return;
  currentFloor = key;
  $('#plantes').classList.add('ax-open');
  $$('[data-floor]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.floor === key)));
  $('#floor-title').textContent = floorTitle(key);
  $('#floor-count').textContent = tr('floor_' + key + '_c');
  $('#floor-description').textContent = tr('floor_' + key + '_d');
  $('#floor-plan').src = img(FLOOR_IMG[key]);
  $('#floor-plan').alt = tr('plan_general', { floor: floorTitle(key) });
  $('#expand-plan').setAttribute('aria-label', tr('zoom_aria', { floor: floorTitle(key) }));
  $('#see-floor-homes').replaceChildren(document.createTextNode((key === '-1' ? tr('see_parking') : tr('see_homes')) + ' '), node('span', ''));
}
$('#expand-plan').setAttribute('aria-label', tr('zoom_aria', { floor: floorTitle('1') }));
$$('[data-floor]').forEach(b => b.addEventListener('click', () => setFloor(b.dataset.floor)));
$('#expand-plan').addEventListener('click', () => openDialog(floorTitle(currentFloor), planContent(FLOOR_IMG[currentFloor], tr('plan_general', { floor: floorTitle(currentFloor) })), tr('floor_note')));
const scrollTo = sel => $(sel).scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
$('#see-floor-homes').addEventListener('click', () => {
  if (currentFloor === '-1') { scrollTo('#contacte'); return; }
  $('#filter-floor').value = currentFloor;
  $('#filter-bedrooms').value = 'all';
  $('#filter-available').checked = false;
  renderHomes();
  scrollTo('#habitatges');
  $('#filter-floor').focus({ preventScroll: true });
});

/* ----- Llista d'habitatges ----- */
const L = $('#homes-body').dataset;
function extText(h) {
  const base = tr('ext_' + h.ext);
  return h.extM2 ? base + ' · ' + format.format(h.extM2) + ' m²' : base;
}
function homePlan(home) {
  openDialog(home.name + ' · ' + tr('type', { t: home.type }), planContent('type-' + home.type + '.webp', tr('type_plan_alt', { t: home.type })), tr('type_plan_note'));
}
function home3D(home) {
  const type = PLAN3D_BY_TYPE[home.type], src = PLANS3D[type];
  if (!src) return;
  openDialog(home.name + ' · ' + tr('plan3d'), planContent(src, tr('plan3d_alt', { t: type })), (type !== home.type ? tr('plan3d_ref', { t: type }) : tr('plan3d_type', { t: type })) + ' ' + tr('plan3d_note'));
}
function renderHomes() {
  const floor = $('#filter-floor').value, beds = $('#filter-bedrooms').value, available = $('#filter-available').checked;
  const homes = A.homes.filter(h => (floor === 'all' || String(h.floor) === floor) && (beds === 'all' || String(h.bedrooms) === beds) && (!available || h.status === 'available'));
  const fragment = document.createDocumentFragment();
  homes.forEach(home => {
    const trEl = node('tr');
    const cell = (label, ...children) => { const td = node('td'); td.dataset.label = label; td.append(...children); trEl.append(td); return td; };
    cell(L.lHome, node('strong', home.name), node('small', tr('type', { t: home.type })));
    cell(L.lBeds, node('span', String(home.bedrooms)), node('small', home.detail ? tr('detail_' + home.detail) : ''));
    cell(L.lArea, node('span', format.format(home.area) + ' m²'));
    cell(L.lExt, node('span', extText(home)));
    if (home.status === 'available' && home.price != null) cell(L.lPrice, node('strong', money.format(home.price)));
    else if (home.price != null) { const bl = node('strong', money.format(home.price), 'ax-price-blur'); bl.setAttribute('aria-hidden', 'true'); cell(L.lPrice, bl, node('span', tr('price_hidden'), 'ax-sr')); }
    else { const np = node('span', undefined, 'ax-noprice'); np.title = tr('price_hidden'); np.append(Object.assign(node('span', '—'), { ariaHidden: 'true' }), node('span', tr('price_hidden'), 'ax-sr')); cell(L.lPrice, np); }
    const locked = home.status === 'agreed'; /* 3.6.0: aparaulat → botons atenuats */
    cell(L.lStatus, node('span', tr('st_' + home.status), home.status !== 'available' ? 'ax-stamp ax-stamp-' + home.status : 'ax-status'));
    const actions = node('div', undefined, 'ax-actions' + (locked ? ' is-locked' : '')); if (locked) actions.title = tr('locked');
    const plan = node('button', tr('btn_plan')); plan.type = 'button'; plan.setAttribute('aria-label', tr('aria_plan', { home: home.name }));
    if (locked) plan.disabled = true; else plan.addEventListener('click', () => homePlan(home));
    const view = node('button', tr('btn_3d')); view.type = 'button'; view.setAttribute('aria-label', tr('aria_3d', { home: home.name }));
    if (locked) view.disabled = true;
    else if (PLANS3D[PLAN3D_BY_TYPE[home.type]]) view.addEventListener('click', () => home3D(home));
    else { view.disabled = true; view.title = tr('soon_3d'); }
    actions.append(plan, view);
    if (A.cfgOn) {
      if (home.cfg && !locked) {
        const c = node('a', tr('btn_cfg'), 'ax-act-cfg'); c.href = home.cfg; c.setAttribute('aria-label', tr('aria_cfg', { home: home.name }));
        actions.append(c);
      } else {
        const c = node('button', tr('btn_cfg')); c.type = 'button'; c.disabled = true; c.title = locked ? tr('locked') : tr('soon_cfg');
        actions.append(c);
      }
    }
    if (locked) {
      const wa = node('span', undefined, 'ax-act-wa is-off'); wa.setAttribute('aria-disabled', 'true'); wa.setAttribute('aria-label', tr('locked'));
      wa.innerHTML = WA_ICON; actions.append(wa);
    } else {
      const wa = node('a', undefined, 'ax-act-wa');
      wa.href = 'https://wa.me/376822345?text=' + encodeURIComponent(tr('wa_home', { home: home.name }));
      wa.target = '_blank'; wa.rel = 'noopener'; wa.dataset.place = 'listing';
      wa.setAttribute('aria-label', tr('aria_wa', { home: home.name })); wa.title = tr('aria_wa', { home: home.name });
      wa.innerHTML = WA_ICON; actions.append(wa);
    }
    cell(L.lDiscover, actions); fragment.append(trEl);
  });
  $('#homes-body').replaceChildren(fragment);
  const a = homes.filter(h => h.status === 'available').length;
  $('#result-count').textContent = tr(homes.length === 1 ? 'count_one' : 'count', { n: homes.length, a });
  $('#no-results').hidden = homes.length > 0;
}
['#filter-floor', '#filter-bedrooms', '#filter-available'].forEach(s => $(s).addEventListener('change', renderHomes));
$('#reset-filters').addEventListener('click', () => { $('#filter-floor').value = 'all'; $('#filter-bedrooms').value = 'all'; $('#filter-available').checked = false; renderHomes(); });
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { const v = dialog.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } syncHero(); document.body.style.overflow = previousOverflow || ''; if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true }); });

/* ----- Vídeo de portada: un sol MP4, després de carregar la pàgina ----- */
const connection = navigator.connection;
let allowed = !reduced.matches && !(connection && connection.saveData) && !/2g/.test((connection && connection.effectiveType) || '');
let userPaused = false, heroVisible = true, videoReady = false;
const videoPath = () => asset('video/' + (matchMedia('(max-width:720px)').matches ? 'intro-480.mp4' : 'intro-720.mp4'));
function syncHero() {
  if (!hero) return;
  if (videoReady && allowed && !userPaused && heroVisible && !document.hidden && !dialog.open) {
    if (!hero.getAttribute('src')) hero.src = videoPath();
    hero.play().catch(() => {});
  } else hero.pause();
}
if (hero && toggle) {
  const setToggle = playing => { toggle.textContent = playing ? tr('video_pause') + ' Ⅱ' : tr('video_play') + ' ▷'; toggle.setAttribute('aria-label', tr(playing ? 'video_pause_aria' : 'video_play_aria')); };
  hero.addEventListener('playing', () => { hero.classList.add('ax-playing'); setToggle(true); });
  hero.addEventListener('pause', () => setToggle(false));
  hero.addEventListener('error', () => hero.classList.remove('ax-playing'));
  toggle.addEventListener('click', () => { videoReady = true; allowed = true; userPaused = !hero.paused; syncHero(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncHero(); }, { threshold: .1 }).observe($('#inici'));
  document.addEventListener('visibilitychange', syncHero);
  reduced.addEventListener('change', () => { if (reduced.matches) { allowed = false; syncHero(); } });
  const startHero = () => { videoReady = true; if ('requestIdleCallback' in window) requestIdleCallback(syncHero, { timeout: 1800 }); else setTimeout(syncHero, 500); };
  if (document.readyState === 'complete') startHero(); else window.addEventListener('load', startHero, { once: true });
}

/* ----- Galeria: les imatges grans només es demanen en obrir-les ----- */
let galleryFilter = 'all', galleryExpanded = false;
function openMedia(item) {
  if (item.kind === 'video') {
    const v = node('video'); v.controls = true; v.playsInline = true; v.preload = 'metadata'; v.poster = img('hero-poster.webp'); v.src = videoPath(); v.className = 'ax-gallery-video';
    openDialog(item.caption, v, tr('video_note')); v.play().catch(() => {});
  } else openDialog(item.caption, planContent(item.src, item.caption), tr('img_note'));
}
function renderGallery() {
  const all = media.filter(item => galleryFilter === 'all' || item.kind === galleryFilter);
  const shown = galleryExpanded ? all : all.slice(0, 6);
  $('#ax-gallery-grid').replaceChildren(...shown.map(item => {
    const b = node('button', undefined, 'ax-gallery-card' + (item.kind === 'plan' ? ' ax-gallery-plan' : '')); b.type = 'button';
    b.setAttribute('aria-label', (item.kind === 'video' ? tr('g_play') : tr('g_enlarge')) + ': ' + item.caption);
    const im = node('img'); im.src = img('thumbs/' + item.image + '.webp'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 560; im.height = 420;
    b.append(im, node('span', item.caption), node('small', item.kind === 'video' ? tr('g_play_small') + ' ▷' : tr('g_enlarge_small')));
    b.addEventListener('click', () => openMedia(item)); return b;
  }));
  $('#ax-gallery-more').hidden = galleryExpanded || all.length <= 6;
}
$$('[data-gallery-filter]').forEach(b => b.addEventListener('click', () => { galleryFilter = b.dataset.galleryFilter; galleryExpanded = false; $$('[data-gallery-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderGallery(); }));
$('#ax-gallery-more').addEventListener('click', () => { galleryExpanded = true; renderGallery(); const n = $('#ax-gallery-grid button:nth-child(7)'); if (n) n.focus(); });

/* ----- Cortineta abans / després ----- */
const compare = $('#ax-compare');
if (compare) {
  const range = compare.querySelector('input');
  const set = v => compare.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => { compare.dataset.touched = '1'; set(range.value); });
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = now => {
        if (compare.dataset.touched) return;
        const k = Math.min(1, (now - t0) / 2200);
        const v = 50 + Math.sin(k * Math.PI * 2) * 24 * (1 - k * .35);
        range.value = v; set(v);
        if (k < 1) requestAnimationFrame(tick); else { range.value = 50; set(50); }
      };
      requestAnimationFrame(tick);
    }, { threshold: .55 });
    io.observe(compare);
  }
}

renderGallery();
renderHomes();
if ('IntersectionObserver' in window && !reduced.matches) {
  root.classList.add('ax-animate');
  const reveals = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ax-visible'); reveals.unobserve(e.target); } }), { threshold: .08 });
  $$('.ax-reveal').forEach(e => reveals.observe(e));
  const explorer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { $('#plantes').classList.add('ax-open'); explorer.disconnect(); } }), { threshold: .3 });
  explorer.observe($('.ax-explorer-stage'));
  $('#plantes').addEventListener('focusin', () => $('#plantes').classList.add('ax-open'));
}
})();
/* v2.4 timelapse: autoplay muted when visible */
(function(){var v=document.querySelector('#aixovall .ax-timelapse');if(!v||!('IntersectionObserver' in window))return;
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){v.preload='auto';var p=v.play();p&&p.catch&&p.catch(function(){});}else if(!v.paused)v.pause();});},{threshold:.5}).observe(v);})();


/* ===== v3.3 · conversió i mesura ===== */
/* Aixovall Residencial · v3.1 · conversió i mesura
   - Avís de galetes: el píxel de Meta i GA4 només es carreguen si s'accepten.
   - Esdeveniments: ViewContent, ConfiguradorInici, ConfiguradorResum, Contact, Lead.
   - API de Conversions: si window.AXTRACK.capi té una URL (endpoint del WordPress),
     cada esdeveniment s'hi envia amb el mateix event_id que el píxel (deduplicació).
   - Botó flotant de WhatsApp, formulari curt i línia de temps de l'obra (data-stage). */
(() => {
'use strict';
if (window.__axConv) return; window.__axConv = true;
const lang = ((document.documentElement.lang || 'ca').slice(0, 2));
const WA = '376822345';
const CFG = window.AXTRACK || {};
const AXR = window.AXR || {};
const I = {
  ca: {
    ck_text: 'Fem servir galetes d’analítica i de publicitat (Google Analytics i Meta) per mesurar les visites i millorar els anuncis. Només s’activen si les acceptes.',
    ck_yes: 'Accepta', ck_no: 'Rebutja', ck_label: 'Avís de galetes', ck_link: 'Preferències de galetes',
    wa_float: 'WhatsApp', wa_float_aria: 'Escriu-nos per WhatsApp',
    wa_hello: 'Hola, API! M’interessa Aixovall Residencial.',
    wa_cfg: 'Hola, API! Estic configurant el pis {home} d’Aixovall Residencial i tinc algun dubte.',
    nudge: 'Necessites ajuda? Escriu-nos!',
    wa_float_msg: 'Hola equip d’API Immobiliària! M’interessa la promoció d’Aixovall Residencial i necessito ajuda amb alguns dubtes.',
    f_invalid: 'Escriu el teu nom i un telèfon vàlid, i accepta l’avís de privacitat.',
    f_ok: 'Gràcies, {name}. Envia el missatge de WhatsApp que s’ha preparat i et respondrem aviat.',
    f_open: 'Obre WhatsApp', f_mail: 'Envia-ho per correu',
    f_tpl: 'Hola, API! Soc {name}. M’interessa Aixovall Residencial.\nVull: {interest}\nDormitoris: {beds}\nTelèfon: {phone}{email}{msg}',
    f_email: '\nCorreu: ', f_msg: '\nMissatge: ', f_subject: 'Sol·licitud · Aixovall Residencial'
  },
  es: {
    ck_text: 'Usamos cookies de analítica y publicidad (Google Analytics y Meta) para medir las visitas y mejorar los anuncios. Solo se activan si las aceptas.',
    ck_yes: 'Aceptar', ck_no: 'Rechazar', ck_label: 'Aviso de cookies', ck_link: 'Preferencias de cookies',
    wa_float: 'WhatsApp', wa_float_aria: 'Escríbenos por WhatsApp',
    wa_hello: '¡Hola, API! Me interesa Aixovall Residencial.',
    wa_cfg: '¡Hola, API! Estoy configurando el piso {home} de Aixovall Residencial y tengo alguna duda.',
    nudge: '¿Necesitas ayuda? ¡Escríbenos!',
    wa_float_msg: '¡Hola, equipo de API Immobiliària! Me interesa la promoción de Aixovall Residencial y necesito ayuda con algunas dudas.',
    f_invalid: 'Escribe tu nombre y un teléfono válido, y acepta el aviso de privacidad.',
    f_ok: 'Gracias, {name}. Envía el mensaje de WhatsApp que hemos preparado y te responderemos pronto.',
    f_open: 'Abrir WhatsApp', f_mail: 'Enviarlo por correo',
    f_tpl: '¡Hola, API! Soy {name}. Me interesa Aixovall Residencial.\nQuiero: {interest}\nDormitorios: {beds}\nTeléfono: {phone}{email}{msg}',
    f_email: '\nCorreo: ', f_msg: '\nMensaje: ', f_subject: 'Solicitud · Aixovall Residencial'
  },
  fr: {
    ck_text: 'Nous utilisons des cookies d’analyse et de publicité (Google Analytics et Meta) pour mesurer les visites et améliorer nos annonces. Ils ne s’activent que si vous les acceptez.',
    ck_yes: 'Accepter', ck_no: 'Refuser', ck_label: 'Gestion des cookies', ck_link: 'Préférences de cookies',
    wa_float: 'WhatsApp', wa_float_aria: 'Écrivez-nous sur WhatsApp',
    wa_hello: 'Bonjour API ! Aixovall Residencial m’intéresse.',
    wa_cfg: 'Bonjour API ! Je configure l’appartement {home} d’Aixovall Residencial et j’ai une question.',
    nudge: 'Besoin d’aide ? Écrivez-nous !',
    wa_float_msg: 'Bonjour l’équipe d’API Immobiliària ! Le programme Aixovall Residencial m’intéresse et j’ai besoin d’aide pour quelques questions.',
    f_invalid: 'Indiquez votre nom et un numéro de téléphone valide, et acceptez la mention de confidentialité.',
    f_ok: 'Merci, {name}. Envoyez le message WhatsApp préparé et nous vous répondrons rapidement.',
    f_open: 'Ouvrir WhatsApp', f_mail: 'Envoyer par e-mail',
    f_tpl: 'Bonjour API ! Je suis {name}. Aixovall Residencial m’intéresse.\nJe souhaite : {interest}\nChambres : {beds}\nTéléphone : {phone}{email}{msg}',
    f_email: '\nE-mail : ', f_msg: '\nMessage : ', f_subject: 'Demande · Aixovall Residencial'
  },
  en: {
    ck_text: 'We use analytics and advertising cookies (Google Analytics and Meta) to measure visits and improve our ads. They only switch on if you accept them.',
    ck_yes: 'Accept', ck_no: 'Decline', ck_label: 'Cookie notice', ck_link: 'Cookie preferences',
    wa_float: 'WhatsApp', wa_float_aria: 'Message us on WhatsApp',
    wa_hello: 'Hi API! I’m interested in Aixovall Residencial.',
    wa_cfg: 'Hi API! I’m configuring flat {home} at Aixovall Residencial and I have a question.',
    nudge: 'Need help? Message us!',
    wa_float_msg: 'Hello API Immobiliària team! I’m interested in the Aixovall Residencial development and I need help with a few questions.',
    f_invalid: 'Enter your name and a valid phone number, and accept the privacy notice.',
    f_ok: 'Thank you, {name}. Send the WhatsApp message we have prepared and we will reply soon.',
    f_open: 'Open WhatsApp', f_mail: 'Send by email',
    f_tpl: 'Hi API! I’m {name}. I’m interested in Aixovall Residencial.\nI would like: {interest}\nBedrooms: {beds}\nPhone: {phone}{email}{msg}',
    f_email: '\nEmail: ', f_msg: '\nMessage: ', f_subject: 'Enquiry · Aixovall Residencial'
  }
};
const T = I[lang] || I.ca;
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const waUrl = text => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
const WA_SVG = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 9.5c.3 2 2.2 4.2 4.6 4.8l1-1.1 1.8.8"/></svg>';

/* ---------- Consentiment ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
let consent = store.get('ax_consent');            // 'yes' | 'no' | null
const queue = [];
let loaded = false;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const cookie = n => { const m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; };
const STD = new Set(['PageView', 'ViewContent', 'Contact', 'Lead']);

function loadTrackers() {
  if (loaded) return; loaded = true;
  if (CFG.pixel) {
    /* Codi base del píxel de Meta */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.pixel);
  }
  if (CFG.ga4) {
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CFG.ga4);
  }
  send('PageView', {});
  queue.splice(0).forEach(a => send(a[0], a[1]));
}
function send(name, params) {
  const id = uid(); params = params || {};
  if (window.fbq) { if (STD.has(name)) window.fbq('track', name, params, { eventID: id }); else window.fbq('trackCustom', name, params, { eventID: id }); }
  if (window.gtag && name !== 'PageView') window.gtag('event', name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(), params);
  if (CFG.capi) {
    const body = JSON.stringify({ event_name: name, event_id: id, event_time: Math.floor(Date.now() / 1000), event_source_url: location.href, lang, params, fbp: cookie('_fbp'), fbc: cookie('_fbc') });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon(CFG.capi, new Blob([body], { type: 'application/json' })))) fetch(CFG.capi, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); } catch (e) {}
  }
}
function track(name, params) {
  if (consent === 'yes') send(name, params);
  else if (consent === null) queue.push([name, params]);
}
window.AXTrack = track;

function injectBannerStyle() {
  if (document.getElementById('ax-ck-style')) return;
  const st = document.createElement('style'); st.id = 'ax-ck-style';
  st.textContent = '.ax-ck{position:fixed;z-index:60;left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:420px;background:#302d27;color:#f5f3eb;padding:18px 20px;display:grid;gap:14px;font:13px/1.55 "Helvetica Neue",Arial,sans-serif;box-shadow:0 10px 40px #0000003d}'
    + '.ax-ck p{margin:0}.ax-ck-acts{display:flex;gap:10px;flex-wrap:wrap}.ax-ck button{font:inherit;font-size:13px;font-weight:500;min-height:42px;padding:10px 18px;cursor:pointer;border:1px solid #f5f3eb}'
    + '.ax-ck .ax-ck-yes{background:#e96e1c;border-color:#e96e1c;color:#241b14}.ax-ck .ax-ck-no{background:transparent;color:#f5f3eb}.ax-ck button:focus-visible{outline:3px solid #f58b43;outline-offset:3px}'
    + '@media(max-width:720px){.ax-ck{left:calc(12px + env(safe-area-inset-left,0px));right:calc(12px + env(safe-area-inset-right,0px));max-width:none}}';
  document.head.appendChild(st);
}
function showBanner() {
  injectBannerStyle();
  if (document.querySelector('.ax-ck')) return;
  const b = document.createElement('div');
  b.className = 'ax-ck'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', T.ck_label);
  const p = document.createElement('p'); p.textContent = T.ck_text;
  const acts = document.createElement('div'); acts.className = 'ax-ck-acts';
  const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'ax-ck-yes'; yes.textContent = T.ck_yes;
  const no = document.createElement('button'); no.type = 'button'; no.className = 'ax-ck-no'; no.textContent = T.ck_no;
  acts.append(yes, no); b.append(p, acts); document.body.appendChild(b);
  document.documentElement.classList.add('ax-ck-open');
  const done = v => { consent = v; store.set('ax_consent', v); b.remove(); document.documentElement.classList.remove('ax-ck-open'); if (v === 'yes') loadTrackers(); else queue.length = 0; };
  yes.addEventListener('click', () => done('yes'));
  no.addEventListener('click', () => done('no'));
}
if (consent === 'yes') loadTrackers(); else if (consent !== 'no') showBanner();

/* Enllaç al peu per canviar la tria */
const footer = document.querySelector('.ax-footer');
if (footer) {
  const l = document.createElement('button'); l.type = 'button'; l.className = 'ax-ck-reopen'; l.textContent = T.ck_link;
  l.addEventListener('click', () => { consent = null; showBanner(); });
  const credit = footer.querySelector('.ax-credit');
  footer.insertBefore(l, credit || null);
}

/* ---------- Esdeveniments per delegació ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a,button');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (/wa\.me\//.test(href)) track('Contact', { channel: 'whatsapp', place: a.dataset.place || '' });
  else if (href.indexOf('tel:') === 0) track('Contact', { channel: 'phone' });
  else if (href.indexOf('mailto:') === 0) track('Contact', { channel: 'email' });
  if (/cfg-|\/configurador\//.test(href)) track('ConfiguradorInici', { from: 'landing' });
  const row = a.closest('#homes-body tr');
  if (row && a.tagName === 'BUTTON' && !a.disabled) {
    const home = (row.querySelector('strong') || {}).textContent || '';
    track('ViewContent', { content_name: home, content_type: 'home_listing' });
  }
  /* Configurador */
  if (document.getElementById('axc')) {
    if (a.id === 'pdf' && a.getAttribute('aria-disabled') !== 'true') track('ConfiguradorResum', { home: (window.AXC && window.AXC.home && window.AXC.home.name) || '' });
    if (a.id === 'leadSend') track('Lead', { source: 'configurador', home: (window.AXC && window.AXC.home && window.AXC.home.name) || '' });
  }
}, true);
/* Primera tria dins del configurador */
const axc = document.getElementById('axc');
if (axc) {
  const once = e => {
    if (!e.target.closest('#axc-panel')) return;
    if (!e.target.closest('input,button,label')) return;
    track('ConfiguradorInici', { home: (window.AXC && window.AXC.home && window.AXC.home.name) || '' });
    axc.removeEventListener('click', once, true);
  };
  axc.addEventListener('click', once, true);
}

/* ---------- Botó flotant de WhatsApp (landing i configurador) + missatge si l'usuari s'atura 4 s ---------- */
(function floatWA() {
  if (!document.getElementById('aixovall') && !document.getElementById('axc')) return;
  const st = document.createElement('style'); st.id = 'ax-wa-style';
  st.textContent = '.ax-wa-wrap{position:fixed;z-index:45;right:calc(22px + env(safe-area-inset-right,0px));bottom:calc(22px + var(--ax-wa-lift,0px) + env(safe-area-inset-bottom,0px));display:flex;flex-direction:row-reverse;align-items:center;gap:12px;pointer-events:none;font-family:"Helvetica Neue",Arial,sans-serif}'
    + '.ax-wa-wrap>*{pointer-events:auto}.ax-ck-open .ax-wa-wrap{display:none}'
    + '.ax-wa-float{display:inline-flex;align-items:center;gap:10px;min-height:54px;padding:0 20px 0 16px;border-radius:30px;background:#1d7a45;color:#fff!important;text-decoration:none;font-size:14px;font-weight:600;box-shadow:0 10px 28px #13301f47;transition:transform .2s,background .2s}'
    + '.ax-wa-float:hover{background:#17663a;transform:translateY(-2px)}.ax-wa-float svg{width:24px;height:24px;flex:none}'
    + '.ax-wa-float:focus-visible,.ax-wa-nudge:focus-visible{outline:3px solid #8d5328;outline-offset:4px}'
    + '.ax-wa-nudge{position:relative;display:block;max-width:320px;white-space:nowrap;background:#fff;color:#302d27!important;text-decoration:none;font-size:14px;font-weight:600;line-height:1.35;padding:12px 16px;border-radius:14px;box-shadow:0 10px 30px #1f1b1433;border:1px solid #dcd7ce;opacity:0;transform:translateX(10px) scale(.96);transform-origin:right center;transition:opacity .28s ease,transform .28s ease}'
    + '.ax-wa-nudge:after{content:"";position:absolute;right:-7px;top:50%;width:12px;height:12px;background:#fff;border-right:1px solid #dcd7ce;border-top:1px solid #dcd7ce;transform:translateY(-50%) rotate(45deg)}'
    + '.ax-wa-nudge.is-in{opacity:1;transform:none}'
    + '@media(prefers-reduced-motion:no-preference){.ax-wa-float.is-nudge{animation:axWaHop 1.1s ease 2}@keyframes axWaHop{0%,100%{transform:none}30%{transform:translateY(-7px) rotate(-6deg)}55%{transform:translateY(0) rotate(5deg)}75%{transform:rotate(-2deg)}}}'
    + '@media(prefers-reduced-motion:reduce){.ax-wa-nudge{transition:opacity .2s}}'
    + '@media(max-width:720px){.ax-wa-wrap{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + var(--ax-wa-lift,0px) + env(safe-area-inset-bottom,0px))}.ax-wa-float{width:58px;height:58px;padding:0;justify-content:center}.ax-wa-float span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.ax-wa-nudge{max-width:200px;white-space:normal;font-size:13px;padding:10px 13px}}';
  document.head.appendChild(st);
  const isCfg = !!document.getElementById('axc');
  const homeName = (window.AXC && window.AXC.home && window.AXC.home.name) || '';
  const url = waUrl(T.wa_float_msg);  /* mateix missatge a la landing i al configurador */
  const wrap = document.createElement('div'); wrap.className = 'ax-wa-wrap';
  const btn = document.createElement('a');
  btn.className = 'ax-wa-float'; btn.href = url; btn.target = '_blank'; btn.rel = 'noopener';
  btn.dataset.place = isCfg ? 'float-configurador' : 'float'; btn.setAttribute('aria-label', T.wa_float_aria);
  btn.innerHTML = WA_SVG + '<span>' + T.wa_float + '</span>';
  const bub = document.createElement('a');
  bub.className = 'ax-wa-nudge'; bub.href = url; bub.target = '_blank'; bub.rel = 'noopener'; bub.dataset.place = 'nudge';
  bub.textContent = T.nudge; bub.hidden = true;
  wrap.append(btn, bub); document.body.appendChild(wrap);

  /* Al configurador, el botó s'aixeca per sobre de la barra inferior */
  const nav = document.querySelector('.axc-nav');
  if (nav) {
    const lift = () => wrap.style.setProperty('--ax-wa-lift', nav.offsetHeight + 'px');
    lift(); if ('ResizeObserver' in window) new ResizeObserver(lift).observe(nav); else addEventListener('resize', lift);
  }

  /* Missatge animat quan l'usuari porta 4 segons sense moure's */
  const IDLE = 4000, MIN_VISIBLE = 2500, MAX_TIMES = 3;
  let timer = 0, shownAt = 0, times = 0, hideT = 0;
  const blocked = () => document.documentElement.classList.contains('ax-ck-open') || !!document.querySelector('dialog[open]')
    || !!document.querySelector('.axc-modal:not([hidden])') || document.hidden;
  function show() {
    if (times >= MAX_TIMES || !bub.hidden || blocked()) return;
    times++; shownAt = Date.now(); bub.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => bub.classList.add('is-in')));
    btn.classList.remove('is-nudge'); void btn.offsetWidth; btn.classList.add('is-nudge');
  }
  function hide() {
    bub.classList.remove('is-in'); btn.classList.remove('is-nudge');
    setTimeout(() => { if (!bub.classList.contains('is-in')) bub.hidden = true; }, 300);
  }
  function activity() {
    clearTimeout(timer);
    if (!bub.hidden && !hideT) { hideT = setTimeout(() => { hideT = 0; hide(); }, Math.max(0, MIN_VISIBLE - (Date.now() - shownAt))); }
    timer = setTimeout(show, IDLE);
  }
  bub.addEventListener('pointerenter', () => { clearTimeout(hideT); hideT = 0; });
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, activity, { passive: true }));
  activity();
})();

/* ---------- Landing: formulari i línia de temps ---------- */
const root = document.getElementById('aixovall');
if (!root) return;


/* Línia de temps: canviar data-stage (1–7) a la secció per avançar l'obra */
const prog = root.querySelector('[data-stage]');
if (prog) {
  const stage = parseInt(prog.dataset.stage, 10) || 0;
  prog.querySelectorAll('.ax-step').forEach((li, i) => {
    const n = i + 1;
    li.classList.toggle('is-done', n <= stage);
    li.classList.toggle('is-next', n === stage + 1);
    if (n === stage + 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    const tag = li.querySelector('.ax-step-tag');
    if (tag) { tag.hidden = !(n <= stage || n === stage + 1); tag.textContent = n <= stage ? prog.dataset.done : prog.dataset.next; }
  });
}

/* Formulari curt */
const form = document.getElementById('ax-lead-form');
if (form) {
  const msg = form.querySelector('.ax-lead-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (form.website && form.website.value) return;               // trampa per a bots
    const name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    const okPhone = phone.replace(/[^\d]/g, '').length >= 6;
    if (!name || !okPhone || !form.consent.checked) {
      msg.className = 'ax-lead-msg is-error'; msg.textContent = T.f_invalid; return;
    }
    const opt = s => (s.options[s.selectedIndex] || {}).text || '';
    const note = form.message.value.trim();
    const text = fill(T.f_tpl, { name, phone, interest: opt(form.interest), beds: opt(form.beds),
      email: email ? T.f_email + email : '', msg: note ? T.f_msg + note : '' });
    const url = waUrl(text);
    track('Lead', { source: 'landing', interest: form.interest.value, beds: form.beds.value });
    /* Correu: l'endpoint de leads del WordPress (el mateix del configurador) */
    if (AXR.lead) {
      try { fetch(AXR.lead, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, beds: form.beds.value, interest: form.interest.value, note, consent: true,
          website: '', home: 'landing', lang, intent: 'landing', summary: text, link: location.href }) }).catch(() => {}); } catch (err) {}
    }
    let w = null;
    try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (err) {}
    msg.className = 'ax-lead-msg is-ok';
    msg.replaceChildren();
    const p = document.createElement('p'); p.textContent = fill(T.f_ok, { name: name.split(' ')[0] });
    const acts = document.createElement('div'); acts.className = 'ax-lead-acts';
    const wa = document.createElement('a'); wa.className = 'ax-button ax-button-api'; wa.href = url; wa.target = '_blank'; wa.rel = 'noopener'; wa.dataset.place = 'form';
    wa.innerHTML = WA_SVG; wa.append(document.createTextNode(T.f_open));
    acts.append(wa);
    if (!AXR.lead) {
      const m = document.createElement('a'); m.className = 'ax-lead-mail';
      m.href = 'mailto:apimi@andorra.ad?subject=' + encodeURIComponent(T.f_subject) + '&body=' + encodeURIComponent(text);
      m.textContent = T.f_mail + ' · apimi@andorra.ad';
      acts.append(m);
    }
    msg.append(p, acts);
  });
}
})();
