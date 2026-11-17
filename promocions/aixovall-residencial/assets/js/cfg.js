(() => {
'use strict';
const A = window.AXC;
/* v3.4: rutes del dossier derivades del boot (no cal tocar la plantilla PHP) i full d'estil propi */
(() => {
  const base = String(A.planta || '').replace(/assets\/planta\/planta\.html.*$/, '');
  A.vendor = A.vendor || base + 'assets/vendor/'; A.fontsUrl = A.fontsUrl || base + 'assets/fonts/';
  A.dossierJs = A.dossierJs || base + 'assets/js/dossier.js?v=' + (A.pv || '1');
  A.dossier = A.dossier || (A.lead ? A.lead.replace(/lead(\/?)(\?.*)?$/, 'dossier$1$2') : '');
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + 'assets/css/dossier.css?v=' + (A.pv || '1'); document.head.appendChild(l);
})();
if (!A) return;
const T = A.i18n, HOME = A.home, TYPE = A.type, KIND = A.kind, G = A.catalog;
const tr = (k, v) => { let s = T[k] === undefined ? k : T[k]; if (v) for (const n in v) s = String(s).split('{' + n + '}').join(v[n]); return s; };
const OV = new Set(A.assets.ov || []);
const asset = rel => (OV.has(rel) ? A.assets.uploads : A.assets.plugin) + rel;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf0 = new Intl.NumberFormat(A.locale, { maximumFractionDigits: 0 }), nf2 = new Intl.NumberFormat(A.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = n => { n = Math.round(n * 100) / 100; return Number.isInteger(n) ? nf0.format(n) : nf2.format(n); };
const eur = n => fmt(n) + ' €';
const plus = n => n === 0 ? tr('included') : '+' + eur(n);
const typeLabel = 'T' + HOME.type;
const sameType = typeLabel === TYPE.label;
const D = 'cfg/' + KIND + '/';
/* T5: de moment, renders de cuina i parquet del T4 com a referència. */
const LD = KIND === 't5' ? 'cfg/t4/' : D;
const REFNOTE = KIND === 't5' ? ' ' + tr('note_ref_t5') : '';

/* ============ Passos i renders per tipologia ============ */
const BATH = p => ({ w: 1086, h: 1448, base: 'cfg/ba/ba_base.webp', layers: [[p + '.SB', 'cfg/ba/ba_'], [p + '.PV', 'cfg/ba/ba_'], [p + '.PE', 'cfg/ba/ba_'], [p + '.MB', 'cfg/ba/ba_']] });
const bathKeys = p => [p + '.SB', p + '.PV', p + '.PE', p + '.MB'];
const SU = LD === 'cfg/t4/' ? { w: 1536, h: 1024 } : { w: 1448, h: 1086 };
const NOLAYER = new Set((LD === 'cfg/t4/' ? ['co_IL.B', 'co_FB.B', 'co_FA.B'] : ['co_IL.B', 'co_FB.B', 'co_FA.B', 'co_EC.A']).map(f => LD + f));
const STEPS = [
  { id: 'vivienda', name: tr('s_vivienda') },
  { id: 'suelo', name: tr('s_suelo'), title: tr('t_suelo'), cat: tr('c_suelo'), cap: tr('cap_suelo'), keys: ['SV'],
    stage: { w: SU.w, h: SU.h, base: LD + 'su_base.webp', layers: [['SV', LD + 'su_']] },
    note: tr('note_suelo', { m2: fmt(TYPE.floorM2) }) + (sameType ? '' : ' (' + tr('ref_m2', { t: TYPE.label }) + ')') + REFNOTE },
  { id: 'cocina', name: tr('s_cocina'), title: tr('t_cocina'), cat: tr('c_cocina'), cap: tr('cap_cocina'), keys: ['FB', 'FA', 'EC', 'IL'],
    stage: { w: 1448, h: 1086, base: LD + 'co_base.webp', layers: [['SV', LD + 'co_'], ['IL', LD + 'co_'], ['FB', LD + 'co_'], ['FA', LD + 'co_'], ['EC', LD + 'co_']] },
    note: tr('note_cocina') + REFNOTE }
];
if (TYPE.baths >= 2) {
  STEPS.push({ id: 'bano1', name: tr('s_bano1'), title: tr(KIND === 't4' ? 't_bano1' : 's_bano1'), cat: tr('c_bano'), cap: tr(KIND === 't4' ? 'cap_bano1' : 's_bano1'), keys: bathKeys('B1'), stage: BATH('B1'), note: tr('note_sample') });
  STEPS.push({ id: 'bano2', name: tr('s_bano2'), title: tr('t_bano2'), cat: tr('c_bano'), cap: tr('cap_bano2'), keys: bathKeys('B2'), stage: BATH('B2'), note: tr('note_bano2') + ' ' + tr('note_sample') });
} else {
  STEPS.push({ id: 'bano1', name: tr('s_bano'), title: tr('t_bano'), cat: tr('c_bano'), cap: tr('cap_bano'), keys: bathKeys('B1'), stage: BATH('B1'), note: (KIND === 't4' ? '' : tr('note_bano_ref') + ' ') + tr('note_sample') });
}
STEPS.push({ id: 'otros', name: tr('s_otros'), title: tr('t_otros'), cat: tr('c_otros'), keys: ['CR', 'PA', 'TR'], note: tr('note_otros') });
STEPS.push({ id: 'resumen', name: tr('s_resumen') });
const GAL = ({ t4: [1.3333, 1.5, 1.3333, 2.3091], t5: [2.2099, 1.3333, 1.7778] }[KIND] || [1.3333, 1.3333, 1.3333]).map((ar, i) => ({ ar, src: D + 'ga_' + (i + 1) + '.webp', label: (T['gal_' + KIND] || [])[i] || String(i + 1) }));
const ROOMS = STEPS.filter(s => s.keys && s.id !== 'otros').map(s => [s.title, s.keys]).concat([[tr('t_otros'), ['CR']]]);
const OBJ = { MB: 1, CR: 1 }, PHOTO = { PA: 1, TR: 1 };

/* ============ Estat ============ */
const gk = key => key.split('.').pop();
const grp = key => G[gk(key)];
const KEYS = STEPS.flatMap(s => s.keys || []);
const optName = o => T['o_' + o.id] || o.name;
const isNone = o => /\.0$/.test(o.id) || /^IL\./.test(o.id);
const DEF = { validado: false, propuesta: '', comprador: '', email: '', tel: '', paso: 0, mods: null, lead: null, plaza: '' };
for (const k of KEYS) DEF[k] = grp(k).ops[0].id;
const STORE = 'axr-cfg-v1-' + HOME.id;
let S = Object.assign({}, DEF);
function apply(src) {
  if (!src || typeof src !== 'object') return;
  for (const k in DEF) if (k in src) {
    if (k === 'mods') { if (src.mods === null || (src.mods && Array.isArray(src.mods.items))) S.mods = src.mods; }
    else if (KEYS.includes(k)) { if (grp(k).ops.some(o => o.id === src[k])) S[k] = src[k]; }
    else if (typeof src[k] === typeof DEF[k]) S[k] = src[k];
  }
}
try { apply(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch (e) {}
/* Un enllaç compartit (#c=…) mana sobre el que hi hagi desat. */
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
/* v2.5.1: «&p=…» ve de l'enllaç «Descargar PDF» d'una sol·licitud: dades del client i PDF directe, sense tornar a enviar res. */
let ADMIN_PDF = false;
try {
  const m = location.hash.match(/[#&]c=([A-Za-z0-9_-]+)/);
  const q = location.hash.match(/[#&]p=([A-Za-z0-9_-]+)/);
  if (m) {
    const o = JSON.parse(b64d(m[1])); apply(o); S.validado = true; S.paso = STEPS.length - 1;
    if (q) { const b = JSON.parse(b64d(q[1])) || {}; S.comprador = String(b.n || ''); S.email = String(b.e || ''); S.tel = String(b.t || ''); S.lead = { n: S.comprador, e: S.email, t: S.tel, ok: true, admin: true }; ADMIN_PDF = true; }
    history.replaceState(null, '', location.pathname);
  }
} catch (e) {}
if (!(S.paso >= 0 && S.paso < STEPS.length)) S.paso = 0;
if (!S.validado) S.paso = 0;
const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} };
const shareUrl = () => { const o = { propuesta: S.propuesta, mods: S.mods, plaza: S.plaza }; for (const k of KEYS) o[k] = S[k]; return A.self + '#c=' + b64e(JSON.stringify(o)); };

const op = key => grp(key).ops.find(o => o.id === S[key]) || grp(key).ops[0];
const amount = key => { const g = grp(key), o = op(key); if (key === 'PA' && !isNone(o)) { const p = pkSel(); if (p && p.precio > 0) return p.precio; } return o.price * (g.perM2 ? TYPE.floorM2 : 1); };
const cfgKeys = KEYS.filter(k => !grp(k).annex);
const IGI = (typeof A.igi === 'number' ? A.igi : 4.5) / 100;
const igiOf = n => Math.round(n * IGI * 100) / 100;
const igiPct = () => new Intl.NumberFormat(A.locale, { maximumFractionDigits: 2 }).format(IGI * 100) + ' %';
const grandBase = () => HOME.price + totalAnx() + totalCfg();
const modsTotal = () => (S.mods && S.mods.total) || 0;
const totalCfg = () => cfgKeys.reduce((t, k) => t + amount(k), 0) + modsTotal();
let modPng = null;
try { modPng = JSON.parse(sessionStorage.getItem(STORE + '-png') || 'null'); } catch (e) {}
const totalAnx = () => amount('PA') + amount('TR');
/* ============ v3.5 · Plaça d'aparcament: plànol del soterrani amb la disponibilitat del Hub ============ */
const PK = A.parking && A.parking.plazas && A.parking.plazas.length ? A.parking : null;
const PKI = {
  ca: { eye: "Plaça d'aparcament", title: 'Tria la teva <em>plaça</em>', lead: 'Plànol del soterrani. En verd, les places lliures; en taronja, les reservades. Cada habitatge pot tenir una plaça individual o una plaça doble.', free: 'Lliure', res: 'Reservada', sold: 'Venuda', na: 'No disponible', ind: 'Individual', dbl: 'Doble', plaza: 'Plaça', pick: 'Tria una plaça al plànol.', sel: 'Plaça triada', ok: 'Confirmar la plaça', later: 'Ara no', see: 'Veure el plànol i triar', change: 'Canviar de plaça', none: 'Encara no has triat quina plaça.', left: '{n} lliures de {t}', out: 'Exhaurides', gone: 'La plaça {p} ja no està disponible: tria’n una altra.', close: 'Tancar', note: 'La plaça queda reservada quan es formalitza la reserva del pis amb l’agència.', igi: '+ IGI' },
  es: { eye: 'Plaza de aparcamiento', title: 'Elige tu <em>plaza</em>', lead: 'Plano del sótano. En verde, las plazas libres; en naranja, las reservadas. Cada vivienda puede tener una plaza individual o una plaza doble.', free: 'Libre', res: 'Reservada', sold: 'Vendida', na: 'No disponible', ind: 'Individual', dbl: 'Doble', plaza: 'Plaza', pick: 'Elige una plaza en el plano.', sel: 'Plaza elegida', ok: 'Confirmar la plaza', later: 'Ahora no', see: 'Ver el plano y elegir', change: 'Cambiar de plaza', none: 'Todavía no has elegido qué plaza.', left: '{n} libres de {t}', out: 'Agotadas', gone: 'La plaza {p} ya no está disponible: elige otra.', close: 'Cerrar', note: 'La plaza queda reservada cuando se formaliza la reserva del piso con la agencia.', igi: '+ IGI' },
  fr: { eye: 'Place de parking', title: 'Choisissez votre <em>place</em>', lead: 'Plan du sous-sol. En vert, les places libres ; en orange, les places réservées. Chaque logement peut avoir une place simple ou une place double.', free: 'Libre', res: 'Réservée', sold: 'Vendue', na: 'Indisponible', ind: 'Simple', dbl: 'Double', plaza: 'Place', pick: 'Choisissez une place sur le plan.', sel: 'Place choisie', ok: 'Confirmer la place', later: 'Plus tard', see: 'Voir le plan et choisir', change: 'Changer de place', none: 'Vous n’avez pas encore choisi de place.', left: '{n} libres sur {t}', out: 'Épuisées', gone: 'La place {p} n’est plus disponible : choisissez-en une autre.', close: 'Fermer', note: 'La place est réservée lorsque la réservation du logement est formalisée avec l’agence.', igi: '+ IGI' },
  en: { eye: 'Parking space', title: 'Choose your <em>space</em>', lead: 'Basement plan. Free spaces in green, reserved ones in orange. Each home can have one single space or one double space.', free: 'Free', res: 'Reserved', sold: 'Sold', na: 'Not available', ind: 'Single', dbl: 'Double', plaza: 'Space', pick: 'Choose a space on the plan.', sel: 'Chosen space', ok: 'Confirm space', later: 'Not now', see: 'See the plan and choose', change: 'Change space', none: 'You have not chosen a space yet.', left: '{n} free of {t}', out: 'Sold out', gone: 'Space {p} is no longer available: please choose another.', close: 'Close', note: 'The space is reserved when the home reservation is formalised with the agency.', igi: '+ IGI' }
};
const PKT = PKI[A.lang] || PKI.ca;
const pkt = (k, v) => { let s = PKT[k]; if (v) for (const n in v) s = s.split('{' + n + '}').join(v[n]); return s; };
const PK_OP = { individual: 'PA.A', doble: 'PA.B' };
const pkHasOp = id => grp('PA').ops.some(o => o.id === id);
function pkSel() { return PK && S.plaza ? PK.plazas.find(p => p.ref === S.plaza && p.estado === 'disponible') || null : null; }
function anxName(o) { return optName(o) + (!isNone(o) && pkSel() ? ' · ' + PKT.plaza + ' ' + S.plaza : ''); }
const pkFree = mod => PK ? PK.plazas.filter(p => p.estado === 'disponible' && (!mod || p.mod === mod)) : [];
let pkGone = '';
/* Una plaça desada que ja no és lliure (o d'una altra modalitat) es descarta. */
function pkCheck() {
  if (!PK || !S.plaza) return;
  const p = PK.plazas.find(x => x.ref === S.plaza), o = op('PA');
  if (!p || p.estado !== 'disponible' || isNone(o) || PK_OP[p.mod] !== o.id) { if (p && p.estado !== 'disponible') pkGone = S.plaza; S.plaza = ''; persist(); }
}
function pkOnChange() {
  if (!PK) return;
  const o = op('PA');
  if (isNone(o)) { S.plaza = ''; return; }
  const p = PK.plazas.find(x => x.ref === S.plaza);
  if (!p || PK_OP[p.mod] !== o.id) S.plaza = '';
  if (PK.plano && PK.plano.url) setTimeout(() => pkOpen(), 60);
}
function pkPaint() {
  if (!PK) return;
  pkCheck();
  for (const mod of ['individual', 'doble']) {
    const el = $('opt-PA-' + PK_OP[mod]); if (!el) continue;
    const out = !pkFree(mod).length && S.PA !== PK_OP[mod];
    el.disabled = out; const lab = el.closest('label'); if (lab) { lab.classList.toggle('pk-out', out); let b = lab.querySelector('.pk-badge'); if (out && !b) { b = document.createElement('span'); b.className = 'pk-badge'; b.textContent = PKT.out; lab.querySelector('.tx').appendChild(b); } else if (!out && b) b.remove(); }
  }
  const z = $('pkz'); if (!z) return;
  const o = op('PA'), sel = pkSel(), canMap = PK.plano && PK.plano.url;
  const left = pkt('left', { n: pkFree().length, t: PK.plazas.length });
  if (isNone(o)) { z.innerHTML = `<p class="pkz-l">${left}</p>` + (canMap ? `<button type="button" class="axc-btn pkz-b" data-pk="open">${PKT.see}</button>` : ''); return; }
  z.innerHTML = (pkGone ? `<p class="pkz-w">${esc(pkt('gone', { p: pkGone }))}</p>` : '') +
    (sel ? `<p class="pkz-s"><span>${PKT.sel}</span><b>${esc(sel.ref)}</b><small>${sel.mod === 'doble' ? PKT.dbl : PKT.ind} · ${eur(sel.precio)} ${PKT.igi}</small></p>` : `<p class="pkz-l">${PKT.none} ${left}.</p>`) +
    (canMap ? `<button type="button" class="axc-btn${sel ? '' : ' axc-primary'} pkz-b" data-pk="open">${sel ? PKT.change : PKT.see}</button>` : '') + `<p class="pkz-n">${PKT.note}</p>`;
}
document.addEventListener('click', e => { if (e.target.closest('[data-pk="open"]')) { e.preventDefault(); pkOpen(); } });

let pkDlg = null;
async function pkLive() {
  if (!PK.live) return;
  try {
    const r = await fetch(PK.live, { cache: 'no-store' }); const j = await r.json();
    if (j && j.ok && Array.isArray(j.plazas) && j.plazas.length) { PK.plazas = j.plazas; }
  } catch (e) { /* ens quedem amb les dades de la pàgina */ }
}
function pkMap(cur) {
  const pl = PK.plano;
  return `<div class="pk-map" style="--r:${pl.w && pl.h ? (pl.h / pl.w * 100).toFixed(3) : 141.4}%"><img src="${esc(pl.url)}" alt="${esc(PKT.eye)}" draggable="false">` +
    PK.plazas.filter(p => p.zona).map(p => {
      const ok = p.estado === 'disponible' && pkHasOp(PK_OP[p.mod]);
      const cls = p.estado === 'disponible' ? (ok ? 'free' : 'na') : p.estado === 'vendida' ? 'sold' : p.estado === 'reservada' ? 'res' : 'na';
      const st = { free: PKT.free, res: PKT.res, sold: PKT.sold, na: PKT.na }[cls];
      const z = p.zona;
      return `<button type="button" class="pk-z pk-${cls}${p.ref === cur ? ' on' : ''}" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%" ${ok ? `data-ref="${esc(p.ref)}"` : 'disabled'} aria-label="${esc(PKT.plaza + ' ' + p.ref + ' · ' + (p.mod === 'doble' ? PKT.dbl : PKT.ind) + ' · ' + st)}" aria-pressed="${p.ref === cur}"><b>${esc(p.ref.replace(/^P/, ''))}</b><small>${p.mod === 'doble' ? PKT.dbl : ''}${cls !== 'free' ? (p.mod === 'doble' ? ' · ' : '') + st : ''}</small></button>`;
    }).join('') + '</div>';
}
async function pkOpen() {
  if (!PK || !PK.plano || !PK.plano.url) return;
  if (!pkDlg) {
    const s = document.createElement('style');
    s.textContent = `.pkz{margin-top:12px;display:grid;gap:8px;justify-items:start}.pkz p{margin:0;font-size:13px;color:var(--muted)}.pkz-s{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}.pkz-s span{font-size:12px;letter-spacing:.08em;text-transform:uppercase}.pkz-s b{font-size:20px;color:var(--ink)}.pkz-w{color:#a1441f!important}.pkz-n{font-size:12px!important}.pkz-b{min-height:44px}
label.pk-out{opacity:.55}label.pk-out input{cursor:not-allowed}.pk-badge{display:inline-block;margin-top:4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#a1441f}
.axc-pkd{border:0;padding:0;background:transparent;width:min(980px,calc(100vw - 24px));max-width:none;max-height:calc(100svh - 24px);color:var(--ink)}.axc-pkd::backdrop{background:rgba(30,28,24,.6);backdrop-filter:blur(3px)}
.pkd-in{position:relative;background:var(--paper,#faf8f4);padding:30px 32px 24px;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:26px;box-shadow:0 24px 64px rgba(0,0,0,.3);max-height:calc(100svh - 24px);overflow:auto}
.pkd-side{display:grid;gap:14px;align-content:start}.pkd-side h2{font:400 clamp(26px,3.2vw,34px)/1.1 Georgia,serif;letter-spacing:-.02em;margin:0}.pkd-side h2 em{font-style:italic;color:var(--accent)}.pkd-side p{margin:0;font-size:14px;color:var(--muted)}
.pk-map{position:relative;width:100%;max-width:480px;margin:0 auto;aspect-ratio:auto;background:#fff;border:1px solid var(--line);user-select:none}.pk-map img{display:block;width:100%;height:auto;pointer-events:none}
.pk-z{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0;margin:0;border:2px solid;font:inherit;line-height:1.1;color:#1c1c1c;-webkit-appearance:none;appearance:none;border-radius:2px;min-width:0;min-height:0}
.pk-z b{font-size:clamp(12px,1.6vw,16px)}.pk-z small{font-size:10px;letter-spacing:.04em;text-transform:uppercase}
.pk-free{background:rgba(57,160,96,.36);border-color:#2b7f4c;cursor:pointer}.pk-free:hover{background:rgba(57,160,96,.55)}
.pk-res{background:rgba(255,126,0,.5);border-color:#c25e00}.pk-sold{background:rgba(161,68,31,.5);border-color:#a1441f}.pk-na{background:rgba(120,120,120,.32);border-color:#777}
.pk-z.on{background:var(--accent);border-color:#1c1c1c;color:#fff;box-shadow:0 0 0 3px #fff,0 0 0 5px #1c1c1c;z-index:2}.pk-z:focus-visible{outline:3px solid #1c1c1c;outline-offset:2px}
.pk-leg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--muted)}.pk-leg i{display:inline-block;width:12px;height:12px;border:2px solid;margin-right:6px;vertical-align:-2px}
.pk-pick{border:1px solid var(--line);background:#fff;padding:14px 16px;display:grid;gap:4px;min-height:78px}.pk-pick span{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.pk-pick b{font-size:22px}.pk-pick small{font-size:13px;color:var(--muted)}
.pkd-act{display:flex;flex-wrap:wrap;gap:10px}.pkd-act .axc-btn{min-height:46px}
@media(max-width:820px){.pkd-in{grid-template-columns:1fr;padding:24px 16px 0;gap:16px}.pk-map{max-width:420px}.pkd-act{position:sticky;bottom:0;background:var(--paper,#faf8f4);padding:12px 0 16px;margin:0 -16px;padding-inline:16px;box-shadow:0 -8px 16px rgba(250,248,244,.9);z-index:3}}`;
    document.head.appendChild(s);
    pkDlg = document.createElement('dialog'); pkDlg.className = 'axc-pkd'; pkDlg.setAttribute('aria-labelledby', 'pkd-t');
    document.body.appendChild(pkDlg);
    pkDlg.addEventListener('click', e => {
      if (e.target === pkDlg || e.target.closest('[data-pkx]')) { pkDlg.close(); return; }
      const z = e.target.closest('.pk-z[data-ref]'); if (z) { pkDlg._sel = z.dataset.ref; pkDraw(); return; }
      if (e.target.closest('[data-pkok]') && pkDlg._sel) {
        const p = PK.plazas.find(x => x.ref === pkDlg._sel); if (!p) return;
        S.PA = PK_OP[p.mod]; S.plaza = p.ref; pkGone = '';
        DOS.blob = null; DOS.done = false; persist(); refresh(); pkDlg.close();
        if (window.AXTrack) window.AXTrack('ConfiguradorPlaca', { home: HOME.name, plaza: p.ref, mod: p.mod });
      }
    });
  }
  pkDlg._sel = S.plaza || '';
  pkDraw(); if (!pkDlg.open) pkDlg.showModal();
  await pkLive(); pkCheck();
  if (pkDlg._sel && !PK.plazas.some(p => p.ref === pkDlg._sel && p.estado === 'disponible')) pkDlg._sel = '';
  pkDraw(); pkPaint();
}
function pkDraw() {
  const sel = PK.plazas.find(p => p.ref === pkDlg._sel);
  pkDlg.innerHTML = `<div class="pkd-in"><button type="button" class="pop-x" data-pkx aria-label="${esc(PKT.close)}"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div>${pkMap(pkDlg._sel)}</div>
    <div class="pkd-side"><span class="eyebrow">${esc(PKT.eye)}</span><h2 id="pkd-t">${PKT.title}</h2><p>${esc(PKT.lead)}</p>
      <div class="pk-leg"><span><i class="pk-free"></i>${PKT.free}</span><span><i class="pk-res"></i>${PKT.res}</span><span><i class="pk-sold"></i>${PKT.sold}</span></div>
      <p>${[pkt('left', { n: pkFree().length, t: PK.plazas.length })].concat(['individual', 'doble'].map(m => { const ps = PK.plazas.filter(p => p.mod === m).map(p => p.precio); return ps.length ? (m === 'doble' ? PKT.dbl : PKT.ind) + ' ' + eur(Math.min(...ps)) + ' ' + PKT.igi : ''; }).filter(Boolean)).join(' · ')}</p>
      <div class="pk-pick" aria-live="polite">${sel ? `<span>${PKT.sel}</span><b>${PKT.plaza} ${esc(sel.ref)}</b><small>${sel.mod === 'doble' ? PKT.dbl : PKT.ind} · ${eur(sel.precio)} ${PKT.igi}</small>` : `<small>${PKT.pick}</small>`}</div>
      <div class="pkd-act"><button type="button" class="axc-btn axc-primary" data-pkok${sel ? '' : ' disabled'}>${PKT.ok}</button><button type="button" class="axc-btn" data-pkx>${PKT.later}</button></div>
      <p style="font-size:12px">${PKT.note}</p></div></div>`;
  const b = pkDlg.querySelector('.pk-z.on') || pkDlg.querySelector('.pk-z[data-ref]'); if (b && document.activeElement && !pkDlg.contains(document.activeElement)) b.focus({ preventScroll: true });
}

/* ============ Renders per capes ============ */
const stages = [];
function makeStage(def, el) {
  el.classList.add('stage', 'loading'); el.style.setProperty('--ar', (def.w / def.h).toFixed(4));
  let pending = 0;
  const done = () => { if (--pending <= 0) el.classList.remove('loading'); };
  const add = (rel, on) => { const i = new Image(); i.alt = ''; i.decoding = 'async'; pending++; i.onload = done; i.onerror = () => { i.remove(); done(); }; i.src = asset(rel); if (on) i.className = 'on'; el.appendChild(i); return i; };
  add(def.base, true);
  const imgs = [];
  for (const [key, pre] of def.layers) for (const o of grp(key).ops) {
    const f = pre + o.id; if (NOLAYER.has(f)) continue;
    imgs.push([key, o.id, add(f + '.webp')]);
  }
  const upd = () => imgs.forEach(([k, id, im]) => im.classList.toggle('on', S[k] === id));
  upd(); stages.push(upd);
}
const layerFiles = def => [def.base].concat(def.layers.map(([k, pre]) => pre + S[k]).filter(f => !NOLAYER.has(f)).map(f => f + '.webp'));
const preload = def => { if (!def || def._pre) return; def._pre = true; [def.base].concat(def.layers.flatMap(([k, pre]) => grp(k).ops.map(o => pre + o.id).filter(f => !NOLAYER.has(f)).map(f => f + '.webp'))).forEach(f => { const i = new Image(); i.decoding = 'async'; i.src = asset(f); }); };

/* ============ Construcció dels passos ============ */
const viewer = $('axc-viewer'), panel = $('axc-panel');
const V = {}, P = {};
const sw = id => asset('cfg/sw/sw_' + id + '.jpg');
function optCard(key, g, o) {
  const k2 = gk(key), none = isNone(o);
  const cls = /\.0$/.test(o.id) ? 'sw none' : OBJ[k2] ? 'sw obj' : PHOTO[k2] ? 'sw photo' : 'sw';
  const bg = none ? '' : ` style="background-image:url('${sw(o.id)}')"`;
  const price = g.perM2 ? (o.price ? `+${fmt(o.price)} €/m² · ${plus(o.price * TYPE.floorM2)}` : tr('included')) : g.annex ? (o.price ? '+' + eur(o.price) + ' ' + tr('igi') : tr('no_cost')) : plus(o.price);
  return `<label class="opt"><input type="radio" name="${key}" id="opt-${key}-${o.id}" value="${o.id}">
    ${k2 === 'IL' ? '' : `<span class="${cls}"${bg}></span>`}
    <span class="tx"><span class="code">${/\.0$/.test(o.id) ? '—' : o.id}</span><span class="nm">${esc(optName(o))}</span>${o.brand ? `<span class="br">${esc(o.brand)}</span>` : ''}<span class="pr">${price}</span></span></label>`;
}
/* Plànols retallats de les tipologies que fan servir renders d'una altra */
const PLX = { 6: 1.2521, 8: 1.2076, 9: 0.8894, 10: 0.9863 };
const planSrc = sameType ? { src: D + 'vi_plano.webp', ar: { t4: 1.2, t5: 0.7941 }[KIND] || 1.4582 } : (PLX[HOME.type] ? { src: 'cfg/pl/type-' + HOME.type + '.webp', ar: PLX[HOME.type] } : { src: 'img/type-' + HOME.type + '.webp', ar: 0.7068 });
function buildStep(st, i) {
  const v = document.createElement('div'); v.hidden = true; v.className = 'axc-view'; V[st.id] = v; viewer.appendChild(v);
  const p = document.createElement('section'); p.className = 'axc-pane'; p.hidden = true; P[st.id] = p; panel.appendChild(p);
  if (st.id === 'vivienda') {
    v.innerHTML = `<div class="stage paper" id="planStage" style="--ar:${planSrc.ar}"><img class="on" id="imgPlano" src="${asset(planSrc.src)}" alt="${esc(tr('plan_alt', { t: typeLabel }))}"><img id="img3d" data-src="${asset(D + 'vi_3d.webp')}" alt="${esc(tr('d3_alt', { t: TYPE.label }))}"></div>
      <div class="vbar"><div class="seg"><button type="button" id="tabPlano" aria-pressed="true">${tr('tab_plan')}</button><button type="button" id="tab3d" aria-pressed="false">${tr('tab_3d')}</button></div><span class="vnote">${tr('furniture')}</span></div>`;
    const ext = HOME.extM2 ? `<div><dt>${tr('ext_' + HOME.ext)}</dt><dd>${fmt(HOME.extM2)} m²</dd></div>` : '';
    p.innerHTML = `<div class="phead"><span class="eyebrow">${tr('step', { n: 1 })} · Aixovall Residencial</span><h2>${esc(tr('home_title', { name: HOME.name }))}</h2><p class="muted">${typeLabel}${sameType ? ' · ' + tr('desc_' + KIND) : ''}</p></div>
      <dl class="facts"><div><dt>${tr('f_floor')}</dt><dd>${tr('floor_' + HOME.floor)}</dd></div>${sameType ? `<div><dt>${tr('f_util')}</dt><dd>${fmt(TYPE.util)} m²</dd></div>` : ''}<div><dt>${tr('f_built')}</dt><dd>${fmt(HOME.area)} m²</dd></div><div><dt>${tr('f_beds')}</dt><dd>${HOME.bedrooms}</dd></div><div><dt>${tr('f_baths')}</dt><dd>${TYPE.baths}</dd></div>${ext}<div><dt>${tr('f_price')}</dt><dd>${eur(HOME.price)} <small class="muted">${tr('igi')}</small></dd></div></dl>
      <p><span class="status ${HOME.status}">${tr('st_' + HOME.status)}</span> · <a href="${A.back}">${tr('change_home')}</a></p>
      ${sameType ? '' : `<p class="note">${tr('ref_note', { t: TYPE.label })}</p>`}
      <div class="modbox"><div><b>${tr('mod_title')}</b><p class="muted">${tr('mod_text')}</p></div><div id="modSum"></div><button type="button" class="axc-btn axc-dark" id="modOpen">${tr('mod_open')}</button></div>
      <label class="fld" for="propuesta">${tr('proposal')}
        <textarea id="propuesta" maxlength="1500" placeholder="${esc(tr('proposal_ph'))}"></textarea></label>
      <p class="warn">${tr('legal_mod')}</p>
      <div class="vcheck" id="vcheck"><label class="check" for="validado"><input type="checkbox" id="validado"><span><b>${tr('validate')}</b><br><span class="muted">${tr('validate_s')}</span></span></label>
      <p class="need-msg" id="needMsg" role="status" hidden></p></div>`;
  } else if (st.id === 'resumen') {
    p.className = 'axc-pane sheet';
  } else {
    if (st.stage) { const el = document.createElement('div'); v.appendChild(el); st._el = el; }
    else v.innerHTML = `<div class="stage" id="galStage" style="--ar:${GAL[0].ar}">${GAL.map((g, n) => `<img ${n === 0 ? 'class="on"' : ''} data-g="${n}" alt="${esc(tr('gal_alt'))} ${n + 1}">`).join('')}</div>
      <div class="vbar"><div class="seg" id="galSeg">${GAL.map((g, n) => `<button type="button" data-g="${n}" aria-pressed="${n === 0}">${esc(g.label)}</button>`).join('')}</div></div>`;
    v.insertAdjacentHTML('beforeend', `<span class="vnote">${tr('img_ref')}</span>`);
    p.innerHTML = `<div class="phead"><span class="eyebrow">${tr('step', { n: i + 1 })} · ${st.cat}</span><h2>${st.title}</h2></div>` +
      st.keys.map(k => { const g = grp(k), k2 = gk(k); return `<fieldset><legend><b>${tr('g_' + k2)}</b><span>${T['d_' + k2] ? T['d_' + k2] + ' · ' : ''}${tr('n_options', { n: g.ops.length })}</span></legend><div class="opts">${g.ops.map(o => optCard(k, g, o)).join('')}</div>${k === 'PA' && PK ? '<div class="pkz" id="pkz"></div>' : ''}</fieldset>`; }).join('') +
      (st.note ? `<p class="note">${st.note}</p>` : '');
  }
}
STEPS.forEach(buildStep);
$('axc-steps').innerHTML = STEPS.map((s, i) => `<li><button type="button" data-i="${i}"><span class="n">${i + 1}</span>${esc(s.name)}</button></li>`).join('');
$('axc-price').textContent = eur(HOME.price) + ' ' + tr('igi');

/* ============ Resum ============ */
let minisBuilt = false;
function row(key) {
  const g = grp(key), k2 = gk(key), o = op(key), a = amount(key);
  const th = isNone(o) ? (k2 === 'IL' ? '' : '<span class="th none"></span>') : `<span class="th${OBJ[k2] ? ' obj' : ''}" style="background-image:url('${sw(o.id)}')"></span>`;
  const code = /\.0$/.test(o.id) ? '' : `<span class="muted">${o.id}</span> · `;
  const extra = g.perM2 && o.price ? ' · ' + tr('m2_times', { p: fmt(o.price), m2: fmt(TYPE.floorM2) }) : '';
  return `<div class="row${th ? '' : ' nothumb'}">${th}<span class="d"><span>${code}${esc(key === 'PA' ? anxName(o) : optName(o))}${g.sample && o.price ? ' *' : ''}</span><small>${tr('g_' + k2)}${o.brand ? ' · ' + esc(o.brand) : ''}${extra}</small></span><span class="p">${g.annex ? (a ? eur(a) : '—') : plus(a)}</span></div>`;
}
const homeLine = () => `${typeLabel} · ${tr('floor_' + HOME.floor)} · ${fmt(HOME.area)} m² · ${S.validado ? tr('validated') : tr('not_validated')}`;
function renderSummary() {
  const p = P.resumen;
  if (!leadOk()) { renderGate(); return; }
  if (!minisBuilt) {
    p.innerHTML = `<div class="phead"><span class="eyebrow">${tr('step', { n: STEPS.length })} · Aixovall Residencial</span><h2>${tr('sum_title')}</h2></div>
      <div class="minis" id="minis"></div><div id="sumBody" style="display:grid;gap:30px"></div>
      <div class="legal"><p><b>${tr('legal_img_t')}</b> ${tr('legal_img')}</p><p><b>${tr('legal_amt_t')}</b> ${tr('legal_amt', { r: igiPct() })}</p></div>
      <section class="dossier" id="dossier" aria-live="polite"><div class="dos-head"><span class="eyebrow">${esc(gt('d_eye'))}</span><h3>${esc(gt('d_t', { home: HOME.name }))}</h3><p id="dosMsg">${esc(gt(DOS.busy ? 'd_wait' : 'd_ready'))}</p></div>
        <div class="actions"><a class="axc-btn axc-wa is-off" id="dosWa" href="#" target="_blank" rel="noopener" data-place="dossier" aria-disabled="true">${WA_ICON}${esc(gt('d_get'))}</a><button type="button" class="axc-btn axc-ghost" id="pdf">${esc(gt('d_dl'))} ↓</button></div></section>
      <section class="fin" id="fin" hidden aria-labelledby="finTitle"></section>
      <div class="actions"><button type="button" class="axc-btn" id="share">${tr('share')}</button><button type="button" class="axc-btn" id="copy">${tr('copy')}</button><button type="button" class="axc-btn" id="reset">${tr('reset')}</button><span class="hint" id="status" role="status"></span></div>`;
    for (const st of STEPS) if (st.stage) { const f = document.createElement('figure'), d = document.createElement('div'); f.appendChild(d); f.insertAdjacentHTML('beforeend', `<figcaption>${st.cap}</figcaption>`); $('minis').appendChild(f); makeStage(st.stage, d); }
    const say = m => { $('status').textContent = m; };
    const clip = (text, ok) => navigator.clipboard.writeText(text).then(() => say(ok)).catch(() => say(tr('copy_err')));
    $('copy').addEventListener('click', () => clip(summaryText(), tr('copied')));
    $('share').addEventListener('click', () => clip(shareUrl(), tr('shared')));
    $('reset').addEventListener('click', e => {
      const b = e.currentTarget;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = tr('reset_sure'); setTimeout(() => { delete b.dataset.sure; b.textContent = tr('reset'); }, 4000); return; }
      try { localStorage.removeItem(STORE); } catch (err) {}
      location.href = A.self;
    });
    wireDossier(); minisBuilt = true;
  }
  const anx = ['PA', 'TR'].filter(k => !isNone(op(k)));
  $('sumBody').innerHTML = `
    <div class="block"><div class="bhead"><h3>${tr('b_home')}</h3><span>${tr('b_home_s')}</span></div>
      <div class="row nothumb"><span class="d"><span>${esc(HOME.name)}</span><small>${homeLine()}</small></span><span class="p">${eur(HOME.price)}</span></div>
      <div class="total"><span>${tr('total_home')} <small>${tr('no_igi')}</small></span><span>${eur(HOME.price)}</span></div>
      <div class="igirow"><span>${tr('igi_line', { r: igiPct() })}</span><span>${eur(igiOf(HOME.price))}</span></div>
      <div class="total igitot"><span>${tr('total_home')} ${tr('with_igi')}</span><span>${eur(HOME.price + igiOf(HOME.price))}</span></div></div>
    <div class="block"><div class="bhead"><h3>${tr('b_annex')}</h3><span>${tr('b_annex_s')}</span></div>
      ${anx.length ? anx.map(row).join('') : `<div class="row nothumb"><span class="d"><span>${tr('none_annex')}</span></span><span class="p">—</span></div>`}
      <div class="total"><span>${tr('total_annex')} <small>${tr('no_igi')}</small></span><span>${eur(totalAnx())}</span></div>
      <div class="igirow"><span>${tr('igi_line', { r: igiPct() })}</span><span>${eur(igiOf(totalAnx()))}</span></div>
      <div class="total igitot"><span>${tr('total_annex')} ${tr('with_igi')}</span><span>${eur(totalAnx() + igiOf(totalAnx()))}</span></div></div>
    <div class="block"><div class="bhead"><h3>${tr('b_cfg')}</h3><span>${tr('b_cfg_s')}</span></div>
      ${ROOMS.map(([name, ks]) => `<div class="room">${name}</div>` + ks.map(row).join('')).join('')}
      ${modRows()}
      <div class="total"><span>${tr('total_cfg')} <small>${tr('no_igi')}</small></span><span>${eur(totalCfg())}</span></div>
      <div class="igirow"><span>${tr('igi_line', { r: igiPct() })}</span><span>${eur(igiOf(totalCfg()))}</span></div>
      <div class="total igitot"><span>${tr('total_cfg')} ${tr('with_igi')}</span><span>${eur(totalCfg() + igiOf(totalCfg()))}</span></div>
      <p class="note" style="margin-top:8px">${tr('sample_foot')}</p></div>
    <div class="block grand"><div class="bhead"><h3>${tr('grand')}</h3><span>${tr('grand_s')}</span></div>
      <div class="row nothumb"><span class="d"><span>${tr('total_home')}</span></span><span class="p">${eur(HOME.price)}</span></div>
      <div class="row nothumb"><span class="d"><span>${tr('total_annex')}</span></span><span class="p">${eur(totalAnx())}</span></div>
      <div class="row nothumb"><span class="d"><span>${tr('total_cfg')}</span></span><span class="p">${eur(totalCfg())}</span></div>
      <div class="total"><span>${tr('grand_base')}</span><span>${eur(grandBase())}</span></div>
      <div class="igirow"><span>${tr('igi_line', { r: igiPct() })}</span><span>${eur(igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()))}</span></div>
      <div class="total igitot big"><span>${tr('grand_total')}</span><span>${eur(grandBase() + igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()))}</span></div></div>
    ${modBlock()}
    ${S.propuesta.trim() ? `<div class="block" style="gap:8px"><div class="bhead"><h3>${tr('b_mod')}</h3><span>${tr('b_mod_s')}</span></div><p class="quote">${esc(S.propuesta.trim())}</p><p class="warn">${tr('legal_mod')}</p></div>` : ''}`;
}
function summaryText() {
  const L = [`Aixovall Residencial · ${HOME.name} (${typeLabel})`];
  if (S.comprador.trim()) L.push(tr('buyer') + ': ' + S.comprador.trim());
  const wi = n => `${eur(n)} ${tr('no_igi')} · ${tr('igi_line', { r: igiPct() })}: ${eur(igiOf(n))} · ${tr('with_igi')}: ${eur(n + igiOf(n))}`;
  L.push('', `${tr('t_summary_home')}: ${wi(HOME.price)}`, '', tr('t_summary_annex'));
  for (const k of ['PA', 'TR']) L.push(`- ${tr('g_' + k)}: ${k === 'PA' ? anxName(op(k)) : optName(op(k))}${amount(k) ? ' · ' + eur(amount(k)) : ''}`);
  L.push(`${tr('total_annex')}: ${wi(totalAnx())}`, '', tr('t_summary_cfg'));
  for (const [name, ks] of ROOMS) { L.push(name + ':'); for (const k of ks) L.push(`- ${tr('g_' + gk(k))}: ${op(k).id} ${optName(op(k))} · ${plus(amount(k))}`); }
  if (S.mods && S.mods.items.length) { L.push(tr('mod_room') + ':'); for (const i of S.mods.items) L.push(`- ${i.label} (${modQty(i)}) · +${eur(i.amount)}`); }
  L.push(`${tr('total_cfg')}: ${wi(totalCfg())}`);
  L.push('', `${tr('grand_total').toUpperCase()}: ${eur(grandBase() + igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()))} (${tr('grand_base')}: ${eur(grandBase())})`);
  if (S.mods && S.mods.kitchen) L.push(tr('mod_kwarn'));
  if (S.propuesta.trim()) L.push('', tr('t_summary_mod'), S.propuesta.trim());
  L.push('', tr('legal_img'));
  return L.join('\n');
}

/* ============ Enviament a API ============ */
const emailOk = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const telOk = v => (v.replace(/\D/g, '').length >= 6);
/* ============ v3.4: porta d'accés al resum (dades → dossier) i enviament per WhatsApp ============
   El resum, el PDF i l'enviament a API només es desbloquegen quan el client deixa nom i WhatsApp.
   El dossier es genera al navegador (assets/js/dossier.js), es puja a WordPress (/aixovall/v1/dossier)
   i WordPress avisa Make (webhook) perquè l'enviï per WhatsApp (360dialog) i el desi al CRM. */
const GT = ({
  ca: {
    g_t: 'El teu dossier del {home} és a punt.', g_p: 'Hem preparat un dossier personalitzat amb el teu pis configurat: plànols, acabats, preu detallat i calendari de pagaments. Deixa’ns el nom i el WhatsApp i te l’enviem a l’instant.',
    g_form: 'Rep el teu dossier', g_hint: 'Sense compromís. Només et contactarem per a aquest pis.',
    g_total: 'Total amb IGI', g_cta: 'Veure el meu dossier i rebre’l per WhatsApp', g_fine: 'En 1 minut tindràs el PDF al teu WhatsApp i aquí mateix.',
    l_wa: 'WhatsApp (+376 …)', l_email_opt: 'Correu electrònic (opcional)',
    g_invalid: 'Escriu el teu nom i un número de WhatsApp vàlid, i accepta que et contactem.',
    d_eye: 'EL TEU DOSSIER', d_t: 'Dossier personalitzat del {home}', d_wait: 'Preparant el teu dossier en PDF…',
    d_sent: 'Fet, {name}! Toca «Rebre’l al meu WhatsApp» i te l’enviem ara mateix. Si no, te l’enviarem igualment al {tel} d’aquí a uns minuts.', d_get: 'Rebre’l al meu WhatsApp', d_get_msg: 'Hola, API! Soc {name}. Vull rebre el dossier del pis {home} d’Aixovall Residencial (codi {code}).', d_get_wait: 'Un moment: estem preparant el PDF…',
    d_nowa: 'El teu dossier és a punt per descarregar. Et contactarem al {tel} per WhatsApp.',
    d_err: 'No hem pogut generar el PDF. Escriu-nos per WhatsApp i te l’enviem nosaltres.',
    d_wa: 'Parlar amb API sobre el {home}', d_wa_msg: 'Hola, API! Soc {name}. He configurat el pis {home} d’Aixovall Residencial (codi {code}, total {total}) i vull parlar-ne.',
    d_dl: 'Descarregar el PDF', d_ready: 'El teu dossier està disponible: descarrega’l aquí o escriu-nos per WhatsApp.'
  },
  es: {
    g_t: 'Tu dossier del {home} está listo.', g_p: 'Hemos preparado un dossier personalizado con tu piso configurado: planos, acabados, precio detallado y calendario de pagos. Déjanos tu nombre y tu WhatsApp y te lo enviamos al instante.',
    g_form: 'Recibe tu dossier', g_hint: 'Sin compromiso. Solo te contactaremos por este piso.',
    g_total: 'Total con IGI', g_cta: 'Ver mi dossier y recibirlo por WhatsApp', g_fine: 'En 1 minuto tendrás el PDF en tu WhatsApp y aquí mismo.',
    l_wa: 'WhatsApp (+376 …)', l_email_opt: 'Correo electrónico (opcional)',
    g_invalid: 'Escribe tu nombre y un número de WhatsApp válido, y acepta que te contactemos.',
    d_eye: 'TU DOSSIER', d_t: 'Dossier personalizado del {home}', d_wait: 'Preparando tu dossier en PDF…',
    d_sent: '¡Hecho, {name}! Toca «Recibirlo en mi WhatsApp» y te lo enviamos ahora mismo. Si no, te lo enviaremos igualmente al {tel} en unos minutos.', d_get: 'Recibirlo en mi WhatsApp', d_get_msg: '¡Hola, API! Soy {name}. Quiero recibir el dossier del piso {home} de Aixovall Residencial (código {code}).', d_get_wait: 'Un momento: estamos preparando el PDF…',
    d_nowa: 'Tu dossier está listo para descargar. Te contactaremos al {tel} por WhatsApp.',
    d_err: 'No hemos podido generar el PDF. Escríbenos por WhatsApp y te lo enviamos nosotros.',
    d_wa: 'Hablar con API sobre el {home}', d_wa_msg: '¡Hola, API! Soy {name}. He configurado el piso {home} de Aixovall Residencial (código {code}, total {total}) y quiero hablar de ello.',
    d_dl: 'Descargar el PDF', d_ready: 'Tu dossier está disponible: descárgalo aquí o escríbenos por WhatsApp.'
  },
  fr: {
    g_t: 'Votre dossier du {home} est prêt.', g_p: 'Nous avons préparé un dossier personnalisé avec votre appartement configuré : plans, finitions, prix détaillé et calendrier de paiement. Laissez-nous votre nom et votre WhatsApp et nous vous l’envoyons immédiatement.',
    g_form: 'Recevez votre dossier', g_hint: 'Sans engagement. Nous ne vous contacterons que pour cet appartement.',
    g_total: 'Total IGI inclus', g_cta: 'Voir mon dossier et le recevoir sur WhatsApp', g_fine: 'Dans 1 minute, le PDF sera sur votre WhatsApp et ici même.',
    l_wa: 'WhatsApp (+33 …)', l_email_opt: 'E-mail (facultatif)',
    g_invalid: 'Indiquez votre nom et un numéro WhatsApp valide, et acceptez d’être contacté.',
    d_eye: 'VOTRE DOSSIER', d_t: 'Dossier personnalisé du {home}', d_wait: 'Préparation de votre dossier PDF…',
    d_sent: 'C’est fait, {name} ! Touchez « Le recevoir sur WhatsApp » et nous vous l’envoyons tout de suite. Sinon, nous vous l’enverrons au {tel} dans quelques minutes.', d_get: 'Le recevoir sur WhatsApp', d_get_msg: 'Bonjour API ! Je suis {name}. Je souhaite recevoir le dossier de l’appartement {home} d’Aixovall Residencial (code {code}).', d_get_wait: 'Un instant : nous préparons le PDF…',
    d_nowa: 'Votre dossier est prêt à télécharger. Nous vous contacterons au {tel} sur WhatsApp.',
    d_err: 'Impossible de générer le PDF. Écrivez-nous sur WhatsApp et nous vous l’enverrons.',
    d_wa: 'Parler avec API du {home}', d_wa_msg: 'Bonjour API ! Je suis {name}. J’ai configuré l’appartement {home} d’Aixovall Residencial (code {code}, total {total}) et je souhaite en parler.',
    d_dl: 'Télécharger le PDF', d_ready: 'Votre dossier est disponible : téléchargez-le ici ou écrivez-nous sur WhatsApp.'
  },
  en: {
    g_t: 'Your dossier for {home} is ready.', g_p: 'We have prepared a personalised dossier of your configured home: plans, finishes, detailed price and payment schedule. Leave your name and WhatsApp and we’ll send it right away.',
    g_form: 'Get your dossier', g_hint: 'No commitment. We’ll only contact you about this home.',
    g_total: 'Total incl. IGI', g_cta: 'See my dossier and get it on WhatsApp', g_fine: 'In 1 minute you’ll have the PDF on WhatsApp and right here.',
    l_wa: 'WhatsApp (+44 …)', l_email_opt: 'Email (optional)',
    g_invalid: 'Enter your name and a valid WhatsApp number, and accept to be contacted.',
    d_eye: 'YOUR DOSSIER', d_t: 'Personalised dossier for {home}', d_wait: 'Preparing your PDF dossier…',
    d_sent: 'Done, {name}! Tap “Get it on my WhatsApp” and we’ll send it right away. Otherwise we’ll send it to {tel} in a few minutes.', d_get: 'Get it on my WhatsApp', d_get_msg: 'Hi API! I’m {name}. I’d like to receive the dossier for flat {home} at Aixovall Residencial (code {code}).', d_get_wait: 'One moment: we’re preparing the PDF…',
    d_nowa: 'Your dossier is ready to download. We’ll contact you on WhatsApp at {tel}.',
    d_err: 'We couldn’t generate the PDF. Message us on WhatsApp and we’ll send it to you.',
    d_wa: 'Talk to API about {home}', d_wa_msg: 'Hi API! I’m {name}. I configured flat {home} at Aixovall Residencial (code {code}, total {total}) and I’d like to talk about it.',
    d_dl: 'Download the PDF', d_ready: 'Your dossier is available: download it here or message us on WhatsApp.'
  }
})[A.lang] || null;
const gt = (k, v) => { let s = GT && GT[k] !== undefined ? GT[k] : k; if (v) for (const n in v) s = String(s).split('{' + n + '}').join(v[n]); return s; };
const grandIgi = () => grandBase() + igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg());
const leadOk = () => ADMIN_PDF || !!(S.lead && S.lead.ok);
/* Codi curt i estable de la configuració: AX-<pis>-<hash> */
function dossierCode() {
  const o = {}; for (const k of KEYS) o[k] = S[k]; o.m = S.mods && S.mods.total || 0;
  const str = JSON.stringify(o); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return 'AX-' + HOME.id.replace(/-/g, '') + '-' + h.toString(36).toUpperCase().slice(-4).padStart(4, '0');
}
const waPhone = v => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.length === 6) d = '376' + d; if (d.length === 9 && !d.startsWith('376')) d = '34' + d; return d; };

/* ---------- Porta d'accés ---------- */
function renderGate() {
  const p = P.resumen; minisBuilt = false;
  p.innerHTML = `<div class="phead"><span class="eyebrow">${tr('step', { n: STEPS.length })} · Aixovall Residencial</span><h2>${esc(gt('g_t', { home: HOME.name }))}</h2><p class="muted">${esc(gt('g_p'))}</p></div>
    <div class="gate">
      <div class="gate-total"><span>${esc(gt('g_total'))} · ${esc(HOME.name)}</span><b>${eur(grandIgi())}</b></div>
      <div class="gate-preview" aria-hidden="true"><div class="minis" id="gateMinis"></div>
        <div class="gate-blur"><div class="row nothumb"><span class="d"><span>${esc(HOME.name)}</span><small>${homeLine()}</small></span><span class="p">${eur(HOME.price)}</span></div><div class="row nothumb"><span class="d"><span>${tr('b_cfg')}</span></span><span class="p">+${eur(totalCfg())}</span></div><div class="row nothumb"><span class="d"><span>${tr('b_annex')}</span></span><span class="p">${eur(totalAnx())}</span></div></div>
      </div>
      <form class="lead gate-form" id="gate" novalidate>
        <h3>${esc(gt('g_form'))}</h3><p>${esc(gt('g_hint'))}</p>
        <div class="lgrid"><label class="fld full">${tr('l_name')}<input type="text" name="name" maxlength="120" autocomplete="name" required></label>
        <label class="fld">${esc(gt('l_wa'))}<input type="tel" name="phone" maxlength="40" autocomplete="tel" inputmode="tel" required></label>
        <label class="fld">${esc(gt('l_email_opt'))}<input type="email" name="email" maxlength="160" autocomplete="email"></label></div>
        <label class="hp" aria-hidden="true">Web<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
        <label class="consent"><input type="checkbox" name="consent" required><span>${tr('l_consent')}</span></label>
        <div class="actions"><button type="submit" class="axc-btn axc-primary" id="gateGo">${WA_ICON}${esc(gt('g_cta'))}</button><span class="msg" id="gateMsg" role="status"></span></div>
        <p class="gate-fine">${esc(gt('g_fine'))}</p>
      </form>
    </div>`;
  for (const st of STEPS) if (st.stage) { const f = document.createElement('figure'), d = document.createElement('div'); f.appendChild(d); $('gateMinis').appendChild(f); makeStage(st.stage, d); }
  const f = $('gate'), msg = $('gateMsg');
  f.name.value = S.comprador || ''; f.phone.value = S.tel || ''; f.email.value = S.email || '';
  f.addEventListener('input', () => { S.comprador = f.name.value; S.tel = f.phone.value; S.email = f.email.value; persist(); });
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (f.website.value) return;
    const name = f.name.value.trim(), tel = f.phone.value.trim(), email = f.email.value.trim();
    if (!name || !telOk(tel) || (email && !emailOk(email)) || !f.consent.checked) {
      msg.textContent = gt('g_invalid');
      const bad = !name ? f.name : !telOk(tel) ? f.phone : (email && !emailOk(email)) ? f.email : f.consent; bad.focus(); return;
    }
    $('gateGo').disabled = true;
    unlockDossier({ n: name, t: tel, e: email, ok: true, when: Date.now() });
  });
}
function unlockDossier(lead) {
  S.lead = lead; S.comprador = lead.n; S.tel = lead.t; S.email = lead.e; persist();
  if (window.AXTrack) window.AXTrack('Lead', { source: 'configurador_dossier', content_name: HOME.name, content_ids: [HOME.id], value: Math.round(grandIgi()), currency: 'EUR' });
  renderSummary(); showFin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  runDossier(false);
}

/* ---------- Dossier: generar, pujar, avisar ---------- */
const DOS = { blob: null, url: '', busy: false, done: false };
const fontCache = {};
const loadScript = src => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = () => ok(); s.onerror = () => ko(new Error(src)); document.head.appendChild(s); });
async function loadFont(file) {
  if (fontCache[file]) return fontCache[file];
  const r = await fetch(A.fontsUrl + file, { mode: 'cors' }); if (!r.ok) throw new Error(file);
  const u8 = new Uint8Array(await r.arrayBuffer()); let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return (fontCache[file] = btoa(bin));
}
const imgInfo = async (rel, w) => { try { const i = await loadImg(asset(rel)); const cv = document.createElement('canvas'); const s = Math.min(1, w / i.width); cv.width = Math.round(i.width * s); cv.height = Math.round(i.height * s); cv.getContext('2d').drawImage(i, 0, 0, cv.width, cv.height); return { data: cv.toDataURL('image/jpeg', 0.86), w: cv.width, h: cv.height, fmt: 'JPEG' }; } catch (e) { return null; } };
async function composeInfo(def, w) { const data = await compose(def, w); return { data, w, h: Math.round(w * def.h / def.w), fmt: 'JPEG' }; }
async function dossierCtx() {
  const lead = S.lead || {};
  const [inter400, inter500, inter600, gelasio400, gelasio400i, gelasio500] = await Promise.all(['Inter-Regular.ttf', 'Inter-Medium.ttf', 'Inter-SemiBold.ttf', 'Gelasio-Regular.ttf', 'Gelasio-Italic.ttf', 'Gelasio-Medium.ttf'].map(f => loadFont(f).catch(() => '')));
  const defs = STEPS.filter(s => s.stage);
  const stages = []; for (const s of defs) { try { stages.push(Object.assign(await composeInfo(s.stage, s === defs[0] ? 1100 : 800), { cap: s.cap })); } catch (e) {} }
  const sw = {}; const ids = KEYS.map(k => op(k)).filter(o => !isNone(o)).map(o => o.id);
  for (const id of ids) { if (!sw[id]) { try { sw[id] = await thumbData(id); } catch (e) {} } }
  const rooms = ROOMS.map(([name, ks]) => ({ name, items: ks.map(k => { const g = grp(k), o = op(k), a = amount(k); return { id: o.id, name: optName(o), brand: o.brand || '', group: tr('g_' + gk(k)), amount: a, included: !a, sample: !!g.sample, perM2: !!g.perM2, extra: g.perM2 && o.price ? tr('m2_times', { p: fmt(o.price), m2: fmt(TYPE.floorM2) }) : '' }; }) }));
  const annex = ['PA', 'TR'].filter(k => !isNone(op(k))).map(k => ({ id: op(k).id, name: k === 'PA' ? anxName(op(k)) : optName(op(k)), plaza: k === 'PA' ? S.plaza : undefined, group: tr('g_' + k), amount: amount(k) }));
  const PP = payPlan();
  const code = dossierCode();
  return {
    jsPDF: window.jspdf.jsPDF, qrcode: window.qrcode, lang: A.lang, locale: A.locale, igiPct: IGI * 100,
    fonts: { inter400, inter500, inter600, gelasio400, gelasio400i, gelasio500 },
    home: { id: HOME.id, name: HOME.name, floor: tr('floor_' + HOME.floor), typeLabel, util: TYPE.util, built: HOME.area, bedrooms: HOME.bedrooms, baths: TYPE.baths, ext: HOME.extM2 ? tr('ext_' + HOME.ext) : '', extM2: HOME.extM2, price: HOME.price, status: tr('st_' + HOME.status) },
    client: { name: lead.n || '', phone: lead.t || '', email: lead.e || '' }, code, date: new Date(), link: shareUrl(),
    images: { cover: await imgInfo(GAL[0].src, 1600) || await imgInfo(D + 'vi_3d.webp', 1400), plan: await imgInfo(planSrc.src, 1400), d3: await imgInfo(D + 'vi_3d.webp', 1400), stages, sw, modPlan: S.mods && modPng && modPng.src ? { data: modPng.src, w: modPng.w, h: modPng.h, fmt: 'JPEG' } : null },
    rooms, annex, mods: S.mods && S.mods.items && S.mods.items.length ? { items: S.mods.items.map(i => ({ label: i.label, qty: modQty(i), amount: i.amount })), total: S.mods.total, kitchen: !!S.mods.kitchen } : null, proposal: S.propuesta.trim(),
    totals: { home: HOME.price, anx: totalAnx(), cfg: totalCfg() },
    pay: { base: PP.base, start: tr('cal_start'), end: tr('cal_end'), rows: PP.rows.map(r => ({ n: r.n, label: tr(r.k), sub: tr(r.s), amount: r.amount })) },
    contact: { wa: API_WA, waText: gt('d_wa_msg', { name: (lead.n || '').split(' ')[0], home: HOME.name, code, total: eur(grandIgi()) }), phone: A.phone, email: A.email || 'apimi@andorra.ad', web: 'apimi.com/aixovall-residencial' },
    company: { promotor: 'Construccions Estapé', arch: 'Magnesi Arquitectes', agency: 'API Immobiliària' }
  };
}
async function buildDossier() {
  await Promise.all([loadJsPdf(), window.qrcode ? Promise.resolve() : loadScript(A.vendor + 'qrcode.min.js'), window.AXDossier ? Promise.resolve() : loadScript(A.dossierJs)]);
  return window.AXDossier.build(await dossierCtx());
}
const dossierFile = () => `Aixovall_${HOME.id}_${dossierCode()}.pdf`;
async function uploadDossier(blob) {
  if (!A.dossier) return null;
  const fd = new FormData(); fd.append('file', blob, dossierFile()); fd.append('home', HOME.id); fd.append('code', dossierCode());
  const r = await fetch(A.dossier, { method: 'POST', body: fd }); if (!r.ok) throw new Error(String(r.status));
  const j = await r.json(); if (!j || !j.ok) throw new Error('upload'); return j;
}
function waReady() { const wa = $('dosWa'); if (!wa) return; const on = !DOS.busy && (leadSent || ADMIN_PDF); wa.classList.toggle('is-off', !on); wa.setAttribute('aria-disabled', String(!on)); }
let leadSent = false;
async function sendLead(extra) {
  if (!A.lead || leadSent || ADMIN_PDF) return true;
  const lead = S.lead || {}; let utm = null; try { utm = JSON.parse(localStorage.getItem('ax_utm') || 'null'); } catch (e) {}
  const config = {}; for (const k of KEYS) config[k] = S[k];
  const body = Object.assign({ name: lead.n, email: lead.e || '', phone: lead.t, wa: waPhone(lead.t), consent: true, website: '', home: HOME.id, lang: A.lang, intent: 'dossier', note: '', summary: summaryText(), link: shareUrl(), code: dossierCode(), config, mods: S.mods && S.mods.total || 0, proposal: S.propuesta.trim(),
    totals: { home: HOME.price, anx: totalAnx(), cfg: totalCfg(), base: grandBase(), igi: igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()), total: grandIgi() }, utm, pdf_url: '' }, extra || {});
  const r = await fetch(A.lead, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
  leadSent = true; return true;
}
function dosMsg(k, v) { const m = $('dosMsg'); if (m) m.textContent = gt(k, Object.assign({ name: (S.lead && S.lead.n || '').split(' ')[0], tel: S.lead && S.lead.t || '' }, v || {})); }
async function runDossier(download) {
  if (DOS.busy) return; DOS.busy = true; dosMsg('d_wait');
  const b = $('pdf'); if (b) b.disabled = true;
  try {
    const doc = await buildDossier();
    DOS.blob = doc.output('blob'); DOS.done = true;
    if (download) doc.save(dossierFile());
    if (ADMIN_PDF) { dosMsg('d_nowa'); }
    else {
      let up = null; try { up = await uploadDossier(DOS.blob); } catch (e) {}
      DOS.url = up && up.url || '';
      try { await sendLead({ pdf_url: DOS.url }); } catch (e) {}
      dosMsg(DOS.url ? 'd_sent' : 'd_nowa');
    }
  } catch (e) {
    try { await sendLead({}); } catch (err) {}
    dosMsg('d_err');
  }
  if (b) b.disabled = false; DOS.busy = false; waReady();
  if (!ADMIN_PDF) setTimeout(reserveNotice, 1500);
}
function wireDossier() {
  const b = $('pdf'); if (!b) return;
  b.addEventListener('click', () => {
    if (DOS.blob) { const u = URL.createObjectURL(DOS.blob); const a = document.createElement('a'); a.href = u; a.download = dossierFile(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
    else runDossier(true);
  });
  const wa = $('dosWa');
  if (wa) {
    wa.href = waLink(API_WA, gt('d_get_msg', { name: (S.lead && S.lead.n || '').split(' ')[0], home: HOME.name, code: dossierCode() }));
    /* v3.4: si el client ens escriu, la conversa s'obre i Make li envia el PDF sense plantilla.
       Mentre es prepara el PDF el botó espera: si sortís cap a WhatsApp, el mòbil aturaria la pujada. */
    wa.addEventListener('click', e => { if (DOS.busy) { e.preventDefault(); dosMsg('d_get_wait'); } });
    waReady();
  }
}

/* ============ v3.1: avisos de demo, reserva per WhatsApp, finançament i crèdit ============ */
const API_WA = '376822345', BB_WA = '376325999';
const waLink = (num, text) => 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
const WA_ICON = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5z"/><path d="M9 9.5c.3 2 2.2 4.2 4.6 4.8l1-1.1 1.8.8"/></svg>';
const XL = ({
  ca: {
    i_eye: 'CONFIGURADOR · FASE DEMO', i_t: 'Imagina el teu pis', i_em: 'al teu gust.',
    i_p: 'Aquest configurador és una demo: et mostra que el teu pis és configurable i et permet començar a imaginar-lo.',
    i_1: 'Opcions provisionals', i_1s: 'Els acabats i els extres encara poden canviar.',
    i_2: 'Preus orientatius', i_2s: 'No són el preu final.',
    i_3: 'Configuració oficial amb la façana', i_3s: 'Quan es faci la façana, el promotor aprovarà les opcions i els preus definitius.',
    i_ok: 'Entesos, comencem',
    r_eye: 'LA TEVA CONFIGURACIÓ ÉS PROVISIONAL', r_t: 'Que no et quedis sense el', r_p: 'Amb la configuració oficial poden canviar els tipus de rajola, els mobles i els preus. El que no pot esperar és el pis: reserva’l ara i la configuració la tanquem més endavant.',
    r_ok: 'Vull reservar el {home}', r_later: 'Veure el resum', r_wa: 'Hola, API! Vull reservar el pis {home} d’Aixovall Residencial.',
    fin_t: 'Necessites finançar el teu pis?', fin_p: 'T’expliquem com es fa i t’ajudem en la gestió per trobar el banc i el finançament adequats per a tu.',
    fin_wa: 'Hola, API! Estic pensant a comprar un pis d’Aixovall Residencial però tinc dubtes sobre el finançament.',
    by_wa: 'Per WhatsApp', by_mail: 'Per correu', close: 'Tancar',
    cr: 'Sistema de configuració de pisos dissenyat per', bb_wa: 'Hola! M’ha encantat el disseny de la pàgina web i el configurador d’Aixovall Residencial. Voldria contractar un servei similar.'
  },
  es: {
    i_eye: 'CONFIGURADOR · FASE DEMO', i_t: 'Imagina tu piso', i_em: 'a tu gusto.',
    i_p: 'Este configurador es una demo: te muestra que tu piso es configurable y te permite empezar a imaginarlo.',
    i_1: 'Opciones provisionales', i_1s: 'Los acabados y los extras aún pueden cambiar.',
    i_2: 'Precios orientativos', i_2s: 'No son el precio final.',
    i_3: 'Configuración oficial con la fachada', i_3s: 'Cuando se haga la fachada, el promotor aprobará las opciones y los precios definitivos.',
    i_ok: 'Entendido, empecemos',
    r_eye: 'TU CONFIGURACIÓN ES PROVISIONAL', r_t: 'Que no te quedes sin el', r_p: 'Con la configuración oficial pueden cambiar los tipos de baldosa, los muebles y los precios. Lo que no puede esperar es el piso: resérvalo ahora y la configuración la cerramos más adelante.',
    r_ok: 'Quiero reservar el {home}', r_later: 'Ver el resumen', r_wa: '¡Hola, API! Quiero reservar el piso {home} de Aixovall Residencial.',
    fin_t: '¿Necesitas financiar tu piso?', fin_p: 'Te explicamos cómo se hace y te ayudamos en la gestión para encontrar el banco y la financiación adecuados para ti.',
    fin_wa: '¡Hola, API! Estoy pensando en comprar un piso de Aixovall Residencial pero tengo dudas sobre la financiación.',
    by_wa: 'Por WhatsApp', by_mail: 'Por correo', close: 'Cerrar',
    cr: 'Sistema de configuración de pisos diseñado por', bb_wa: '¡Hola! Me ha encantado el diseño de la página web y el configurador de Aixovall Residencial. Quisiera contratar un servicio similar.'
  },
  fr: {
    i_eye: 'CONFIGURATEUR · VERSION DÉMO', i_t: 'Imaginez votre appartement', i_em: 'à votre goût.',
    i_p: 'Ce configurateur est une démo : il vous montre que votre appartement est personnalisable et vous permet de commencer à l’imaginer.',
    i_1: 'Options provisoires', i_1s: 'Les finitions et les options peuvent encore changer.',
    i_2: 'Prix indicatifs', i_2s: 'Ce ne sont pas les prix définitifs.',
    i_3: 'Configuration officielle avec la façade', i_3s: 'À l’étape de la façade, le promoteur validera les options et les prix définitifs.',
    i_ok: 'Compris, commençons',
    r_eye: 'VOTRE CONFIGURATION EST PROVISOIRE', r_t: 'Ne laissez pas filer le', r_p: 'Avec la configuration officielle, les carrelages, les meubles et les prix peuvent changer. Ce qui ne peut pas attendre, c’est l’appartement : réservez-le maintenant, la configuration sera finalisée plus tard.',
    r_ok: 'Je veux réserver le {home}', r_later: 'Voir le récapitulatif', r_wa: 'Bonjour API ! Je souhaite réserver l’appartement {home} d’Aixovall Residencial.',
    fin_t: 'Besoin de financer votre appartement ?', fin_p: 'Nous vous expliquons comment faire et vous accompagnons pour trouver la banque et le financement adaptés.',
    fin_wa: 'Bonjour API ! J’envisage d’acheter un appartement à Aixovall Residencial mais j’ai des questions sur le financement.',
    by_wa: 'Par WhatsApp', by_mail: 'Par e-mail', close: 'Fermer',
    cr: 'Système de configuration d’appartements conçu par', bb_wa: 'Bonjour ! J’ai adoré le design du site et le configurateur d’Aixovall Residencial. Je souhaiterais un service similaire.'
  },
  en: {
    i_eye: 'CONFIGURATOR · DEMO', i_t: 'Picture your home', i_em: 'your way.',
    i_p: 'This configurator is a demo: it shows you that your home can be customised and lets you start picturing it.',
    i_1: 'Provisional options', i_1s: 'Finishes and extras may still change.',
    i_2: 'Indicative prices', i_2s: 'They are not the final prices.',
    i_3: 'Official configuration at the façade stage', i_3s: 'Once the façade is built, the developer will approve the final options and prices.',
    i_ok: 'Got it, let’s start',
    r_eye: 'YOUR CONFIGURATION IS PROVISIONAL', r_t: 'Don’t miss out on', r_p: 'With the official configuration, tile types, furniture and prices may change. The home can’t wait: reserve it now and we’ll finalise the configuration later.',
    r_ok: 'I want to reserve {home}', r_later: 'See the summary', r_wa: 'Hi API! I’d like to reserve flat {home} at Aixovall Residencial.',
    fin_t: 'Need to finance your home?', fin_p: 'We explain how it works and help you find the right bank and financing for you.',
    fin_wa: 'Hi API! I’m thinking of buying a flat at Aixovall Residencial but I have questions about financing.',
    by_wa: 'Via WhatsApp', by_mail: 'By email', close: 'Close',
    cr: 'Flat configuration system designed by', bb_wa: 'Hi! I loved the design of the Aixovall Residencial website and configurator. I’d like to hire a similar service.'
  }
})[A.lang] || null;
function axModal(html, onReady) {
  const d = document.createElement('dialog'); d.className = 'axc-pop'; d.innerHTML = html;
  document.body.append(d);
  const close = () => d.close();
  d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('close', () => d.remove());
  if (onReady) onReady(d);
  d.showModal();
  const f = d.querySelector('[data-focus]'); if (f) f.focus();
}
const ICO = {
  edit: '<path d="M4 20h16"/><path d="M6 16l9-9 3 3-9 9H6v-3z"/>',
  euro: '<path d="M17 7.5A6 6 0 1 0 17 16.5"/><path d="M5 10.5h8M5 13.5h8"/>',
  build: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
  key: '<path d="M4 11l8-6 8 6v9H4v-9z"/><path d="M9.5 14.5l2 2 3.5-3.5"/>'
};
const ico = k => `<span class="pi"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg></span>`;
const X_SVG = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function introNotice() {
  if (!XL) return;
  try { if (sessionStorage.getItem('axc-intro')) return; sessionStorage.setItem('axc-intro', '1'); } catch (e) {}
  axModal(`<div class="pop-in" role="document" aria-labelledby="popT1">
    <button type="button" class="pop-x" data-close aria-label="${esc(XL.close)}">${X_SVG}</button>
    <span class="eyebrow">${esc(XL.i_eye)}</span>
    <h2 id="popT1">${esc(XL.i_t)} <em>${esc(XL.i_em)}</em></h2>
    <p class="pop-lead">${esc(XL.i_p)}</p>
    <ul class="pop-pts">
      <li>${ico('edit')}<span><b>${esc(XL.i_1)}</b>${esc(XL.i_1s)}</span></li>
      <li>${ico('euro')}<span><b>${esc(XL.i_2)}</b>${esc(XL.i_2s)}</span></li>
      <li>${ico('build')}<span><b>${esc(XL.i_3)}</b>${esc(XL.i_3s)}</span></li>
    </ul>
    <button type="button" class="axc-btn axc-primary pop-main" data-close data-focus>${esc(XL.i_ok)}</button>
  </div>`);
}
let reserveShown = false;
function reserveNotice() {
  if (!XL || reserveShown || HOME.status !== 'available') return; reserveShown = true;
  const h = esc(HOME.name);
  axModal(`<div class="pop-in" role="document" aria-labelledby="popT2">
    <button type="button" class="pop-x" data-close aria-label="${esc(XL.close)}">${X_SVG}</button>
    <span class="eyebrow">${esc(XL.r_eye)}</span>
    <h2 id="popT2">${esc(XL.r_t)} <em>${h}.</em></h2>
    <div class="pop-key">${ico('key')}<p>${esc(XL.r_p)}</p></div>
    <div class="pop-acts">
      <a class="axc-btn axc-wa pop-main" href="${esc(waLink(API_WA, XL.r_wa.split('{home}').join(HOME.name)))}" target="_blank" rel="noopener" data-focus>${WA_ICON}${esc(XL.r_ok.split('{home}').join(HOME.name))}</a>
      <button type="button" class="axc-btn" data-close>${esc(XL.r_later)}</button>
    </div>
  </div>`);
}
if (XL) {
  const cr = document.createElement('p'); cr.className = 'axc-credit';
  cr.innerHTML = `${esc(XL.cr)} <a href="${esc(waLink(BB_WA, XL.bb_wa))}" target="_blank" rel="noopener">BoomBizz Solucions Comercials</a>`;
  const nav = document.querySelector('.axc-nav'); if (nav) nav.before(cr);
}

/* ============ Necessites finançament? Calendari de pagaments ============ */
/* v2.8.0: reserva de 10.000 € dins del 10 % d'arres · 10 % fonaments · 20 % sostre · 20 % tancament · 40 % notari */
const RESERVA = 10000;
const PAY_PCT = { arr: 10, fon: 10, sos: 20, fac: 20, not: 40 };
const pctTxt = p => p + ' %';
function payPlan() {
  const base = HOME.price + totalAnx(), part = p => Math.round(base * p / 100);
  const arr = part(PAY_PCT.arr), fon = part(PAY_PCT.fon), sos = part(PAY_PCT.sos), fac = part(PAY_PCT.fac);
  return { base, rows: [
    { k: 'pay_res', n: '10.000 €', amount: RESERVA, s: 'pay_res_s' },
    { k: 'pay_arr', n: pctTxt(PAY_PCT.arr), amount: arr - RESERVA, s: 'pay_arr_s' },
    { k: 'pay_fon', n: pctTxt(PAY_PCT.fon), amount: fon, s: 'pay_cert' },
    { k: 'pay_sos', n: pctTxt(PAY_PCT.sos), amount: sos, s: 'pay_cert' },
    { k: 'pay_fac', n: pctTxt(PAY_PCT.fac), amount: fac, s: 'pay_cert' },
    { k: 'pay_not', n: pctTxt(PAY_PCT.not), amount: base - arr - fon - sos - fac, s: 'pay_not_s' }] };
}
let finShown = false;
function showFin(scroll) {
  const el = $('fin'); if (!el) return;
  if (!finShown) {
    const P = payPlan();
    el.innerHTML = `<div class="fin-head"><span class="eyebrow">${tr('fin_eyebrow')}</span><h3 id="finTitle">${tr('fin_title')}</h3><p>${tr('fin_text')}</p></div>
      <ol class="pay">${P.rows.map(r => `<li><span class="n">${r.n}</span><span class="d"><b>${tr(r.k)}</b><small>${tr(r.s)}</small></span><span class="p">${eur(r.amount)}</span></li>`).join('')}</ol>
      <p class="note">${tr('pay_note', { base: eur(P.base), r: igiPct() })}</p>
      <div class="cal"><div><small>${tr('cal_start_l')}</small><b>${tr('cal_start')}</b></div><div><small>${tr('cal_end_l')}</small><b>${tr('cal_end')}</b></div></div>
      ${A.fin ? `<div class="bank"><h3>${esc(XL.fin_t)}</h3><p>${esc(XL.fin_p)}</p><div class="bank-acts"><a class="axc-btn axc-wa" href="${esc(waLink(API_WA, XL.fin_wa))}" target="_blank" rel="noopener">${WA_ICON}${esc(XL.by_wa)}</a><a class="axc-btn axc-ghost" href="${esc(A.finUrl)}">${esc(XL.by_mail)}</a></div></div>` : ''}`;
    finShown = true;
  }
  el.hidden = false;
  if (scroll) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============ PDF (la llibreria només es carrega en demanar-lo) ============ */
let jsPdfP = null;
const loadJsPdf = () => jsPdfP || (jsPdfP = new Promise((ok, ko) => { if (window.jspdf) return ok(); const s = document.createElement('script'); s.src = A.jspdf; s.onload = () => ok(); s.onerror = () => { jsPdfP = null; ko(new Error('jspdf')); }; document.head.appendChild(s); }));
/* v2.5.1: a apimi.com les imatges vénen d'un altre domini; sense CORS el navegador bloqueja el canvas i el PDF fallava. */
const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = ko; i.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'cors=1'; });
async function compose(def, w) {
  const imgs = (await Promise.all(layerFiles(def).map(f => loadImg(asset(f)).catch(() => null)))).filter(Boolean);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = Math.round(w * def.h / def.w);
  const g = cv.getContext('2d'); imgs.forEach(i => g.drawImage(i, 0, 0, cv.width, cv.height));
  return cv.toDataURL('image/jpeg', 0.86);
}
async function thumbData(id) {
  const i = await loadImg(sw(id)), cv = document.createElement('canvas'); cv.width = 168; cv.height = 108;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 168, 108);
  const s = Math.max(168 / i.width, 108 / i.height), w = i.width * s, h = i.height * s; g.drawImage(i, (168 - w) / 2, (108 - h) / 2, w, h);
  return cv.toDataURL('image/jpeg', 0.85);
}
/* Les fonts estàndard del PDF són Latin-1: es substitueixen els signes que no hi caben. */
const ascii = s => String(s).replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/€/g, 'EUR').replace(/²/g, '2').replace(/[–—]/g, '-').replace(/[  ]/g, ' ').replace(/×/g, 'x').replace(/→|↗|↓/g, '');
async function buildPdf() {
  const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), L = 16, R = 194;
  const money = n => ascii(eur(n)), pl = n => n ? '+' + money(n) : ascii(tr('included'));
  const _text = doc.text.bind(doc); doc.text = (t, ...a) => _text(Array.isArray(t) ? t.map(ascii) : ascii(t), ...a);
  const split = (t, w) => doc.splitTextToSize(ascii(t), w);
  const igi = ' (' + tr('igi') + ')';
  const head = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(20); doc.text(`Aixovall Residencial · ${HOME.name} · ${typeLabel}`, L, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(95); doc.text(tr('pdf_sub'), L, 23.5);
    doc.text(new Date().toLocaleDateString(A.locale), R, 23.5, { align: 'right' }); doc.setDrawColor(30); doc.setLineWidth(0.5); doc.line(L, 26.5, R, 26.5);
  };
  const title = (t, sub, y) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20); doc.text(t, L, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110); doc.text(sub, R, y, { align: 'right' }); doc.setDrawColor(30); doc.setLineWidth(0.3); doc.line(L, y + 1.8, R, y + 1.8); return y + 7; };
  const tot = (t, n, y) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(20); doc.text(t + ' (' + tr('no_igi') + ')', L, y + 1); doc.text(money(n), R, y + 1, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(70); doc.text(`${tr('igi_line', { r: igiPct() })}: ${money(igiOf(n))}   ·   ${tr('with_igi')}: `, R - 30, y + 5.6, { align: 'right' }); doc.setFont('helvetica', 'bold'); doc.setTextColor(20); doc.text(money(n + igiOf(n)), R, y + 5.6, { align: 'right' }); return y + 13; };
  const line = (a, b, price, y, x = L) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(20); doc.text(a, x, y); doc.text(price, R, y, { align: 'right' }); if (b) { doc.setFontSize(8); doc.setTextColor(110); doc.text(b, x, y + 3.6); } doc.setDrawColor(210); doc.setLineWidth(0.15); doc.line(L, y + 5.2, R, y + 5.2); return y + 8.6; };
  head();
  doc.setFontSize(9.5); doc.setTextColor(20); doc.text(tr('buyer') + ': ' + (S.comprador.trim() || '______________________________') + (S.email.trim() ? '  ·  ' + S.email.trim() : '') + (S.tel.trim() ? '  ·  ' + S.tel.trim() : ''), L, 33);
  let y = title(tr('b_home'), tr('b_home_s'), 41);
  y = line(HOME.name, homeLine(), money(HOME.price), y);
  y = tot(tr('total_home'), HOME.price, y);
  y = title(tr('b_annex'), tr('b_annex_s'), y + 2);
  const anx = ['PA', 'TR'].filter(k => !isNone(op(k)));
  if (!anx.length) y = line(tr('none_annex'), '', '-', y);
  for (const k of anx) y = line(`${op(k).id} · ${k === 'PA' ? anxName(op(k)) : optName(op(k))}`, tr('g_' + k) + (op(k).brand ? ' · ' + op(k).brand : ''), money(amount(k)), y);
  y = tot(tr('total_annex'), totalAnx(), y);
  y = title(tr('b_cfg'), tr('b_cfg_s'), y + 2);
  for (const [name, ks] of ROOMS) for (const k of ks) {
    const g = grp(k), o = op(k);
    if (!isNone(o)) { try { doc.addImage(await thumbData(o.id), 'JPEG', L, y - 3.6, 10.5, 6.75); } catch (e) {} }
    const extra = g.perM2 && o.price ? ' · ' + tr('m2_times', { p: fmt(o.price), m2: fmt(TYPE.floorM2) }) : '';
    y = line(`${o.id} · ${optName(o)}${g.sample && o.price ? ' *' : ''}`, `${name} · ${tr('g_' + gk(k))}${o.brand ? ' · ' + o.brand : ''}${extra}`, pl(amount(k)), y, L + 13.5);
  }
  if (S.mods && S.mods.items.length) y = line(tr('mod_room') + ' *', tr('mod_annex'), '+' + money(S.mods.total), y);
  if (y > 262) { doc.addPage(); head(); y = 36; }
  y = tot(tr('total_cfg'), totalCfg(), y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110); doc.text(tr('sample_foot') + (S.mods && S.mods.items.length ? ' ' + tr('mod_foot') : ''), L, y - 2);

  doc.addPage(); head();
  const defs = STEPS.filter(s => s.stage);
  const cap = (t, x, yy) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110); doc.text(t, x, yy); };
  const su = defs[0], co = defs[1], baths = defs.slice(2);
  const suH = 92 * su.stage.h / su.stage.w;
  doc.addImage(await compose(su.stage, 1100), 'JPEG', L, 33, 92, suH); cap(su.cap + ' · ' + S.SV, L, 33 + suH + 4);
  doc.addImage(await compose(co.stage, 1000), 'JPEG', L + 96, 33, 82, 61.5); cap(co.cap, L + 96, 98.5);
  let x = L;
  for (const b of baths) { doc.addImage(await compose(b.stage, 700), 'JPEG', x, 108, 54, 72); cap(b.cap, x, 184); x += 58; }
  const tx = x + 2, tw = R - tx; doc.setFontSize(8.5); doc.setTextColor(60);
  doc.text(split(tr('legal_img'), tw), tx, 112);
  y = 192;
  {
    y = title(tr('grand'), tr('grand_s'), y);
    const gl = (a, n, b) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(b ? 11 : 9.5); doc.setTextColor(20); doc.text(a, L, y); doc.text(money(n), R, y, { align: 'right' }); y += b ? 7 : 5.2; };
    gl(tr('total_home'), HOME.price); gl(tr('total_annex'), totalAnx()); gl(tr('total_cfg'), totalCfg());
    doc.setDrawColor(200); doc.line(L, y - 3.4, R, y - 3.4);
    gl(tr('grand_base'), grandBase()); gl(tr('igi_line', { r: igiPct() }), igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()));
    doc.setDrawColor(30); doc.line(L, y - 3.4, R, y - 3.4); y += 1.5;
    gl(tr('grand_total'), grandBase() + igiOf(HOME.price) + igiOf(totalAnx()) + igiOf(totalCfg()), true); y += 2;
  }
  if (S.propuesta.trim()) {
    y = title(tr('b_mod'), tr('b_mod_s'), y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(20);
    let ls = split(S.propuesta.trim(), R - L); if (ls.length > 3) { ls = ls.slice(0, 3); ls[2] += ' (...)'; }
    doc.text(ls, L, y); y += ls.length * 4.4 + 2; doc.setFontSize(8.5); doc.setTextColor(60);
    const w = split(tr('legal_mod'), R - L); doc.text(w, L, y); y += w.length * 3.9 + 4;
  }
  doc.setFontSize(8.5); doc.setTextColor(60); doc.text(split(tr('legal_amt', { r: igiPct() }), R - L), L, y + 2);
  doc.setTextColor(20); doc.setFontSize(9.5); doc.setDrawColor(30); doc.setLineWidth(0.3);
  doc.line(L, 272, L + 72, 272); doc.text(tr('sign_buyer'), L, 277); doc.line(R - 72, 272, R, 272); doc.text(tr('sign_dev'), R - 72, 277);
  {
    doc.addPage(); head();
    let py = title(tr('fin_pdf_t'), tr('fin_pdf_s'), 36);
    const P = payPlan();
    P.rows.forEach(r => { py = line(`${r.n} · ${tr(r.k)}`, tr(r.s), money(r.amount), py); });
    py = tot(tr('pay_total'), P.base, py);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60);
    const nt = split(tr('pay_note', { base: ascii(eur(P.base)), r: igiPct() }), R - L); doc.text(nt, L, py); py += nt.length * 3.9 + 6;
    doc.setFontSize(9.5); doc.setTextColor(20); doc.setFont('helvetica', 'bold'); doc.text(tr('cal_start_l') + ': ', L, py); doc.setFont('helvetica', 'normal'); doc.text(tr('cal_start'), L + 48, py); py += 6;
    doc.setFont('helvetica', 'bold'); doc.text(tr('cal_end_l') + ': ', L, py); doc.setFont('helvetica', 'normal'); doc.text(tr('cal_end'), L + 48, py); py += 6;
    doc.setFontSize(8); doc.setTextColor(110); doc.text(split(tr('cal_note'), R - L), L, py);
  }
  if (S.mods && modPng && modPng.src) {
    doc.addPage(); head();
    let ty = title(tr('mod_plan'), tr('b_mod_s'), 36);
    const mw = R - L, mh = Math.min(170, mw * modPng.h / modPng.w), iw = mh * modPng.w / modPng.h;
    doc.addImage(modPng.src, 'JPEG', L + (mw - iw) / 2, ty, iw, mh); ty += mh + 8;
    if (S.mods.items.length) {
      for (const i of S.mods.items) ty = line(i.label, modQty(i), '+' + money(i.amount), ty);
      ty = tot(tr('mod_total'), S.mods.total, ty);
    }
    doc.setFontSize(8.5); doc.setTextColor(60);
    const lg = split(tr('legal_mod') + (S.mods.kitchen ? ' ' + tr('mod_kwarn') : ''), R - L); doc.text(lg, L, ty);
    doc.setTextColor(20); doc.setFontSize(9.5); doc.line(L, 272, L + 72, 272); doc.text(tr('sign_buyer'), L, 277); doc.line(R - 72, 272, R, 272); doc.text(tr('sign_dev'), R - 72, 277);
  }
  return doc;
}

