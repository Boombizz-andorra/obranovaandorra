/* Traductor del showroom (v4). El català és la font; AXS.tr porta el diccionari de l'idioma de la pàgina
 * (lang/showroom-{es,fr,en}.json, generat des de showroom-src/i18n.tsv). Tradueix els textos i atributs
 * visibles, també els que es creen en navegar. Números i noms de pis es conserven: {n} i {u} a les claus. */
(() => {
  const D = (window.AXS && AXS.tr) || null; if (!D) return;
  const U = /(Baixos \d+a|\d+(?:r|n|t) \d+a)/g, N = /\d+(?:[.,]\d+)*/g, ATTR = ['placeholder', 'aria-label', 'title', 'alt'];
  const one = t => { const us = [], ns = []; const k = t.replace(U, m => (us.push(m), '{u}')).replace(N, m => (ns.push(m), '{n}')); const v = D[k];
    if (v == null) return null; let a = 0, b = 0; return v.replace(/\{u\}|\{n\}/g, m => m === '{u}' ? us[a++] : ns[b++]); };
  const tr = t => { const r = one(t); if (r != null) return r; if (t.indexOf(' · ') > -1){ let ok = false; const s = t.split(' · ').map(x => { const y = one(x); if (y != null){ ok = true; return y; } return x; }); return ok ? s.join(' · ') : null; } return null; };
  const txt = n => { const v = n.nodeValue, t = v.trim(); if (!t || !/[A-Za-zÀ-ÿ]/.test(t)) return; const r = tr(t.replace(/\s+/g, ' ')); if (r != null && r !== t) n.nodeValue = v.replace(t, r); };
  const el = e => { if (!e.getAttribute) return; ATTR.forEach(a => { const v = e.getAttribute(a); if (!v) return; const r = tr(v.trim()); if (r != null && r !== v) e.setAttribute(a, r); }); };
  const skip = e => e && /^(SCRIPT|STYLE|TEXTAREA)$/.test(e.tagName);
  const walk = root => { if (root.nodeType === 3){ if (!skip(root.parentElement)) txt(root); return; } if (root.nodeType !== 1) return; el(root); if (skip(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); let n;
    while ((n = w.nextNode())){ if (n.nodeType === 3){ if (!skip(n.parentElement)) txt(n); } else el(n); } };
  window.axsTr = t => tr(t) ?? t; // per a textos fora del DOM (missatges de WhatsApp, avisos)
  const start = () => { walk(document.body);
    new MutationObserver(ms => { for (const m of ms){ if (m.type === 'characterData'){ if (!skip(m.target.parentElement)) txt(m.target); } else if (m.type === 'attributes') el(m.target); else m.addedNodes.forEach(walk); } })
      .observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTR});
    const ti = document.querySelector('title'), fix = () => { const r = tr(document.title); if (r && r !== document.title) document.title = r; };
    if (ti) new MutationObserver(fix).observe(ti, {childList:true, characterData:true, subtree:true}); fix(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
