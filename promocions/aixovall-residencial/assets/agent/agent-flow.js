/* Aixovall Residencial · mode agent: el recorregut d'una unitat segons el seu estat real a l'iShowi Hub.
 * Aparaular (72 h) → Reserva (contracte signat, documentació del client, transferència) → Arres → pagaments d'obra
 * (fonaments, coberta, tancaments) → escriptura. Es fa servir a la fitxa d'agent del showroom i al resum del configurador. */
(() => {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 2 });
const eur = n => nf.format(+n || 0) + ' €';
const dm = s => { const m = String(s || '').match(/(\d{4})-(\d\d)-(\d\d)(?: (\d\d):(\d\d))?/); return m ? `${m[3]}/${m[2]}${m[4] ? ' a les ' + m[4] + ':' + m[5] : ''}` : ''; };
const DOCST = { pendiente: ['Pendent de validar', 'w'], validado: ['Validat', 'ok'], rechazado: ['Rebutjat', 'ko'] };
const PAYST = { pendiente: ['Pendent de pagament', 'w'], subido: ['Justificant pujat · la promotora ho ha de confirmar', 'w'], validado: ['Pagat', 'ok'], pagado: ['Pagat', 'ok'], rechazado: ['Justificant rebutjat', 'ko'], vencido: ['Vençut', 'ko'] };
const SLOTS = {
  reserva: [['contrato_reserva', 'Contracte de reserva signat'], ['identidad', 'Documentació del client (DNI o passaport)'], ['justificante_envio', 'Comprovant de la transferència de la reserva']],
  arras: [['contrato_arras', 'Contracte d’arres signat'], ['justificante_envio', 'Comprovant de la transferència de les arres']],
};
const ESTCA = { bloqueo: 'Aparaulat (72 h)', reserva_pendiente: 'Reserva tècnica · per validar', reserva_confirmada: 'Reserva tècnica · validada', arras_subidas: 'Arres pujades · per validar', arras_validadas: 'Arres validades', compraventa: 'Compravenda formalitzada', entregada: 'Entregat', cancelacion: 'Cancel·lació en revisió' };
const est = v => ESTCA[v.estado_interno] || v.estado_txt || '';
/* Noms de les fites tal com venen del Hub (castellà) → català. */
const hn = n => { const t = String(n || ''); return /arras/i.test(t) ? 'Arres' : /cimenta|fonament/i.test(t) ? 'Fonaments' : /techo|cubierta|teulada|coberta|estructura/i.test(t) ? 'Coberta' : /fachada|cerramiento|tancament/i.test(t) ? 'Tancaments' : /notar|escritura|escriptura|entrega/i.test(t) ? 'Escriptura' : t; };
const ORDER = ['bloqueo', 'reserva_pendiente', 'reserva_confirmada', 'arras_subidas', 'arras_validadas', 'compraventa', 'entregada'];
const at = (v, e) => ORDER.indexOf(v.estado_interno) >= ORDER.indexOf(e);

