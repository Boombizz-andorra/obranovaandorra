/* Aixovall Residencial · mode agent al configurador.
 * Amb sessió d'agent: resum directe (sense formulari de client), PDF, i a dalt del resum la gestió de la unitat
 * segons el seu estat al Hub: aparaular, documents de reserva, arres, pagaments d'obra i desar la configuració. */
(() => {
'use strict';
const B = window.AXA_BOOT; if (!B || !B.on || !B.hub || !/(?:^|;\s*)axr_ag_on=1/.test(document.cookie)) return;
const F = window.AXFLOW, esc = F ? F.esc : String;
const FTXT = { disponible: 'Disponible', aparaulat: 'Aparaulat', reserva_tecnica: 'Reserva tècnica', reserva_confirmada: 'Reserva confirmada', vendida: 'Venut' };
let S = null, el = null, msg = '';

async function api(path, o = {}){
  const opt = { method: 'GET', credentials: 'same-origin', headers: { 'X-AXR-Agent': '1' } };
  if (o.json){ opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(o.json); }
  if (o.form){ opt.method = 'POST'; opt.body = o.form; }
  const r = await fetch(B.rest + path, opt); let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok || j.ok === false) throw new Error(j.error || 'Error ' + r.status);
  return j;
}
const viv = () => S && S.viviendas.find(x => x.referencia === B.home);
const toContract = () => { location.href = B.back.replace('#', '?ag=contracte#'); };

function paint(){
  if (!el || !S) return;
  const v = viv(); if (!v){ el.innerHTML = ''; return; }
  const head = `<div class="axf-head"><span class="axf-eye">Mode agent · ${esc(S.actor.entidad && S.actor.entidad.nombre || S.actor.nombre)}</span><h3>${esc(v.referencia === B.home ? (document.querySelector('.axc-home strong') || {}).textContent || B.home : B.home)} <em class="axf-badge axf-f-${esc(v.fase)}">${esc(v.mia && F.est(v) ? F.est(v) : FTXT[v.fase])}</em></h3>${msg ? `<p class="axf-msg">${esc(msg)}</p>` : ''}</div>`;
  if (!v.mia && v.fase !== 'disponible'){
    el.innerHTML = `<section class="axf">${head}<p class="axf-note">Aquest habitatge està ${esc(FTXT[v.fase].toLowerCase())} per una altra part. Pots descarregar el resum en PDF per al teu client.</p><div class="axf-row"><button type="button" class="axf-b ghost" data-axf="pdf">Descarregar el resum en PDF</button></div></section>`;
  } else if (!v.mia){
    el.innerHTML = `<section class="axf">${head}<p>Aparaula’l per bloquejar-lo ${S.parametros.bloqueo_horas} hores per a les altres immobiliàries; després podràs pujar el contracte de reserva i desar-hi aquesta configuració.</p>${F.buyerForm()}<div class="axf-row"><button type="button" class="axf-b ghost" data-axf="contracte">Generar contracte de reserva</button><button type="button" class="axf-b ghost" data-axf="pdf">Descarregar el resum en PDF</button></div></section>`;
    el.querySelector('[data-axf-buyer]').onsubmit = async e => { e.preventDefault(); const b = e.submitter; b.disabled = true; b.textContent = 'Aparaulant…';
      try { await api('aparaular', { json: Object.assign({ referencia: v.referencia }, Object.fromEntries(new FormData(e.target).entries())) }); msg = 'Aparaulat ' + S.parametros.bloqueo_horas + ' h. Ara pots pujar la documentació de la reserva.'; await load(); }
      catch (err){ msg = err.message; paint(); } };
  } else {
    el.innerHTML = `<section class="axf">${head}${F.render(v, S, { cfgSave: true })}</section>`;
  }
  F.bind(el, v, { api, done: async (m, refresh) => { msg = m; if (refresh) await load(); else paint(); }, act });
}

async function act(name, btn){
  const v = viv();
  if (name === 'pdf'){ const p = document.getElementById('pdf'); if (p) p.click(); return; }
  if (name === 'contracte') return toContract();
  if (name === 'alliberar'){ if (!confirm('Alliberar aquest habitatge? Tornarà a estar disponible per a tothom.')) return; try { await api('alliberar', { json: { referencia: v.referencia } }); msg = 'Habitatge alliberat.'; await load(); } catch (e){ msg = e.message; paint(); } return; }
  if (name === 'desar'){
    if (!window.AXC || !AXC.agentState) return;
    const st = AXC.agentState(); btn.disabled = true; btn.textContent = 'Desant…';
    try {
      const j = await api('configuracio', { json: { referencia: v.referencia, total: st.total, enlace: st.enlace, lineas: st.lines.filter(l => !l.inclos).map(l => ({ codigo: l.codigo, cantidad: 1 })), resumen: { lineas: st.lines.map(l => ({ codigo: l.codigo, nombre: l.nombre, importe: l.importe })), modificacions: st.mods, placa: st.plaza } } });
      msg = j.aviso ? 'Desada a la web; el Hub avisa: ' + j.aviso : 'Configuració provisional desada al Hub' + (j.fuera_catalogo && j.fuera_catalogo.length ? ' (fora de catàleg: ' + j.fuera_catalogo.join(', ') + ')' : '') + '.';
    } catch (e){ msg = e.message; }
    await load();
  }
}

async function load(){ try { S = await api('estat'); } catch (e){ S = null; } paint(); bar(); return S; }

/* Barra fixa fora del resum: estat i accés directe al resum. */
function bar(){
  let b = document.getElementById('ag-cfg-bar'); const v = viv();
  if (!S || !v){ if (b) b.remove(); return; }
  if (!b){ b = document.createElement('div'); b.id = 'ag-cfg-bar'; document.body.appendChild(b); }
  b.innerHTML = `<span>Mode agent · ${esc(v.mia && F.est(v) ? F.est(v) : FTXT[v.fase])}</span><button type="button">Resum i gestió</button>`;
  b.querySelector('button').onclick = () => { const s = document.querySelectorAll('#axc-steps li'); const last = s[s.length - 1]; const t = last && (last.querySelector('button,a') || last); t && t.click(); setTimeout(() => { const p = document.getElementById('agPanel'); p && p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400); };
}

const ready = () => {
  if (!window.AXC || !AXC.setAgent) return setTimeout(ready, 200);
  AXC.agentPanel = node => { el = node; paint(); };
  AXC.setAgent();
  if (!el && document.getElementById('agPanel')) el = document.getElementById('agPanel');
  load();
};
ready();
})();
