/* Aixovall Residencial · mode agent iShowi (v4.1).
 * Accés al final del menú; amb sessió, estat real de cada habitatge i accions del Hub des del showroom.
 * Parla només amb /wp-json/axr/v1/agent/* (el servidor de la web fa de pont amb l'iShowi Hub). */
(() => {
'use strict';
const B = window.AXA_BOOT; if (!B || !B.on) return;
const R = window.AXSR || {};
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });
const eur = n => nf.format(+n || 0) + ' €';
const FASE = { disponible: 'available', aparaulat: 'agreed', reserva_tecnica: 'reserved', reserva_confirmada: 'confirmed', vendida: 'sold' };
const FTXT = { disponible: 'Disponible', aparaulat: 'Aparaulat', reserva_tecnica: 'Reserva tècnica', reserva_confirmada: 'Reserva confirmada', vendida: 'Venut' };
const DOCST = { pendiente: 'Pendent de validar', validado: 'Validat', rechazado: 'Rebutjat' };
const toast = t => (R.toast ? R.toast(t) : alert(t));
const sheet = (html, after) => { if (R.openSheet) R.openSheet(`<div class="ag">${html}</div>`); else modal(html); after && after($('#sh-body') || $('#ag-modal')); };
const closeSheet = () => { R.closeSheet && R.closeSheet(); const m = $('#ag-modal'); m && m.remove(); };
function modal(html){ let m = $('#ag-modal'); if (!m){ m = document.createElement('div'); m.id = 'ag-modal'; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) m.remove(); }); } m.innerHTML = `<div class="ag ag-box"><button class="ag-x" aria-label="Tancar">×</button>${html}</div>`; m.querySelector('.ag-x').onclick = () => m.remove(); }

let S = null, busy = false, cur = null, curTab = 'resum';

async function api(path, o = {}){
  const opt = { method: o.method || 'GET', credentials: 'same-origin', headers: { 'X-AXR-Agent': '1' } };
  if (o.json){ opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(o.json); }
  if (o.form){ opt.method = 'POST'; opt.body = o.form; }
  const r = await fetch(B.rest + path, opt);
  if (o.blob){ if (!r.ok){ let e = 'No s’ha pogut generar.'; try { e = (await r.json()).error || e; } catch(x){} throw new Error(e); } return r; }
  let j = {}; try { j = await r.json(); } catch(e){}
  if (!r.ok || j.ok === false){ const err = new Error(j.error || 'Error ' + r.status); err.code = r.status; if (r.status === 401){ S = null; paint(); } throw err; }
  return j;
}
const run = async (btn, fn) => { if (busy) return; busy = true; const t = btn && btn.innerHTML; if (btn){ btn.disabled = true; btn.innerHTML = 'Un moment…'; } try { await fn(); } catch(e){ toast(e.message); } finally { busy = false; if (btn && btn.isConnected){ btn.disabled = false; btn.innerHTML = t; } } };

/* ---------- estat ---------- */
async function load(){
  try { S = await api('estat'); } catch(e){ S = null; if (e.code && e.code !== 401) toast(e.message); }
  paint();
  return S;
}
function paint(){
  document.body.classList.toggle('ag-on', !!S);
  if (S && R.HOMES){
    for (const v of S.viviendas){ const h = R.HOMES.find(x => x.id === v.referencia); if (!h) continue; h.status = FASE[v.fase] || h.status; if (v.precio) h.price = v.precio; h._ag = v; }
    R.rerender && R.rerender();
  }
  menu();
  const ub = $('#ag-u'); if (ub) ub.hidden = !S;
}
const viv = ref => S && S.viviendas.find(v => v.referencia === ref);
const homeName = ref => { const h = R.HOMES && R.HOMES.find(x => x.id === ref); return h ? h.name : ref; };