function slotHTML(v, fase, tipo, label){
  const docs = ((v.operacion && v.operacion.documentos) || []).filter(d => d.tipo === tipo && (d.fase || 'reserva') === fase);
  const d = docs[docs.length - 1], st = d ? DOCST[d.estado] || [d.estado, 'w'] : null;
  return `<li class="axf-slot${d ? ' has' : ''}"><span class="axf-n"><b>${esc(label)}</b>${d ? `<small>${esc(d.nombre_original)} · ${dm(d.creado)}</small>` : '<small>Encara no s’ha pujat</small>'}</span>
    ${st ? `<em class="axf-st axf-${st[1]}">${esc(st[0])}</em>` : ''}
    ${!d || d.estado !== 'validado' ? `<label class="axf-up">${d ? 'Substituir' : 'Pujar'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" data-tipo="${esc(tipo)}" data-fase="${esc(fase)}"></label>` : ''}</li>`;
}

/** Línia de temps: cada pas amb estat fet / actual / pendent. */
function steps(v){
  const p = (v.operacion && v.operacion.pagos) || [], out = [];
  out.push({ k: 'aparaulat', n: 'Aparaulat', s: 'done' });
  out.push({ k: 'reserva', n: 'Reserva', s: at(v, 'reserva_confirmada') ? 'done' : 'now' });
  out.push({ k: 'arras', n: 'Arres', s: at(v, 'arras_validadas') ? 'done' : at(v, 'reserva_confirmada') ? 'now' : 'next' });
  let cur = !at(v, 'arras_validadas');
  for (const x of p.filter(x => x.tipo_pago !== 'arras')){
    const c = x.cargo, paid = c && ['validado', 'pagado'].includes(c.estado);
    let s = 'next';
    if (paid) s = 'done'; else if (!cur && (c || x.tipo_pago === 'final')) { s = 'now'; cur = true; }
    out.push({ k: 'h' + x.hito_id, n: hn(x.nombre), s, x });
  }
  return out;
}

/** HTML del recorregut d'una unitat pròpia. opts: { cfgSave: bool } */
function render(v, S, opts = {}){
  const op = v.operacion || {}, st = steps(v), ip = v.estado_interno;
  const pagos = op.pagos || [], obra = pagos.filter(x => x.tipo_pago !== 'arras');
  let h = `<ol class="axf-tl">${st.map(x => `<li class="axf-${x.s}"><i></i><span>${esc(x.n)}</span></li>`).join('')}</ol>`;
  if (ip === 'cancelacion') return h + '<p class="axf-note axf-ko">Operació en revisió de cancel·lació (promotora o BoomBizz).</p>';
  if (at(v, 'compraventa')) h += '<p class="axf-note axf-ok">Compravenda formalitzada.</p>';
  /* Pas actiu */
  if (ip === 'bloqueo'){
    h += `<section class="axf-card"><h4>Reserva <small>aparaulat fins al ${esc(dm(v.bloqueo_hasta))}</small></h4><p>Puja el contracte de reserva signat, la documentació del client i el comprovant de la transferència de ${eur(op.reserva_importe)}. Quan hi hagi el contracte, l’habitatge passa a reserva tècnica i deixa de caducar.</p>
      <ul class="axf-slots">${SLOTS.reserva.map(([t, l]) => slotHTML(v, 'reserva', t, l)).join('')}</ul>
      <div class="axf-row"><button type="button" class="axf-b" data-axf="contracte">Generar contracte de reserva</button><button type="button" class="axf-b ghost" data-axf="alliberar">Alliberar</button></div></section>`;
  } else if (ip === 'reserva_pendiente'){
    h += `<section class="axf-card"><h4>Reserva <small>pendent de validar</small></h4><p>La promotora ha de confirmar l’ingrés de ${eur(op.reserva_importe)} i el Hub valida els documents.</p><ul class="axf-slots">${SLOTS.reserva.map(([t, l]) => slotHTML(v, 'reserva', t, l)).join('')}</ul></section>`;
  } else if (ip === 'reserva_confirmada' || ip === 'arras_subidas'){
    h += `<section class="axf-card"><h4>Arres <small>${ip === 'arras_subidas' ? 'pendents de validar' : 'reserva validada'}</small></h4><p>Arres del 10 %: ${eur(op.arras_total)} (a transferir ${eur(op.arras_transferencia)}, la reserva ja hi compta) + IGI. Puja el contracte d’arres signat i el comprovant de la transferència.</p>
      <ul class="axf-slots">${SLOTS.arras.map(([t, l]) => slotHTML(v, 'arras', t, l)).join('')}</ul></section>`;
  }
  /* Pagaments d'obra */
  if (at(v, 'reserva_confirmada') && obra.length){
    h += `<section class="axf-card"><h4>Pagaments <small>sobre ${eur(op.precio_total)} + IGI</small></h4><ul class="axf-pays">${obra.map(x => {
      const c = x.cargo, s = c ? PAYST[c.estado] || [c.estado, 'w'] : null, amt = c ? c.total : (op.precio_total || 0) * (x.pct / 100);
      const when = c ? (c.vence ? 'venç el ' + dm(c.vence) : 'declarat') : x.tipo_pago === 'final' ? 'a l’escriptura' : (x.fecha_prevista ? 'previst ' + dm(x.fecha_prevista) : 'quan l’arquitecte en certifiqui la fase');
      return `<li class="${c && ['validado', 'pagado'].includes(c.estado) ? 'done' : c ? 'now' : ''}"><span class="axf-n"><b>${esc(hn(x.nombre))} · ${nf.format(x.pct)} %</b><small>${esc(when)}${c && c.motivo ? ' · ' + esc(c.motivo) : ''}</small></span><b class="axf-amt">${eur(amt)}${c ? '<small>amb IGI</small>' : '<small>sense IGI</small>'}</b>
        ${s ? `<em class="axf-st axf-${s[1]}">${esc(s[0])}</em>` : ''}${c && ['pendiente', 'rechazado', 'vencido', 'subido'].includes(c.estado) ? `<label class="axf-up">${c.justificante ? 'Substituir justificant' : 'Pujar justificant'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" data-cargo="${c.id}"></label>` : ''}</li>`;
    }).join('')}</ul></section>`;
  }
  if (opts.cfgSave) h += `<div class="axf-row"><button type="button" class="axf-b wood" data-axf="desar">Desar aquesta configuració com a provisional</button><button type="button" class="axf-b ghost" data-axf="pdf">Descarregar el resum en PDF</button></div>`;
  return h;
}

/** Enllaça les pujades i els botons. hooks: { api(path, o), done(msg), act(name) } */
function bind(root, v, hooks){
  root.querySelectorAll('.axf-up input[type=file]').forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) return hooks.done('El fitxer passa de 10 MB.');
    const fd = new FormData(); fd.append('referencia', v.referencia); fd.append('archivo', f);
    if (inp.dataset.cargo) fd.append('cargo_id', inp.dataset.cargo); else { fd.append('tipo', inp.dataset.tipo); fd.append('fase', inp.dataset.fase); }
    const lab = inp.parentElement; lab.classList.add('busy'); lab.firstChild.textContent = 'Pujant…';
    try { await hooks.api(inp.dataset.cargo ? 'pago' : 'document', { form: fd }); hooks.done('Pujat al Hub', true); }
    catch (e){ hooks.done(e.message); lab.classList.remove('busy'); lab.firstChild.textContent = 'Pujar'; }
  });
  root.querySelectorAll('[data-axf]').forEach(b => b.onclick = () => hooks.act(b.dataset.axf, b));
}

/** Formulari per aparaular (comprador). */
function buyerForm(){
  return `<form class="axf-form" data-axf-buyer><label>Nom i cognoms del comprador *<input name="nombre" required></label><div class="axf-2"><label>Document<input name="documento"></label><label>Telèfon<input name="telefono" type="tel"></label></div><label>Correu<input name="email" type="email"></label><button class="axf-b wood" type="submit">Aparaular 72 h</button></form>`;
}

window.AXFLOW = { render, bind, buyerForm, steps, eur, esc, dm, est };
})();
