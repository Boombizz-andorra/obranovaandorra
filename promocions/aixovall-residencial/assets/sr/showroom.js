
(() => {
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return; e.preventDefault(); const h = a.getAttribute('href'); if (h.length > 1) location.hash = h.slice(1); }, true);
'use strict';
/* ================= DADES DE LA PROMOCIÓ (un sol objecte de configuració) ================= */
const IGI = (window.AXS && AXS.igi) || 4.5, PHONE = (window.AXS && AXS.phone) || '376822345';
const HOMES = (window.AXS && AXS.homes) || []; // pisos i estats llegits del Hub (inc/data.php)
const FLOOR = {0:{n:'Planta baixa',s:'PB',img:'img/floor-0.webp'},1:{n:'Primera planta',s:'1',img:'img/floor-1.webp'},2:{n:'Segona planta',s:'2',img:'img/floor-23.webp'},3:{n:'Tercera planta',s:'3',img:'img/floor-23.webp'},4:{n:'Àtic · Quarta planta',s:'Àtic',img:'img/floor-4.webp'}};
const EXT = {none:'',patio:'Pati comunitari',garden:'Jardí',balcony:'Balcó',terrace:'Terrassa'};
const ST = Object.assign({available:'Disponible',agreed:'Aparaulat',reserved:'Reserva tècnica',confirmed:'Reserva confirmada',sold:'Venut'}, (window.AXS && AXS.st) || {});
const stc = s => s === 'available' ? '' : s === 'confirmed' ? 'reserved' : s; // classe visual de cada estat
const pv = (h, v) => h.price == null ? '—' : h.status === 'agreed' && !document.body.classList.contains('ag-on') ? `<span class="pblur" title="${ST.agreed}">${eur(v)}</span>` : eur(v); // preu només si el Hub el deixa veure; aparaulat, difuminat com a la pàgina actual
/* tipologies: banys coneguts, vista 3D disponible i dades del configurador */
const TYPE = {1:{tag:'Loft'},2:{},3:{tag:'Amb safareig',baths:2,d3:'t3'},4:{tag:'Amb suite',baths:2,d3:'t4',floorM2:52.07,util:59.78},5:{baths:2,d3:'t5'},6:{d3:'t7',d3ref:'T7'},7:{baths:1,d3:'t7'},8:{tag:'Amb suite',baths:2,d3:'t4',d3ref:'T4'},9:{d3:'t5',d3ref:'T5'},10:{d3:'t7',d3ref:'T7'}};
const cfgOK = h => !!h.cfg; // configurador actual del plugin
const tourU = h => (window.AXS && AXS.tours && AXS.tours[h.type]) || ''; // tour virtual 360° de la tipologia, si n'hi ha
const tourA = (h, st) => tourU(h) ? `<a class="btn ghost" ${st || ''} href="${tourU(h)}" target="axr-tour" rel="noopener"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="10" ry="4.2"/><path d="M12 2.5c2.6 2.2 4 5.7 4 9.5s-1.4 7.3-4 9.5M12 2.5C9.4 4.7 8 8.2 8 12s1.4 7.3 4 9.5"/></svg>Fer un tour virtual</a>` : '';
/* polígons de cada habitatge sobre el plànol de planta (968×1173) */
const POLY = {
 0:{'PB-3':'205,60 905,60 905,420 712,420 712,490 565,490 565,365 420,365 420,270 205,270','PB-2':'205,272 420,272 420,368 562,368 562,690 205,690','PB-1':'205,692 460,692 460,1010 205,985'},
 1:{'1-3':'197,40 905,40 905,400 725,400 725,330 197,330','1-2':'197,333 560,333 560,610 720,610 720,682 420,682 420,748 330,748 330,1000 197,1000','1-1':'340,752 585,752 585,690 905,690 905,1045 340,985'},
 23:{'3':'380,45 915,45 915,410 735,410 735,335 380,335','2':'205,338 568,338 568,618 728,618 728,690 428,690 428,756 340,756 340,1010 205,990','1':'350,760 592,760 592,696 915,696 915,1058 350,990'},
 4:{'4-3':'385,55 920,55 920,415 742,415 742,345 385,345','4-2':'212,347 572,347 572,625 736,625 736,694 432,694 432,762 356,762 356,985 212,968','4-1':'362,766 600,766 600,702 920,702 920,1062 362,992'}};
/* vistes exteriors + zones de planta sobre la vista 1 (1600×900) */
const VIEWS = [{k:'v1',n:'Carrer'},{k:'v2',n:'Façana'},{k:'v3',n:'Secció'}];
/* contorn de cada planta sobre la vista 1, seguint la perspectiva: línies a la cantonada esquerra (L), l'aresta (C) i la dreta (R) */
const FX = {L:318, C:775, R:1240}, FLN = [[142,104,170],[253,253,255],[365,385,367],[477,522,479],[607,667,615],[787,809,709]];
const BANDS = [4,3,2,1,0].map((f,i) => { const a = FLN[i], b = FLN[i+1]; return {f, pts:`${FX.L},${a[0]} ${FX.C},${a[1]} ${FX.R},${a[2]} ${FX.R},${b[2]} ${FX.C},${b[1]} ${FX.L},${b[0]}`, yr:(a[2]+b[2])/2, yc:(a[1]+b[1]+a[2]+b[2])/4, edge:`M${FX.C} ${a[1]}V${b[1]}`}; });
const GAL = [['cfg/ga_1.webp','Saló'],['cfg/ga_2.webp','Menjador'],['cfg/ga_3.webp','Suite'],['cfg/ga_4.webp','Balcó',1],['img/terrace-t5.webp','Menjador i terrassa'],['img/living-t5.webp','Sala d’estar',1],['img/living-t7.webp','Saló menjador'],['img/room-t5.webp','Habitació individual']];
/* catàleg d'acabats (preus sense IGI) */
const CAT = {
 SV:{t:'Terra de l’habitatge',perM2:1,sw:'SV',ops:[['A','Roble Makro Claro','',0],['B','Everest Oak Naturaleza','',25],['C','Roble Rama oscuro','',35]]},
 FB:{t:'Frontal baix',d:'armaris baixos',sw:'FB',ops:[['A','Gris Arena','',0],['B','Blanco Iceberg','',500],['C','Roble Claro Sinc','',590],['D','Roble Natural','',680]]},
 FA:{t:'Frontal alt',d:'armaris alts',sw:'FB',ops:[['A','Gris Arena','',0],['B','Blanco Iceberg','',500],['C','Roble Claro Sinc','',590],['D','Roble Natural','',680]]},
 EC:{t:'Taulell',d:'Corian Solid Surface',sw:'EC',ops:[['A','Corian Abalone','ZPC001 ABE',0],['B','Corian Ash Concrete','ZPC006 HXE',1000]]},
 IL:{t:'Il·luminació',d:'sota els mobles alts',ops:[['A','Sense LED','',0],['B','Amb LED','IP38 · 12 V',480]]},
 SB:{t:'Terra del bany',sw:'SB',sample:1,ops:[['A','Lambda Rho Blanco','Vives',0],['B','Dome Bone Rectificado','Baldocer',480]]},
 PV:{t:'Paret vertical',sw:'PV',sample:1,ops:[['A','Rho Blanco','Vives',0],['B','Dome Bone Rectificado','Baldocer',650],['C','Eleganza Saggio','Pamesa',890]]},
 PE:{t:'Paret especial',d:'fons de dutxa',sw:'PE',sample:1,ops:[['A','Nimos Rho Blanco','Vives',0],['B','Blind Dome Bone','Baldocer',420]]},
 MB:{t:'Moble de bany',sw:'MB',sample:1,ops:[['A','Ambient Teca','Vidrabany',0],['B','Ambient Olmo','Vidrabany',260]]},
 CR:{t:'Vidres',sw:'CR',ops:[['A','Vidres dobles','',0],['B','Vidres triples','',5500]]},
 PA:{t:'Aparcament',sw:'PA',annex:1,ops:[['0','Sense aparcament','',0],['A','Plaça d’aparcament','',38000],['B','Plaça doble','',68000]]},
 TR:{t:'Traster',sw:'TR',annex:1,ops:[['0','Sense traster','',0],['A','Traster','1,5 m²',10000]]}};
const KEYS = ['SV','FB','FA','EC','IL','B1SB','B1PV','B1PE','B1MB','B2SB','B2PV','B2PE','B2MB','CR','PA','TR'];
const DEF = 'AAAAAAAAAAAAAA00';
const grp = k => CAT[k.length > 2 ? k.slice(2) : k];

/* ================= utilitats ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const nf = new Intl.NumberFormat('ca-AD',{maximumFractionDigits:0}), nf2 = new Intl.NumberFormat('ca-AD',{maximumFractionDigits:2});
const eur = n => nf.format(Math.round(n)) + ' €', m2 = n => nf2.format(n) + ' m²';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ico = (n, c='') => `<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const slug = id => id.toLowerCase(), byId = s => HOMES.find(h => slug(h.id) === s);
const beds = n => n + (n === 1 ? ' dormitori' : ' dormitoris');
const extTxt = h => EXT[h.ext] ? EXT[h.ext] + (h.extM2 ? ' · ' + m2(h.extM2) : '') : '';
const badge = h => `<span class="badge st-${h.status}"><i class="dot"></i>${ST[h.status]}</span>`;
const store = { get(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch(e){ return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };
let toastT; const toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2200); };
const copy = async (t, ok) => { try { await navigator.clipboard.writeText(t); toast(ok); } catch(e){ toast('No s’ha pogut copiar'); } };
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ================= pan & zoom genèric (arrossegar, roda, pessic) ================= */
class PZ {
  constructor(vp, el, w, h, mode){ Object.assign(this,{vp,el,w,h,mode,z:1,x:0,y:0,moved:false}); const P = new Map(); let d0 = 0, z0 = 1;
    vp.addEventListener('pointerdown', e => { P.set(e.pointerId,[e.clientX,e.clientY]); this.moved = false; this.acc = 0; if (P.size === 2){ const [a,b] = [...P.values()]; d0 = Math.hypot(a[0]-b[0],a[1]-b[1]); z0 = this.z; } });
    vp.addEventListener('pointermove', e => { const p = P.get(e.pointerId); if (!p) return; const dx = e.clientX-p[0], dy = e.clientY-p[1]; P.set(e.pointerId,[e.clientX,e.clientY]);
      if (P.size === 1){ this.acc += Math.abs(dx)+Math.abs(dy); if (this.acc > 6){ if (!this.moved){ this.moved = true; vp.classList.add('drag'); try{ vp.setPointerCapture(e.pointerId); }catch(_){} this.onmove && this.onmove(); } this.x += dx; this.y += dy; this.apply(); } }
      else if (P.size === 2){ const [a,b] = [...P.values()]; const d = Math.hypot(a[0]-b[0],a[1]-b[1]); const r = vp.getBoundingClientRect(); this.moved = true; this.zoomTo(z0*d/d0,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top); } });
    const up = e => { P.delete(e.pointerId); vp.classList.remove('drag'); };
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    vp.addEventListener('click', e => { if (this.moved){ e.stopPropagation(); e.preventDefault(); this.moved = false; } }, true);
    vp.addEventListener('wheel', e => { e.preventDefault(); const r = vp.getBoundingClientRect(); this.zoomTo(this.z*(e.deltaY<0?1.12:.89), e.clientX-r.left, e.clientY-r.top); }, {passive:false});
    new ResizeObserver(() => this.fit(true)).observe(vp); this.fit(); }
  size(w, h){ this.w = w; this.h = h; this.el.style.width = w+'px'; this.el.style.height = h+'px'; this.z = 1; this.fit(); }
  fit(keep){ const vw = this.vp.clientWidth, vh = this.vp.clientHeight; if (!vw) return; const pad = this.mode === 'contain' ? this.pad || 0 : 0;
    this.base = this.mode === 'cover' ? Math.max(vw/this.w, vh/this.h) : Math.min((vw-pad*2)/this.w, (vh-(this.padT||pad)-(this.padB||pad))/this.h);
    if (!keep || !this.s){ this.z = 1; const s = this.base; this.x = (vw-this.w*s)/2; this.y = this.mode === 'contain' ? (this.padT||pad)+((vh-(this.padT||pad)-(this.padB||pad))-this.h*s)/2 : (vh-this.h*s)*(this.fy ?? .5); }
    this.apply(); }
  zoomTo(z, cx, cy){ z = Math.min(Math.max(z,1),4); const s0 = this.base*this.z, s1 = this.base*z; cx ??= this.vp.clientWidth/2; cy ??= this.vp.clientHeight/2;
    this.x = cx-(cx-this.x)*s1/s0; this.y = cy-(cy-this.y)*s1/s0; this.z = z; this.apply(); }
  apply(){ const vw = this.vp.clientWidth, vh = this.vp.clientHeight, s = this.s = this.base*this.z, cw = this.w*s, ch = this.h*s;
    if (this.mode === 'contain'){ const mx = vw*.45, my = vh*.5; this.x = Math.min(Math.max(0, vw-cw)+mx, Math.max(Math.min(0, vw-cw)-mx, this.x)); this.y = Math.min(Math.max(0, vh-ch)+my, Math.max(Math.min(0, vh-ch)-my, this.y)); }
    else { this.x = cw <= vw ? (vw-cw)/2 : Math.min(0, Math.max(vw-cw, this.x)); this.y = ch <= vh ? (vh-ch)/2 : Math.min(0, Math.max(vh-ch, this.y)); }
    this.el.style.transform = `translate(${this.x}px,${this.y}px) scale(${s})`; this.el.style.setProperty('--inv', 1/s); }
  get pannable(){ return this.w*this.s > this.vp.clientWidth+4 || this.h*this.s > this.vp.clientHeight+4; }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; const pz = {'s-edifici':ePZ,'s-pis':uPZ}[b.closest('.screen').id]; pz && pz.zoomTo(pz.z*parseFloat(b.dataset.z)); });

/* ================= full inferior / lateral ================= */
const sheet = $('#sheet'); let sheetClose = null;
function openSheet(html, onclose){ $('#sh-body').innerHTML = html; sheet.classList.add('on'); sheet.setAttribute('aria-hidden','false'); sheetClose = onclose || null; $('#sh-body').scrollTop = 0; }
function closeSheet(){ if (!sheet.classList.contains('on')) return; sheet.classList.remove('on'); sheet.setAttribute('aria-hidden','true'); const f = sheetClose; sheetClose = null; f && f(); }
$('#sh-x').onclick = closeSheet;
function unitSheetHTML(h){ const T = TYPE[h.type]; return `<div class="sh-h"><h2>${esc(h.name)}</h2>${badge(h)}</div><p class="sub">Tipologia T${h.type}${T.tag ? ' · ' + T.tag : ''} · ${FLOOR[h.floor].n}</p>
  <dl class="facts"><div><dt>Preu</dt><dd>${pv(h, h.price)} <small style="font:500 11px var(--f);color:var(--mute)">+ IGI</small></dd></div><div><dt>Superfície</dt><dd>${m2(h.area)}</dd></div><div><dt>Dormitoris</dt><dd>${h.beds}</dd></div><div><dt>${EXT[h.ext] ? 'Exterior' : 'Preu/m²'}</dt><dd>${EXT[h.ext] ? extTxt(h) : pv(h, h.price/h.area)}</dd></div></dl>
  <div class="row2"><a class="btn ghost" href="#pis-${slug(h.id)}">${ico('plan')}Veure fitxa</a>${cfgOK(h) ? `<a class="btn wood" href="#cfg-${slug(h.id)}">${ico('brush')}Configurar</a>` : `<span class="btn" style="opacity:.45">Configurador aviat</span>`}</div>${tourU(h) ? `<div class="row2" style="margin-top:8px">${tourA(h, 'style="grid-column:1/-1"')}</div>` : ''}${window.AXA && AXA.sheet ? AXA.sheet(h) : ''}`; }