/* ============ Modificació de la distribució (editor de plànol) ============ */
function modQty(i) { return i.unit === 'm' ? fmt(i.qty) + ' m × ' + eur(i.price) : i.qty + ' × ' + eur(i.price); }
function modRows() {
  if (!S.mods || !S.mods.items.length) return '';
  return `<div class="room">${tr('mod_room')}</div>` + S.mods.items.map(i => `<div class="row nothumb"><span class="d"><span>${esc(i.label)} *</span><small>${modQty(i)}</small></span><span class="p">+${eur(i.amount)}</span></div>`).join('');
}
function modBlock() {
  if (!S.mods || !S.mods.changed) return '';
  return `<div class="block" style="gap:10px"><div class="bhead"><h3>${tr('mod_plan')}</h3><span>${tr('b_mod_s')}</span></div>${modPng && modPng.src ? `<img src="${modPng.src}" alt="${esc(tr('mod_plan'))}" style="border:1px solid var(--line);background:#fff;max-height:520px;object-fit:contain">` : ''}<p class="warn">${tr('legal_mod')}${S.mods.kitchen ? ' ' + tr('mod_kwarn') : ''}</p></div>`;
}
function renderModSum() {
  const el = $('modSum'), b = $('modOpen'); if (!el) return;
  b.textContent = S.mods && S.mods.changed ? tr('mod_edit') : tr('mod_open');
  if (!S.mods || !S.mods.changed) { el.innerHTML = ''; return; }
  el.innerHTML = (S.mods.items.length ? `<div class="modlist">${S.mods.items.map(i => `<div><span>${esc(i.label)} <small class="muted">${modQty(i)}</small></span><b>+${eur(i.amount)}</b></div>`).join('')}<div class="modtot"><span>${tr('mod_total')}</span><b>+${eur(S.mods.total)}</b></div></div>` : `<p class="muted">${tr('mod_furn_only')}</p>`) +
    (S.mods.kitchen ? `<p class="warn">${tr('mod_kwarn')}</p>` : '') + `<button type="button" class="axc-link" id="modClear">${tr('mod_clear')}</button>`;
  $('modClear').addEventListener('click', () => { S.mods = null; modPng = null; try { sessionStorage.removeItem(STORE + '-png'); localStorage.removeItem('axr-planta-' + HOME.id); } catch (e) {} unmarkPlanModified(); persist(); renderModSum(); refresh(); });
}
let modDlg = null;
function openPlanEditor() {
  if (!modDlg) {
    modDlg = document.createElement('div'); modDlg.className = 'axc-modal'; modDlg.setAttribute('role', 'dialog'); modDlg.setAttribute('aria-modal', 'true'); modDlg.setAttribute('aria-label', tr('mod_title'));
    modDlg.innerHTML = `<div class="axc-modal-bar"><b>${tr('mod_title')} · ${esc(HOME.name)}</b><span class="muted">${tr('mod_hint')}</span><button type="button" class="axc-btn" id="modClose">${tr('mod_close')}</button></div><iframe title="${esc(tr('mod_title'))}" src="${A.planta}?v=${A.pv||0}&t=${KIND}&home=${encodeURIComponent(HOME.id)}&lang=${A.lang}"></iframe>`;
    document.body.appendChild(modDlg);
    modDlg._ishw = ishowiBadge(modDlg.querySelector('.axc-modal-bar'));
    $('modClose').addEventListener('click', closePlanEditor);
  }
  modDlg.hidden = false; document.documentElement.style.overflow = 'hidden'; $('modClose').focus();
  if (modDlg._ishw) ishowiIntro(modDlg._ishw, null, 'ishw-intro-ed');
}
function closePlanEditor() { if (modDlg) modDlg.hidden = true; document.documentElement.style.overflow = ''; const b = $('modOpen'); if (b) b.focus(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modDlg && !modDlg.hidden) closePlanEditor(); });
window.addEventListener('message', e => {
  const d = e.data;
  if (!d || d.type !== 'axr-plan' || d.home !== HOME.id) return;
  if (e.origin !== location.origin && location.origin !== 'null') return;
  const items = Array.isArray(d.items) ? d.items.filter(i => i && typeof i.amount === 'number').map(i => ({ k: String(i.k), label: String(i.label).slice(0, 80), qty: +i.qty || 0, unit: i.unit === 'm' ? 'm' : 'u', price: +i.price || 0, amount: Math.max(0, Math.round(+i.amount || 0)) })) : [];
  S.mods = { items, total: items.reduce((t, i) => t + i.amount, 0), kitchen: !!d.kitchen, changed: !!d.changed || items.length > 0 };
  modPng = d.png && typeof d.png.src === 'string' && d.png.src.startsWith('data:image/') ? d.png : null;
  try { sessionStorage.setItem(STORE + '-png', JSON.stringify(modPng)); } catch (err) {}
  if (S.mods.changed) markPlanModified();
  persist(); renderModSum(); show(); closePlanEditor();
});

