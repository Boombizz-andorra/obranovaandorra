/* Aixovall Residencial · mode agent al configurador: desar la configuració com a provisional al Hub. */
(() => {
'use strict';
const B = window.AXA_BOOT; if (!B || !B.on || !/(?:^|;\s*)axr_ag_on=1/.test(document.cookie)) return;
const H = { 'X-AXR-Agent': '1' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = t => { const el = document.getElementById('ag-cfg-msg'); if (el) el.textContent = t; };
fetch(B.rest + 'estat', { credentials: 'same-origin', headers: H }).then(r => r.ok ? r.json() : null).then(S => {
  if (!S || !S.ok) return;
  const ag = () => window.AXC && AXC.setAgent ? AXC.setAgent() : setTimeout(ag, 300); ag(); // mode agent: fora contacte i formulari
  const v = S.viviendas.find(x => x.referencia === B.home); if (!v) return;
  const bar = document.createElement('div'); bar.id = 'ag-cfg-bar';
  if (!v.mia){ bar.innerHTML = `<span id="ag-cfg-msg">Mode agent · aparaula o reserva aquest pis per desar-ne la configuració</span>`; document.body.appendChild(bar); return; }
  bar.innerHTML = `<span id="ag-cfg-msg">Mode agent · ${esc(v.operacion && v.operacion.comprador ? v.operacion.comprador.nombre : 'la teva unitat')}</span><button type="button" id="ag-cfg-save">Desar com a provisional</button>`;
  document.body.appendChild(bar);
  const btn = document.getElementById('ag-cfg-save');
  btn.onclick = async () => {
    if (!window.AXC || !AXC.agentState) return say('El configurador encara s’està carregant.');
    const st = AXC.agentState(); btn.disabled = true; btn.textContent = 'Desant…';
    try {
      const r = await fetch(B.rest + 'configuracio', { method: 'POST', credentials: 'same-origin', headers: Object.assign({ 'Content-Type': 'application/json' }, H), body: JSON.stringify({
        referencia: B.home, total: st.total, enlace: st.enlace,
        lineas: st.lines.filter(l => !l.inclos).map(l => ({ codigo: l.codigo, cantidad: 1 })),
        resumen: { lineas: st.lines.map(l => ({ codigo: l.codigo, nombre: l.nombre, importe: l.importe })), modificacions: st.mods, placa: st.plaza } }) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'No s’ha pogut desar.');
      say(j.aviso ? 'Desada a la web; el Hub avisa: ' + j.aviso : 'Configuració provisional desada al Hub' + (j.fuera_catalogo && j.fuera_catalogo.length ? ' (fora de catàleg: ' + j.fuera_catalogo.join(', ') + ')' : ''));
      btn.textContent = 'Tornar a la fitxa'; btn.disabled = false; btn.onclick = () => { location.href = B.back; };
    } catch (e){ say(e.message); btn.disabled = false; btn.textContent = 'Desar com a provisional'; }
  };
});
})();