const PAYS = [['Fonaments','Quan un arquitecte en certifica la fase',.10],['Sostre','Quan un arquitecte en certifica la fase',.20],['Tancament de façana','Quan un arquitecte en certifica la fase',.20],['Notari','A l’escriptura pública',.40]];
function payHTML(base){ return `<ul class="pay"><li><span>Reserva<small>Et guardem el pis un mes</small></span><b>10.000 €</b></li><li><span>Arres<small>10 % menys la reserva</small></span><b>${eur(base*.1-10000)}</b></li>${PAYS.map(([n,t,f]) => `<li><span>${n}<small>${t}</small></span><b>${eur(base*f)}</b></li>`).join('')}</ul><p class="note">Calculat sobre ${eur(base)}, sense IGI. Cal afegir l’IGI (${nf2.format(IGI)} %) a cada pagament.</p>`; }

/* ================= accés ràpid: obra, pagaments, finançament ================= */
const INFO = {
 obra: () => `<div class="sh-h"><h2>Estat de l’obra</h2></div><p class="sub">Llicència del comú concedida · inici previst des. 2026 – gen. 2027</p><div class="prog"><i data-w="28"></i></div><p class="note" style="margin-top:0">2 de 7 fites completades</p>
  <ul class="tl" style="margin-top:14px"><li class="done"><b>Projecte arquitectònic</b><small>Fet</small></li><li class="done"><b>Llicència del comú</b><small>Fet</small></li><li class="next"><b>Inici d’obres</b><small>Des. 2026 – gen. 2027 · pròxim pas</small></li><li><b>Fonaments</b></li><li><b>Teulada</b></li><li><b>Tancament de façana</b></li><li><b>Entrega</b><small>Prevista el 1r trimestre de 2029</small></li></ul><a class="btn ghost" href="#obra">Veure el calendari complet</a>`,
 pagaments: () => `<div class="sh-h"><h2>Reserva i pagaments</h2></div><p class="sub">Pagues el pis a mesura que es construeix.</p><ul class="pay"><li><span>Reserva<small>Et guardem el pis un mes · compta dins de les arres</small></span><b>10.000 €</b></li><li><span>Arres<small>Fins al 10 %, menys la reserva</small></span><b>10 %</b></li><li><span>Fonaments<small>Fase certificada per un arquitecte</small></span><b>10 %</b></li><li><span>Sostre<small>Fase certificada per un arquitecte</small></span><b>20 %</b></li><li><span>Tancament de façana<small>Fase certificada per un arquitecte</small></span><b>20 %</b></li><li><span>Notari<small>A l’escriptura pública</small></span><b>40 %</b></li></ul><p class="note">Cal afegir l’IGI (${nf2.format(IGI)} %) a cada pagament. A la fitxa de cada pis veuràs els imports calculats.</p><a class="btn" style="margin-top:12px" href="#habitatges">Tria un pis i calcula-ho</a>`,
 financ: () => { const B = BANKS[BK].n, h = uHome || HOMES.find(x => x.status === 'available' && x.floor >= 1);
  if (!FIN_BANK) return `<div class="sh-h"><h2>Finançament</h2></div><p class="sub">Necessites finançar el teu pis?</p><p>T’ajudem a trobar el finançament adequat per a tu i t’acompanyem en tot el procés. Ho gestionem des d’API Immobiliària, sense compromís.</p><div class="row2"><a class="btn wood" target="_blank" rel="noopener" href="https://wa.me/${PHONE}?text=${encodeURIComponent('Hola, voldria informació sobre el finançament d’un pis a Aixovall Residencial.')}">${ico('chat')}WhatsApp</a><a class="btn ghost" href="#contacte">Contacte</a></div><p class="note">+376 822345 · carles@apimi.com</p>`;
  return `<div class="sh-h"><h2>Finançament</h2></div><p class="sub">Necessites finançar el teu pis?</p>
  <div class="fin-bk"><img class="bk-logo" src="${BANKS[BK].logo}" alt="${B}"><h3>Pòlissa d’obra nova amb ${B}</h3><p>Finança el pis mentre es construeix: les arres i els fonaments els pagues tu, la pòlissa s’activa al sostre i al notari s’obre la hipoteca.</p>
   <div class="fin-big"><div><b>0 %</b><span>comissió d’obertura</span></div><div><b>0 €</b><span>despeses d’estudi</span></div></div>${mbStrip('ex', `Veure com funciona amb un exemple (${h.name})`)}</div>
  <p style="margin-top:14px">Si prefereixes una altra opció, també t’ajudem a trobar el finançament adequat per a tu. Ho gestionem des d’API Immobiliària, sense compromís.</p><div class="row2"><a class="btn wood" target="_blank" rel="noopener" href="https://wa.me/${PHONE}?text=${encodeURIComponent('Hola, voldria informació sobre el finançament d’un pis a Aixovall Residencial.')}">${ico('chat')}WhatsApp</a><a class="btn ghost" href="#contacte">Contacte</a></div><p class="note">+376 822345 · carles@apimi.com · Condicions de ${B} pendents de validar.</p>`; }};
document.addEventListener('click', e => { const b = e.target.closest('[data-info]'); if (!b) return; openSheet(INFO[b.dataset.info]()); const pr = $('#sh-body .prog i'); pr && requestAnimationFrame(() => setTimeout(() => pr.style.width = pr.dataset.w + '%', 80)); });

/* ================= menú ================= */
const menu = $('#menu'), scrim = $('#scrim');
const setMenu = on => { menu.classList.toggle('on', on); scrim.classList.toggle('on', on); menu.setAttribute('aria-hidden', !on); };
$('#b-menu').onclick = () => setMenu(true); $('#m-x').onclick = scrim.onclick = () => setMenu(false);
$('#m-nav').addEventListener('click', () => setMenu(false));
$('#m-share').onclick = () => copy(location.href, 'Enllaç copiat');
$('#b-full').onclick = async () => { try { document.fullscreenElement ? await document.exitFullscreen() : await document.documentElement.requestFullscreen(); } catch(e){ toast('La pantalla completa no està disponible aquí'); } };
$('#b-back').onclick = () => { const r = route; location.hash = r.s === 'pis' ? 'planta-' + (byId(r.id)?.floor ?? 1) : r.s === 'planta' ? 'edifici' : 'edifici'; };

/* ================= EDIFICI ================= */
let ePZ, eState = {v:0, night:0, mati:0, mig:0}, eBusy = false, eAuto = 0; const blobs = {};
const vfile = (a, b, n) => `video/${a}-${b}${n ? 'n' : ''}.mp4`;
async function prefetch(f){ if (blobs[f] !== undefined || reduce) return; blobs[f] = null; try { const r = await fetch(f); if (r.ok) blobs[f] = URL.createObjectURL(await r.blob()); } catch(e){} }
function warm(){ const k = VIEWS[eState.v].k, n = eState.night; if (k === 'v1'){ ['', 'n', 'm', 'd'].forEach(x => { new Image().src = `view/f1${x}.webp`; }); } else { VIEWS.forEach(o => { if (o.k !== k && o.k !== 'v1') prefetch(vfile(k, o.k, n)); }); prefetch(`video/${k}-${n ? 'day' : 'night'}.mp4`); } VIEWS.forEach(o => { new Image().src = `view/${o.k}${n ? 'n' : ''}.webp`; }); }
/* la vista 1 (carrer) té un render per a cada moment del dia: f1 tarda · f1n nit · f1m matí · f1d migdia */
const eImgSrc = () => eState.v === 0 ? `view/f1${eState.night ? 'n' : eState.mati ? 'm' : eState.mig ? 'd' : ''}.webp` : `view/${VIEWS[eState.v].k}${eState.night ? 'n' : ''}.webp`;
/* fosa suau quan no hi ha vídeo de transició */
function eFade(){ const img = $('#e-img'), next = eImgSrc(); if (reduce || !img.getAttribute('src')){ img.src = next; return; } const old = $('#e-xf'); old && old.remove(); const g = img.cloneNode(); g.id = 'e-xf'; g.removeAttribute('alt'); img.after(g);
  const go = () => { requestAnimationFrame(() => requestAnimationFrame(() => { g.style.opacity = 0; setTimeout(() => g.remove(), 1000); })); }; const pre = new Image(); pre.onload = pre.onerror = () => { img.src = next; go(); }; pre.src = next; }
function playTo(file, done){ const vid = $('#e-vid'), img = $('#e-img'); const nextSrc = eImgSrc();
  const finish = () => { clearTimeout(guard); const pre = new Image(); pre.onload = pre.onerror = () => { img.src = nextSrc; requestAnimationFrame(() => setTimeout(() => { vid.classList.remove('show'); eBusy = false; done && done(); }, 60)); }; pre.src = nextSrc; };
  if (reduce){ img.src = nextSrc; eBusy = false; done && done(); return; }
  eBusy = true; let guard = setTimeout(finish, 3500);
  vid.onended = finish; vid.onerror = finish; vid.onplaying = () => vid.classList.add('show');
  vid.src = blobs[file] || file; vid.currentTime = 0; vid.play().catch(finish); }
function eRender(anim, prev){ const v = VIEWS[eState.v]; $('#e-dots').innerHTML = VIEWS.map((o,i) => `<button class="${i === eState.v ? 'on' : ''}" data-v="${i}">${o.n}</button>`).join('');
  const tod = eTod(); $$('#dn button').forEach(b => { if (b.dataset.n === 'a'){ b.classList.add('auto'); b.classList.toggle('on', !!eAuto); } else b.classList.toggle('on', +b.dataset.n === tod); }); $('#e-pz').classList.toggle('mati', !!eState.mati); $('#e-pz').classList.toggle('v1', v.k === 'v1');
  { const H = v.k === 'v1' ? 1200 : 900; if (ePZ && ePZ.h !== H){ ePZ.fy = H === 1200 ? .3 : .45; ePZ.size(1600, H); } $('#e-ov').setAttribute('viewBox', '0 0 1600 ' + H); if (v.k !== 'v1') $('#e-cars').innerHTML = ''; }
  $('#e-ov').innerHTML = ''; $('#e-labs').innerHTML = '';
  const draw = () => { if (v.k === 'v1'){ $('#e-ov').innerHTML = BANDS.map(b => `<polygon class="zone" data-f="${b.f}" points="${b.pts}"/>`).join('');
      $('#e-labs').innerHTML = BANDS.map(b => { const f = b.f, a = HOMES.filter(h => h.floor === f && h.status === 'available').length; return `<button class="lab" data-f="${f}" style="left:${innerWidth < 760 ? 960 : 1292}px;top:${innerWidth < 760 ? b.yc : b.yr}px"><i class="dot ${a ? '' : 'reserved'}"></i>${FLOOR[f].s === 'PB' ? 'Baixos' : FLOOR[f].s === 'Àtic' ? 'Àtic' : 'Planta ' + FLOOR[f].s}<small>${a} disp.</small></button>`; }).join(''); }
    else if (v.k === 'v3') $('#e-labs').innerHTML = `<button class="lab" data-go="aparcament" style="left:800px;top:740px">${ico('car')}Aparcament · planta −1</button><button class="lab" data-go="planta-1" style="left:800px;top:835px">${ico('layers')}Veure les plantes</button>`;
    else $('#e-labs').innerHTML = `<button class="lab" data-go="habitatges" style="left:800px;top:800px">${ico('grid')}Veure els 15 habitatges</button>`; };
  if (anim && prev){ playTo(prev, draw); } else { if (anim) eFade(); else $('#e-img').src = eImgSrc(); draw(); }
  warm(); }
/* t: 0 tarda · 1 nit · 2 matí · 3 migdia */
const eTod = () => eState.night ? 1 : eState.mati ? 2 : eState.mig ? 3 : 0;
function eGo(v, t, keep){ if (eBusy) return; if (!keep) closeSheet(); const a = VIEWS[eState.v].k, n0 = eState.night, night = t === 1 ? 1 : 0, mati = t === 2 ? 1 : 0, mig = t === 3 ? 1 : 0; let file = null;
  if (v === eState.v && t === eTod()) return;
  /* els vídeos de transició són del render antic: amb la vista 1 pel mig es fa una fosa */
  const novid = a === 'v1' || VIEWS[v].k === 'v1';
  if (!novid){ if (v !== eState.v) file = vfile(a, VIEWS[v].k, night); else if (night !== n0) file = `video/${a}-${night ? 'night' : 'day'}.mp4`; }
  eState = {v, night, mati, mig}; setHash('edifici' + (v ? '-v' + (v+1) : '') + (night ? '-nit' : mati ? '-mati' : mig ? '-migdia' : ''), true); if (file) eRender(true, file); else { eRender(true, null); } }
const eStopAuto = () => { clearInterval(eAuto); eAuto = 0; };
function eStartAuto(){ eStopAuto(); eAuto = setInterval(() => { if (route.s !== 'edifici'){ eStopAuto(); return; } if (eBusy || sheet.classList.contains('on') || document.hidden) return; eGo(eState.v, [1,2,3,0][eTod()], true); }, 9000); }
$('#e-dots').onclick = e => { const b = e.target.closest('[data-v]'); b && eGo(+b.dataset.v, eTod()); };
$('#e-prev').onclick = () => eGo((eState.v+VIEWS.length-1)%VIEWS.length, eTod());
$('#e-next').onclick = () => eGo((eState.v+1)%VIEWS.length, eTod());
$('#dn').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; if (b.dataset.n === 'a'){ eAuto ? eStopAuto() : eStartAuto(); eRender(false); toast(eAuto ? 'Cicle del dia activat' : 'Cicle del dia aturat'); return; } eStopAuto(); eGo(eState.v, +b.dataset.n); eRender(false); };

/* ---------- vehicles i vianants que passen pel carrer (vista 1) ----------
   Coordenades de l'escenari 1600×1200. Cada carril és una línia que segueix la perspectiva del carrer;
   la mida i la velocitat s'escalen amb la distància (el punt de fuga queda cap a y≈705). */
const LANES = { a:[[1215,770],[1100,812],[780,937],[515,1042],[145,1192],[-260,1352]],   /* carril de la vorera: ve cap a la càmera */
                c:[[640,1330],[760,1195],[905,1075],[1010,980],[1090,900],[1150,845]],     /* carril de l'arbre: s'allunya */
                p:[[1085,772],[900,832],[600,928],[200,1072],[-70,1168]] };              /* vorera */
const eDepth = y => Math.max(.07, (y - 705) / 455);
function eRun(el, pts, speed, opt = {}){ let i = 0, x = pts[0][0], y = pts[0][1], t0 = 0, life = 0; const total = pts.slice(1).reduce((n, q, j) => n + Math.hypot(q[0]-pts[j][0], q[1]-pts[j][1]), 0); let done = 0;
  const step = t => { if (!el.isConnected) return; const dt = Math.min(.05, t0 ? (t - t0) / 1000 : 0); t0 = t; life += dt;
    if (route.s !== 'edifici' || eState.v !== 0){ el.remove(); return; }
    let d = speed * eDepth(y) * dt; while (d > 0 && i < pts.length - 1){ const q = pts[i+1], L = Math.hypot(q[0]-x, q[1]-y); if (L <= d){ d -= L; done += L; x = q[0]; y = q[1]; i++; } else { x += (q[0]-x)/L*d; y += (q[1]-y)/L*d; done += d; d = 0; } }
    if (i >= pts.length - 1){ el.remove(); return; }
    const q = pts[i+1], ang = Math.atan2(q[1]-y, q[0]-x) * 180 / Math.PI, s = eDepth(y) * (opt.k || 1), f = done / total;
    el.style.opacity = opt.fade ? Math.min(1, f * 12, (1 - f) * 12) : 1;
    el.style.transform = `translate(${x}px,${y + (opt.bob ? Math.sin(life * 9) * 1.6 * s : 0)}px) scale(${s})`; if (opt.rot) el.style.setProperty('--a', (ang + (opt.back ? 180 : 0)) + 'deg');
    requestAnimationFrame(step); }; requestAnimationFrame(step); }