/* ============ v3.3: pas 1 més clar i plànol modificat ============ */
const NX = ({
  ca: { need: 'Marca aquesta casella per continuar amb els acabats.', auto: 'Plànol modificat pel client, pendent d’aprovació.' },
  es: { need: 'Marca esta casilla para continuar con los acabados.', auto: 'Plano modificado por el cliente, pendiente de aprobación.' },
  fr: { need: 'Cochez cette case pour passer aux finitions.', auto: 'Plan modifié par le client, en attente de validation.' },
  en: { need: 'Tick this box to continue to the finishes.', auto: 'Plan modified by the client, pending approval.' }
})[A.lang] || { need: '', auto: '' };
function needValidate() {
  const box = $('vcheck'), msg = $('needMsg'); if (!box) return;
  msg.textContent = NX.need; msg.hidden = false;
  box.classList.remove('need'); void box.offsetWidth; box.classList.add('need');
  box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  const cb = $('validado'); if (cb) setTimeout(() => cb.focus({ preventScroll: true }), 350);
}
function markPlanModified() {
  S.validado = true; const cb = $('validado'); if (cb) cb.checked = true;
  const cur = (S.propuesta || '').trim();
  if (cur.indexOf(NX.auto) === -1) S.propuesta = cur ? NX.auto + '\n' + cur : NX.auto;
  const ta = $('propuesta'); if (ta) ta.value = S.propuesta;
  const m = $('needMsg'); if (m) m.hidden = true;
  const b = $('vcheck'); if (b) b.classList.remove('need');
}
function unmarkPlanModified() {
  const lines = (S.propuesta || '').split('\n').filter(l => l.trim() !== NX.auto);
  S.propuesta = lines.join('\n').trim();
  const ta = $('propuesta'); if (ta) ta.value = S.propuesta;
}

