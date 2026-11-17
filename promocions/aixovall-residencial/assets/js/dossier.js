/* Aixovall Residencial · Dossier personalitzat (PDF) · v3.4
   Renderitza el dossier del client amb jsPDF: portada, fitxa i plànols, acabats, preu i
   calendari de pagaments, properes passes. El mateix codi corre al navegador (window.AXDossier)
   i a Node (per generar maquetes). Tot el que necessita arriba dins de `ctx`:

   ctx = {
     jsPDF, qrcode,                       // constructors de les llibreries
     fonts: { inter400, inter500, inter600, gelasio400, gelasio400i, gelasio500 },  // TTF en base64
     lang: 'ca'|'es'|'fr'|'en', locale: 'ca-ES',
     igiPct: 4.5,
     home:  { id, name, floor (text), typeLabel, util, built, bedrooms, baths, ext (text|''), extM2, price, status (text) },
     client:{ name, phone, email }, code: 'AX-11-7F3K', date: Date, link: 'https://…#c=…',
     images:{ cover, plan, d3, stages:[{ cap, data, w, h }], sw:{ 'SV.B': dataURL, … }, modPlan:{ data, w, h }|null },
     rooms: [ { name, items:[ { id, name, brand, group, amount, included, sample, perM2, extra } ] } ],
     annex: [ { id, name, group, amount } ],
     mods:  { items:[{ label, qty, amount }], total, kitchen } | null,
     proposal: '',
     totals:{ home, anx, cfg },
     pay:   { base, rows:[ { label, sub, n, amount } ], start, end },
     contact:{ wa: '376822345', waText: 'Hola…', phone: '+376 822345', email: 'apimi@andorra.ad', web: 'apimi.com/aixovall-residencial' },
     company:{ promotor:'Construccions Estapé', arch:'Magnesi Arquitectes', agency:'API Immobiliària' }
   }
   build(ctx) → jsPDF doc.  */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AXDossier = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const I18N = {
    ca: {
      eyebrow: 'Aixovall Residencial · Sant Julià de Lòria · Andorra', cover_t: 'El teu pis: {home}', cover_em: 'configurat al teu gust.',
      cover_for: 'Dossier preparat per a', cover_date: 'Data', cover_code: 'Codi de configuració', cover_sub: 'Habitatges d’obra nova · Entrega prevista 1r trimestre de 2029',
      promotor: 'Promotor', arch: 'Arquitectura', agency: 'Comercialitza',
      s1: 'La teva llar', s1_sub: 'Fitxa i plànols', f_floor: 'Planta', f_type: 'Tipologia', f_util: 'Superfície útil', f_built: 'Superfície construïda', f_beds: 'Dormitoris', f_baths: 'Banys', f_price: 'Preu sense IGI', f_status: 'Estat',
      plan: 'Plànol de distribució', d3: 'Vista 3D', furniture: 'Mobiliari orientatiu, no inclòs. Plànols del dossier comercial: mides i distribucions subjectes a l’obra i a la llicència.',
      s2: 'Els teus acabats', s2_sub: 'Configuració triada', included: 'Inclòs', sample: '* Preu d’exemple, pendent de tarifa.', m2: '{p} €/m² × {m2} m²', mods_room: 'Modificacions de distribució', mods_note: 'Proposta pendent de revisió del promotor.',
      s3: 'Preu del teu pis', s3_sub: 'Habitatge, annexos i configuracions', b_home: 'Habitatge', b_anx: 'Aparcament i traster', b_cfg: 'Configuracions', none_anx: 'Sense aparcament ni traster',
      no_igi: 'sense IGI', igi: 'IGI {r} %', with_igi: 'amb IGI', total: 'Total', grand: 'Total a pagar amb IGI', grand_s: 'Habitatge + annexos + configuracions',
      legal_amt: 'Els imports són sense IGI; cada bloc mostra l’IGI ({r} %) i el total amb IGI. L’habitatge, els annexos i les configuracions es facturen per separat. Preus i opcions provisionals fins a la configuració oficial, que es farà quan l’obra arribi a la façana.',
      s4: 'Paga el teu pis a mesura que es construeix', s4_sub: 'Calendari de pagaments', pay_base: 'Base de càlcul: habitatge i annexos ({base} sense IGI). Cada pagament porta l’IGI ({r} %) a part. Venciments segons contracte i avanç certificat de l’obra.',
      pay_h1: 'Moment', pay_h2: 'Import sense IGI', pay_h3: 'IGI', pay_h4: 'Total', cal_start: 'Inici d’obra', cal_end: 'Entrega prevista', before_keys: 'Només pagues el {p} % abans de tenir les claus. El {n} % restant el pagues a l’escriptura, davant de notari: el finançament et costa menys interessos mentre es construeix.',
      s5: 'Properes passes', s5_sub: 'Com reservar el {home}', st1: 'Reserva’l amb 10.000 €', st1_s: 'Te’l guardem un mes, sense compromís. L’import compta dins del 10 % de les arres.', st2: 'Arres dins del mes', st2_s: 'Signem el contracte d’arres i fixem el calendari de pagaments d’aquest dossier.', st3: 'Finançament', st3_s: 'T’ajudem a trobar el banc i la hipoteca adequats. Només pagues el 60 % abans de les claus.',
      contact_t: 'Parlem-ne per WhatsApp', contact_s: 'Escaneja el codi o escriu-nos: respondrem amb tot el que necessitis sobre el {home}.', legal_img: 'Els renders i les imatges són referencials i no tenen implicacions contractuals. El promotor es compromet a instal·lar i lliurar el que s’ha configurat en el mateix estil, i es reserva el dret de substituir qualsevol material per un altre de similar.',
      link_t: 'La teva configuració en línia', valid: 'Dossier informatiu generat el {date}. Preus publicats i estats actualitzats el 30/09/2026.',
      sign_buyer: 'Signatura del comprador', sign_dev: 'Signatura del promotor', page: 'Pàgina {n} de {t}', mod_plan: 'Plànol modificat pel client',
      floor_0: 'Planta baixa', floor_1: 'Primera planta', floor_2: 'Segona planta', floor_3: 'Tercera planta', floor_4: 'Àtic · Quarta planta', terrace: 'Terrassa', balcony: 'Balcó', garden: 'Jardí', patio: 'Pati'
    },
    es: {
      eyebrow: 'Aixovall Residencial · Sant Julià de Lòria · Andorra', cover_t: 'Tu piso: {home}', cover_em: 'configurado a tu gusto.',
      cover_for: 'Dossier preparado para', cover_date: 'Fecha', cover_code: 'Código de configuración', cover_sub: 'Viviendas de obra nueva · Entrega prevista 1.er trimestre de 2029',
      promotor: 'Promotor', arch: 'Arquitectura', agency: 'Comercializa',
      s1: 'Tu hogar', s1_sub: 'Ficha y planos', f_floor: 'Planta', f_type: 'Tipología', f_util: 'Superficie útil', f_built: 'Superficie construida', f_beds: 'Dormitorios', f_baths: 'Baños', f_price: 'Precio sin IGI', f_status: 'Estado',
      plan: 'Plano de distribución', d3: 'Vista 3D', furniture: 'Mobiliario orientativo, no incluido. Planos del dossier comercial: medidas y distribuciones sujetas a la obra y a la licencia.',
      s2: 'Tus acabados', s2_sub: 'Configuración elegida', included: 'Incluido', sample: '* Precio de ejemplo, pendiente de tarifa.', m2: '{p} €/m² × {m2} m²', mods_room: 'Modificaciones de distribución', mods_note: 'Propuesta pendiente de revisión del promotor.',
      s3: 'Precio de tu piso', s3_sub: 'Vivienda, anexos y configuraciones', b_home: 'Vivienda', b_anx: 'Aparcamiento y trastero', b_cfg: 'Configuraciones', none_anx: 'Sin aparcamiento ni trastero',
      no_igi: 'sin IGI', igi: 'IGI {r} %', with_igi: 'con IGI', total: 'Total', grand: 'Total a pagar con IGI', grand_s: 'Vivienda + anexos + configuraciones',
      legal_amt: 'Los importes son sin IGI; cada bloque muestra el IGI ({r} %) y el total con IGI. La vivienda, los anexos y las configuraciones se facturan por separado. Precios y opciones provisionales hasta la configuración oficial, que se hará cuando la obra llegue a la fachada.',
      s4: 'Paga tu piso a medida que se construye', s4_sub: 'Calendario de pagos', pay_base: 'Base de cálculo: vivienda y anexos ({base} sin IGI). Cada pago lleva el IGI ({r} %) aparte. Vencimientos según contrato y avance certificado de la obra.',
      pay_h1: 'Momento', pay_h2: 'Importe sin IGI', pay_h3: 'IGI', pay_h4: 'Total', cal_start: 'Inicio de obra', cal_end: 'Entrega prevista', before_keys: 'Solo pagas el {p} % antes de tener las llaves. El {n} % restante lo pagas en la escritura, ante notario: la financiación te cuesta menos intereses mientras se construye.',
      s5: 'Próximos pasos', s5_sub: 'Cómo reservar el {home}', st1: 'Resérvalo con 10.000 €', st1_s: 'Te lo guardamos un mes, sin compromiso. El importe cuenta dentro del 10 % de las arras.', st2: 'Arras dentro del mes', st2_s: 'Firmamos el contrato de arras y fijamos el calendario de pagos de este dossier.', st3: 'Financiación', st3_s: 'Te ayudamos a encontrar el banco y la hipoteca adecuados. Solo pagas el 60 % antes de las llaves.',
      contact_t: 'Hablemos por WhatsApp', contact_s: 'Escanea el código o escríbenos: te responderemos con todo lo que necesites sobre el {home}.', legal_img: 'Los renders y las imágenes son referenciales y no tienen implicaciones contractuales. El promotor se compromete a instalar y entregar lo configurado en el mismo estilo, y se reserva el derecho de sustituir cualquier material por otro similar.',
      link_t: 'Tu configuración en línea', valid: 'Dossier informativo generado el {date}. Precios publicados y estados actualizados el 30/09/2026.',
      sign_buyer: 'Firma del comprador', sign_dev: 'Firma del promotor', page: 'Página {n} de {t}', mod_plan: 'Plano modificado por el cliente',
      floor_0: 'Planta baja', floor_1: 'Primera planta', floor_2: 'Segunda planta', floor_3: 'Tercera planta', floor_4: 'Ático · Cuarta planta', terrace: 'Terraza', balcony: 'Balcón', garden: 'Jardín', patio: 'Patio'
    },
    fr: {
      eyebrow: 'Aixovall Residencial · Sant Julià de Lòria · Andorre', cover_t: 'Votre appartement : {home}', cover_em: 'configuré à votre goût.',
      cover_for: 'Dossier préparé pour', cover_date: 'Date', cover_code: 'Code de configuration', cover_sub: 'Logements neufs · Livraison prévue au 1er trimestre 2029',
      promotor: 'Promoteur', arch: 'Architecture', agency: 'Commercialisation',
      s1: 'Votre logement', s1_sub: 'Fiche et plans', f_floor: 'Étage', f_type: 'Typologie', f_util: 'Surface utile', f_built: 'Surface construite', f_beds: 'Chambres', f_baths: 'Salles de bains', f_price: 'Prix hors IGI', f_status: 'Statut',
      plan: 'Plan de distribution', d3: 'Vue 3D', furniture: 'Mobilier indicatif, non inclus. Plans du dossier commercial : dimensions et distributions soumises au chantier et au permis.',
      s2: 'Vos finitions', s2_sub: 'Configuration choisie', included: 'Inclus', sample: '* Prix indicatif, tarif en attente.', m2: '{p} €/m² × {m2} m²', mods_room: 'Modifications de distribution', mods_note: 'Proposition en attente de validation du promoteur.',
      s3: 'Prix de votre appartement', s3_sub: 'Logement, annexes et configurations', b_home: 'Logement', b_anx: 'Parking et cave', b_cfg: 'Configurations', none_anx: 'Sans parking ni cave',
      no_igi: 'hors IGI', igi: 'IGI {r} %', with_igi: 'IGI inclus', total: 'Total', grand: 'Total à payer IGI inclus', grand_s: 'Logement + annexes + configurations',
      legal_amt: 'Les montants sont hors IGI ; chaque bloc indique l’IGI ({r} %) et le total IGI inclus. Le logement, les annexes et les configurations sont facturés séparément. Prix et options provisoires jusqu’à la configuration officielle, à l’étape de la façade.',
      s4: 'Payez votre appartement au rythme du chantier', s4_sub: 'Calendrier de paiement', pay_base: 'Base de calcul : logement et annexes ({base} hors IGI). Chaque paiement porte l’IGI ({r} %) en sus. Échéances selon contrat et avancement certifié des travaux.',
      pay_h1: 'Moment', pay_h2: 'Montant hors IGI', pay_h3: 'IGI', pay_h4: 'Total', cal_start: 'Début des travaux', cal_end: 'Livraison prévue', before_keys: 'Vous ne payez que {p} % avant la remise des clés. Les {n} % restants se paient à l’acte, devant notaire : le financement vous coûte moins d’intérêts pendant les travaux.',
      s5: 'Prochaines étapes', s5_sub: 'Comment réserver le {home}', st1: 'Réservez-le avec 10 000 €', st1_s: 'Nous le bloquons un mois, sans engagement. Le montant compte dans les 10 % d’arrhes.', st2: 'Arrhes dans le mois', st2_s: 'Nous signons le contrat d’arrhes et fixons le calendrier de paiement de ce dossier.', st3: 'Financement', st3_s: 'Nous vous aidons à trouver la banque et le prêt adaptés. Vous ne payez que 60 % avant les clés.',
      contact_t: 'Parlons-en sur WhatsApp', contact_s: 'Scannez le code ou écrivez-nous : nous répondrons à toutes vos questions sur le {home}.', legal_img: 'Les rendus et les images sont indicatifs et sans valeur contractuelle. Le promoteur s’engage à installer et livrer la configuration dans le même style et se réserve le droit de remplacer tout matériau par un autre similaire.',
      link_t: 'Votre configuration en ligne', valid: 'Dossier informatif généré le {date}. Prix publiés et statuts mis à jour le 30/09/2026.',
      sign_buyer: 'Signature de l’acheteur', sign_dev: 'Signature du promoteur', page: 'Page {n} sur {t}', mod_plan: 'Plan modifié par le client',
      floor_0: 'Rez-de-chaussée', floor_1: 'Premier étage', floor_2: 'Deuxième étage', floor_3: 'Troisième étage', floor_4: 'Attique · Quatrième étage', terrace: 'Terrasse', balcony: 'Balcon', garden: 'Jardin', patio: 'Patio'
    },
    en: {
      eyebrow: 'Aixovall Residencial · Sant Julià de Lòria · Andorra', cover_t: 'Your home: {home}', cover_em: 'configured your way.',
      cover_for: 'Dossier prepared for', cover_date: 'Date', cover_code: 'Configuration code', cover_sub: 'New-build homes · Expected delivery Q1 2029',
      promotor: 'Developer', arch: 'Architecture', agency: 'Sales',
      s1: 'Your home', s1_sub: 'Fact sheet and plans', f_floor: 'Floor', f_type: 'Type', f_util: 'Usable area', f_built: 'Built area', f_beds: 'Bedrooms', f_baths: 'Bathrooms', f_price: 'Price excl. IGI', f_status: 'Status',
      plan: 'Floor plan', d3: '3D view', furniture: 'Furniture shown for reference only, not included. Sales-brochure plans: sizes and layouts subject to construction and permit.',
      s2: 'Your finishes', s2_sub: 'Chosen configuration', included: 'Included', sample: '* Sample price, pending rate.', m2: '{p} €/m² × {m2} m²', mods_room: 'Layout changes', mods_note: 'Proposal pending developer review.',
      s3: 'Price of your home', s3_sub: 'Home, extras and configurations', b_home: 'Home', b_anx: 'Parking and storage', b_cfg: 'Configurations', none_anx: 'No parking or storage room',
      no_igi: 'excl. IGI', igi: 'IGI {r} %', with_igi: 'incl. IGI', total: 'Total', grand: 'Total payable incl. IGI', grand_s: 'Home + extras + configurations',
      legal_amt: 'Amounts exclude IGI; each block shows IGI ({r} %) and the total incl. IGI. Home, extras and configurations are invoiced separately. Prices and options are provisional until the official configuration at the façade stage.',
      s4: 'Pay for your home as it is built', s4_sub: 'Payment schedule', pay_base: 'Basis: home and extras ({base} excl. IGI). Each payment carries IGI ({r} %) on top. Due dates as per contract and certified construction progress.',
      pay_h1: 'Stage', pay_h2: 'Amount excl. IGI', pay_h3: 'IGI', pay_h4: 'Total', cal_start: 'Start of works', cal_end: 'Expected delivery', before_keys: 'You only pay {p} % before getting the keys. The remaining {n} % is paid at the deed, before a notary: your financing costs less interest while the building goes up.',
      s5: 'Next steps', s5_sub: 'How to reserve {home}', st1: 'Reserve it with €10,000', st1_s: 'We hold it for one month, no commitment. The amount counts towards the 10 % deposit.', st2: 'Deposit within the month', st2_s: 'We sign the deposit contract and fix the payment schedule in this dossier.', st3: 'Financing', st3_s: 'We help you find the right bank and mortgage. You only pay 60 % before the keys.',
      contact_t: 'Let’s talk on WhatsApp', contact_s: 'Scan the code or message us: we’ll answer everything you need about {home}.', legal_img: 'Renders and images are for reference only and have no contractual value. The developer undertakes to install and deliver the configured items in the same style and reserves the right to replace any material with a similar one.',
      link_t: 'Your configuration online', valid: 'Informational dossier generated on {date}. Published prices and status updated on 30/09/2026.',
      sign_buyer: 'Buyer’s signature', sign_dev: 'Developer’s signature', page: 'Page {n} of {t}', mod_plan: 'Plan modified by the client',
      floor_0: 'Ground floor', floor_1: 'First floor', floor_2: 'Second floor', floor_3: 'Third floor', floor_4: 'Penthouse · Fourth floor', terrace: 'Terrace', balcony: 'Balcony', garden: 'Garden', patio: 'Patio'
    }
  };

  /* Paleta del lloc web */
  const C = { ink: [48, 45, 39], muted: [113, 108, 99], paper: [250, 249, 245], sand: [234, 230, 222], line: [220, 215, 206], accent: [165, 107, 56], api: [233, 110, 28], apiInk: [36, 27, 20], green: [48, 57, 47], white: [255, 255, 255], soft: [243, 230, 216] };
  const PAGE = { w: 210, h: 297 }, M = 16, R = PAGE.w - M, CW = R - M;

  function build(ctx) {
    const T = I18N[ctx.lang] || I18N.ca;
    const tr = (k, v) => { let s = T[k] === undefined ? k : T[k]; if (v) for (const n in v) s = String(s).split('{' + n + '}').join(v[n]); return s; };
    const nf0 = new Intl.NumberFormat(ctx.locale || 'ca-ES', { maximumFractionDigits: 0 });
    const nf2 = new Intl.NumberFormat(ctx.locale || 'ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmt = n => { n = Math.round(n * 100) / 100; return Number.isInteger(n) ? nf0.format(n) : nf2.format(n); };
    const eur = n => fmt(n) + ' €';
    const igiR = (typeof ctx.igiPct === 'number' ? ctx.igiPct : 4.5) / 100;
    const igiOf = n => Math.round(n * igiR * 100) / 100;
    const igiPct = new Intl.NumberFormat(ctx.locale || 'ca-ES', { maximumFractionDigits: 2 }).format(igiR * 100);
    const dateTxt = (ctx.date || new Date()).toLocaleDateString(ctx.locale || 'ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    const doc = new ctx.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    /* Tipografies */
    const F = ctx.fonts || {};
    const addFont = (b64, file, name, style) => { if (!b64) return false; doc.addFileToVFS(file, b64); doc.addFont(file, name, style); return true; };
    const hasSans = addFont(F.inter400, 'Inter-Regular.ttf', 'Inter', 'normal');
    addFont(F.inter500, 'Inter-Medium.ttf', 'Inter', 'medium'); addFont(F.inter600, 'Inter-SemiBold.ttf', 'Inter', 'bold');
    const hasSerif = addFont(F.gelasio400, 'Gelasio-Regular.ttf', 'Gelasio', 'normal');
    addFont(F.gelasio400i, 'Gelasio-Italic.ttf', 'Gelasio', 'italic'); addFont(F.gelasio500, 'Gelasio-Medium.ttf', 'Gelasio', 'medium');
    const sans = (w) => { if (hasSans) doc.setFont('Inter', w === 600 ? 'bold' : w === 500 ? 'medium' : 'normal'); else doc.setFont('helvetica', w >= 500 ? 'bold' : 'normal'); };
    const serif = (st) => { if (hasSerif) doc.setFont('Gelasio', st || 'normal'); else doc.setFont('times', st === 'italic' ? 'italic' : 'normal'); };
    const col = c => { doc.setTextColor(c[0], c[1], c[2]); };
    const fill = c => { doc.setFillColor(c[0], c[1], c[2]); };
    const stroke = c => { doc.setDrawColor(c[0], c[1], c[2]); };
    const txt = (s, x, y, o) => doc.text(Array.isArray(s) ? s.map(String) : String(s), x, y, o || {});
    const wrap = (s, w) => doc.splitTextToSize(String(s), w);
    const img = (data, x, y, w, h, fmtHint) => { try { doc.addImage(data, fmtHint || 'JPEG', x, y, w, h, undefined, 'FAST'); return true; } catch (e) { return false; } };
    const fitW = (im, w) => w * im.h / im.w;               // alçada per a una amplada
    const fitBox = (im, w, h) => { const r = Math.min(w / im.w, h / im.h); return { w: im.w * r, h: im.h * r }; };

    const pages = [];
    let pageNo = 0;
    const newPage = (bg) => { if (pageNo > 0) doc.addPage(); pageNo++; if (bg) { fill(bg); doc.rect(0, 0, PAGE.w, PAGE.h, 'F'); } pages.push(pageNo); };
    const header = (title, sub) => {
      sans(600); doc.setFontSize(8); col(C.accent); doc.setCharSpace(0.6); txt(tr('eyebrow').toUpperCase(), M, 14); doc.setCharSpace(0);
      serif('normal'); doc.setFontSize(22); col(C.ink); txt(title, M, 26);
      if (sub) { sans(400); doc.setFontSize(9.5); col(C.muted); txt(sub, R, 26, { align: 'right' }); }
      stroke(C.ink); doc.setLineWidth(0.5); doc.line(M, 30.5, R, 30.5);
    };
    const footer = (n, total) => {
      stroke(C.line); doc.setLineWidth(0.2); doc.line(M, 283, R, 283);
      sans(400); doc.setFontSize(7.5); col(C.muted);
      txt(`Aixovall Residencial · ${ctx.home.name} · ${ctx.client.name || ''}${ctx.code ? ' · ' + ctx.code : ''}`, M, 287.5);
      txt(tr('page', { n, t: total }), R, 287.5, { align: 'right' });
    };
    const sectionTitle = (t, sub, y) => {
      stroke(C.ink); doc.setLineWidth(0.6); doc.line(M, y, R, y);
      sans(600); doc.setFontSize(11); col(C.ink); txt(t, M, y + 6.5);
      if (sub) { sans(400); doc.setFontSize(8.5); col(C.muted); txt(sub, R, y + 6.5, { align: 'right' }); }
      return y + 12;
    };
    const money = (label, n, y, bold) => {
      sans(bold ? 600 : 400); doc.setFontSize(bold ? 10.5 : 9.5); col(C.ink);
      txt(label, M, y); txt(eur(n), R, y, { align: 'right' });
      return y + (bold ? 6.5 : 5.6);
    };
    const igiBlock = (label, n, y) => {
      /* total sense IGI · línia IGI · total amb IGI (ressaltat) */
      stroke(C.line); doc.setLineWidth(0.2); doc.line(M, y - 3.2, R, y - 3.2);
      sans(600); doc.setFontSize(9.8); col(C.ink); txt(`${label} · ${tr('no_igi')}`, M, y); txt(eur(n), R, y, { align: 'right' });
      sans(400); doc.setFontSize(8.5); col(C.muted); txt(tr('igi', { r: igiPct }), M, y + 5); txt(eur(igiOf(n)), R, y + 5, { align: 'right' });
      sans(600); doc.setFontSize(9.8); col(C.ink); txt(`${label} · ${tr('with_igi')}`, M, y + 10.5);
      const v = eur(n + igiOf(n)); const w = doc.getTextWidth(v) + 5; fill(C.soft); doc.rect(R - w, y + 7, w, 5.2, 'F'); col(C.apiInk); txt(v, R - 2.5, y + 10.7, { align: 'right' });
      return y + 18;
    };

    /* ─────────────── 1 · PORTADA ─────────────── */
    newPage(C.paper);
    const cover = ctx.images.cover;
    const coverH = 150;
    if (cover && cover.data) {
      /* retall "cover" de la imatge a 210×coverH */
      const r = Math.max(PAGE.w / cover.w, coverH / cover.h); const w = cover.w * r, h = cover.h * r;
      // jsPDF no retalla: dibuixem i després tapem els marges amb paper (la imatge queda centrada)
      img(cover.data, (PAGE.w - w) / 2, (coverH - h) / 2, w, h, cover.fmt);
      fill(C.paper); doc.rect(0, coverH, PAGE.w, PAGE.h - coverH, 'F');
      if (w > PAGE.w) { /* res a tapar lateralment: la pàgina acaba a 210 */ }
    } else { fill(C.sand); doc.rect(0, 0, PAGE.w, coverH, 'F'); }
    /* Marca a la part superior sobre la foto */
    fill(C.paper); doc.rect(M, 12, 62, 14, 'F');
    serif('normal'); doc.setFontSize(13); col(C.ink); doc.setCharSpace(1.6); txt('AIXOVALL', M + 4, 21.2); doc.setCharSpace(0);
    sans(500); doc.setFontSize(5.5); col(C.muted); doc.setCharSpace(0.5); txt('RESIDENCIAL', M + 4 + 0.2, 24.3); doc.setCharSpace(0);
    /* Títol */
    let y = coverH + 18;
    sans(600); doc.setFontSize(8.5); col(C.accent); doc.setCharSpace(0.7); txt(tr('eyebrow').toUpperCase(), M, y); doc.setCharSpace(0);
    y += 14; serif('normal'); doc.setFontSize(34); col(C.ink); txt(tr('cover_t', { home: ctx.home.name }), M, y);
    y += 14; serif('italic'); doc.setFontSize(30); col(C.accent); txt(tr('cover_em'), M, y);
    y += 9; sans(400); doc.setFontSize(10); col(C.muted); txt(`${ctx.home.typeLabel} · ${ctx.home.bedrooms} ${tr('f_beds').toLowerCase()} · ${ctx.home.baths} ${tr('f_baths').toLowerCase()} · ${fmt(ctx.home.built)} m²${ctx.home.ext ? ' · ' + ctx.home.ext : ''}`, M, y);
    /* Dades del client */
    y += 16;
    const colW = CW / 3;
    const meta = [[tr('cover_for'), ctx.client.name || '—'], [tr('cover_date'), dateTxt], [tr('cover_code'), ctx.code || '—']];
    meta.forEach((m, i) => {
      const x = M + i * colW;
      sans(500); doc.setFontSize(7); col(C.muted); doc.setCharSpace(0.4); txt(m[0].toUpperCase(), x, y); doc.setCharSpace(0);
      sans(500); doc.setFontSize(11); col(C.ink); txt(wrap(m[1], colW - 6)[0], x, y + 6);
    });
    stroke(C.line); doc.setLineWidth(0.2); doc.line(M, y + 11, R, y + 11);
    /* Peu de portada */
    const fy = 272;
    const who = [[tr('promotor'), ctx.company.promotor], [tr('arch'), ctx.company.arch], [tr('agency'), ctx.company.agency]];
    who.forEach((w, i) => {
      const x = M + i * colW;
      sans(400); doc.setFontSize(7); col(C.muted); txt(w[0], x, fy);
      sans(600); doc.setFontSize(9); col(C.ink); txt(w[1], x, fy + 4.5);
    });
    sans(400); doc.setFontSize(8); col(C.muted); txt(tr('cover_sub'), M, fy + 12);

    /* ─────────────── 2 · FITXA I PLÀNOLS ─────────────── */
    newPage(C.white); header(tr('s1'), tr('s1_sub'));
    y = 40;
    const facts = [[tr('f_floor'), ctx.home.floor], [tr('f_type'), ctx.home.typeLabel], [tr('f_util'), fmt(ctx.home.util) + ' m²'], [tr('f_built'), fmt(ctx.home.built) + ' m²'], [tr('f_beds'), String(ctx.home.bedrooms)], [tr('f_baths'), String(ctx.home.baths)]];
    if (ctx.home.ext) facts.push([ctx.home.ext, ctx.home.extM2 ? fmt(ctx.home.extM2) + ' m²' : '—']);
    facts.push([tr('f_price'), eur(ctx.home.price)]);
    const fw = CW / 4, fh = 14;
    stroke(C.line); doc.setLineWidth(0.2); doc.line(M, y, R, y);
    facts.forEach((f, i) => {
      const cx = M + (i % 4) * fw, cy = y + Math.floor(i / 4) * fh;
      sans(500); doc.setFontSize(6.5); col(C.muted); doc.setCharSpace(0.4); txt(f[0].toUpperCase(), cx, cy + 5); doc.setCharSpace(0);
      sans(500); doc.setFontSize(10.5); col(C.ink); txt(f[1], cx, cy + 10.5);
      if ((i + 1) % 4 === 0 || i === facts.length - 1) doc.line(M, cy + fh, R, cy + fh);
    });
    y += Math.ceil(facts.length / 4) * fh + 10;
    /* Plànol (gran) */
    const plan = ctx.images.plan;
    if (plan && plan.data) {
      sans(600); doc.setFontSize(8); col(C.accent); doc.setCharSpace(0.5); txt(tr('plan').toUpperCase(), M, y); doc.setCharSpace(0); y += 3;
      const box = fitBox(plan, CW, 92);
      fill(C.white); stroke(C.line); doc.setLineWidth(0.2); doc.rect(M, y, CW, box.h + 6, 'FD');
      img(plan.data, M + (CW - box.w) / 2, y + 3, box.w, box.h, plan.fmt);
      y += box.h + 6 + 8;
    }
    /* 3D */
    const d3 = ctx.images.d3;
    if (d3 && d3.data && y < 215) {
      const avail = 268 - y;
      sans(600); doc.setFontSize(8); col(C.accent); doc.setCharSpace(0.5); txt(tr('d3').toUpperCase(), M, y); doc.setCharSpace(0); y += 3;
      const box = fitBox(d3, CW, avail - 10);
      img(d3.data, M + (CW - box.w) / 2, y, box.w, box.h, d3.fmt);
      y += box.h + 5;
    }
    sans(400); doc.setFontSize(7.5); col(C.muted); txt(wrap(tr('furniture'), CW), M, Math.min(y + 2, 276));

    /* ─────────────── 3 · ACABATS ─────────────── */
    newPage(C.white); header(tr('s2'), tr('s2_sub'));
    y = 38;
    const st = (ctx.images.stages || []).filter(s => s && s.data);
    if (st.length) {
      const gap = 4, cw = (CW - gap * (st.length - 1)) / st.length, ch = 40;
      st.forEach((s, i) => {
        const x = M + i * (cw + gap); const b = fitBox(s, cw, ch);
        fill(C.sand); doc.rect(x, y, cw, ch, 'F');
        img(s.data, x + (cw - b.w) / 2, y + (ch - b.h) / 2, b.w, b.h, s.fmt);
        sans(400); doc.setFontSize(7); col(C.muted); txt(wrap(s.cap, cw)[0], x, y + ch + 4);
      });
      y += ch + 12;
    }
    const rowH = 8.6;
    const drawItem = (it, roomName) => {
      if (y > 262) { footer(pageNo, 0); newPage(C.white); header(tr('s2'), tr('s2_sub')); y = 40; }
      const sw = ctx.images.sw && ctx.images.sw[it.id];
      if (sw) { stroke(C.line); doc.setLineWidth(0.2); img(sw, M, y - 5.6, 10.5, 7, 'JPEG'); doc.rect(M, y - 5.6, 10.5, 7); }
      else { fill(C.sand); doc.rect(M, y - 5.6, 10.5, 7, 'F'); }
      const x = M + 14;
      sans(500); doc.setFontSize(9); col(C.ink);
      const code = /\.0$/.test(it.id) ? '' : it.id + ' · ';
      txt(`${code}${it.name}${it.sample && it.amount ? ' *' : ''}`, x, y - 1.2);
      sans(400); doc.setFontSize(7.5); col(C.muted);
      txt(`${roomName} · ${it.group}${it.brand ? ' · ' + it.brand : ''}${it.extra ? ' · ' + it.extra : ''}`, x, y + 2.4);
      sans(it.amount ? 500 : 400); doc.setFontSize(9); col(it.amount ? C.ink : C.muted);
      txt(it.amount ? '+' + eur(it.amount) : tr('included'), R, y - 1.2, { align: 'right' });
      stroke(C.line); doc.setLineWidth(0.15); doc.line(M, y + 4.2, R, y + 4.2);
      y += rowH;
    };
    for (const room of ctx.rooms) {
      if (y > 255) { footer(pageNo, 0); newPage(C.white); header(tr('s2'), tr('s2_sub')); y = 40; }
      sans(600); doc.setFontSize(7); col(C.muted); doc.setCharSpace(0.6); txt(room.name.toUpperCase(), M, y); doc.setCharSpace(0); y += 7;
      for (const it of room.items) drawItem(it, room.name);
      y += 3;
    }
    if (ctx.mods && ctx.mods.items && ctx.mods.items.length) {
      sans(600); doc.setFontSize(7); col(C.muted); doc.setCharSpace(0.6); txt(tr('mods_room').toUpperCase(), M, y); doc.setCharSpace(0); y += 7;
      for (const i of ctx.mods.items) { drawItem({ id: '', name: i.label, group: i.qty, amount: i.amount }, tr('mods_room')); }
      sans(400); doc.setFontSize(7.5); col(C.muted); txt(tr('mods_note'), M, y); y += 5;
    }
    if (ctx.rooms.some(r => r.items.some(i => i.sample && i.amount))) { sans(400); doc.setFontSize(7.5); col(C.muted); txt(tr('sample'), M, y + 1); y += 5; }
    sans(400); doc.setFontSize(7.5); col(C.muted); txt(wrap(tr('legal_img'), CW), M, Math.max(y + 4, 262));

    /* ─────────────── 4 · PREU I PAGAMENTS ─────────────── */
    newPage(C.white); header(tr('s3'), tr('s3_sub'));
    y = 42;
    y = sectionTitle(tr('b_home'), ctx.home.name + ' · ' + ctx.home.typeLabel, y - 4);
    y = money(ctx.home.name, ctx.home.price, y);
    y = igiBlock(tr('total'), ctx.home.price, y + 3);
    y = sectionTitle(tr('b_anx'), '', y);
    if (!ctx.annex.length) y = money(tr('none_anx'), 0, y);
    for (const a of ctx.annex) y = money(`${a.id} · ${a.name}`, a.amount, y);
    y = igiBlock(tr('total'), ctx.totals.anx, y + 3);
    y = sectionTitle(tr('b_cfg'), '', y);
    /* línies resumides per estança */
    for (const room of ctx.rooms) { const s = room.items.reduce((t, i) => t + i.amount, 0); y = money(room.name, s, y); }
    if (ctx.mods && ctx.mods.total) y = money(tr('mods_room'), ctx.mods.total, y);
    y = igiBlock(tr('total'), ctx.totals.cfg, y + 3);
    /* Gran total */
    const base = ctx.totals.home + ctx.totals.anx + ctx.totals.cfg;
    const igiAll = igiOf(ctx.totals.home) + igiOf(ctx.totals.anx) + igiOf(ctx.totals.cfg);
    fill(C.green); doc.rect(M, y, CW, 30, 'F');
    sans(500); doc.setFontSize(7.5); col([210, 213, 204]); doc.setCharSpace(0.5); txt(tr('grand').toUpperCase(), M + 7, y + 8); doc.setCharSpace(0);
    sans(400); doc.setFontSize(8.5); col([210, 213, 204]); txt(tr('grand_s'), M + 7, y + 14);
    txt(`${eur(base)} ${tr('no_igi')} + ${tr('igi', { r: igiPct })} ${eur(igiAll)}`, M + 7, y + 24);
    serif('normal'); doc.setFontSize(24); col(C.white); txt(eur(base + igiAll), R - 7, y + 19, { align: 'right' });
    y += 36;
    sans(400); doc.setFontSize(7.5); col(C.muted); const la = wrap(tr('legal_amt', { r: igiPct }), CW); txt(la, M, y); y += la.length * 3.4 + 6;
    /* ─────────────── 4b · CALENDARI DE PAGAMENTS ─────────────── */
    newPage(C.white); header(tr('s4_sub'), ctx.home.name);
    serif('italic'); doc.setFontSize(15); col(C.accent); txt(tr('s4'), M, 42);
    y = 54;
    const P = ctx.pay;
    const cols = [M, M + 96, M + 134, R];
    sans(500); doc.setFontSize(7); col(C.muted); doc.setCharSpace(0.3);
    txt(tr('pay_h1').toUpperCase(), cols[0], y); txt(tr('pay_h2').toUpperCase(), cols[1], y, { align: 'right' }); txt(tr('pay_h3').toUpperCase(), cols[2], y, { align: 'right' }); txt(tr('pay_h4').toUpperCase(), cols[3], y, { align: 'right' }); doc.setCharSpace(0);
    y += 2.5; stroke(C.ink); doc.setLineWidth(0.4); doc.line(M, y, R, y); y += 8;
    for (const r of P.rows) {
      sans(600); doc.setFontSize(9); col(C.accent); txt(r.n, M, y);
      sans(500); doc.setFontSize(10); col(C.ink); txt(r.label, M + 20, y);
      sans(400); doc.setFontSize(7.5); col(C.muted); txt(wrap(r.sub, 70), M + 20, y + 4.2);
      sans(400); doc.setFontSize(10); col(C.ink); txt(eur(r.amount), cols[1], y, { align: 'right' });
      col(C.muted); txt(eur(igiOf(r.amount)), cols[2], y, { align: 'right' });
      sans(500); col(C.ink); txt(eur(r.amount + igiOf(r.amount)), cols[3], y, { align: 'right' });
      stroke(C.line); doc.setLineWidth(0.15); doc.line(M, y + 7.2, R, y + 7.2); y += 12.5;
    }
    sans(600); doc.setFontSize(10.5); col(C.ink); txt(tr('total'), M, y + 1); txt(eur(P.base), cols[1], y + 1, { align: 'right' }); col(C.muted); sans(400); txt(eur(igiOf(P.base)), cols[2], y + 1, { align: 'right' }); sans(600); col(C.ink); txt(eur(P.base + igiOf(P.base)), cols[3], y + 1, { align: 'right' });
    y += 12;
    fill(C.sand); doc.rect(M, y, CW / 2 - 2, 16, 'F'); doc.rect(M + CW / 2 + 2, y, CW / 2 - 2, 16, 'F');
    sans(500); doc.setFontSize(6.5); col(C.muted); doc.setCharSpace(0.4); txt(tr('cal_start').toUpperCase(), M + 5, y + 6); txt(tr('cal_end').toUpperCase(), M + CW / 2 + 7, y + 6); doc.setCharSpace(0);
    sans(600); doc.setFontSize(10.5); col(C.ink); txt(P.start, M + 5, y + 12); txt(P.end, M + CW / 2 + 7, y + 12);
    y += 24;
    sans(400); doc.setFontSize(8); col(C.muted); txt(wrap(tr('pay_base', { base: eur(P.base), r: igiPct }), CW), M, y);
    /* 60 % abans de les claus */
    y += 16;
    const before = P.rows.slice(0, 5).reduce((t, r) => t + r.amount, 0), pct = Math.round(before / P.base * 100);
    fill(C.soft); doc.rect(M, y, CW, 22, 'F');
    serif('normal'); doc.setFontSize(22); col(C.ink); txt(pct + ' %', M + 6, y + 14.5);
    sans(400); doc.setFontSize(9); col(C.ink); txt(wrap(tr('before_keys', { p: pct, n: 100 - pct }), CW - 40), M + 34, y + 9.5);
    /* Signatures */
    stroke(C.ink); doc.setLineWidth(0.3); doc.line(M, 262, M + 72, 262); doc.line(R - 72, 262, R, 262);
    sans(400); doc.setFontSize(8); col(C.ink); txt(tr('sign_buyer'), M, 266.5); txt(tr('sign_dev'), R - 72, 266.5);

    /* ─────────────── 5 · PLÀNOL MODIFICAT (opcional) ─────────────── */
    const mp = ctx.images.modPlan;
    if (mp && mp.data) {
      newPage(C.white); header(tr('mod_plan'), ctx.home.name);
      const b = fitBox(mp, CW, 170); img(mp.data, M + (CW - b.w) / 2, 40, b.w, b.h, mp.fmt);
      let my = 40 + b.h + 10;
      if (ctx.mods && ctx.mods.items) for (const i of ctx.mods.items) { sans(400); doc.setFontSize(9); col(C.ink); txt(i.label, M, my); col(C.muted); txt(i.qty, M + 90, my); col(C.ink); txt('+' + eur(i.amount), R, my, { align: 'right' }); my += 6; }
      if (ctx.mods) { sans(600); doc.setFontSize(9.5); col(C.ink); txt(tr('total'), M, my + 2); txt('+' + eur(ctx.mods.total), R, my + 2, { align: 'right' }); my += 10; }
      sans(400); doc.setFontSize(7.5); col(C.muted); txt(wrap(tr('mods_note'), CW), M, my);
      if (ctx.proposal) { my += 8; sans(400); doc.setFontSize(9); col(C.ink); txt(wrap(ctx.proposal, CW).slice(0, 8), M, my); }
    }

    /* ─────────────── 6 · PROPERES PASSES ─────────────── */
    newPage(C.paper); header(tr('s5'), tr('s5_sub', { home: ctx.home.name }));
    y = 44;
    const steps = [['1', tr('st1'), tr('st1_s')], ['2', tr('st2'), tr('st2_s')], ['3', tr('st3'), tr('st3_s')]];
    const sw3 = (CW - 8) / 3;
    steps.forEach((s, i) => {
      const x = M + i * (sw3 + 4);
      fill(C.white); stroke(C.line); doc.setLineWidth(0.2); doc.rect(x, y, sw3, 52, 'FD');
      fill(C.api); doc.circle(x + 9, y + 10, 5, 'F'); sans(600); doc.setFontSize(10); col(C.apiInk); txt(s[0], x + 9, y + 11.4, { align: 'center' });
      serif('normal'); doc.setFontSize(12.5); col(C.ink); txt(wrap(s[1], sw3 - 10), x + 5, y + 23);
      sans(400); doc.setFontSize(8); col(C.muted); txt(wrap(s[2], sw3 - 10), x + 5, y + 32);
    });
    y += 64;
    /* Contacte + QR */
    fill(C.green); doc.rect(M, y, CW, 70, 'F');
    const qrSize = 46;
    const waUrl = 'https://wa.me/' + ctx.contact.wa + '?text=' + encodeURIComponent(ctx.contact.waText || '');
    if (ctx.qrcode) {
      try {
        const q = ctx.qrcode(0, 'M'); q.addData(waUrl); q.make();
        const n = q.getModuleCount(), cell = qrSize / n, qx = R - 8 - qrSize, qy = y + 12;
        fill(C.white); doc.rect(qx - 3, qy - 3, qrSize + 6, qrSize + 6, 'F');
        fill(C.green);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) doc.rect(qx + c * cell, qy + r * cell, cell + 0.02, cell + 0.02, 'F');
      } catch (e) {}
    }
    const tw = CW - qrSize - 24;
    serif('normal'); doc.setFontSize(20); col(C.white); txt(tr('contact_t'), M + 8, y + 16);
    sans(400); doc.setFontSize(9); col([210, 213, 204]); txt(wrap(tr('contact_s', { home: ctx.home.name }), tw), M + 8, y + 25);
    sans(600); doc.setFontSize(13); col(C.white); txt(ctx.contact.phone, M + 8, y + 44);
    sans(400); doc.setFontSize(9); col([210, 213, 204]); txt(ctx.contact.email, M + 8, y + 51); txt(ctx.contact.web, M + 8, y + 57);
    sans(500); doc.setFontSize(7); col([210, 213, 204]); txt('WhatsApp', R - 8 - qrSize / 2, y + 12 + qrSize + 8.5, { align: 'center' });
    y += 80;
    /* Enllaç a la configuració */
    if (ctx.link) {
      sans(600); doc.setFontSize(7); col(C.muted); doc.setCharSpace(0.5); txt(tr('link_t').toUpperCase(), M, y); doc.setCharSpace(0); y += 5;
      sans(400); doc.setFontSize(8); col(C.accent);
      const short = ctx.link.length > 110 ? ctx.link.slice(0, 107) + '…' : ctx.link;
      doc.textWithLink(short, M, y, { url: ctx.link }); y += 8;
    }
    sans(400); doc.setFontSize(7.5); col(C.muted); txt(wrap(tr('valid', { date: dateTxt }), CW), M, y);
    y += 10;
    txt(wrap(tr('legal_img'), CW), M, y);

    /* Peus de pàgina amb el total definitiu */
    const total = doc.getNumberOfPages();
    for (let i = 2; i <= total; i++) { doc.setPage(i); footer(i, total); }
    doc.setPage(1);
    return doc;
  }

  return { build, I18N };
}));