function eCar(){ setTimeout(eCar, 5200 + Math.random() * 7800); if (reduce || route.s !== 'edifici' || eState.v !== 0 || document.hidden) return;
  const out = Math.random() < .4, el = document.createElement('div'), col = ['#e9e6df','#2a2f33','#8a9aa6','#7a2e26','#c9c2b4','#3d5a6c','#f2f2ef'][Math.floor(Math.random()*7)];
  el.className = 'veh ' + (out ? 'out' : 'in') + (eState.night ? ' nit' : ''); const r = 'transform:rotate(var(--a,0deg))';
  el.innerHTML = `<i class="sh" style="${r};transform-origin:260px 50%"></i><i class="hl" style="${r};transform-origin:-150px 122px"></i><i class="sd" style="${r};transform-origin:330px 50%;background:linear-gradient(90deg,transparent,${col} 42%)"></i><i class="tp" style="${r};transform-origin:330px 50%;background:linear-gradient(90deg,transparent,${col} 42%)"></i><i class="gl" style="${r};transform-origin:150px 50%"></i><i class="tl" style="${r};transform-origin:196px 50px"></i><i class="fl" style="${r};transform-origin:-150px 46px"></i>`;
  $('#e-cars').appendChild(el); eRun(el, out ? LANES.c : LANES.a, 1050 + Math.random() * 260, {rot:1, k:out ? .92 : 1}); }
function ePed(){ setTimeout(ePed, 16000 + Math.random() * 22000); if (reduce || route.s !== 'edifici' || eState.v !== 0 || document.hidden || $('#e-cars .ped')) return;
  const el = document.createElement('div'), col = ['#2c3a4a','#5b4a3c','#3f4d3a','#7b2f2a','#d8d2c6','#27292c'][Math.floor(Math.random()*6)], pts = Math.random() < .5 ? LANES.p : [...LANES.p].reverse();
  el.className = 'ped' + (eState.night ? ' nit' : ''); el.innerHTML = `<i class="ps"></i><i class="pb" style="background:${col}"></i><i class="ph"></i>`;
  $('#e-cars').prepend(el); eRun(el, pts, 96, {bob:1, fade:1}); }
setTimeout(eCar, 2200); setTimeout(ePed, 6000); window.__veh = {eCar, ePed};

/* ---------- moviment de perspectiva: paral·laxi amb mapa de profunditat (WebGL) ---------- */
const PX = {gl:null, tx:0, ty:0, x:0, y:0, dep:{}, ok:false}; window.__px = PX;
(function(){ const cv = $('#e-gl'); let gl; try { gl = cv.getContext('webgl', {premultipliedAlpha:false, antialias:false}); } catch(e){} if (!gl || reduce) return;
  const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; }, pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 v;uniform sampler2D a,d;uniform vec2 o;void main(){float z=texture2D(d,v).r;vec2 u=v+o*(z-.66);z=texture2D(d,u).r;u=v+o*(z-.66);gl_FragColor=texture2D(a,clamp(u,0.,1.));}'));
  gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return; gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW); const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const tex = unit => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D, t); [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]].forEach(([k,v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); return t; };
  const tA = tex(0), tD = tex(1); gl.uniform1i(gl.getUniformLocation(pr, 'a'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'd'), 1); const uo = gl.getUniformLocation(pr, 'o');
  const up = (unit, t, im) => { gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D, t); try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); return true; } catch(e){ return false; } };
  let haveA = false, depFor = '';
  VIEWS.forEach((o,i) => { if (o.k === 'v1') return; /* el render nou de la vista 1 no té mapa de profunditat */ const im = new Image(); im.onload = () => { PX.dep[o.k] = im; sync(); }; im.src = `view/d${i+1}.png`; });
  function sync(){ const img = $('#e-img'), k = VIEWS[eState.v].k; if (!img.complete || !img.naturalWidth || !PX.dep[k]){ cv.classList.remove('on'); return; } haveA = up(0, tA, img); if (depFor !== k && up(1, tD, PX.dep[k])) depFor = k; PX.ok = haveA && depFor === k; cv.classList.toggle('on', PX.ok); }
  $('#e-img').addEventListener('load', sync); PX.sync = sync;
  $('#e-vp').addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); PX.tx = ((e.clientX-r.left)/r.width-.5)*2; PX.ty = ((e.clientY-r.top)/r.height-.5)*2; PX.m = performance.now(); });
  const loop = t => { requestAnimationFrame(loop); if (route.s !== 'edifici' || !PX.ok || document.hidden) return; const idle = !PX.m || t-PX.m > 2500; const gx = idle ? Math.sin(t/2600)*.85 : PX.tx, gy = idle ? Math.sin(t/3700)*.5 : PX.ty;
    PX.x += (gx-PX.x)*.06; PX.y += (gy-PX.y)*.06; gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uo, -PX.x*.02, -PX.y*.011); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }; requestAnimationFrame(loop); })();
function floorSheet(f){ $$('#s-edifici [data-f]').forEach(el => el.classList.toggle('sel', +el.dataset.f === f));
  const hs = HOMES.filter(h => h.floor === f);
  openSheet(`<div class="sh-h"><h2>${FLOOR[f].n}</h2></div><p class="sub">${hs.length} habitatges · ${hs.filter(h => h.status === 'available').length} disponibles</p>
   <ul class="ulist">${hs.map(h => `<li><button data-go="pis-${slug(h.id)}"><i class="dot ${stc(h.status)}"></i><span><b>${h.name}</b><small>${beds(h.beds)} · ${m2(h.area)}${EXT[h.ext] ? ' · ' + EXT[h.ext] : ''}</small></span><span class="price" style="font-size:16px">${pv(h, h.price)}</span></button></li>`).join('')}</ul>
   <a class="btn" style="margin-top:14px" href="#planta-${f}">${ico('layers')}Entrar a la planta</a>`, () => $$('#s-edifici .sel').forEach(el => el.classList.remove('sel'))); }
$('#s-edifici').addEventListener('click', e => { const f = e.target.closest('[data-f]'); if (f) return floorSheet(+f.dataset.f);
  if (e.target.closest('[data-park]')) return openSheet(`<div class="sh-h"><h2>Aparcament</h2></div><p class="sub">Planta −1 · places i trasters</p><img src="img/floor-m1.webp" alt="Plànol de la planta d’aparcament" style="border-radius:16px;background:#eee"><ul class="pay"><li><span>Plaça d’aparcament</span><b>${eur(38000)}</b></li><li><span>Plaça doble</span><b>${eur(68000)}</b></li><li><span>Traster<small>1,5 m²</small></span><b>${eur(10000)}</b></li></ul><p class="note">Imports sense IGI. La plaça concreta i l’import es confirmen amb la tarifa oficial. S’afegeixen al configurador, al pas «Altres».</p>`); });
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g){ closeSheet(); location.hash = g.dataset.go; } });

/* ================= PLANTA ================= */
let pPZ, pFloor = null;
function pRender(f){ pFloor = f; const F = FLOOR[f]; $('#p-img').src = F.img; $('#p-img').alt = 'Plànol de la ' + F.n;
  $('#floors').innerHTML = [4,3,2,1,0].map(n => `<button class="${n === f ? 'on' : ''}" data-go="planta-${n}">${FLOOR[n].s}</button>`).join('');
  const P = f === 2 || f === 3 ? Object.fromEntries(Object.entries(POLY[23]).map(([k,v]) => [f + '-' + k, v])) : POLY[f]; let ov = '', labs = '';
  for (const id in P){ const h = HOMES.find(x => x.id === id); const pts = P[id].split(' ').map(p => p.split(',').map(Number)); const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const cx = (Math.min(...xs)+Math.max(...xs))/2, cy = (Math.min(...ys)+Math.max(...ys))/2;
    ov += `<polygon class="unit ${stc(h.status)}" data-u="${id}" points="${P[id]}"/>`; labs += `<button class="lab" data-u="${id}" style="left:${cx}px;top:${cy}px"><i class="dot ${stc(h.status)}"></i>${h.name}</button>`; }
  $('#p-ov').innerHTML = ov; $('#p-labs').innerHTML = labs; pPZ.fit(); }
$('#s-planta').addEventListener('click', e => { const u = e.target.closest('[data-u]'); if (!u) return; const h = HOMES.find(x => x.id === u.dataset.u);
  $$('#s-planta [data-u]').forEach(el => el.classList.toggle('sel', el.dataset.u === h.id));
  if (innerWidth < 900){ const l = $(`#p-labs [data-u="${h.id}"]`), cx = parseFloat(l.style.left), cy = parseFloat(l.style.top); pPZ.el.style.transition = 'transform .4s'; pPZ.x = innerWidth/2-cx*pPZ.s; pPZ.y = innerHeight*.27-cy*pPZ.s; pPZ.apply(); setTimeout(() => pPZ.el.style.transition = '', 450); }
  openSheet(unitSheetHTML(h), () => { $$('#s-planta .sel').forEach(el => el.classList.remove('sel')); if (innerWidth < 900){ pPZ.el.style.transition = 'transform .4s'; pPZ.fit(); setTimeout(() => pPZ.el.style.transition = '', 450); } }); });

/* ================= HABITATGES ================= */
let favs = new Set(store.get('axr-demo-fav', [])), cmp = new Set();
const thumb = h => TYPE[h.type].d3 ? `img/plan3d-${TYPE[h.type].d3}.webp` : `img/type-${h.type}.webp`;
function hRender(){ const ff = $('#f-floor').value, fb = $('#f-beds').value, so = $('#f-sort').value, av = $('#f-av').checked, fv = $('#f-fav').checked;
  let L = HOMES.filter(h => (ff === '' || h.floor === +ff) && (fb === '' || h.beds === +fb) && (!av || h.status === 'available') && (!fv || favs.has(h.id)));
  L.sort((a,b) => so === 'up' ? (a.price ?? 1e12)-(b.price ?? 1e12) : so === 'down' ? (b.price ?? -1)-(a.price ?? -1) : so === 'area' ? b.area-a.area : 0);
  $('#f-count').textContent = `${L.length} de ${HOMES.length} habitatges`;
  $('#cards').innerHTML = L.length ? L.map(h => { const T = TYPE[h.type]; return `<article class="card"><div class="ph" data-go="pis-${slug(h.id)}"><img src="${thumb(h)}" alt="Vista de l’habitatge ${esc(h.name)}" loading="lazy">${badge(h)}<button class="pill round sm fav ${favs.has(h.id) ? 'on' : ''}" data-fav="${h.id}" aria-label="Preferit" aria-pressed="${favs.has(h.id)}">${ico('heart')}</button></div>
   <div class="in"><h3>${h.name}<small>T${h.type} · ${FLOOR[h.floor].n}</small></h3><div class="price">${pv(h, h.price)} <small>+ IGI</small></div>
   <div class="chips"><span>${beds(h.beds)}</span><span>${m2(h.area)}</span>${T.baths ? `<span>${T.baths} ${T.baths > 1 ? 'banys' : 'bany'}</span>` : ''}${EXT[h.ext] ? `<span>${extTxt(h)}</span>` : ''}${T.tag ? `<span>${T.tag}</span>` : ''}</div>
   <label class="cmp"><input type="checkbox" data-cmp="${h.id}" ${cmp.has(h.id) ? 'checked' : ''}> Comparar</label>
   <div class="acts"><a class="btn ghost" href="#pis-${slug(h.id)}">Veure fitxa</a>${cfgOK(h) ? `<a class="btn wood" href="#cfg-${slug(h.id)}">Configurar</a>` : `<span class="btn" style="opacity:.4">Aviat</span>`}</div>${tourU(h) ? `<div class="acts" style="margin-top:6px">${tourA(h, 'style="flex:1;grid-column:1/-1"')}</div>` : ''}</div></article>`; }).join('') : '<p class="lead">No hi ha habitatges amb aquests filtres. Prova una altra combinació.</p>';
  cmpBar(); }
function cmpBar(){ const b = $('#cmpbar'); b.classList.toggle('on', cmp.size >= 2 && route.s === 'habitatges'); b.querySelector('span').textContent = `Comparar ${cmp.size} habitatges`; }
['f-floor','f-beds','f-sort','f-av','f-fav'].forEach(id => $('#'+id).onchange = hRender);
$('#cards').addEventListener('click', e => { const f = e.target.closest('[data-fav]'); if (f){ e.stopPropagation(); const id = f.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id); store.set('axr-demo-fav', [...favs]); f.classList.toggle('on', favs.has(id)); f.setAttribute('aria-pressed', favs.has(id)); toast(favs.has(id) ? 'Afegit a preferits' : 'Tret de preferits'); } }, true);
$('#cards').addEventListener('change', e => { const c = e.target.closest('[data-cmp]'); if (!c) return; if (c.checked){ if (cmp.size >= 3){ c.checked = false; return toast('Pots comparar fins a 3 habitatges'); } cmp.add(c.dataset.cmp); } else cmp.delete(c.dataset.cmp); cmpBar(); });
$('#cmpbar').onclick = () => { const L = [...cmp].map(id => HOMES.find(h => h.id === id)); const row = (t, f) => `<tr><th>${t}</th>${L.map(h => `<td>${f(h)}</td>`).join('')}</tr>`;
  openSheet(`<div class="sh-h"><h2>Comparador</h2></div><table class="cmpt">${row('', h => `<b>${h.name}</b>`)}${row('Estat', badge)}${row('Preu', h => pv(h, h.price))}${row('Preu/m²', h => pv(h, h.price/h.area))}${row('Superfície', h => m2(h.area))}${row('Dormitoris', h => h.beds)}${row('Exterior', h => extTxt(h) || '—')}${row('Planta', h => FLOOR[h.floor].n)}${row('', h => `<a class="btn ghost" style="min-height:38px;padding:0 8px;font-size:13px" href="#pis-${slug(h.id)}">Fitxa</a>`)}</table><p class="note">Preus sense IGI.</p>`); };

/* ================= PIS ================= */
let uPZ, uHome = null, uTab = 'pla';
function uRender(h, tab){ uHome = h; const T = TYPE[h.type]; const tabs = [['pla','Plànol','plan']]; if (T.d3) tabs.push(['3d','3D','cube']); tabs.push(['galeria','Galeria','img']);
  uTab = tabs.some(t => t[0] === tab) ? tab : 'pla'; if (uTab === 'galeria'){ openLB(0); uTab = 'pla'; }
  $('#pis-tabs').innerHTML = tabs.map(t => `<button class="${t[0] === uTab ? 'on' : ''}" data-t="${t[0]}">${ico(t[2])}<span>${t[1]}</span></button>`).join('');
  const src = uTab === '3d' ? `img/plan3d-${T.d3}.webp` : `img/type-${h.type}.webp`; const img = $('#u-img'); img.style.opacity = 0;
  const pre = new Image(); pre.onload = () => { img.src = src; img.alt = (uTab === '3d' ? 'Vista 3D' : 'Plànol') + ' de l’habitatge ' + h.name; uPZ.size(pre.naturalWidth, pre.naturalHeight); img.style.transition = 'opacity .3s'; img.style.opacity = 1; }; pre.src = src;
  $('#u-name').textContent = h.name; $('#u-st').outerHTML = badge(h).replace('class="badge', 'id="u-st" class="badge'); $('#u-price').innerHTML = pv(h, h.price);
  $('#u-ref').textContent = uTab === '3d' ? (T.d3ref ? `Vista 3D de referència de la tipologia ${T.d3ref}. ` : '') + 'Mobiliari orientatiu, no inclòs.' : 'Plànol orientatiu del dossier comercial.';
  $('#u-cfg').hidden = !cfgOK(h); $('#u-tour').hidden = !tourU(h); window.AXA && AXA.unit && AXA.unit(h); }