/* ============ Navegació ============ */
const grid = $('axc-grid'), prev = $('axc-prev'), next = $('axc-next');
function show() {
  const st = STEPS[S.paso];
  for (const s of STEPS) { V[s.id].hidden = s.id !== st.id; P[s.id].hidden = s.id !== st.id; }
  if (st.stage && !st._built) { makeStage(st.stage, st._el); st._built = true; }
  if (st.id === 'otros' && !st._built) { document.querySelectorAll('#galStage img').forEach(i => { i.src = asset(GAL[+i.dataset.g].src); }); st._built = true; }
  const nx = STEPS[S.paso + 1]; if (nx && nx.stage) (window.requestIdleCallback || setTimeout)(() => preload(nx.stage));
  const wide = st.id === 'resumen'; grid.classList.toggle('wide', wide); viewer.hidden = wide;
  if (wide) renderSummary();
  document.querySelectorAll('#axc-steps button').forEach((b, i) => { if (i === S.paso) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', i < S.paso && S.validado); b.disabled = i > 0 && !S.validado; });
  const cur = document.querySelector('#axc-steps button[aria-current="step"]'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  prev.disabled = S.paso === 0; next.hidden = S.paso === STEPS.length - 1;
  next.disabled = false; next.classList.toggle('is-gated', S.paso === 0 && !S.validado);
  next.firstChild.textContent = (S.paso === STEPS.length - 2 ? tr('see_summary') : tr('next')) + ' ';
  refresh();
}
function refresh() {
  for (const k of KEYS) { const el = $(`opt-${k}-${S[k]}`); if (el) el.checked = true; }
  stages.forEach(f => f());
  pkPaint();
  $('axc-total').textContent = (totalCfg() ? '+' : '') + eur(totalCfg()) + (totalAnx() ? '  ·  ' + tr('annexes') + ' ' + eur(totalAnx()) : '');
  if (STEPS[S.paso].id === 'resumen' && minisBuilt) renderSummary();
}
let resumTracked = false;
function go(i) { if (i > 0 && i < STEPS.length && !S.validado) { if (S.paso !== 0) { S.paso = 0; persist(); show(); } needValidate(); return; } if (i < 0 || i >= STEPS.length) return; S.paso = i; persist(); show(); window.scrollTo({ top: 0 }); if (STEPS[i].id === 'resumen') { if (!resumTracked && window.AXTrack) { resumTracked = true; window.AXTrack('ConfiguradorResum', { home: HOME.name, gate: leadOk() ? 'open' : 'locked', value: Math.round(grandIgi()), currency: 'EUR' }); } if (leadOk()) reserveNotice(); } }
$('axc-steps').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) go(+b.dataset.i); });
prev.addEventListener('click', () => go(S.paso - 1));
next.addEventListener('click', () => go(S.paso + 1));
panel.addEventListener('change', e => {
  const t = e.target;
  if (KEYS.includes(t.name)) S[t.name] = t.value; else return;
  if (t.name === 'PA') pkOnChange();
  DOS.blob = null; DOS.done = false; /* v3.4: el PDF es torna a generar amb la nova tria */
  persist(); refresh();
});
$('validado').checked = S.validado; $('propuesta').value = S.propuesta;
$('validado').addEventListener('change', e => { S.validado = e.target.checked; if (S.validado) { const m = $('needMsg'); if (m) m.hidden = true; $('vcheck').classList.remove('need'); } persist(); show(); });
$('propuesta').addEventListener('input', e => { S.propuesta = e.target.value; persist(); });
$('modOpen').addEventListener('click', openPlanEditor); renderModSum();
const tab = d3 => { const i3 = $('img3d'); if (d3 && !i3.src) i3.src = i3.dataset.src; i3.classList.toggle('on', d3); $('imgPlano').classList.toggle('on', !d3); $('tab3d').setAttribute('aria-pressed', d3); $('tabPlano').setAttribute('aria-pressed', !d3); $('planStage').style.setProperty('--ar', d3 ? '1.3333' : planSrc.ar); };
$('tabPlano').addEventListener('click', () => tab(false)); $('tab3d').addEventListener('click', () => tab(true));
$('galSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('galStage').style.setProperty('--ar', GAL[+b.dataset.g].ar); document.querySelectorAll('#galStage img').forEach(i => i.classList.toggle('on', i.dataset.g === b.dataset.g)); document.querySelectorAll('#galSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
/* v3.3.1: el configurador s'obre sempre a dalt. Alguns visors (i Safari) tornen a aplicar el desplaçament
   de la pàgina anterior després de carregar; ho corregim fins que l'usuari faci scroll ell mateix. */
let userScrolled = false;
const markUser = () => { userScrolled = true; };
['wheel', 'touchmove'].forEach(ev => addEventListener(ev, markUser, { passive: true, once: true }));
addEventListener('keydown', e => { if (/^(Arrow|Page|Home|End| )/.test(e.key) && !e.target.closest('input,textarea,select')) markUser(); });
const toTop = () => { if (!userScrolled && (window.scrollY || document.documentElement.scrollTop)) window.scrollTo(0, 0); };
window.AXToTop = toTop;
show(); window.scrollTo(0, 0);
addEventListener('load', () => { toTop(); [120, 400, 900, 1600].forEach(t => setTimeout(toTop, t)); });
addEventListener('pageshow', toTop);
document.addEventListener('close', () => setTimeout(toTop, 30), true);

/* ============ v3.2: animació d'entrada iShowi + segell «iShowi by BoomBizz» ============ */
const ISHW_MARK = "<svg class=\"ishw-mark\" viewBox=\"0 0 1040 370\" aria-hidden=\"true\" focusable=\"false\"><path class=\"ishw-house\" pathLength=\"1\" d=\"M110,332 L66,332 Q42,332 42,308 L42,156 Q42,140 56,130 L186,38 Q200,28 214,38 L356,138\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"26\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path class=\"ishw-bar ishw-b1\" d=\"M138,318 L138,118 L190,144 L190,318 Q190,328 180,328 L148,328 Q138,328 138,318 Z\" fill=\"#EE7418\" stroke=\"#EE7418\" stroke-width=\"12\" stroke-linejoin=\"round\"/><path class=\"ishw-bar ishw-b2\" d=\"M218,318 L218,152 L270,174 L270,318 Q270,328 260,328 L228,328 Q218,328 218,318 Z\" fill=\"#A8A39D\" stroke=\"#A8A39D\" stroke-width=\"12\" stroke-linejoin=\"round\"/><path class=\"ishw-bar ishw-b3\" d=\"M298,318 L298,192 L350,210 L350,318 Q350,328 340,328 L308,328 Q298,328 298,318 Z\" fill=\"#D8B48A\" stroke=\"#D8B48A\" stroke-width=\"12\" stroke-linejoin=\"round\"/><g class=\"ishw-word\" transform=\"translate(420,322) scale(1.85)\"><path d=\"M20.9 -55.4V0H6.9V-55.4Z M31.9 -20.1H46.9Q47.2 -15.8 50 -13.3Q52.7 -10.8 57.5 -10.8Q62.4 -10.8 65.2 -13.2Q68 -15.5 68 -19.3Q68 -22.4 66.1 -24.4Q64.2 -26.4 61.4 -27.6Q58.5 -28.7 53.5 -30.1Q46.7 -32.1 42.5 -34Q38.2 -36 35.2 -40Q32.1 -43.9 32.1 -50.5Q32.1 -56.7 35.2 -61.3Q38.3 -65.9 43.9 -68.3Q49.5 -70.8 56.7 -70.8Q67.5 -70.8 74.2 -65.5Q81 -60.3 81.7 -50.9H66.3Q66.1 -54.5 63.3 -56.9Q60.4 -59.2 55.7 -59.2Q51.6 -59.2 49.2 -57.1Q46.7 -55 46.7 -51Q46.7 -48.2 48.6 -46.4Q50.4 -44.5 53.2 -43.4Q55.9 -42.2 60.9 -40.7Q67.7 -38.7 72 -36.7Q76.3 -34.7 79.4 -30.7Q82.5 -26.7 82.5 -20.2Q82.5 -14.6 79.6 -9.8Q76.7 -5 71.1 -2.1Q65.5 0.7 57.8 0.7Q50.5 0.7 44.6 -1.8Q38.8 -4.3 35.4 -9Q32 -13.7 31.9 -20.1Z M146.4 -32.5V0H132.4V-30.6Q132.4 -37.2 129.1 -40.8Q125.8 -44.3 120.1 -44.3Q114.3 -44.3 111 -40.8Q107.6 -37.2 107.6 -30.6V0H93.6V-74H107.6V-48.5Q110.3 -52.1 114.8 -54.2Q119.3 -56.2 124.8 -56.2Q131.1 -56.2 136 -53.5Q140.9 -50.7 143.7 -45.4Q146.4 -40 146.4 -32.5Z M155.2 -27.7Q155.2 -36.2 159 -42.7Q162.7 -49.2 169.2 -52.8Q175.7 -56.3 183.7 -56.3Q191.7 -56.3 198.2 -52.8Q204.7 -49.2 208.5 -42.7Q212.2 -36.2 212.2 -27.7Q212.2 -19.2 208.4 -12.7Q204.5 -6.2 197.9 -2.6Q191.4 0.9 183.3 0.9Q175.3 0.9 168.9 -2.6Q162.5 -6.2 158.9 -12.7Q155.2 -19.2 155.2 -27.7ZM197.8 -27.7Q197.8 -35.6 193.7 -39.9Q189.5 -44.1 183.5 -44.1Q177.5 -44.1 173.4 -39.9Q169.4 -35.6 169.4 -27.7Q169.4 -19.8 173.4 -15.6Q177.3 -11.3 183.3 -11.3Q187.1 -11.3 190.5 -13.2Q193.8 -15 195.8 -18.7Q197.8 -22.4 197.8 -27.7Z M298.3 -55.4 282.1 0H267L256.9 -38.7L246.8 0H231.6L215.3 -55.4H229.5L239.3 -13.2L249.9 -55.4H264.7L275.1 -13.3L284.9 -55.4Z M318.9 -55.4V0H304.9V-55.4Z\" fill=\"currentColor\"/><path class=\"ishw-dot ishw-d1\" d=\"M5.4 -70.2Q5.4 -73.7 7.9 -76.1Q10.3 -78.4 14 -78.4Q17.7 -78.4 20.1 -76.1Q22.6 -73.7 22.6 -70.2Q22.6 -66.7 20.1 -64.3Q17.7 -62 14 -62Q10.3 -62 7.9 -64.3Q5.4 -66.7 5.4 -70.2Z\" fill=\"#EE7418\"/><path class=\"ishw-dot ishw-d2\" d=\"M303.4 -70.2Q303.4 -73.7 305.9 -76.1Q308.3 -78.4 312 -78.4Q315.7 -78.4 318.1 -76.1Q320.6 -73.7 320.6 -70.2Q320.6 -66.7 318.1 -64.3Q315.7 -62 312 -62Q308.3 -62 305.9 -64.3Q303.4 -66.7 303.4 -70.2Z\" fill=\"#EE7418\"/></g></svg>";
const ISHW_BY = 'by';
const ISHW_LBL = ({ ca: 'iShowi, de BoomBizz. Visita boombizzandorra.com', es: 'iShowi, de BoomBizz. Visita boombizzandorra.com', fr: 'iShowi, par BoomBizz. Visitez boombizzandorra.com', en: 'iShowi by BoomBizz. Visit boombizzandorra.com' })[A.lang] || 'iShowi by BoomBizz';
function ishowiBadge(host) {
  if (!host) return null;
  const a = document.createElement('a');
  a.className = 'ishw-badge'; a.href = 'https://boombizzandorra.com/'; a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', ISHW_LBL);
  a.innerHTML = ISHW_MARK + '<span class="ishw-by">' + ISHW_BY + ' <b>BoomBizz</b></span>';
  host.append(a);
  return a;
}
function ishowiIntro(badge, done, key) {
  const finish = () => { if (badge) badge.classList.remove('ishw-wait'); if (done) done(); };
  let seen = false;
  try { seen = !!sessionStorage.getItem(key || 'ishw-intro'); sessionStorage.setItem(key || 'ishw-intro', '1'); } catch (e) {}
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!badge || seen || reduce || !document.body.animate) { finish(); return; }
  badge.classList.add('ishw-wait');
  const ov = document.createElement('div');
  ov.className = 'ishw-intro'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="ishw-stage">' + ISHW_MARK + '<span class="ishw-by">' + ISHW_BY + ' <b>BoomBizz</b></span></div>';
  document.body.append(ov);
  const stage = ov.querySelector('.ishw-stage');
  let ended = false, timer;
  const end = () => {
    if (ended) return; ended = true; clearTimeout(timer);
    removeEventListener('keydown', end); ov.removeEventListener('pointerdown', end);
    ov.remove(); finish();
  };
  const fly = () => {
    const from = stage.getBoundingClientRect(), to = badge.getBoundingClientRect();
    const s = to.width / from.width;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2), dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    ov.animate([{ backgroundColor: getComputedStyle(ov).backgroundColor }, { backgroundColor: 'rgba(250,249,245,0)' }], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    const anim = stage.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }], { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    anim.onfinish = end;
  };
  ov.addEventListener('pointerdown', end); addEventListener('keydown', end);
  requestAnimationFrame(() => ov.classList.add('ishw-go'));
  timer = setTimeout(fly, 1750);
}