/* ---------- menú ---------- */
function menu(){
  const nav = $('#m-nav'); if (!nav) return;
  let box = $('#ag-menu'); if (!box){ box = document.createElement('div'); box.id = 'ag-menu'; nav.insertAdjacentElement('afterend', box); }
  if (!S){ box.innerHTML = `<button class="ag-mlink" data-ag="login">${ico('key')}Accés agents iShowi</button>`; return; }
  const e = S.actor.entidad || {};
  box.innerHTML = `<div class="ag-who"><b>Mode agent</b><span>${esc(S.actor.nombre)}</span>${e.nombre ? `<small>${esc(e.nombre)}</small>` : ''}</div>
  <button class="ag-mlink" data-ag="units">${ico('grid')}Les meves unitats</button><button class="ag-mlink" data-ag="files">${ico('doc')}Descarregables</button><button class="ag-mlink sub" data-ag="out">Sortir del mode agent</button>`;
}
function ico(n){ const p = { key: 'M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l2.1-2.1A4 4 0 0 1 15 7z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6', up: 'M12 16V4M7 9l5-5 5 5M5 20h14' }[n] || ''; return `<svg class="ag-i" viewBox="0 0 24 24" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }

document.addEventListener('click', e => {
  const a = e.target.closest('[data-ag]'); if (a){ e.preventDefault(); const k = a.dataset.ag; R.closeMenu ? R.closeMenu() : ($('#m-x') && $('#m-x').click());
    if (k === 'login') return login(); if (k === 'out') return run(null, async () => { await api('logout', { json: {} }); S = null; paint(); location.reload(); });
    if (k === 'files') return files(); if (k === 'units') return units(); }
  const u = e.target.closest('[data-ag-unit]'); if (u){ e.preventDefault(); panel(u.dataset.agUnit, u.dataset.agTab || 'resum'); }
});

/* ---------- accés ---------- */
function login(msg){
  sheet(`<div class="sh-h"><h2>Accés agents iShowi</h2></div><p class="sub">Entra amb el teu usuari de l’iShowi Hub per veure l’estat real dels habitatges i aparaular, reservar o pujar documents.</p>
  ${msg ? `<p class="ag-err">${esc(msg)}</p>` : ''}
  <form class="ag-f" id="ag-login"><label>Usuari o correu<input name="usuario" autocomplete="username" required></label><label>Contrasenya<input name="clave" type="password" autocomplete="current-password" required></label>
  <button class="btn wood" type="submit">Entrar</button></form>
  ${B.google ? `<div class="ag-or"><span>o bé</span></div><a class="btn ghost ag-g" href="${esc(B.google)}"><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.2-8.5 2.2-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Entrar amb Google</a>` : ''}
  <p class="note">Només per a immobiliàries i equips autoritzats a la promoció. Si no tens accés, demana’l a BoomBizz.</p>`, b => {
    $('#ag-login', b).onsubmit = ev => { ev.preventDefault(); const f = new FormData(ev.target); run(ev.submitter, async () => { await api('login', { json: { usuario: f.get('usuario'), clave: f.get('clave') } }); await load(); closeSheet(); toast('Mode agent actiu'); }); };
  });
}

/* ---------- llistes ---------- */
function units(){
  const mine = S.viviendas.filter(v => v.mia);
  sheet(`<div class="sh-h"><h2>Les meves unitats</h2></div><p class="sub">${esc(S.promocion.nombre)} · ${mine.length ? mine.length + ' en curs' : 'cap operació en curs'}</p>
  ${mine.length ? `<ul class="ag-list">${mine.map(v => `<li><button data-ag-unit="${esc(v.referencia)}"><b>${esc(homeName(v.referencia))}</b><span class="ag-st ag-${esc(v.fase)}">${esc(v.estado_txt || FTXT[v.fase])}</span><small>${v.operacion && v.operacion.comprador ? esc(v.operacion.comprador.nombre) : ''}</small></button></li>`).join('')}</ul>` : '<p class="note">Quan aparaulis o reservis un habitatge, el trobaràs aquí.</p>'}
  <h3>Disponibles</h3><ul class="ag-list">${S.viviendas.filter(v => v.fase === 'disponible').map(v => `<li><button data-ag-unit="${esc(v.referencia)}"><b>${esc(homeName(v.referencia))}</b><span class="ag-st ag-disponible">Disponible</span><small>${eur(v.precio)}</small></button></li>`).join('') || '<li class="note">No en queda cap.</li>'}</ul>`);
}
function files(){
  const g = {}; for (const f of S.descarregables || []) (g[f.grup] = g[f.grup] || []).push(f);
  sheet(`<div class="sh-h"><h2>Descarregables</h2></div><p class="sub">Documentació de ${esc(S.promocion.nombre)} per als teus clients.</p>
  ${Object.keys(g).map(k => `<h3>${esc(k)}</h3><ul class="ag-files">${g[k].map(f => `<li><a target="_blank" rel="noopener" href="${esc(B.rest + 'descarregable?f=' + encodeURIComponent(f.f))}">${ico('doc')}<span>${esc(f.nom)}</span><small>PDF · ${f.kb > 1024 ? nf.format(f.kb / 1024) + ' MB' : f.kb + ' kB'}</small></a></li>`).join('')}</ul>`).join('') || '<p class="note">Encara no hi ha documents.</p>'}`);
}

/* ---------- fitxa d'agent d'un habitatge ---------- */
function hasta(s){ if (!s) return ''; const m = String(s).match(/(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/); return m ? `${m[3]}/${m[2]} a les ${m[4]}:${m[5]}` : s; }
function panel(ref, tab){
  const v = viv(ref); if (!v) return toast('Aquest habitatge no és al Hub.');
  cur = ref; curTab = tab || 'resum';
  const head = `<div class="sh-h"><h2>${esc(homeName(ref))}</h2><span class="ag-st ag-${esc(v.fase)}">${esc(FTXT[v.fase])}</span></div><p class="sub">${esc(v.tipologia || '')}${v.dormitorios ? ' · ' + v.dormitorios + ' dormitoris' : ''}${v.m2_utiles ? ' · ' + nf.format(v.m2_utiles) + ' m² útils' : ''} · ${eur(v.precio)} + IGI</p>`;
  if (!v.mia && v.fase !== 'disponible'){
    return sheet(head + `<p class="ag-box-note">Aquest habitatge està <b>${esc(FTXT[v.fase].toLowerCase())}</b> per una altra part. Si el teu client hi està interessat, parla amb la promotora o amb BoomBizz.</p>`);
  }
  if (!v.mia){
    return sheet(head + `<div class="ag-acts"><button class="btn wood" data-act="aparaular">Aparaular (${S.parametros.bloqueo_horas} h)</button><button class="btn" data-act="reservar">Reservar</button></div>
    <p class="note">Aparaular el bloqueja ${S.parametros.bloqueo_horas} hores per a les altres immobiliàries. Per reservar-lo, aparaula’l i puja el contracte de reserva signat i el justificant de la transferència de ${eur(S.parametros.reserva_importe)}.</p>
    <div class="ag-acts two"><button class="btn ghost" data-act="contracte">Generar contracte de reserva</button>${S.cfg[ref] ? `<a class="btn ghost" href="${esc(S.cfg[ref])}">Obrir el configurador</a>` : ''}</div>`, b => bindFree(b, v));
  }
  const tabs = [['resum', 'Resum'], ['comprador', 'Comprador'], ['documents', 'Documents'], ['config', 'Configuració'], ['placa', 'Plaça'], ['contracte', 'Contracte']];
  sheet(head + `<div class="ag-tabs" role="tablist">${tabs.map(t => `<button role="tab" class="${t[0] === curTab ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div id="ag-pane"></div>`, b => {
    b.querySelector('.ag-tabs').onclick = e => { const t = e.target.closest('[data-tab]'); if (!t) return; curTab = t.dataset.tab; b.querySelectorAll('.ag-tabs button').forEach(x => x.classList.toggle('on', x === t)); pane(b, v); };
    pane(b, v);
  });
}
async function refresh(tab){ await load(); if (cur) panel(cur, tab || curTab); }

function bindFree(b, v){
  b.querySelectorAll('[data-act]').forEach(btn => btn.onclick = () => {
    const a = btn.dataset.act;
    if (a === 'contracte') return contractForm(v);
    buyerForm(v, a === 'reservar' ? 'Reservar' : 'Aparaular', async (data, sb) => { await api('aparaular', { json: Object.assign({ referencia: v.referencia }, data) }); toast(a === 'reservar' ? 'Aparaulat. Ara puja el contracte de reserva signat.' : 'Habitatge aparaulat ' + S.parametros.bloqueo_horas + ' h'); await refresh(a === 'reservar' ? 'documents' : 'resum'); });
  });
}

function buyerFields(c = {}){
  return `<label>Nom i cognoms del comprador *<input name="nombre" required value="${esc(c.nombre)}"></label>
  <div class="ag-2"><label>Document (passaport, DNI…)<input name="documento" value="${esc(c.documento)}"></label><label>Telèfon<input name="telefono" type="tel" value="${esc(c.telefono)}"></label></div>
  <label>Correu<input name="email" type="email" value="${esc(c.email)}"></label>
  <label>Adreça<input name="direccion" value="${esc(c.direccion)}"></label>
  <label>Altres compradors (si n’hi ha)<input name="otros_compradores" value="${esc(c.otros_compradores)}"></label>
  <label>Idioma del comprador<select name="idioma">${[['ca', 'Català'], ['es', 'Castellà'], ['fr', 'Francès'], ['en', 'Anglès']].map(l => `<option value="${l[0]}"${(c.idioma || 'ca') === l[0] ? ' selected' : ''}>${l[1]}</option>`).join('')}</select></label>`;
}
const formData = f => Object.fromEntries(new FormData(f).entries());
function buyerForm(v, verb, onok){
  sheet(`<div class="sh-h"><h2>${esc(verb)} ${esc(homeName(v.referencia))}</h2></div><p class="sub">Les dades queden al Hub, a la teva operació. Només les veuen la promotora i BoomBizz.</p>
  <form class="ag-f" id="ag-buyer">${buyerFields()}<button class="btn wood" type="submit">${esc(verb)}</button></form>`, b => {
    $('#ag-buyer', b).onsubmit = e => { e.preventDefault(); run(e.submitter, () => onok(formData(e.target), e.submitter)); };
  });
}

function pane(b, v){
  const p = b.querySelector('#ag-pane'), op = v.operacion || {};
  if (curTab === 'resum'){
    p.innerHTML = `<dl class="ag-dl"><div><dt>Estat al Hub</dt><dd>${esc(v.estado_txt)}${v.estado_interno === 'bloqueo' && v.bloqueo_hasta ? `<small>Caduca el ${esc(hasta(v.bloqueo_hasta))} si no es puja el contracte de reserva</small>` : ''}</dd></div>
    <div><dt>Preu total</dt><dd>${eur(op.precio_total)}<small>${op.precio_anexos ? 'Habitatge ' + eur(op.precio_contractual) + ' + plaça ' + eur(op.precio_anexos) : 'Sense annexos'} · sense IGI</small></dd></div>
    <div><dt>Reserva</dt><dd>${eur(op.reserva_importe)}</dd></div><div><dt>Arres (10 %)</dt><dd>${eur(op.arras_total)}<small>Pendent de transferir: ${eur(op.arras_transferencia)}</small></dd></div>
    <div><dt>Comprador</dt><dd>${esc(op.comprador ? op.comprador.nombre : '—')}</dd></div><div><dt>Registrat per</dt><dd>${esc(op.registrado_por || '')}</dd></div></dl>
    <div class="ag-acts two">${v.estado_interno === 'bloqueo' ? `<button class="btn" data-go="documents">${ico('up')}Reservar: pujar contracte</button><button class="btn ghost" id="ag-free">Alliberar</button>` : `<button class="btn" data-go="documents">Documents</button><button class="btn ghost" data-go="contracte">Contracte de reserva</button>`}</div>`;
    p.querySelectorAll('[data-go]').forEach(x => x.onclick = () => b.querySelector(`[data-tab="${x.dataset.go}"]`).click());
    const fr = p.querySelector('#ag-free'); if (fr) fr.onclick = () => { if (confirm('Alliberar ' + homeName(v.referencia) + '? Tornarà a estar disponible per a tothom.')) run(fr, async () => { await api('alliberar', { json: { referencia: v.referencia } }); toast('Habitatge alliberat'); closeSheet(); await load(); }); };
  }
  if (curTab === 'comprador'){
    p.innerHTML = `<form class="ag-f" id="ag-cmp">${buyerFields(op.comprador || {})}<button class="btn wood" type="submit">Desar les dades</button></form>`;
    p.querySelector('#ag-cmp').onsubmit = e => { e.preventDefault(); run(e.submitter, async () => { await api('comprador', { json: Object.assign({ referencia: v.referencia }, formData(e.target)) }); toast('Dades desades al Hub'); await refresh('comprador'); }); };
  }
  if (curTab === 'documents'){
    const docs = op.documentos || [];
    p.innerHTML = `<ul class="ag-docs">${docs.map(d => `<li><a target="_blank" rel="noopener" href="${esc(B.rest + 'document?id=' + d.id)}">${ico('doc')}<span><b>${esc(d.tipo_txt)}</b><small>${esc(d.nombre_original)} · ${esc(d.subido_nombre)}</small></span></a><em class="ag-doc ag-d-${esc(d.estado)}">${esc(DOCST[d.estado] || d.estado)}</em></li>`).join('') || '<li class="note">Encara no hi ha cap document.</li>'}</ul>
    <form class="ag-f ag-up" id="ag-up"><label>Tipus de document<select name="tipo">${Object.entries(S.tipos_documento).map(([k, t]) => `<option value="${esc(k)}"${k === (v.estado_interno === 'bloqueo' ? 'contrato_reserva' : 'justificante_envio') ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
    <label class="ag-file">Fitxer (PDF, JPG o PNG, fins a 10 MB)<input type="file" name="archivo" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required></label>
    <button class="btn wood" type="submit">${ico('up')}Pujar al Hub</button></form>
    <p class="note">Reserva: contracte de reserva signat + justificant d’enviament de la transferència del comprador (el justificant d’ingrés el puja la promotora). Arres: contracte d’arres signat + justificant de la transferència de les arres. El Hub els valida i avisa la promotora.</p>`;
    p.querySelector('#ag-up').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); f.append('referencia', v.referencia); f.append('fase', /arras/.test(f.get('tipo')) || ['reserva_confirmada', 'arras_subidas'].includes(v.estado_interno) ? 'arras' : 'reserva'); run(e.submitter, async () => { await api('document', { form: f }); toast('Document pujat al Hub'); await refresh('documents'); }); };
  }
  if (curTab === 'config'){
    const c = op.configuracion, w = op.configuracion_web, ex = {}; (S.extras || []).forEach(x => ex[x.codigo] = x);
    const changed = c ? c.lineas.filter(l => { const x = ex[l.codigo]; return !x || x.version !== l.version || +x.pvp !== +l.pvp; }) : [];
    const closed = c ? c.lineas.filter(l => ex[l.codigo] && ex[l.codigo].cerrado) : [];
    p.innerHTML = (c ? `<div class="ag-cfg"><p><b>${c.estado === 'borrador' ? 'Configuració provisional' : c.estado === 'aceptada' ? 'Configuració acceptada pel comprador' : 'Configuració facturada'}</b> · ${esc(c.creado_por)} · ${esc(String(c.creado).slice(0, 10))}</p>
      <ul class="ag-lines">${c.lineas.map(l => `<li><span>${esc(l.nombre)}<small>${esc(l.codigo)}${ex[l.codigo] && ex[l.codigo].fecha_cierre ? ' · tanca el ' + esc(ex[l.codigo].fecha_cierre.split('-').reverse().join('/')) : ''}</small></span><b>${eur(l.importe)}</b></li>`).join('')}</ul><p class="ag-tot">Total extres <b>${eur(c.total_pvp)}</b> + IGI</p>
      ${changed.length ? `<p class="ag-warn">Han canviat preus o versions d’alguns acabats des que es va desar (${changed.map(l => esc(l.codigo)).join(', ')}). Torna-la a desar des del configurador per actualitzar-la.</p>` : ''}
      ${closed.length ? `<p class="ag-warn">Ja ha passat la data de tancament de: ${closed.map(l => esc(l.nombre)).join(', ')}. Per canviar-los cal demanar una excepció a la promotora.</p>` : ''}</div>` : '<p class="note">Encara no hi ha cap configuració desada per a aquest habitatge.</p>')
      + (w ? `<p class="note">Última versió desada des de la web: ${esc(String(w.fecha).slice(0, 16))} per ${esc(w.por)} · ${eur(w.total)}${w.fuera_catalogo && w.fuera_catalogo.length ? ' · fora del catàleg del Hub: ' + esc(w.fuera_catalogo.join(', ')) : ''}${w.enlace ? ` · <a href="${esc(w.enlace)}">reobrir-la</a>` : ''}</p>` : '')
      + `<p class="note">És provisional fins al tancament de cada acabat: els preus i les opcions del configurador poden canviar fins aleshores.</p>`
      + (S.cfg[v.referencia] ? `<a class="btn wood" href="${esc(S.cfg[v.referencia])}">Obrir el configurador</a>` : '');
  }
  if (curTab === 'placa'){
    const park = (S.anexos || []).filter(a => a.tipo === 'parking'), mine = park.find(a => a.mia && a.vivienda_ref === v.referencia), free = park.filter(a => a.estado === 'libre');
    p.innerHTML = `<p>${mine ? `Plaça assignada: <b>${esc(mine.referencia)}</b> (${mine.modalidad === 'doble' ? 'doble' : 'individual'}, ${eur(mine.precio)} + IGI)` : 'Aquest habitatge encara no té plaça d’aparcament.'}</p>
    ${free.length ? `<form class="ag-f" id="ag-pk"><label>${mine ? 'Canviar per' : 'Triar plaça'}<select name="anexo">${free.map(a => `<option value="${esc(a.referencia)}">${esc(a.referencia)} · ${a.modalidad === 'doble' ? 'doble' : 'individual'} · ${eur(a.precio)}</option>`).join('')}</select></label><button class="btn wood" type="submit">${mine ? 'Canviar la plaça' : 'Afegir la plaça'}</button></form>` : '<p class="note">No queda cap plaça lliure.</p>'}
    ${mine ? '<button class="btn ghost" id="ag-pk-x">Treure la plaça</button>' : ''}<p class="note">El preu de la plaça se suma al de l’habitatge i segueix el mateix calendari de pagaments. Una sola plaça (individual o doble) per habitatge.</p>`;
    const f = p.querySelector('#ag-pk'); if (f) f.onsubmit = e => { e.preventDefault(); run(e.submitter, async () => { await api('placa', { json: { referencia: v.referencia, anexo: new FormData(e.target).get('anexo') } }); toast('Plaça assignada'); await refresh('placa'); }); };
    const x = p.querySelector('#ag-pk-x'); if (x) x.onclick = () => run(x, async () => { await api('placa', { json: { referencia: v.referencia, anexo: '' } }); toast('Plaça alliberada'); await refresh('placa'); });
  }
  if (curTab === 'contracte') contractInline(p, v);
}

/* ---------- contracte de reserva ---------- */
function contractHTML(v){
  const c = (v.operacion && v.operacion.comprador) || {}, d = S.contracte || {}, today = new Date().toISOString().slice(0, 10);
  const int = [['rao', 'Raó social *'], ['comercial', 'Nom comercial'], ['nrt', 'NRT *'], ['domicili', 'Domicili social *'], ['poblacio', 'Població'], ['representant', 'Representant que signa *'], ['carrec', 'En qualitat de'], ['banc', 'Entitat bancària'], ['iban', 'IBAN per a la reserva *'], ['email', 'Correu per a protecció de dades']];
  return `<form class="ag-f" id="ag-ct"><p class="note">Model de contracte de reserva de la promoció, a nom de la teva immobiliària. Es descarrega en Word (.docx) per revisar-lo i signar-lo.</p>
  <label>Nom i cognoms del comprador *<input name="nom" required value="${esc(c.nombre)}"></label>
  <div class="ag-2"><label>Nacionalitat<input name="nacionalitat" value="andorrana"></label><label>Tipus de document<select name="tipus_doc"><option>passaport</option><option>DNI</option><option>NIE</option><option>document d’identitat</option></select></label></div>
  <div class="ag-2"><label>Número de document *<input name="num_doc" required value="${esc(c.documento)}"></label><label>Telèfon<input name="telefon" value="${esc(c.telefono)}"></label></div>
  <label>Correu<input name="email" value="${esc(c.email)}"></label><label>Adreça<input name="adreca" value="${esc(c.direccion)}"></label>
  <div class="ag-2"><label>Lloc de signatura<input name="lloc" value="${esc(d.poblacio || 'Andorra la Vella')}"></label><label>Data<input type="date" name="data" value="${today}"></label></div>
  <details${d.rao && d.nrt && d.iban && d.representant ? '' : ' open'}><summary>Dades de la immobiliària (es recorden per a la propera vegada)</summary>${int.map(([k, l]) => `<label>${l}<input name="int_${k}" value="${esc(d[k])}"></label>`).join('')}</details>
  <button class="btn wood" type="submit">${ico('doc')}Generar contracte de reserva</button></form>`;
}
function bindContract(root, v){
  root.querySelector('#ag-ct').onsubmit = e => { e.preventDefault(); run(e.submitter, async () => {
    const r = await api('contracte', { json: Object.assign({ referencia: v.referencia }, formData(e.target)), blob: true });
    const cd = r.headers.get('content-disposition') || '', m = cd.match(/filename\*=UTF-8''([^;]+)/) || cd.match(/filename="([^"]+)"/);
    const url = URL.createObjectURL(await r.blob()), a = document.createElement('a'); a.href = url; a.download = m ? decodeURIComponent(m[1]) : 'Contracte-reserva.docx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Contracte descarregat'); S.contracte = Object.assign({}, S.contracte, Object.fromEntries([...new FormData(e.target).entries()].filter(([k]) => k.startsWith('int_')).map(([k, x]) => [k.slice(4), x])));
  }); };
}
function contractInline(p, v){ p.innerHTML = contractHTML(v); bindContract(p, v); }
function contractForm(v){ sheet(`<div class="sh-h"><h2>Contracte de reserva · ${esc(homeName(v.referencia))}</h2></div>` + contractHTML(v), b => bindContract(b, v)); }

/* ---------- ganxos del showroom ---------- */
window.AXA = {
  unit(h){ const bar = $('#s-pis .ubar'); if (!bar) return; let b = $('#ag-u'); if (!b){ b = document.createElement('button'); b.className = 'btn ag-btn'; b.id = 'ag-u'; bar.appendChild(b); b.onclick = () => panel(b.dataset.ref); } b.dataset.ref = h.id; const v = viv(h.id); b.hidden = !S; b.innerHTML = v && v.mia ? 'La meva unitat' : 'Agent'; },
  sheet(h){ if (!S) return ''; const v = viv(h.id); if (!v) return ''; return `<div class="ag-sheet-cta"><button class="btn ag-btn" data-ag-unit="${esc(h.id)}">${v.mia ? 'Gestionar la meva unitat' : v.fase === 'disponible' ? 'Aparaular o reservar' : 'Estat: ' + esc(FTXT[v.fase])}</button></div>`; },
  state: () => S, reload: load,
};

/* inici */
const q = new URLSearchParams(location.search), err = q.get('agerr');
if (err){
  const M = { google_sin_acceso: 'Aquest correu de Google no té accés a l’iShowi Hub.', google_desactivado: 'El teu accés a l’iShowi Hub està desactivat.', google_cancelado: 'S’ha cancel·lat l’accés amb Google.', google_no_configurado: 'L’accés amb Google encara no està activat.', canje: 'No s’ha pogut completar l’accés. Torna-ho a provar.' };
  history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => login(M[err] || 'No s’ha pogut entrar amb Google.'), 600);
}
menu();
if (/(?:^|;\s*)axr_ag_on=1/.test(document.cookie)) load().then(s => { if (s && /habitatges/.test(location.hash)) toast('Mode agent actiu · ' + s.actor.nombre); });
})();