$('#pis-tabs').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; if (b.dataset.t === 'galeria') return openLB(0); setHash('pis-' + slug(uHome.id) + (b.dataset.t === '3d' ? '-3d' : ''), true); uRender(uHome, b.dataset.t); };
$('#u-cfg').onclick = () => location.hash = 'cfg-' + slug(uHome.id);
$('#u-tour').onclick = () => { const w = window.open(tourU(uHome), 'axr-tour'); if (!w) location.href = tourU(uHome); };
$('#u-fitxa').onclick = () => { const h = uHome, T = TYPE[h.type]; openSheet(`<div class="sh-h"><h2>${h.name}</h2>${badge(h)}</div><p class="sub">Tipologia T${h.type}${T.tag ? ' · ' + T.tag : ''} · ${FLOOR[h.floor].n}</p>
  <dl class="facts"><div><dt>Preu</dt><dd>${pv(h, h.price)}</dd></div><div><dt>Amb IGI</dt><dd>${pv(h, h.price*(1+IGI/100))}</dd></div><div><dt>Superfície construïda</dt><dd>${m2(h.area)}</dd></div><div><dt>Preu/m²</dt><dd>${pv(h, h.price/h.area)}</dd></div><div><dt>Dormitoris</dt><dd>${h.beds}</dd></div>${T.baths ? `<div><dt>Banys</dt><dd>${T.baths}</dd></div>` : ''}${EXT[h.ext] ? `<div><dt>Exterior</dt><dd>${extTxt(h)}</dd></div>` : ''}</dl>${mbStrip(h.id)}
  <h3 style="margin-top:16px;font-size:18px">Pla de pagaments</h3>${h.price != null ? payHTML(h.price) : `<p class="note">${ST[h.status]}</p>`}
  <div class="row2"><button class="btn ghost" id="fx-share">${ico('share')}Copiar enllaç</button><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${PHONE}?text=${encodeURIComponent('Hola, m’interessa el pis ' + h.name + ' d’Aixovall Residencial.')}">${ico('chat')}WhatsApp</a></div>`);
  $('#fx-share').onclick = () => copy(location.href, 'Enllaç del pis copiat'); };

/* ================= GALERIA + visor ================= */
let lbI = 0;
$('#gal').innerHTML = GAL.map((g,i) => `<button class="${g[2] ? 'w' : ''}" data-i="${i}"><img src="${g[0]}" alt="${g[1]}" loading="lazy"><span class="pill sm">${g[1]}</span></button>`).join('');
$('#lb-strip').innerHTML = GAL.map((g,i) => `<button data-i="${i}" aria-label="${g[1]}"><img src="${g[0]}" alt="" loading="lazy"></button>`).join('');
function openLB(i){ lbI = (i+GAL.length)%GAL.length; $('#lb-img').src = GAL[lbI][0]; $('#lb-img').alt = GAL[lbI][1]; $('#lb-cap').textContent = `${GAL[lbI][1]} · ${lbI+1}/${GAL.length}`; $$('#lb-strip button').forEach((b,j) => b.classList.toggle('on', j === lbI)); $('#lb').classList.add('on'); $('#lb').setAttribute('aria-hidden','false'); }
const closeLB = () => { $('#lb').classList.remove('on'); $('#lb').setAttribute('aria-hidden','true'); };
$('#gal').onclick = $('#lb-strip').onclick = e => { const b = e.target.closest('[data-i]'); b && openLB(+b.dataset.i); };
$('#lb-x').onclick = closeLB; $('#lb-p').onclick = () => openLB(lbI-1); $('#lb-n').onclick = () => openLB(lbI+1);
{ let x0 = null; const st = $('#lb .st'); st.addEventListener('pointerdown', e => x0 = e.clientX); st.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX-x0) > 50) openLB(lbI+(e.clientX < x0 ? 1 : -1)); x0 = null; }); }
addEventListener('keydown', e => { if ($('#lb').classList.contains('on')){ if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowLeft') openLB(lbI-1); if (e.key === 'ArrowRight') openLB(lbI+1); } else if (e.key === 'Escape'){ setMenu(false); closeSheet(); } });

/* ================= CONFIGURADOR ================= */
let C = null; // {h, S:{}, step, ok, prop, lead:{}}
const cSteps = h => { const b = TYPE[h.type].baths || 2; const L = [{id:'pis',n:'Habitatge'},{id:'terra',n:'Terra',cat:'Acabats de terra',t:'Terra de l’habitatge',keys:['SV']},{id:'cuina',n:'Cuina',cat:'Acabats de cuina',t:'Cuina',keys:['FB','FA','EC','IL']}];
  L.push({id:'bany1',n:b > 1 ? 'Bany 1' : 'Bany',cat:'Acabats de bany',t:b > 1 ? 'Bany 1 · suite' : 'Bany',keys:['B1SB','B1PV','B1PE','B1MB']}); if (b > 1) L.push({id:'bany2',n:'Bany 2',cat:'Acabats de bany',t:'Bany 2',keys:['B2SB','B2PV','B2PE','B2MB']});
  L.push({id:'altres',n:'Altres',cat:'Altres opcions',t:'Vidres, aparcament i traster',keys:['CR','PA','TR']},{id:'dades',n:'Dades'},{id:'resum',n:'Resum'}); return L; };
const floorM2 = h => TYPE[h.type].floorM2 || Math.round(h.area*.745*10)/10;
const opOf = (k, S) => { const g = grp(k), o = g.ops.find(o => o[0] === S[k]) || g.ops[0]; return {id:o[0], n:o[1], b:o[2], p:o[3]}; };
const lineP = (k, h, S) => { const g = grp(k), o = opOf(k, S); return g.perM2 ? o.p*floorM2(h) : o.p; };
function totals(){ const {h, S} = C; const keys = cSteps(h).flatMap(s => s.keys || []); let cfg = 0, annex = 0; keys.forEach(k => { const p = lineP(k, h, S); grp(k).annex ? annex += p : cfg += p; }); return {cfg, annex, keys}; }
const code = S => KEYS.map(k => S[k]).join('');
const decode = c => { const S = {}; KEYS.forEach((k,i) => { const ch = (c || '')[i]; S[k] = grp(k).ops.some(o => o[0] === ch) ? ch : DEF[i]; }); return S; };
const cHash = () => `cfg-${slug(C.h.id)}-p${C.step+1}-${code(C.S)}`;
function layers(stepId, S){ if (stepId === 'terra') return ['cfg/su_base.webp', `cfg/su_SV.${S.SV}.webp`];
  if (stepId === 'cuina') return ['cfg/co_base.webp', `cfg/co_SV.${S.SV}.webp`, S.IL === 'A' ? 'cfg/co_IL.A.webp' : null, S.FB !== 'B' ? `cfg/co_FB.${S.FB}.webp` : null, S.FA !== 'B' ? `cfg/co_FA.${S.FA}.webp` : null, `cfg/co_EC.${S.EC}.webp`];
  if (stepId === 'bany1' || stepId === 'bany2'){ const p = stepId === 'bany1' ? 'B1' : 'B2'; return ['cfg/ba_base.webp', ...['SB','PV','PE','MB'].map(k => `cfg/ba_${k}.${S[p+k]}.webp`)]; }
  return null; }
/* ================= APARCAMENT: places de la planta −1 i cotxe que surt de l'ascensor de vehicles ================= */
// rectangles de cada plaça sobre el plànol (968×1173)
const PKS = {P1:[273,797,117,203],P2:[148,797,109,218],P3:[148,560,109,237],P4:[148,446,208,114],P5:[148,334,208,112],P6:[148,222,208,112],P7:[148,110,208,112],P8:[598,672,232,113],P9:[598,560,232,112],P10:[598,446,232,114],P11:[598,334,232,112],P12:[598,222,232,112],P13:[598,110,232,112]};
const PKPAIR = {P2:'P3',P3:'P2',P8:'P9',P9:'P8'}; // places dobles confirmades (16/11/2026): P2+P3 i P8+P9
const PKCOL = [['#1c201d','#56636b','#2b3238'],['#8c5a2b','#d8c3a8','#a8774a']];
// recorregut: [x, y, angle] · angle 0 = morro a l'esquerra, 90 amunt, 180 a la dreta, −90 avall
function pkPath(id){ const [x,y,w,h] = PKS[id], cx = x+w/2, cy = y+h/2, n = +id.slice(1), A = 470, S = [A,874,90];
  if (n >= 4 && n <= 7) return [S,[A,cy+72,90],[398,cy,0],[cx,cy,0]];
  if (n >= 8) return [S,[A,cy+72,90],[542,cy,180],[cx,cy,180]];
  if (n === 1) return [S,[A,748,90],[412,690,0],[348,742,-90],[cx,cy,-90]];
  if (n === 2) return [S,[A,748,90],[412,686,0],[262,686,0],[cx+4,740,-90],[cx,cy,-90]];
  return [S,[A,762,90],[412,714,0],[288,718,0],[cx,cy,90]]; }
const pkSeg = P => P.slice(1).map((p,k) => Math.hypot(p[0]-P[k][0], p[1]-P[k][1]) + Math.abs(p[2]-P[k][2])*.6);
const pkLen = id => pkSeg(pkPath(id)).reduce((a,b) => a+b, 0);
const pkCar = (c, i) => `<g class="pkcar" data-p="${c}"><rect x="-93" y="-38" width="186" height="76" rx="24" fill="${PKCOL[i%2][0]}"/><rect x="-31" y="-46" width="11" height="9" rx="3" fill="${PKCOL[i%2][0]}"/><rect x="-31" y="37" width="11" height="9" rx="3" fill="${PKCOL[i%2][0]}"/><rect x="-52" y="-30" width="32" height="60" rx="10" fill="${PKCOL[i%2][1]}"/><rect x="-18" y="-31" width="62" height="62" rx="10" fill="${PKCOL[i%2][2]}"/><rect x="48" y="-28" width="22" height="56" rx="7" fill="${PKCOL[i%2][1]}"/><rect x="-92" y="-29" width="7" height="13" rx="3" fill="#fff4cc"/><rect x="-92" y="16" width="7" height="13" rx="3" fill="#fff4cc"/><rect x="86" y="-28" width="6" height="12" rx="3" fill="#e2483a"/><rect x="86" y="16" width="6" height="12" rx="3" fill="#e2483a"/></g>`;
function pkTag(id, txt){ const [x,y,w,h] = PKS[id], n = +id.slice(1), tw = Math.round(txt.length*13.2 + 48), cy = y+h/2;
  const tx = n >= 4 && n <= 7 ? x+w+18 : n >= 8 ? x-18-tw : x+w/2-tw/2, ty = n <= 3 ? y-62 : cy-27;
  return `<g class="pktag"><rect x="${tx}" y="${ty}" width="${tw}" height="54" rx="27" fill="#1c201d"/><text x="${tx+tw/2}" y="${ty+35}" text-anchor="middle">${txt}</text></g>`; }
// ids: places on aparca (la més llunyana primer) · o.all: totes les places clicables · o.tag: etiqueta final
function pkSVG(ids, o = {}){ ids = [...ids].sort((p,q) => pkLen(q) - pkLen(p));
  const places = o.all ? Object.keys(PKS).map(id => { const [x,y,w,h] = PKS[id]; return `<g class="pkp${ids.includes(id) ? ' on' : ''}" data-pk="${id}" tabindex="0" role="button" aria-label="Plaça ${id}"><rect x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" rx="10"/><text x="${x+w/2}" y="${y+h/2+9}" text-anchor="middle">${id}</text></g>`; }).join('')
    : ids.map(id => { const [x,y,w,h] = PKS[id]; return `<rect class="slot" x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" rx="10"/>`; }).join('');
  const routes = ids.map(id => `<path class="route" d="M${pkPath(id).map(p => p[0] + ' ' + p[1]).join(' L')}"/>`).join('');
  return `<rect class="pklift" x="400" y="753" width="146" height="236" rx="6"/><text class="pkliftt" x="473" y="955" text-anchor="middle">ASCENSOR</text><text class="pkliftt" x="473" y="976" text-anchor="middle">DE VEHICLES</text>${places}${routes}<rect class="pkdoor" x="398" y="741" width="150" height="11" rx="3" fill="#1c201d"/>${ids.map(pkCar).join('')}${o.tag ? pkTag(ids.reduce((m,id) => PKS[id][1] < PKS[m][1] ? id : m), o.tag) : ''}`; }
// anima els cotxes: pugen amb l'ascensor, s'obre la porta, surten i aparquen; el segon surt quan el primer ja ha deixat l'ascensor
function pkPlay(root){ if (!root) return; const T = p => `translate(${p[0]}px,${p[1]}px) rotate(${p[2]}deg)`; let delay = 0, end = 0;
  const motion = !reduce && !!root.animate;
  root.querySelectorAll('.pkcar').forEach(g => { const P = pkPath(g.dataset.p); g.style.transform = T(P[P.length-1]); if (!motion) return;
    const seg = pkSeg(P), D = seg.reduce((a,b) => a+b, 0), lift = 1000, dur = lift + D*2.7, a = 600/dur, b = lift/dur; let acc = 0;
    const F = [{transform:T(P[0]) + ' scale(.78)', opacity:0, offset:0, easing:'ease-out'}, {transform:T(P[0]) + ' scale(1)', opacity:1, offset:a}, {transform:T(P[0]) + ' scale(1)', opacity:1, offset:b, easing:'ease-in'}];
    seg.forEach((s,k) => { acc += s; F.push({transform:T(P[k+1]) + ' scale(1)', opacity:1, offset:Math.min(1, b + (1-b)*acc/D), easing:k === seg.length-2 ? 'ease-out' : 'linear'}); });
    F[F.length-1].offset = 1; g.animate(F, {duration:dur, delay, fill:'both'});
    const dr = root.querySelector('.pkdoor'); if (dr) dr.animate([{opacity:1},{opacity:1, offset:.55},{opacity:0, offset:.75},{opacity:0, offset:.9},{opacity:1}], {duration:lift + 1400, delay, fill:'none'});
    end = Math.max(end, delay + dur); delay += lift + 190*2.7; });
  const tg = root.querySelector('.pktag'); if (tg && motion) tg.animate([{opacity:0, transform:'translateY(14px)'}, {opacity:1, transform:'none'}], {duration:450, delay:end - 150, fill:'both', easing:'ease-out'}); }
/* pantalla Aparcament */
let AP = {p:'P5', t:'A'};
function apIds(){ return AP.t === 'B' && PKPAIR[AP.p] ? [AP.p, PKPAIR[AP.p]] : [AP.p]; }
function apRender(anim = true){ const ids = apIds(), dbl = ids.length > 1, label = ids.slice().sort((a,b) => +a.slice(1) - +b.slice(1)).join(' + ');
  $('#ap-plan').innerHTML = `<svg class="pk" viewBox="96 64 790 1066" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plànol de la planta d’aparcament amb les places"><image href="img/floor-m1.webp" x="0" y="0" width="968" height="1173"/>${pkSVG(ids, {all:1, tag:dbl ? 'Plaça doble' : 'La teva plaça'})}</svg>`;
  const svg = $('#ap-plan svg'); if (dbl) svg.querySelectorAll('.pkp').forEach(g => { if (!PKPAIR[g.dataset.pk]) g.classList.add('off'); });
  if (anim) pkPlay(svg); else svg.querySelectorAll('.pkcar').forEach(g => { const P = pkPath(g.dataset.p), e = P[P.length-1]; g.style.transform = `translate(${e[0]}px,${e[1]}px) rotate(${e[2]}deg)`; });
  $$('#ap-type button').forEach(b => b.classList.toggle('on', b.dataset.t === AP.t));
  const noPair = AP.t === 'B' && !PKPAIR[AP.p];
  $('#ap-card').innerHTML = noPair ? `<span><b>${AP.p}</b><small style="display:block">És una plaça simple. Les places dobles són la P2 + P3 i la P8 + P9.</small></span>` : `<span><b>${dbl ? 'Plaça doble ' : 'Plaça '}${label}</b><small style="display:block">Planta −1 · accés per l’ascensor de vehicles</small></span><strong>${eur(dbl ? 68000 : 38000)}</strong>`;
  $('#ap-pa').textContent = eur(38000); $('#ap-pb').textContent = eur(68000); $('#ap-tr').textContent = eur(10000);
  $('#ap-wa').href = `https://wa.me/${PHONE}?text=${encodeURIComponent(`Hola, m’interessa ${dbl ? 'la plaça doble ' : 'la plaça '}${label} de l’aparcament d’Aixovall Residencial. Està disponible?`)}`;
  $('#ap-hint').textContent = `${dbl ? 'Plaça doble ' : 'Plaça '}${label} · toca’n una altra`; }
function apSet(p, t){ if (p) AP.p = p; if (t) AP.t = t; if (PKPAIR[AP.p]) AP.t = 'B'; else if (AP.t === 'B') AP.t = 'A'; // una plaça d'una doble sempre és la doble; una de simple, simple
  setHash(`aparcament-${AP.p.toLowerCase()}${AP.t === 'B' ? '-doble' : ''}`, true); apRender(true); }
$('#ap-plan').addEventListener('click', e => { const g = e.target.closest('[data-pk]'); if (g && !g.classList.contains('off')) apSet(g.dataset.pk); });
$('#ap-plan').addEventListener('keydown', e => { const g = e.target.closest('[data-pk]'); if (g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); if (!g.classList.contains('off')) apSet(g.dataset.pk); } });
$('#ap-type').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; let p = AP.p; if (b.dataset.t === 'B' && !PKPAIR[p]) p = 'P8'; if (b.dataset.t === 'A' && PKPAIR[p]) p = 'P5'; apSet(p, b.dataset.t); });
$('#ap-replay').onclick = () => apRender(true);
/* ================= FINANÇAMENT · MoraBanc (demo): pòlissa d'obra nova del sostre al notari + hipoteca ================= */
// entitat de la demo: Creand per defecte; l'enllaç #morabanc la canvia durant la visita
const BANKS = {morabanc:{n:'MoraBanc', logo:'img/morabanc.webp', c:{own:'#c3cfdc', pol:'#3cb4e5', hip:'#00468a'}},
  creand:{n:'Creand', logo:'img/creand.webp', c:{own:'#cfd6cc', pol:'#9fd18f', hip:'#359124'}}};