const ishwTop = ishowiBadge(document.querySelector('.axc-top'));
ishowiIntro(ishwTop, () => { if (ADMIN_PDF) { leadSent = true; setTimeout(() => runDossier(true), 300); } else if (STEPS[S.paso].id === 'resumen') { if (leadOk()) reserveNotice(); } else introNotice(); });
})();


/* ===== v3.3 · selector de pis ===== */
/* Aixovall Residencial · v3.2 · selector de pis dins del configurador
   - Desplegable amb tots els pisos (agrupats per planta) i vista de l'edifici per plantes.
   - En canviar de pis s'obre el configurador d'aquell pis (preu, plànols i superfícies propis)
     i es conserven els acabats ja triats.
   - Amb #triar a l'enllaç, el selector s'obre en carregar la pàgina. */
(() => {
'use strict';
const A = window.AXC, H = window.AXH;
const root = document.getElementById('axc');
if (!A || !H || !root || root.dataset.picker) return;
root.dataset.picker = '1';
const lang = A.lang || 'ca';
const X = {
  ca: { eye: 'TRIA EL TEU PIS', title: 'Quin pis vols <em>configurar?</em>', lead: 'Tria la planta i el pis. El preu, el plànol i les superfícies del configurador canvien segons el pis; els acabats que ja hagis triat es mantenen.',
    sel: 'Habitatge', floors: 'Plantes', open: 'Canviar de pis', current: 'Seleccionat', cont: 'Continua amb aquest pis', go: 'Configura aquest pis', soon: 'Configurador en preparació', close: 'Tancar',
    beds: n => n + (n === 1 ? ' dormitori' : ' dormitoris'), short: { 0: 'PB', 1: '1', 2: '2', 3: '3', 4: 'Àtic' }, igi: '+ IGI', homes: n => n + ' habitatges' },
  es: { eye: 'ELIGE TU PISO', title: '¿Qué piso quieres <em>configurar?</em>', lead: 'Elige la planta y el piso. El precio, el plano y las superficies del configurador cambian según el piso; los acabados que ya hayas elegido se mantienen.',
    sel: 'Vivienda', floors: 'Plantas', open: 'Cambiar de piso', current: 'Seleccionado', cont: 'Continúa con este piso', go: 'Configura este piso', soon: 'Configurador en preparación', close: 'Cerrar',
    beds: n => n + (n === 1 ? ' dormitorio' : ' dormitorios'), short: { 0: 'PB', 1: '1', 2: '2', 3: '3', 4: 'Ático' }, igi: '+ IGI', homes: n => n + ' viviendas' },
  fr: { eye: 'CHOISISSEZ VOTRE APPARTEMENT', title: 'Quel appartement voulez-vous <em>configurer ?</em>', lead: 'Choisissez l’étage et l’appartement. Le prix, le plan et les surfaces du configurateur s’adaptent à l’appartement ; les finitions déjà choisies sont conservées.',
    sel: 'Logement', floors: 'Étages', open: 'Changer d’appartement', current: 'Sélectionné', cont: 'Continuer avec cet appartement', go: 'Configurer cet appartement', soon: 'Configurateur en préparation', close: 'Fermer',
    beds: n => n + (n === 1 ? ' chambre' : ' chambres'), short: { 0: 'RDC', 1: '1', 2: '2', 3: '3', 4: 'Attique' }, igi: '+ IGI', homes: n => n + ' logements' },
  en: { eye: 'CHOOSE YOUR FLAT', title: 'Which flat would you like to <em>configure?</em>', lead: 'Choose the floor and the flat. The configurator’s price, plan and floor areas change with the flat; the finishes you have already picked are kept.',
    sel: 'Home', floors: 'Floors', open: 'Change flat', current: 'Selected', cont: 'Continue with this flat', go: 'Configure this flat', soon: 'Configurator coming soon', close: 'Close',
    beds: n => n + (n === 1 ? ' bedroom' : ' bedrooms'), short: { 0: 'GF', 1: '1', 2: '2', 3: '3', 4: 'Attic' }, igi: '+ IGI', homes: n => n + ' homes' }
}[lang] || null;
if (!X) return;
const T = H.t;
const eur = new Intl.NumberFormat(A.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat(A.locale, { maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CUR = A.home.id;
const FLOORS = [4, 3, 2, 1, 0];
const extTxt = h => (T['ext_' + h.ext] || '') + (h.extM2 ? ' · ' + num.format(h.extM2) + ' m²' : '');

/* ---- Conserva els acabats en canviar de pis ---- */
function go(home) {
  if (!home || !home.cfg) return;
  if (home.id === CUR) { dlg.close(); return; }
  try {
    const src = JSON.parse(localStorage.getItem('axr-cfg-v1-' + CUR) || 'null');
    if (src && typeof src === 'object') {
      const key = 'axr-cfg-v1-' + home.id;
      const dst = JSON.parse(localStorage.getItem(key) || 'null') || {};
      for (const k in src) if (!['validado', 'paso', 'mods', 'propuesta'].includes(k)) dst[k] = src[k];
      dst.validado = false; dst.paso = 0; dst.mods = null;
      localStorage.setItem(key, JSON.stringify(dst));
    }
  } catch (e) {}
  if (window.AXTrack) window.AXTrack('ConfiguradorCanviPis', { from: A.home.name, to: home.name });
  location.href = home.cfg;
}

/* ---- Estils ---- */
const st = document.createElement('style');
st.textContent = `
.axc-pick-btn{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid var(--line);padding:6px 10px;min-height:40px;font-size:12px;color:var(--ink);text-align:left;-webkit-appearance:none;appearance:none;border-radius:0}
.axc-pick-btn:hover{background:var(--sand)}
.axc-pick-btn svg{flex:none;transition:transform .2s}
.axc-pick{border:0;padding:0;background:transparent;width:min(1080px,calc(100vw - 24px));max-width:none;max-height:calc(100svh - 24px);color:var(--ink)}
.axc-pick::backdrop{background:rgba(30,28,24,.6);backdrop-filter:blur(3px)}
.pk-in{position:relative;background:var(--paper);padding:34px 36px 30px;display:grid;gap:22px;box-shadow:0 24px 64px rgba(0,0,0,.3);max-height:calc(100svh - 24px);overflow:auto}
.pk-head{display:grid;gap:8px;padding-right:44px}
.pk-head h2{font:400 clamp(26px,3.4vw,36px)/1.1 Georgia,serif;letter-spacing:-.02em}
.pk-head h2 em{font-style:italic;color:var(--accent)}
.pk-head p{font-size:14px;color:var(--muted);max-width:66ch}
.pk-sel{display:grid;gap:6px;font-size:12px;color:var(--muted);max-width:520px}
.pk-sel select{width:100%;min-height:48px;padding:10px 12px;border:1px solid var(--ink);background:#fff;color:var(--ink);font-size:15px;border-radius:0}
.pk-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:30px;align-items:start}
.pk-bld{position:relative;padding-right:58px}
.pk-bld img{width:100%;height:auto;filter:drop-shadow(0 18px 16px #29312e1f)}
.pk-floors{position:absolute;right:0;top:9%;height:66%;display:flex;flex-direction:column;justify-content:space-between;gap:4px}
.pk-floors button{width:50px;height:44px;border-radius:22px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:12px;font-weight:600;-webkit-appearance:none;appearance:none;transition:background .15s,transform .15s}
.pk-floors button:hover{transform:scale(1.05)}
.pk-floors button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 0 0 4px #a56b3826}
.pk-list{display:grid;gap:12px;align-content:start;min-width:0}
.pk-list h3{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
.pk-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;align-items:center;background:#fff;border:1px solid var(--line);padding:16px 18px}
.pk-card.is-cur{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink);background:var(--sand)}
.pk-card b{font-size:18px;font-weight:600}
.pk-card .pk-meta{grid-column:1;font-size:13px;color:var(--muted)}
.pk-card .pk-price{grid-column:2;grid-row:1;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;font-size:16px;white-space:nowrap}
.pk-card .pk-price small{font-weight:400;color:var(--muted);font-size:11px}
.pk-card .pk-act{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:6px}
.pk-card .axc-btn{min-height:42px;padding:9px 16px}
.pk-cur{font-size:12px;font-weight:600;color:var(--ink);margin-left:auto}
.pk-card.is-link{cursor:pointer}.pk-card.is-link:hover{border-color:var(--muted)}
.pk-soon{font-size:12px;color:var(--muted)}
@media(max-width:900px){.pk-in{padding:26px 18px 22px;gap:18px}.pk-body{grid-template-columns:1fr;gap:18px}.pk-bld{max-width:420px;width:100%;margin-inline:auto}}
@media(max-width:600px){.axc-brand{display:none}.axc-home span{white-space:nowrap}.axc-pick-btn .pk-lbl{display:none}.pk-floors button{width:44px;height:40px;font-size:11px}}`;
document.head.appendChild(st);

/* ---- Diàleg ---- */
const dlg = document.createElement('dialog');
dlg.className = 'axc-pick'; dlg.setAttribute('aria-labelledby', 'pk-title');
const byFloor = f => H.homes.filter(h => h.floor === f);
const opt = h => `<option value="${esc(h.id)}"${h.id === CUR ? ' selected' : ''}${h.cfg ? '' : ' disabled'}>${esc(h.name)} · T${h.type} · ${esc(X.beds(h.bedrooms))}${h.price != null ? ' · ' + esc(eur.format(h.price)) + ' ' + X.igi : ''}${h.status !== 'available' ? ' · ' + esc(T['st_' + h.status] || '') : ''}${h.cfg || h.status === 'agreed' ? '' : ' · ' + esc(X.soon)}</option>`;
dlg.innerHTML = `<div class="pk-in">
  <button type="button" class="pop-x" data-close aria-label="${esc(X.close)}"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="pk-head"><span class="eyebrow">${esc(X.eye)}</span><h2 id="pk-title">${X.title}</h2><p>${esc(X.lead)}</p></div>
  <label class="pk-sel" for="pk-select">${esc(X.sel)}<select id="pk-select">${FLOORS.slice().reverse().map(f => `<optgroup label="${esc(T['floor_' + f + '_t'] || '')}">${byFloor(f).map(opt).join('')}</optgroup>`).join('')}</select></label>
  <div class="pk-body">
    <div class="pk-bld"><img src="${esc(A.assets.plugin)}img/building.webp" alt="${esc(T.building_alt || '')}" width="839" height="675" decoding="async">
      <div class="pk-floors" role="group" aria-label="${esc(X.floors)}">${FLOORS.map(f => `<button type="button" data-floor="${f}" aria-pressed="false" aria-label="${esc(T['floor_' + f + '_t'] || '')}">${esc(X.short[f])}</button>`).join('')}</div></div>
    <div class="pk-list" id="pk-list" aria-live="polite"></div>
  </div>
</div>`;
document.body.appendChild(dlg);
const list = dlg.querySelector('#pk-list');
function showFloor(f) {
  dlg.querySelectorAll('[data-floor]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.floor === f)));
  const homes = byFloor(f);
  list.innerHTML = `<h3>${esc(T['floor_' + f + '_t'] || '')} · ${esc(X.homes(homes.length))}</h3>` + homes.map(h => {
    const cur = h.id === CUR;
    const act = cur ? `<span class="pk-cur">${esc(X.current)}</span><button type="button" class="axc-btn axc-primary" data-go="${esc(h.id)}">${esc(X.cont)} →</button>`
      : h.cfg ? `<button type="button" class="axc-btn axc-primary" data-go="${esc(h.id)}">${esc(X.go)} →</button>`
      : h.status === 'agreed' ? '' : `<span class="pk-soon">${esc(X.soon)}</span>`;
    return `<div class="pk-card${cur ? ' is-cur' : ''}${h.cfg ? ' is-link' : ''}" data-home="${esc(h.id)}"><b>${esc(h.name)}</b><span class="pk-price">${h.price != null ? esc(eur.format(h.price)) + ' <small>' + X.igi + '</small>' : '—'}</span>
      <span class="pk-meta">T${h.type} · ${esc(X.beds(h.bedrooms))} · ${esc(num.format(h.area))} m² · ${esc(extTxt(h))}</span>
      <div class="pk-act"><span class="status ${esc(h.status)}">${esc(T['st_' + h.status] || '')}</span>${act}</div></div>`;
  }).join('');
}
dlg.addEventListener('click', e => {
  const f = e.target.closest('[data-floor]'); if (f) { showFloor(+f.dataset.floor); return; }
  const g = e.target.closest('[data-go]'); if (g) { go(H.homes.find(h => h.id === g.dataset.go)); return; }
  const card = e.target.closest('.pk-card[data-home]'); if (card) { go(H.homes.find(h => h.id === card.dataset.home)); return; }
  if (e.target.closest('[data-close]') || e.target === dlg) dlg.close();
});
dlg.querySelector('#pk-select').addEventListener('change', e => {
  const h = H.homes.find(x => x.id === e.target.value);
  if (h) { showFloor(h.floor); go(h); }
});
function openPicker() {
  showFloor(A.home.floor);
  dlg.querySelector('#pk-select').value = CUR;
  if (!dlg.open) dlg.showModal();
}
window.AXPicker = openPicker;
dlg.addEventListener('close', () => { if (window.AXToTop) window.AXToTop(); });

/* ---- Botó a la capçalera (al costat del nom i el preu del pis) ---- */
const head = root.querySelector('.axc-home');
if (head) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'axc-pick-btn'; b.setAttribute('aria-haspopup', 'dialog');
  b.innerHTML = `<span class="pk-lbl">${esc(X.open)}</span><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
  b.setAttribute('aria-label', X.open);
  head.after(b);
  b.addEventListener('click', openPicker);
}
/* L'enllaç «Canviar d'habitatge» del pas 1 obre el selector en lloc de tornar a la llista */
root.addEventListener('click', e => {
  const a = e.target.closest('#axc-panel a');
  if (a && a.getAttribute('href') === A.back) { e.preventDefault(); openPicker(); }
});

/* ---- #triar: s'obre en entrar, quan l'avís inicial del configurador ja s'ha tancat ---- */
if (location.hash === '#triar') {
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  let tries = 0;
  const wait = () => {
    const other = [...document.querySelectorAll('dialog[open]')].some(d => d !== dlg);
    if (!other) { openPicker(); return; }
    if (++tries < 400) setTimeout(wait, 300);
  };
  setTimeout(wait, 400);
}
})();

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
/* v3.4: guardem els UTM de l'anunci per adjuntar-los al lead del configurador */
try {
  const q = new URLSearchParams(location.search);
  if ([...q.keys()].some(k => /^utm_/i.test(k) || k === 'fbclid')) {
    const u = {}; q.forEach((v, k) => { if (/^utm_/i.test(k) || k === 'fbclid') u[k.toLowerCase()] = String(v).slice(0, 120); });
    u.landing = location.pathname; u.when = new Date().toISOString(); store.set('ax_utm', JSON.stringify(u));
  }
} catch (e) {}

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
  const url = waUrl(isCfg && homeName ? fill(T.wa_cfg, { home: homeName }) : T.wa_float_msg);  /* v3.4: al configurador, el missatge diu quin pis està configurant */
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