let BK = 'creand'; // entitat de la demo per defecte
const FIN_BANK = false; // mòdul de finançament amb entitat: desactivat (17/11/2026); posar true per recuperar-lo
function bkApply(first){ const m = location.hash.match(/^#(creand|morabanc)(?:-(.*))?$/); let k = null;
  if (m){ k = m[1]; history.replaceState(null, '', location.pathname + location.search + '#' + (m[2] || 'inici')); }
  else if (first) k = BK;
  if (!BANKS[k]) return; BK = k; document.documentElement.classList.toggle('bk-creand', BK === 'creand');
  document.querySelectorAll('img.bk-logo').forEach(i => { i.src = BANKS[BK].logo; i.alt = BANKS[BK].n; }); }
bkApply(true); addEventListener('hashchange', () => bkApply(false));
document.documentElement.classList.toggle('fin-off', !FIN_BANK);
const mbStrip = (k, t = 'Vols saber més sobre com finançar-ho?') => !FIN_BANK ? '' : `<button class="mb-strip" data-mb="${k}"><img class="bk-logo" src="${BANKS[BK].logo}" alt="${BANKS[BK].n}"><span>${t}</span>${ico('r')}</button>`;

function mbHTML(h, annex, cfg){ const MBC = BANKS[BK].c, k = 1+IGI/100, P = (h.price + annex)*k, a = f => eur(P*f);
  const step = (c, n, lab, pct, txt, hl) => `<li${hl ? ' class="hl"' : ''}><span class="dot" style="background:${c}">${n}</span><b>${lab}</b><em>${pct}</em><small>${txt}</small></li>`;
  const B = BANKS[BK].n;
  return `<div class="mbh"><img src="${BANKS[BK].logo}" alt="${B}"><button class="mbx" id="mb-x" aria-label="Tancar">${ico('x')}</button>
   <h2 id="mb-t">Pòlissa d’obra nova</h2><p>Finança el teu pis mentre es construeix i paga només quan toca.</p></div>
   <div class="mbb"><div class="mbbig"><div><b>0<small>%</small></b><span>comissió d’obertura</span></div><div><b>0<small>€</small></b><span>despeses d’estudi</span></div></div>
   <h3>Com funciona</h3><ul class="mbhow">
    <li><span>Les arres i el pagament dels fonaments els fas amb els teus estalvis.</span></li>
    <li><span>Quan l’obra arriba al <b>sostre</b>, s’activa la pòlissa: ${B} paga per tu els trams del sostre i del tancament de façana.</span></li>
    <li><span>Mentre dura l’obra, només pagues interessos de l’import que has fet servir.</span></li>
    <li><span>Al <b>notari</b> s’obre la hipoteca: cancel·la la pòlissa i paga l’últim tram. A partir d’aquí, una sola quota.</span></li></ul>
   <h3>El teu cas: ${esc(h.name)}${annex ? ' + annexos' : ''}</h3>
   <div class="mbbar"><i style="width:20%;background:${MBC.own}"></i><i style="width:40%;background:${MBC.pol}"></i><i style="width:40%;background:${MBC.hip}"></i></div>
   <div class="mbleg"><span><i style="background:${MBC.own}"></i>Estalvis 20 %</span><span><i style="background:${MBC.pol}"></i>Pòlissa 40 %</span><span><i style="background:${MBC.hip}"></i>Hipoteca 80 % a notari</span></div>
   <ul class="mbsteps">
    ${step(MBC.own, 1, 'Arres i fonaments', a(.2), `Aportació pròpia (10 % + 10 %). La reserva de 10.000 € ja hi compta.`)}
    ${step(MBC.pol, 2, 'Sostre', a(.2), `S’activa la pòlissa: primera disposició de ${a(.2)}.`)}
    ${step(MBC.pol, 3, 'Tancament de façana', a(.2), `Segona disposició. Saldo de la pòlissa: ${a(.4)}.`)}
    ${step(MBC.hip, 4, 'Notari', a(.4), `S’obre la hipoteca de ${a(.8)}: retorna la pòlissa (${a(.4)}) i paga el ${a(.4)} final.`, 1)}
   </ul>
   <p class="mbnote">Calculat sobre ${eur(P)} (habitatge${annex ? ', aparcament i traster' : ''}, amb IGI)${cfg ? `. Les configuracions (+${eur(cfg*k)} amb IGI) es facturen a part: pregunta al gestor si les vols incloure` : ''}.</p>
   <a class="mbcta" id="mb-go" target="_blank" rel="noopener" href="https://wa.me/${PHONE}?text=${encodeURIComponent(`Hola, voldria parlar amb un gestor de ${B} sobre la pòlissa d’obra nova per al pis ${h.name} d’Aixovall Residencial (import aproximat amb IGI: ${eur(P)}).`)}">${ico('chat')}Posa’t en contacte amb un gestor de ${B}</a>
   <p class="mbnote">API Immobiliària et posa en contacte amb un gestor de ${B}. Exemple orientatiu, calculat amb el calendari de pagaments de la promoció i un finançament del 80 %. L’import finançat, el tipus d’interès i les condicions definitives depenen de l’estudi i l’aprovació de ${B}. Demo: condicions pendents de validar amb ${B}.</p></div>`; }
let mbLast = null;
function mbOpen(h, annex = 0, cfg = 0){ if (!h) return; mbLast = document.activeElement; $('#mb-c').innerHTML = mbHTML(h, annex, cfg); const m = $('#mb'); m.classList.add('on'); m.setAttribute('aria-hidden', 'false'); $('#mb-x').focus(); $('#mb-x').onclick = mbClose; }
function mbClose(){ const m = $('#mb'); m.classList.remove('on'); m.setAttribute('aria-hidden', 'true'); if (mbLast && mbLast.focus) mbLast.focus(); }
$('#mb').addEventListener('click', e => { if (e.target.id === 'mb') mbClose(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#mb').classList.contains('on')) mbClose(); });
addEventListener('hashchange', () => { if ($('#mb').classList.contains('on')) mbClose(); });
document.addEventListener('click', e => { const b = e.target.closest('[data-mb]'); if (!b) return; if (b.dataset.mb === 'cfg'){ if (!C.h) return; const t = totals(); mbOpen(C.h, t.annex, t.cfg); } else if (b.dataset.mb === 'ex') mbOpen(uHome || HOMES.find(x => x.status === 'available' && x.floor >= 1)); else mbOpen(HOMES.find(x => x.id === b.dataset.mb)); });
const ASPECT = {terra:[1536,1024],cuina:[1448,1086],bany1:[1086,1448],bany2:[1086,1448]};
let cShown = [];
function cStage(){ const st = cSteps(C.h)[C.step], cv = $('#c-canvas'), T = TYPE[C.h.type]; const L = layers(st.id, C.S);
  const fitBox = (w, h) => { const fr = cv.parentElement, W = fr.clientWidth, H = fr.clientHeight; const s = Math.min(W/w, H/h); cv.style.width = Math.floor(w*s)+'px'; cv.style.height = Math.floor(h*s)+'px'; };
  if (L){ const [w,h] = ASPECT[st.id]; cv.className = 'c-canvas'; fitBox(w, h); $('#c-blur').style.backgroundImage = `url(${L[0]})`;
    if (cv.dataset.step !== st.id){ cv.innerHTML = L.map((s,i) => `<img data-l="${i}" src="${s || ''}" alt="" ${s ? '' : 'hidden'}>`).join('') + '<span class="capt">Imatge referencial, sense valor contractual</span><span class="shine"></span>'; cv.dataset.step = st.id; }
    else L.forEach((s,i) => { const old = cv.querySelector(`img[data-l="${i}"]`); if ((old.getAttribute('src') || '') === (s || '')) return;
      if (!s){ old.style.opacity = 0; setTimeout(() => { old.hidden = true; old.removeAttribute('src'); old.style.opacity = ''; }, 450); old.setAttribute('src',''); return; }
      const n = document.createElement('img'); n.dataset.l = i; n.alt = ''; n.className = 'in'; n.onload = () => { requestAnimationFrame(() => n.classList.remove('in')); setTimeout(() => old.remove(), 500); }; n.src = s; old.removeAttribute('data-l'); old.after(n); });
    cShown = L; // precarrega la resta d'opcions del pas
    (st.keys || []).forEach(k => grp(k).ops.forEach(o => { const S2 = {...C.S, [k]:o[0]}; layers(st.id, S2).forEach(s => { if (s) new Image().src = s; }); }));
  } else if (st.id === 'altres' && C.S.PA !== '0'){ const key = 'altres-' + C.S.PA; if (cv.dataset.step !== key){ cv.dataset.step = key; cv.className = 'c-canvas plan'; fitBox(968, 1173); const dbl = C.S.PA === 'B';
      cv.innerHTML = `<img src="img/floor-m1.webp" alt="Plànol de la planta d’aparcament"><svg class="pk" viewBox="0 0 968 1173">${pkSVG(dbl ? ['P8','P9'] : ['P5'], {tag:dbl ? 'Plaça doble' : 'La teva plaça'})}</svg><span class="capt">Plaça il·lustrativa: la concreta es confirma amb la tarifa oficial</span>`; pkPlay(cv.querySelector('svg.pk')); $('#c-blur').style.backgroundImage = 'url(view/v3n.webp)'; }
  } else { cv.dataset.step = st.id; const pl = st.id === 'pis'; const src = pl ? (C.view3d && T.d3 ? `img/plan3d-${T.d3}.webp` : `img/type-${C.h.type}.webp`) : st.id === 'altres' ? 'cfg/ga_4.webp' : st.id === 'dades' ? 'cfg/ga_2.webp' : 'cfg/ga_1.webp';
    const dims = pl ? (C.view3d && T.d3 ? [1448,1086] : [1191,1685]) : st.id === 'altres' ? [1280,554] : st.id === 'dades' ? [1280,853] : [1280,960];
    cv.className = 'c-canvas' + (pl ? ' plan' : ''); fitBox(...dims); cv.innerHTML = `<img src="${src}" alt="">` + (pl && T.d3 ? `<div class="tabs" style="position:absolute;top:10px;left:10px;height:40px"><button class="${C.view3d ? '' : 'on'}" data-v3="0" style="height:32px">Plànol</button><button class="${C.view3d ? 'on' : ''}" data-v3="1" style="height:32px">3D</button></div>` : '');
    $('#c-blur').style.backgroundImage = `url(${pl ? 'view/v2.webp' : src})`; } }
function opCard(k, o){ const g = grp(k), on = C.S[k] === o[0]; const sw = g.sw && o[0] !== '0' ? `style="background-image:url(sw/${g.sw}.${o[0]}.jpg)"` : ''; const p = o[3];
  return `<button class="op ${on ? 'on' : ''}" data-k="${k}" data-o="${o[0]}" aria-pressed="${on}"><div class="sw" ${sw}>${sw ? '' : (k === 'IL' ? (o[0] === 'B' ? ico('sun') : '—') : '—')}</div><b>${o[1]}</b>${o[2] ? `<small>${o[2]}</small>` : ''}<em>${p === 0 ? (g.annex ? 'Sense cost' : 'Inclòs') : '+' + eur(p) + (g.perM2 ? '/m²' : '')}</em></button>`; }
function cPanel(){ const {h, S} = C, steps = cSteps(h), st = steps[C.step], T = TYPE[h.type], sc = $('#c-scroll'); let html = '';
  if (st.id === 'pis') html = `<div class="cat">Pas 1 · El teu habitatge</div><h2>${h.name} ${badge(h)}</h2><p class="sub">Tipologia T${h.type}${T.tag ? ' · ' + T.tag : ''} · ${FLOOR[h.floor].n}</p>
    <dl class="facts"><div><dt>Preu</dt><dd>${pv(h, h.price)}</dd></div><div><dt>Construïda</dt><dd>${m2(h.area)}</dd></div><div><dt>Dormitoris</dt><dd>${h.beds}</dd></div><div><dt>${EXT[h.ext] || 'Planta'}</dt><dd>${h.extM2 ? m2(h.extM2) : EXT[h.ext] ? 'Sí' : FLOOR[h.floor].s}</dd></div></dl>
    <label class="chkrow"><input type="checkbox" id="c-ok" ${C.ok ? 'checked' : ''}><span>He revisat el plànol${T.d3 ? ' i la vista 3D' : ''} i la distribució és correcta.<small>Necessari per continuar amb els acabats.</small></span></label>
    <div class="field"><label for="c-prop">Vols proposar alguna modificació estructural? (opcional)</label><textarea id="c-prop" placeholder="Ex.: vull tirar la paret entre el saló i la primera habitació per fer un saló més gran.">${esc(C.prop)}</textarea></div>
    <p class="note">El promotor revisarà la teva proposta. Pot tenir costos afegits, i qualsevol modificació estructural pot requerir l’aprovació de l’organisme regulador competent.</p>
    <button class="btn ghost" style="margin-top:10px;width:100%" data-go="habitatges">Canviar d’habitatge</button>`;
  else if (st.keys){ html = `<div class="cat">Pas ${C.step+1} · ${st.cat}</div><h2>${st.t}</h2>` + st.keys.map(k => { const g = grp(k); return `<div class="grp"><h3>${g.t}${g.d ? `<small>${g.d}</small>` : ''}<small style="margin-left:auto">${opOf(k, S).n}</small></h3><div class="ops">${g.ops.map(o => opCard(k, o)).join('')}</div></div>`; }).join('') +
    `<p class="note">${st.id === 'terra' ? `El suplement es calcula per m² de terra: ${m2(floorM2(h))}${TYPE[h.type].floorM2 ? '' : ' (superfície estimada per a la demo)'}.` : st.id === 'cuina' ? 'El terra de la imatge és el que has triat al pas anterior.' : st.id.startsWith('bany') ? 'Sobrecostos de bany d’exemple, pendents de tarifa.' : 'L’aparcament i el traster s’afegeixen al preu de l’habitatge, no a la factura de configuracions.'}${h.type !== 4 && st.id !== 'altres' ? ' Render de referència de la tipologia T4.' : ''}</p>`; }
  else if (st.id === 'dades') html = `<div class="cat">Pas ${C.step+1} · Les teves dades</div><h2>Ja gairebé ho tens</h2><p class="sub">Digue’ns a qui hem de preparar el resum. Et podrem enviar per WhatsApp el dossier del teu pis amb la configuració, el preu i les condicions de pagament.</p>
    <div class="field"><label for="l-n">Nom i cognoms</label><input id="l-n" autocomplete="name" value="${esc(C.lead.n || '')}"></div>
    <div class="field"><label for="l-w">WhatsApp</label><input id="l-w" type="tel" inputmode="tel" autocomplete="tel" placeholder="+376 …" value="${esc(C.lead.w || '')}"></div>
    <label class="chkrow"><input type="checkbox" id="l-c" ${C.lead.c ? 'checked' : ''}><span>Accepto que API Immobiliària em contacti sobre aquesta configuració.</span></label>
    <p class="note" id="l-err" style="color:var(--sold)" hidden>Omple el nom, un WhatsApp vàlid i accepta la condició per veure el resum.</p>
    <p class="note">Demo: les dades no s’envien enlloc; es queden en aquesta pantalla.</p>`;
  else html = sumHTML();
  sc.innerHTML = html; sc.scrollTop = 0;
  const {cfg} = totals(); tweenTot(cfg); $('#c-totl').textContent = `${h.name} · configuracions`;
  $('#c-prev').hidden = C.step === 0; $('#c-next').textContent = st.id === 'dades' ? 'Veure el resum' : 'Següent'; $('#c-next').hidden = st.id === 'resum'; $('#c-next').disabled = st.id === 'pis' && !C.ok;
  $('#c-steps').innerHTML = steps.map((s,i) => `<button class="${i === C.step ? 'on' : i < C.step ? 'done' : ''}" data-st="${i}" ${(i > 0 && !C.ok) || (s.id === 'resum' && !leadOK()) ? 'disabled' : ''}><i>${i < C.step ? '✓' : i+1}</i>${s.n}</button>`).join('');
  const on = $('#c-steps .on'), bar = $('#c-steps'); if (on) bar.scrollLeft = on.offsetLeft-(bar.clientWidth-on.offsetWidth)/2; }
const leadOK = () => C.lead.n && C.lead.n.trim().length > 2 && (C.lead.w || '').replace(/\D/g,'').length >= 6 && C.lead.c;
function sumLines(pred){ const {h, S} = C; return totals().keys.filter(k => pred(grp(k), k)).map(k => { const g = grp(k), o = opOf(k, S), p = lineP(k, h, S); const where = k.startsWith('B1') ? 'Bany 1 · ' : k.startsWith('B2') ? 'Bany 2 · ' : ''; return {k, t:where+g.t, n:o.n, b:o.b, p, sw:g.sw && o.id !== '0' ? `sw/${g.sw}.${o.id}.jpg` : '', per:g.perM2 && o.p ? `${o.p} €/m² × ${m2(floorM2(h))}` : ''}; }); }
function sumHTML(){ const {h} = C, t = totals(), k = 1+IGI/100; const A = sumLines(g => g.annex).filter(l => l.p), L = sumLines(g => !g.annex);
  const ln = l => `<div class="ln"><i ${l.sw ? `style="background-image:url(${l.sw})"` : ''}></i><span>${l.t}<small>${l.n}${l.b ? ' · ' + l.b : ''}${l.per ? ' · ' + l.per : ''}</small></span><b>${l.p ? '+' + eur(l.p) : 'Inclòs'}</b></div>`;
  const tt = (lab, v) => `<div class="tt"><span>${lab} (sense IGI)</span><span>${eur(v)}</span><span>IGI ${nf2.format(IGI)} %</span><span>${eur(v*IGI/100)}</span><b>Total amb IGI</b><b>${eur(v*k)}</b></div>`;
  const base = h.price+t.annex, all = (base+t.cfg)*k;
  return `<div class="sum"><div class="cat">Resum · ${esc(C.lead.n || '')}</div><h2>${h.name}, configurat</h2><p class="sub">${C.ok ? 'Distribució validada' : 'Distribució sense validar'} · ${FLOOR[h.floor].n}</p>
   <div class="blk"><h3>Habitatge<small>Factura de l’habitatge</small></h3><div class="ln"><i style="background-image:url(${thumb(h)})"></i><span>${h.name} · T${h.type}<small>${beds(h.beds)} · ${m2(h.area)}</small></span><b>${pv(h, h.price)}</b></div>${tt('Preu de l’habitatge', h.price)}</div>
   <div class="blk"><h3>Aparcament i traster<small>S’afegeixen al preu de l’habitatge</small></h3>${A.length ? A.map(ln).join('') + tt('Total annexos', t.annex) : '<p class="note" style="margin:6px 0 0">Sense aparcament ni traster.</p>'}</div>
   <div class="blk"><h3>Configuracions<small>Factura a part</small></h3>${L.map(ln).join('')}${tt('Total configuracions', t.cfg)}</div>
   ${C.prop.trim() ? `<div class="blk"><h3>Proposta de modificació<small>Pendent de revisió</small></h3><p style="margin:8px 0 0;font-size:13px">${esc(C.prop)}</p></div>` : ''}
   <div class="grand"><small>Habitatge, annexos i configuracions</small><span></span><span>Total a pagar amb IGI</span><b>${eur(all)}</b></div>${mbStrip('cfg')}
   <h3 style="margin-top:18px;font-size:18px">Pla de pagaments</h3>${payHTML(base)}
   <div style="display:grid;gap:8px;margin-top:14px"><a class="btn wood" id="s-wa" target="_blank" rel="noopener" href="https://wa.me/${PHONE}?text=${encodeURIComponent(sumText())}">${ico('chat')}Enviar a API per WhatsApp</a>
   <div class="row2" style="margin:0"><button class="btn ghost" id="s-copy">${ico('copy')}Copiar resum</button><button class="btn ghost" id="s-link">${ico('share')}Copiar enllaç</button></div><button class="btn ghost" id="s-reset">Tornar a començar</button></div>
   <p class="note"><b>Imatges i materials.</b> Els renders i les imatges són referencials i no tenen implicacions contractuals. El promotor es compromet a instal·lar i lliurar el que s’ha configurat en el mateix estil, i es reserva el dret de substituir qualsevol material per un altre de similar.</p>
   <p class="note"><b>Imports.</b> L’habitatge, els annexos i les configuracions es facturen per separat. Sobrecostos de bany d’exemple, pendents de tarifa. A la versió publicada aquest resum es descarrega en PDF com a annex a la memòria de qualitats.</p></div>`; }
function sumText(){ const {h} = C, t = totals(), k = 1+IGI/100; const L = [...sumLines(g => g.annex).filter(l => l.p), ...sumLines(g => !g.annex)];
  return [`AIXOVALL RESIDENCIAL · ${h.name} (T${h.type})`, C.lead.n ? `Client: ${C.lead.n} · ${C.lead.w}` : '', `Habitatge: ${pv(h, h.price)}`, ...L.map(l => `· ${l.t}: ${l.n}${l.p ? ' (+' + eur(l.p) + ')' : ''}`), `Annexos: ${eur(t.annex)} · Configuracions: ${eur(t.cfg)}`, `TOTAL amb IGI: ${eur((h.price+t.annex+t.cfg)*k)}`, C.prop.trim() ? `Proposta de modificació: ${C.prop.trim()}` : '', location.href].filter(Boolean).join('\n'); }
function cGoStep(i){ const steps = cSteps(C.h); i = Math.max(0, Math.min(steps.length-1, i)); if (i > 0 && !C.ok){ toast('Valida primer la distribució'); i = 0; } if (steps[i].id === 'resum' && !leadOK()) i = steps.findIndex(s => s.id === 'dades');
  const dir = i >= C.step ? 1 : -1; C.step = i; setHash(cHash(), true); cPanel(); cStage(); cAnim(dir); }
function cAnim(dir){ const cv = $('#c-canvas'), sc = $('#c-scroll'); cv.style.setProperty('--dx', dir*46 + 'px'); [[cv,'enter'],[sc,'anim']].forEach(([el,c]) => { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }); setTimeout(() => { cv.classList.remove('enter'); sc.classList.remove('anim'); }, 900); }
let totShown = 0; function tweenTot(to){ const el = $('#c-tot'), from = totShown, t0 = performance.now(); totShown = to; if (from === to || reduce){ el.textContent = (to ? '+' : '') + eur(to); return; } el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  const tick = t => { const k = Math.min(1, (t-t0)/450), e = 1-Math.pow(1-k, 3), v = from+(to-from)*e; el.textContent = (v > .5 ? '+' : '') + eur(v); if (k < 1 && totShown === to) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
function cRender(h, step, c){ if (!C || C.h !== h) C = {h, S:decode(c), step:0, ok:!!(c || step), prop:'', lead:store.get('axr-demo-lead', {}), view3d:0}; else if (c) C.S = decode(c);
  $('#c-canvas').dataset.step = ''; cGoStep(step || 0); }
$('#c-steps').onclick = e => { const b = e.target.closest('[data-st]'); if (b && !b.disabled) cGoStep(+b.dataset.st); };
$('#c-prev').onclick = () => cGoStep(C.step-1);
$('#c-next').onclick = () => { const st = cSteps(C.h)[C.step]; if (st.id === 'dades' && !leadOK()){ $('#l-err').hidden = false; return; } cGoStep(C.step+1); };
$('#c-close').onclick = () => location.hash = 'pis-' + slug(C.h.id);
$('#c-canvas').addEventListener('click', e => { const b = e.target.closest('[data-v3]'); if (b){ C.view3d = +b.dataset.v3; cStage(); const cv = $('#c-canvas'); cv.classList.remove('flip'); void cv.offsetWidth; cv.classList.add('flip'); } });
$('#c-scroll').addEventListener('click', e => { const o = e.target.closest('.op'); if (o){ C.S[o.dataset.k] = o.dataset.o; const y = $('#c-scroll').scrollTop; const xs = $$('#c-scroll .ops').map(el => el.scrollLeft); setHash(cHash(), true); const k0 = o.dataset.k, o0 = o.dataset.o; cStage(); cPanel(); $('#c-scroll').scrollTop = y; $$('#c-scroll .ops').forEach((el,i) => el.scrollLeft = xs[i]);
    const nb = $(`#c-scroll .op[data-k="${k0}"][data-o="${o0}"]`); nb && nb.classList.add('just'); const sh = $('#c-canvas .shine'); if (sh){ sh.classList.remove('go'); void sh.offsetWidth; sh.classList.add('go'); }
    if (k0 === 'PA'){ const cv = $('#c-canvas'); cv.classList.remove('enter'); void cv.offsetWidth; cv.style.setProperty('--dx','0px'); cv.classList.add('enter'); } return; }
  if (e.target.closest('#s-copy')) return copy(sumText(), 'Resum copiat');
  if (e.target.closest('#s-link')) return copy(location.href, 'Enllaç copiat: obre aquesta mateixa configuració');
  if (e.target.closest('#s-reset')){ C.S = decode(''); C.prop = ''; cGoStep(1); toast('Configuració reiniciada'); } });
$('#c-scroll').addEventListener('input', e => { const t = e.target; if (t.id === 'c-ok'){ C.ok = t.checked; $('#c-next').disabled = !C.ok; $$('#c-steps button').forEach((b,i) => { if (i > 0 && i < cSteps(C.h).length-1) b.disabled = !C.ok; }); }
  if (t.id === 'c-prop') C.prop = t.value; if (t.id === 'l-n') C.lead.n = t.value; if (t.id === 'l-w') C.lead.w = t.value; if (t.id === 'l-c') C.lead.c = t.checked; if (t.id.startsWith('l-')) store.set('axr-demo-lead', C.lead); });
addEventListener('resize', () => { if (route.s === 'cfg' && C) cStage(); });

/* ================= ENTORN: zoom coet + infografia ================= */
const LAT0 = 42.47738, LON0 = 1.49059, KX = 111200*Math.cos(LAT0*Math.PI/180), KY = 111200;
const XY = (la, lo) => [(lo-LON0)*KX, -(la-LAT0)*KY];
const ECAT = {con:['Connexions','road','#3f6fb0'],com:['Compres','cart','#b4783f'],sal:['Salut','cross','#c94a3f'],edu:['Educació','book','#6a5acd'],lle:['Lleure','tree','#2b9a5a']};
const POI = [
 ['con','Andorra la Vella · centre',42.5067895,1.5223013,'8 min'],['con','Frontera · la Farga de Moles',42.4327383,1.4683287,'6 min'],['con','Benzinera Repsol · 24 h',42.484916,1.4922692,'2 min'],
 ['com','E.Leclerc Express · Bon Àrea',42.4681061,1.4924323,'2–3 min'],['com','River',42.454317,1.48635,'5 min'],['com','Epizen',42.4475799,1.481438,'6 min'],
 ['sal','Farmàcia de Lòria',42.4659039,1.4918884,'3 min'],['sal','Centre d’Atenció Primària',42.4630522,1.4909434,'4 min'],['sal','Hospital N. S. de Meritxell',42.5116199,1.5339562,'11–13 min'],
 ['edu','Universitat d’Andorra',42.4653237,1.490649,'3 min'],['edu','Escola Andorrana de Lòria',42.4649318,1.4933165,'3–4 min'],
 ['lle','LAUesport · gimnàs i piscina',42.4657225,1.4921917,'3 min'],['lle','Parc infantil de Nagol',42.4672763,1.4970947,'5–6 min'],['lle','Naturland',42.4420394,1.5020964,'15–20 min']
].map(([c,n,la,lo,t]) => { const [x,y] = XY(la,lo); return {c,n,x,y,t,d:Math.hypot(x,y)}; });
const TOWNS = [['Sant Julià de Lòria',42.4610,1.4860],['Santa Coloma',42.4935,1.4905],['Andorra la Vella',42.5075,1.5120],['Escaldes',42.5140,1.5420],['Espanya',42.4300,1.4600]].map(([n,la,lo]) => { const [x,y] = XY(la,lo); return {n,x,y,d:Math.hypot(x,y)*.8}; });
const ROAD = [[42.4327,1.4683],[42.4400,1.4760],[42.4476,1.4814],[42.4543,1.4864],[42.4640,1.4900],[42.4681,1.4924],[42.4730,1.4915],[42.47738,1.49040],[42.4849,1.4923],[42.4900,1.4945],[42.4972,1.5021],[42.5020,1.5120],[42.5048,1.5214],[42.5085,1.5290],[42.5116,1.5340]].map(p => XY(...p));
const HOMEI = 7;
let enVB = null, enFull = null, enCat = '', enSel = -1, enRAF = 0;
function enBuild(){ const svg = $('#en-svg'); const pth = ROAD.map((p,i) => (i ? 'L' : 'M') + p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join(' ');
  svg.innerHTML = `<defs><radialGradient id="eg" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#3c5a44"/><stop offset=".6" stop-color="#27382e"/><stop offset="1" stop-color="#1a2420"/></radialGradient><filter id="eb"><feGaussianBlur stdDeviation="260"/></filter></defs>
   <rect x="-30000" y="-30000" width="60000" height="60000" fill="url(#eg)"/>
   <path d="${pth}" fill="none" stroke="#6f8f64" stroke-width="1500" stroke-linecap="round" stroke-linejoin="round" filter="url(#eb)" opacity=".55"/>
   ${[[1.2,2.4],[-1.6,-1.2],[2.6,-2.8],[-2.4,3.4],[3.4,1.2]].map(([a,b]) => `<ellipse cx="${a*1000}" cy="${b*1000}" rx="1700" ry="1100" fill="#141c18" opacity=".35" filter="url(#eb)"/>`).join('')}
   <g transform="translate(-70,0)"><path d="${pth}" fill="none" stroke="#6fb0d8" stroke-width="3" vector-effect="non-scaling-stroke" opacity=".7" stroke-linejoin="round"/></g>
   <path d="${pth}" fill="none" stroke="#1b1f1c" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="${pth}" fill="none" stroke="#f3ead8" stroke-width="3.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
   ${[1000,2000,5000].map(r => `<circle cx="0" cy="0" r="${r}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="5 6" vector-effect="non-scaling-stroke"/>`).join('')}
   <path id="en-route" d="" fill="none" stroke="#f0b63a" stroke-width="5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
   <rect x="-10" y="-13" width="20" height="26" transform="rotate(-20)" fill="#b4783f" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  $('#en-marks').innerHTML = TOWNS.map((t,i) => `<span class="mk town" data-t="${i}">${t.n}</span>`).join('') + [1,2,5].map(k => `<span class="mk town" data-r="${k}" style="font-size:11px;letter-spacing:.04em;text-transform:none">${k} km</span>`).join('') +
   POI.map((p,i) => `<button class="mk" data-p="${i}" style="--c:${ECAT[p.c][2]}"><i>${ico(ECAT[p.c][1])}</i><span>${p.n}</span><em>${p.t}</em></button>`).join('') + `<span class="mk home on">${ico('home')}Aixovall Residencial</span>`;
  $('#en-cats').innerHTML = `<button data-c="" class="on" style="padding-left:13px">Tot</button>` + Object.entries(ECAT).map(([k,v]) => `<button data-c="${k}" style="--c:${v[2]}"><i>${ico(v[1])}</i>${v[0]}</button>`).join(''); enList(); }
function enList(){ $('#en-list').innerHTML = POI.map((p,i) => [p,i]).filter(([p]) => !enCat || p.c === enCat).sort((a,b) => a[0].d-b[0].d).map(([p,i]) => `<li><button data-p="${i}" class="${i === enSel ? 'sel' : ''}" style="--c:${ECAT[p.c][2]}"><i>${ico(ECAT[p.c][1])}</i><span><b>${p.n}</b><small>${nf2.format(Math.round(p.d/100)/10)} km · ${ECAT[p.c][0]}</small></span><strong>${p.t}</strong></button></li>`).join('');
  $$('#en-cats button').forEach(b => b.classList.toggle('on', b.dataset.c === enCat)); $$('#en-marks .mk[data-p]').forEach(m => { const p = POI[+m.dataset.p]; m.classList.toggle('dim', !!enCat && p.c !== enCat); m.classList.toggle('sel', +m.dataset.p === enSel); m.classList.toggle('lab', !!enCat && p.c === enCat && innerWidth >= 900); }); }
function enFit(){ const st = $('#en-stg'), W = st.clientWidth, H = st.clientHeight; if (!W) return; const bx = [-3900,-4500,5000,5600], bw = bx[2]-bx[0], bh = bx[3]-bx[1]; const sc = Math.max(bw/W, bh/H)*1.06; enFull = {cx:(bx[0]+bx[2])/2, cy:(bx[1]+bx[3])/2, w:W*sc, h:H*sc}; }
function enApply(v){ enVB = v; const st = $('#en-stg'), W = st.clientWidth, k = W/v.w; $('#en-svg').setAttribute('viewBox', `${v.cx-v.w/2} ${v.cy-v.h/2} ${v.w} ${v.h}`);
  const pos = (el, x, y) => { el.style.left = ((x-v.cx)*k+W/2)+'px'; el.style.top = ((y-v.cy)*k+st.clientHeight/2)+'px'; }; const reach = Math.min(v.w, v.h)/2*.92;
  $$('#en-marks .mk').forEach(m => { if (m.dataset.p){ const p = POI[+m.dataset.p]; pos(m, p.x, p.y); m.classList.toggle('on', p.d < reach || Math.abs(p.x-v.cx) < v.w/2*.9 && Math.abs(p.y-v.cy) < v.h/2*.9 && v.w > enFull.w*.95); }
    else if (m.dataset.t){ const t = TOWNS[+m.dataset.t]; pos(m, t.x, t.y+260); m.classList.toggle('on', v.w > enFull.w*.8); }
    else if (m.dataset.r){ const r = +m.dataset.r*1000; pos(m, r*.707, -r*.707); m.classList.toggle('on', reach > r*.8 && v.w > 1500); }
    else pos(m, 0, -34/k); });
  $('#en-alt').textContent = 'Radi de vista: ' + (v.w/2 < 1000 ? Math.round(v.w/2/10)*10 + ' m' : nf2.format(Math.round(v.w/200)/10) + ' km'); }
function enRocket(){ cancelAnimationFrame(enRAF); enFit(); if (!enFull) return; const st = $('#en-stg'), asp = st.clientHeight/st.clientWidth; const w0 = 160, t0 = performance.now(), dur = reduce ? 1 : 3000, delay = reduce ? 0 : 650; enSel = -1; $('#en-route').setAttribute('d',''); enList();
  enApply({cx:0, cy:0, w:w0, h:w0*asp}); const ph = $('#en-photo'); ph.classList.remove('go'); void ph.offsetWidth; if (!reduce) ph.classList.add('go');
  const step = t => { const k = Math.min(1, Math.max(0, (t-t0-delay)/dur)), e = k < .5 ? 4*k*k*k : 1-Math.pow(-2*k+2, 3)/2; const w = w0*Math.pow(enFull.w/w0, e); enApply({cx:enFull.cx*e, cy:enFull.cy*e, w, h:w*asp}); if (k < 1 && route.s === 'entorn') enRAF = requestAnimationFrame(step); }; enRAF = requestAnimationFrame(step); }
function enPick(i){ enSel = enSel === i ? -1 : i; const rt = $('#en-route'); if (enSel < 0){ rt.setAttribute('d',''); enList(); return; } const p = POI[i]; let bi = 0, bd = 1e9; ROAD.forEach((r,j) => { const d = Math.hypot(r[0]-p.x, r[1]-p.y); if (d < bd){ bd = d; bi = j; } });
  const seq = [[0,0]]; const stp = bi >= HOMEI ? 1 : -1; for (let j = HOMEI; j !== bi+stp; j += stp) seq.push(ROAD[j]); seq.push([p.x,p.y]); rt.setAttribute('d', seq.map((q,j) => (j ? 'L' : 'M') + q[0].toFixed(0) + ' ' + q[1].toFixed(0)).join(' '));
  const L = rt.getTotalLength(); rt.style.transition = 'none'; rt.style.strokeDasharray = L; rt.style.strokeDashoffset = L; void rt.getBoundingClientRect(); rt.style.transition = 'stroke-dashoffset 1.1s ease-out'; rt.style.strokeDashoffset = 0; enList(); }
$('#en-cats').onclick = e => { const b = e.target.closest('[data-c]'); if (b){ enCat = b.dataset.c; enList(); } };
$('#s-entorn').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) enPick(+b.dataset.p); });
$('#en-replay').onclick = enRocket;
new ResizeObserver(() => { if (route.s === 'entorn' && enFull){ enFit(); enApply({...enFull}); } }).observe($('#en-stg'));

/* ================= SOL: posició solar + perfil de muntanyes ================= */
/* alçada de l'horitzó (graus) cada 10° d'azimut, des de l'edifici (model d'elevació) */
const HOR = [15.9,29.6,29.6,29.6,32.6,37,40.2,38.2,34.9,28.5,28.4,24.5,22.2,24.9,17,11.9,10.1,9,14.8,16.4,22.3,23.8,21.1,22,20.5,16.4,15.3,18.5,24.7,30.7,27.4,26.2,24.6,22.2,20.4,16.8];
const horAt = az => { az = ((az%360)+360)%360; const i = Math.floor(az/10), f = az/10-i; return HOR[i]*(1-f)+HOR[(i+1)%36]*f; };
const FAC = [['Façana principal','carrer i riu · balcons',250],['Façana posterior','vessant i bosc',70],['Lateral nord','escala',340],['Lateral sud','mitgera amb la casa veïna',160]];
const MES = ['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
const DOY = [21,52,80,111,141,172,202,233,264,294,325,355], rad = Math.PI/180;
function sun(m, h){ const N = DOY[m-1], dec = 23.44*Math.sin(2*Math.PI*(284+N)/365)*rad, B = 2*Math.PI*(N-81)/364, eot = 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B), tz = m >= 4 && m <= 10 ? 2 : 1;
  const st = h+(4*(LON0-15*tz)+eot)/60, H = 15*(st-12)*rad, la = LAT0*rad; const alt = Math.asin(Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(H)); const az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(la)-Math.tan(dec)*Math.cos(la))/rad+180; return {alt:alt/rad, az:(az+360)%360}; }
const sunUp = s => s.alt > Math.max(horAt(s.az), 0);
const litF = (s, n) => sunUp(s) && Math.cos((s.az-n)*rad) > .06;
const hhmm = h => { const a = Math.floor(h+1e-6), b = Math.round((h-a)*60); return String(a).padStart(2,'0') + ':' + String(b).padStart(2,'0'); };
let SO = {m:6, h:15}, soT = 0;
function soDay(m){ const r = FAC.map(() => ({min:0, a:null, b:null})); let up = null, dn = null, tu = null, td = null; for (let h = 4; h <= 22.5; h += 1/12){ const s = sun(m, h); if (s.alt > 0){ tu ??= h; td = h; } if (sunUp(s)){ up ??= h; dn = h; } FAC.forEach((f,i) => { if (litF(s, f[2])){ r[i].min += 5; r[i].a ??= h; r[i].b = h; } }); } return {r, up, dn, tu, td}; }
function soRender(){ const {m, h} = SO, s = sun(m, h), up = sunUp(s), day = soDay(m); $('#so-m').value = m; $('#so-h').value = h; $('#so-mo').textContent = MES[m-1]; $('#so-ho').textContent = hhmm(h);
  $('#so-when').textContent = `21 de ${MES[m-1]} · ${hhmm(h)}`; const main = litF(s, 250), st = $('#so-status');
  st.innerHTML = s.alt <= 0 ? `${ico('moon')}Nit` : !up ? `${ico('layers')}Ombra de muntanya` : main ? `${ico('sun')}Sol directe a la façana principal` : `${ico('sun')}Sol a l’edifici · façana principal a l’ombra`;
  const lightK = s.alt <= -4 ? 0 : s.alt <= 2 ? (s.alt+4)/6 : 1; $('#so-bgn').style.opacity = 1-lightK; $('#so-bg').style.filter = up ? (main ? 'none' : 'saturate(.85) brightness(.92)') : 'saturate(.6) brightness(.78)'; $('#so-tint').style.opacity = s.alt > 0 && !up ? .28 : 0;
  const g = $('#so-glow'); g.style.opacity = up ? 1 : 0; g.style.left = (50-Math.sin((s.az-250)*rad)*46) + '%'; g.style.top = Math.max(-6, 46-s.alt*.9) + '%';
  /* carta solar: x = azimut 40..320, y = alçada 0..75 */
  const X = a => (a-40)/280*300, Y = e => 138-e/75*128; let hp = `M0 ${Y(0)}`; for (let a = 40; a <= 320; a += 5) hp += ` L${X(a).toFixed(1)} ${Y(horAt(a)).toFixed(1)}`; hp += ` L300 ${Y(0)} Z`;
  let sp = '', ticks = ''; for (let t = 4; t <= 22; t += .25){ const q = sun(m, t); if (q.alt > -2 && q.az >= 40 && q.az <= 320) sp += (sp ? ' L' : 'M') + X(q.az).toFixed(1) + ' ' + Y(q.alt).toFixed(1); if (t%2 === 0 && q.alt > 2 && q.az > 46 && q.az < 314) ticks += `<circle cx="${X(q.az)}" cy="${Y(q.alt)}" r="1.6" fill="#b98a1e"/><text x="${X(q.az)}" y="${Y(q.alt)-5}" font-size="7" text-anchor="middle" fill="#7a6a3a">${t}h</text>`; }
  const sv = s.az >= 40 && s.az <= 320 && s.alt > -3;
  $('#so-sky').innerHTML = `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.alt > 0 ? '#bcd9f2' : '#27324a'}"/><stop offset="1" stop-color="${s.alt > 0 ? '#eef5fb' : '#4a5670'}"/></linearGradient></defs><rect width="300" height="150" fill="url(#sg)"/>
   ${[250,70].map((a,i) => `<line x1="${X(a)}" y1="8" x2="${X(a)}" y2="${Y(0)}" stroke="#b4783f" stroke-dasharray="3 3" stroke-width="1"/><text x="${X(a)}" y="14" font-size="6.5" text-anchor="middle" fill="#8c5a2b" font-weight="600">${i ? 'posterior' : 'façana principal'}</text>`).join('')}
   <path d="${sp}" fill="none" stroke="#e7a92b" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>${ticks}
   ${sv ? `<circle cx="${X(s.az)}" cy="${Y(s.alt)}" r="${up ? 9 : 7}" fill="${up ? '#f6c33b' : '#d8cfa8'}" stroke="#fff" stroke-width="2"/>` : ''}
   <path d="${hp}" fill="#31483a"/><path d="${hp}" fill="none" stroke="#1f3026" stroke-width="1"/>
   ${[[90,'E'],[180,'S'],[270,'O']].map(([a,l]) => `<text x="${X(a)}" y="147" font-size="8" text-anchor="middle" fill="#fff" font-weight="700">${l}</text>`).join('')}<text x="6" y="${Y(horAt(60))+12}" font-size="6.5" fill="#cfe0d2">muntanyes</text>`;
  /* planta amb ombra */
  const R = 20*rad, c = Math.cos(-R), sn = Math.sin(-R), rot = ([x,y]) => [x*c-y*sn, x*sn+y*c], B = [[-20,-26],[20,-26],[20,26],[-20,26]].map(rot); let sh = '';
  if (up){ const L = Math.min(150, 16/Math.tan(Math.max(s.alt, 3)*rad)*2), dx = -Math.sin(s.az*rad)*L, dy = Math.cos(s.az*rad)*L; const pts = [...B, ...B.map(([x,y]) => [x+dx, y+dy])].sort((a,b) => a[0]-b[0] || a[1]-b[1]); const cr = (o,a,b) => (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]); const lo = [], hi = []; for (const q of pts){ while (lo.length > 1 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); } for (const q of pts.slice().reverse()){ while (hi.length > 1 && cr(hi.at(-2), hi.at(-1), q) <= 0) hi.pop(); hi.push(q); } sh = `<polygon points="${lo.slice(0,-1).concat(hi.slice(0,-1)).map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="#2b3340" opacity=".3"/>`; }
  const edges = [[3,0,250],[1,2,70],[0,1,340],[2,3,160]].map(([a,b,n]) => `<line x1="${B[a][0]}" y1="${B[a][1]}" x2="${B[b][0]}" y2="${B[b][1]}" stroke="${litF(s, n) ? '#f0b63a' : '#8a8f8b'}" stroke-width="${litF(s, n) ? 6 : 3}" stroke-linecap="round"/>`).join('');
  const sx = Math.sin(s.az*rad)*92, sy = -Math.cos(s.az*rad)*92;
  $('#so-plan').innerHTML = `<rect x="-110" y="-110" width="220" height="220" fill="#e9eee4"/><g transform="rotate(-20)"><rect x="-58" y="-140" width="22" height="280" fill="#cfd3cf"/><rect x="-84" y="-140" width="14" height="280" fill="#b9d7ea"/><rect x="26" y="-140" width="120" height="280" fill="#c9dcc0"/></g>
   <text x="-62" y="-92" font-size="8" fill="#5c625d" transform="rotate(-20)">CG-1</text><text x="62" y="-78" font-size="8" fill="#51704f">vessant</text>${sh}
   <polygon points="${B.map(q => q.join(',')).join(' ')}" fill="#f6f2ea" stroke="#1c201d" stroke-width="1"/>${edges}
   ${up ? `<line x1="0" y1="0" x2="${sx}" y2="${sy}" stroke="#e7a92b" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${sx}" cy="${sy}" r="9" fill="#f6c33b" stroke="#fff" stroke-width="2"/>` : ''}
   <g transform="translate(88,-88)"><circle r="14" fill="#fff"/><path d="M0 -10 4 6 0 3 -4 6z" fill="#1c201d"/><text y="-15" font-size="8" text-anchor="middle" font-weight="700">N</text></g>`;
  $('#so-fac').innerHTML = `<div class="${up ? 'lit' : ''}"><u></u><span><b>Sol a l’edifici avui</b><small>${day.up === null ? 'El sol no supera les muntanyes' : `de ${hhmm(day.up)} a ${hhmm(day.dn)} · sense muntanyes seria de ${hhmm(day.tu)} a ${hhmm(day.td)}`}</small></span><strong>${day.up === null ? '0 h' : nf2.format(Math.round((day.dn-day.up)*10)/10) + ' h'}</strong></div>` +
   FAC.map((f,i) => { const d = day.r[i]; return `<div class="${litF(s, f[2]) ? 'lit' : ''}"><u></u><span><b>${f[0]}</b><small>${f[1]} · ${d.min ? `sol de ${hhmm(d.a)} a ${hhmm(d.b)}` : 'sense sol directe aquest dia'}</small></span><strong>${nf2.format(Math.round(d.min/6)/10)} h</strong></div>`; }).join(''); so3dUpdate(s, up); }
/* ---------- model 3D amb sol i ombres ---------- */
/* Eixos del model (com el plànol): façana del carrer = +z (mira a 250°), +x mira a 160°. */
const AZ_X = 160, AZ_Z = 250;
let S3 = null;
const loadJS = src => new Promise((ok, ko) => { const sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = ko; document.head.appendChild(sc); });
const m3dir = (az, alt) => { const c = Math.cos(alt*rad); return [c*Math.cos((az-AZ_X)*rad), Math.sin(alt*rad), c*Math.cos((az-AZ_Z)*rad)]; };
async function so3dInit(){ if (S3) return; S3 = {ready:false}; const ld = $('#so-load'), lt = $('#so-lt'), lb = $('#so-lb'); ld.hidden = false;
  try { if (!window.THREE){ await loadJS('vendor/three.min.js'); await loadJS('vendor/OrbitControls.js'); await loadJS('vendor/GLTFLoader.js'); await loadJS('vendor/DRACOLoader.js'); } } catch(e){ lt.textContent = 'No s’ha pogut carregar el visor 3D'; setTimeout(() => ld.hidden = true, 2500); return; }
  const T = THREE, cv = $('#so-3d'); let R;
  try { R = new T.WebGLRenderer({canvas:cv, antialias:true, powerPreference:'high-performance'}); } catch(e){ lt.textContent = 'Aquest dispositiu no pot mostrar el 3D'; setTimeout(() => ld.hidden = true, 2500); return; }
  R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .95; R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  const sc = new T.Scene(), cam = new T.PerspectiveCamera(38, 1.5, .5, 2500); sc.fog = new T.Fog(0xbcd0dc, 400, 1400);
  const C0 = new T.Vector3(7.5, 6, -11);
  const hemi = new T.HemisphereLight(0xcfdcea, 0x5a6250, .45); sc.add(hemi);
  const sunL = new T.DirectionalLight(0xfff1dc, 1.6); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); const sca = sunL.shadow.camera; sca.left = -38; sca.right = 38; sca.top = 38; sca.bottom = -38; sca.near = 1; sca.far = 260; sunL.shadow.bias = -.0004; sunL.shadow.normalBias = .04; sunL.target.position.copy(C0); sc.add(sunL, sunL.target);
  /* terreny: carrer i riu davant (+z), vessant darrere (-z) */
  const mat = c => new T.MeshLambertMaterial({color:c});
  const pl = (w, d, c, x, y, z, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), mat(c)); m.rotation.x = rx ?? -Math.PI/2; m.position.set(x, y, z); m.receiveShadow = true; sc.add(m); return m; };
  pl(900, 900, 0x8a9a6c, 7.5, -.06, -11); pl(260, 12, 0x6e7275, 7.5, -.03, 9); pl(260, 2.5, 0xb9b6ad, 7.5, -.02, 2.4); pl(260, 10, 0x6f9fbf, 7.5, -.02, 22);
  const hill = pl(260, 90, 0x5d7a4c, 7.5, 20, -62, -Math.PI/2 + .5); hill.castShadow = true;
  /* serralada amb el perfil real d'horitzó */
  { const Rr = 640, pos = [], idx = []; for (let a = 0; a <= 360; a += 5){ const [dx,,dz] = m3dir(a, 0), h = Rr*Math.tan(horAt(a)*rad); pos.push(C0.x+dx*Rr, -20, C0.z+dz*Rr, C0.x+dx*Rr, h-9, C0.z+dz*Rr); }
    for (let i = 0; i < 72; i++){ const a = i*2; idx.push(a, a+1, a+2, a+1, a+3, a+2); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    sc.add(new T.Mesh(g, new T.MeshBasicMaterial({color:0x3d5240, side:T.DoubleSide, fog:true}))); }
  const sunM = new T.Mesh(new T.SphereGeometry(9, 20, 12), new T.MeshBasicMaterial({color:0xffe08a, fog:false})); sc.add(sunM);
  /* rosa dels vents */
  const txt = (t, col) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = col; x.beginPath(); x.arc(64,64,52,0,7); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, 68); const s = new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c)})); s.scale.set(3.2, 3.2, 1); return s; };
  [['N',0,'#1c201d'],['E',90,'#7d857f'],['S',180,'#7d857f'],['O',270,'#7d857f']].forEach(([t,a,c]) => { const [dx,,dz] = m3dir(a, 0), sp = txt(t, c); sp.position.set(C0.x+dx*30, 1.5, C0.z+dz*30); sc.add(sp); });
  const ctl = new T.OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = .08; ctl.minDistance = 12; ctl.maxDistance = 160; ctl.maxPolarAngle = Math.PI*.49; ctl.target.copy(C0);
  const views = {carrer:[-38, 16, 52], aeri:[48, 78, 58]}; cam.position.set(C0.x+views.carrer[0], C0.y+views.carrer[1], C0.z+views.carrer[2]);
  Object.assign(S3, {T, R, sc, cam, ctl, sunL, sunM, hemi, C0, views, fly:null});
  const resize = () => { const st = cv.parentElement, w = st.clientWidth, h = st.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); }; new ResizeObserver(resize).observe(cv.parentElement); resize();
  const loop = () => { if (route.s === 'sol'){ if (S3.fly){ const k = Math.min(1, (performance.now()-S3.fly.t)/900), e = k < .5 ? 4*k*k*k : 1-Math.pow(-2*k+2,3)/2; cam.position.lerpVectors(S3.fly.a, S3.fly.b, e); if (k >= 1) S3.fly = null; } ctl.update(); R.render(sc, cam); } requestAnimationFrame(loop); }; loop();
  /* model d'ArchiCAD */
  try { const dl = new T.DRACOLoader(); dl.setDecoderPath('vendor/draco/'); const gl = new T.GLTFLoader(); gl.setDRACOLoader(dl);
    await new Promise((ok, ko) => gl.load('model/aixovall.glb', g => { g.scene.traverse(ob => { if (!ob.isMesh) return; const ms = Array.isArray(ob.material) ? ob.material : [ob.material]; let glass = false; ms.forEach(m => { m.metalness = 0; if (m.roughness < .5) m.roughness = .5; if (m.transparent){ m.depthWrite = false; glass = true; } m.needsUpdate = true; }); ob.castShadow = !glass; ob.receiveShadow = true; }); sc.add(g.scene); ok(); }, ev => { const tot = ev.total || 2700000; lb.style.width = Math.min(96, ev.loaded/tot*96) + '%'; lt.textContent = 'Carregant el model 3D… ' + Math.round(Math.min(1, ev.loaded/tot)*100) + ' %'; }, ko));
    lb.style.width = '100%'; S3.ready = true; $('#s-sol').classList.add('s3on'); $('#so-view').hidden = false; setTimeout(() => ld.hidden = true, 300); soRender();
  } catch(e){ console.error(e); lt.textContent = 'No s’ha pogut carregar el model 3D'; setTimeout(() => ld.hidden = true, 2500); } }
function so3dUpdate(s, up){ if (!S3 || !S3.sc) return; const T = S3.T, d = m3dir(s.az, s.alt), C0 = S3.C0;
  S3.sunL.position.set(C0.x+d[0]*120, C0.y+d[1]*120, C0.z+d[2]*120); const day = Math.max(0, Math.min(1, (s.alt+4)/10));
  S3.sunL.intensity = up ? 2.1*Math.min(1, Math.max(.35, Math.sin(s.alt*rad)*2.2)) : 0; S3.sunL.color.setHSL(.1, .9, s.alt < 12 ? .72 : .9);
  S3.hemi.intensity = .1 + .38*day; S3.R.toneMappingExposure = .5 + .4*day;
  const sky = new T.Color(0x0e1626).lerp(new T.Color(up ? 0xbcd6ea : 0x9fb1c2), day); S3.sc.background = sky; S3.sc.fog.color.copy(sky);
  S3.sunM.visible = s.alt > -1; S3.sunM.position.set(C0.x+d[0]*520, C0.y+d[1]*520, C0.z+d[2]*520); S3.sunM.material.color.set(up ? 0xffe08a : 0xc9b98a); }
$('#so-view').onclick = e => { const b = e.target.closest('[data-cam]'); if (!b || !S3 || !S3.cam) return; const C0 = S3.C0; let v;
  if (b.dataset.cam === 'sol'){ const s = sun(SO.m, SO.h), d = m3dir(s.az, Math.max(8, s.alt)); v = new S3.T.Vector3(C0.x+d[0]*55, C0.y+d[1]*55, C0.z+d[2]*55); } else { const o = S3.views[b.dataset.cam]; v = new S3.T.Vector3(C0.x+o[0], C0.y+o[1], C0.z+o[2]); }
  S3.fly = {a:S3.cam.position.clone(), b:v, t:performance.now()}; };
const soSet = (m, h) => { SO = {m, h}; setHash(`sol-m${m}-h${Math.round(h*100)}`, true); soRender(); };
$('#so-m').oninput = e => soSet(+e.target.value, SO.h); $('#so-h').oninput = e => soSet(SO.m, +e.target.value);
$('#so-now').onclick = () => { const d = new Date(); soSet(d.getMonth()+1, Math.min(22, Math.max(5, Math.round((d.getHours()+d.getMinutes()/60)*4)/4))); };
$('#so-play').onclick = () => { clearInterval(soT); let h = 5; soT = setInterval(() => { if (route.s !== 'sol' || h > 22){ clearInterval(soT); return; } soSet(SO.m, h); h += .25; }, 90); };

/* ================= contacte ================= */
$('#cform').addEventListener('submit', e => { e.preventDefault(); const n = $('#cn').value.trim(), m = $('#cm').value.trim(); const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(`${(window.axsTr || (t => t))('Hola, soc')} ${n}. ${m || (window.axsTr || (t => t))('M’interessa Aixovall Residencial.')}`)}`; const o = $('#cout'); o.hidden = false; o.innerHTML = `Missatge preparat. <a href="${url}" target="_blank" rel="noopener"><b>Obre WhatsApp per enviar-lo</b></a>.`; });

/* ================= ENCAMINAMENT PER HASH (cada pantalla i configuració té enllaç) ================= */
let route = {s:'inici'}, silent = false;
function setHash(h, replace){ if (location.hash.slice(1) === h) return; silent = true; try { if (replace) history.replaceState(null, '', '#' + h); else location.hash = h; } catch(e){ location.hash = h; } setTimeout(() => silent = false, 0); }
function parse(){ const p = location.hash.slice(1).toLowerCase().split('-'), s = p[0];
  if (s === 'edifici'){ const v = p.find(x => /^v[123]$/.test(x)); return {s, v:v ? +v[1]-1 : 0, night:p.includes('nit') ? 1 : 0, mati:p.includes('mati') ? 1 : 0, mig:p.includes('migdia') ? 1 : 0}; }
  if (s === 'planta'){ const f = p[1] === 'pb' ? 0 : +p[1]; return {s, f:FLOOR[f] ? f : 1}; }
  if (s === 'cfg'){ const hc = byId(p.slice(1,3).join('-')); if (hc && hc.cfg){ location.href = hc.cfg; return {s:'pis', id:hc.id}; } }
  if (s === 'pis' || s === 'cfg'){ const id = p.slice(1,3).join('-'); if (!byId(id)) return {s:'habitatges'}; if (s === 'pis') return {s, id, tab:p[3]};
    if (!cfgOK(byId(id))) return {s:'pis', id}; const st = p.find((x,i) => i > 2 && /^p\d$/.test(x)); const c = p.slice(3).find(x => /^[a-d0]{16}$/.test(x)); return {s, id, step:st ? +st[1]-1 : 0, c:c ? c.toUpperCase() : ''}; }
  if (s === 'sol'){ const m = p.find(x => /^m\d+$/.test(x)), h = p.find(x => /^h\d+$/.test(x)); return {s, m:m ? Math.min(12, Math.max(1, +m.slice(1))) : 6, h:h ? Math.min(22, Math.max(5, +h.slice(1)/100)) : 15}; }
  if (s === 'aparcament'){ const pl = (p.find(x => /^p\d+$/.test(x)) || '').toUpperCase(); return {s, p:PKS[pl] ? pl : 'P5', t:p.includes('doble') ? 'B' : 'A'}; }
  if (s === 'ubicacio') return {s:'entorn'};
  return {s:['habitatges','galeria','obra','entorn','contacte'].includes(s) ? s : 'inici'}; }
const TITLES = {aparcament:'Aparcament',entorn:'Entorn',sol:'Sol i orientació',edifici:'Edifici',planta:'Plantes',habitatges:'Habitatges',galeria:'Galeria',obra:'Avanç de l’obra',ubicacio:'Ubicació',contacte:'Contacte'};
function go(){ if (silent) return; const r = route = parse(); closeSheet(); setMenu(false);
  if (r.s === 'inici'){ $('#intro').classList.remove('out'); $('#introv').play().catch(() => {}); return; }
  $('#intro').classList.add('out'); $('#introv').pause(); $('#app').hidden = false;
  $$('.screen').forEach(el => el.classList.toggle('on', el.id === 's-' + r.s));
  $$('#m-nav a').forEach(a => a.classList.toggle('on', a.dataset.s === r.s || (r.s === 'pis' && a.dataset.s === 'habitatges')));
  $('#top').hidden = r.s === 'cfg'; $('#dn').hidden = r.s !== 'edifici'; $('#pis-tabs').hidden = r.s !== 'pis'; $('#b-back').hidden = !['planta','pis'].includes(r.s);
  const light = !['edifici','entorn','sol'].includes(r.s); $('#crumb').className = 'crumb' + (light ? ' inkc' : ''); $('#crumb').textContent = r.s === 'planta' ? FLOOR[r.f].n : r.s === 'pis' ? '' : r.s === 'edifici' ? '' : '';
  document.title = (r.s === 'pis' || r.s === 'cfg' ? byId(r.id).name + (r.s === 'cfg' ? ' · Configurador' : '') : TITLES[r.s]) + ' · Aixovall Residencial';
  requestAnimationFrame(() => {
    if (r.s === 'edifici'){ eState = {v:r.v, night:r.night, mati:r.mati, mig:r.mig}; ePZ.fit(); if (window.__enter){ window.__enter = 0; eStartAuto(); } eRender(false); PX.sync && PX.sync(); setTimeout(() => $('#e-hint').style.opacity = 0, 5000); }
    if (r.s === 'planta') pRender(r.f);
    if (r.s === 'habitatges') hRender(); else $('#cmpbar').classList.remove('on');
    if (r.s === 'pis') uRender(byId(r.id), r.tab);
    if (r.s === 'cfg') cRender(byId(r.id), r.step, r.c);
    if (r.s === 'entorn'){ if (!$('#en-svg').childElementCount) enBuild(); enRocket(); }
    if (r.s === 'sol'){ SO = {m:r.m, h:r.h}; soRender(); so3dInit(); }
    if (r.s === 'aparcament'){ AP = {p:r.p, t:PKPAIR[r.p] ? 'B' : 'A'}; apRender(true); }
  }); }
/* init */
$('#app').hidden = false;
ePZ = new PZ($('#e-vp'), $('#e-pz'), 1600, 900, 'cover'); ePZ.fy = .45; ePZ.onmove = () => $('#e-hint').style.opacity = 0;
pPZ = new PZ($('#p-vp'), $('#p-pz'), 968, 1173, 'contain'); pPZ.pad = 14; pPZ.padT = 70; pPZ.padB = 64;
uPZ = new PZ($('#u-vp'), $('#u-pz'), 1191, 1685, 'contain'); uPZ.pad = 16; uPZ.padT = 74; uPZ.padB = 150;
$('#app').hidden = true;
$('#introv').src = 'video/intro.mp4'; $('#introv').play().catch(() => {});
$('#enter').onclick = () => { window.__enter = 1; location.hash = 'edifici'; };
window.AXSR = { HOMES, byId, openSheet, closeSheet, toast, badge, ST, closeMenu: () => setMenu(false), get route(){ return route; }, get uHome(){ return uHome; },
  rerender(){ try { if (route && route.s === 'pis' && uHome) uRender(uHome, uTab); hRender(); if (route && route.s === 'planta') pRender(pFloor); } catch(e){} } };
addEventListener('hashchange', go); go();
})();
