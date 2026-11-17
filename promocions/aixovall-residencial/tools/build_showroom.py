#!/usr/bin/env python3
"""Converteix el showroom (artefacte, showroom-src/index.html) en la plantilla del plugin.

Genera:
  assets/sr/showroom.css   (estils; les url() relatives es resolen des d'assets/sr/)
  assets/sr/showroom.js    (lògica, amb els pegats per llegir les dades del Hub)
  templates/showroom.php   (marcatge + dades dels pisos des de PHP)

Els recursos (img/, view/, video/, model/, cfg/, sw/) han de ser a assets/sr/.
Cada pegat és una substitució exacta: si l'artefacte canvia i un pegat ja no encaixa,
l'script s'atura i diu quin, en lloc de generar una plantilla trencada.
Ús: python3 tools/build_showroom.py
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'showroom-src/index.html').read_text(encoding='utf-8')

def cut(a, b, s):
    i, j = s.index(a), s.index(b)
    return s[i + len(a):j]

css = cut('<style>', '</style>', src)
body = cut('<body>', '<script>', src)
js = cut('<script>', '</script>\n</body>', src)

def patch(text, old, new, label, count=1):
    n = text.count(old)
    if n < 1 or (count and n != count):
        sys.exit(f'Pegat «{label}»: s\'esperaven {count or "≥1"} coincidències i n\'hi ha {n}.')
    return text.replace(old, new)

# ---------- JS: dades del Hub ----------
i = js.index('const HOMES = [')
j = js.index('];', i) + 2
js = js[:i] + "const HOMES = (window.AXS && AXS.homes) || []; // pisos i estats llegits del Hub (inc/data.php)" + js[j:]
js = patch(js, "const IGI = 4.5, PHONE = '376822345';", "const IGI = (window.AXS && AXS.igi) || 4.5, PHONE = (window.AXS && AXS.phone) || '376822345';", 'telèfon i IGI')
js = patch(js, "const ST = {available:'Disponible',reserved:'Reservat',sold:'Venut'};",
    "const ST = Object.assign({available:'Disponible',agreed:'Aparaulat',reserved:'Reserva tècnica',confirmed:'Reserva confirmada',sold:'Venut'}, (window.AXS && AXS.st) || {});\n"
    "const stc = s => s === 'available' ? '' : s === 'confirmed' ? 'reserved' : s; // classe visual de cada estat\n"
    "const pv = (h, v) => h.price == null ? '—' : h.status === 'agreed' ? `<span class=\"pblur\" title=\"${ST.agreed}\">${eur(v)}</span>` : eur(v); // preu només si el Hub el deixa veure; aparaulat, difuminat com a la pàgina actual", 'estats')
js = patch(js, "h.status === 'available' ? '' : h.status", "stc(h.status)", 'classe estat (llistes)', count=2)
js = patch(js, 'class="unit ${h.status}"', 'class="unit ${stc(h.status)}"', 'classe estat (plànol)')
js = re.sub(r"eur\(h\.price([^()]*(?:\([^()]*\))?[^()]*)\)", lambda m: f"pv(h, h.price{m.group(1)})", js)
js = patch(js, "${payHTML(h.price)}", "${h.price != null ? payHTML(h.price) : `<p class=\"note\">${ST[h.status]}</p>`}", 'pla de pagaments si el preu no és visible')
js = patch(js, "L.sort((a,b) => so === 'up' ? a.price-b.price : so === 'down' ? b.price-a.price", "L.sort((a,b) => so === 'up' ? (a.price ?? 1e12)-(b.price ?? 1e12) : so === 'down' ? (b.price ?? -1)-(a.price ?? -1)", 'ordre per preu amb preus ocults')
js = patch(js, "const cfgOK = h => h.floor >= 1;", "const cfgOK = h => !!h.cfg; // configurador actual del plugin", 'configurador disponible')
# el configurador és el del plugin (amb catàleg del Hub, PDF i sol·licituds)
js = patch(js, "  if (s === 'pis' || s === 'cfg'){", "  if (s === 'cfg'){ const hc = byId(p.slice(1,3).join('-')); if (hc && hc.cfg){ location.href = hc.cfg; return {s:'pis', id:hc.id}; } }\n  if (s === 'pis' || s === 'cfg'){", 'redirecció al configurador')
# amb <base> cap als recursos, els enllaços #… han de continuar a la mateixa pàgina
js = js.replace("(() => {", "(() => {\ndocument.addEventListener('click', e => { const a = e.target.closest('a[href^=\"#\"]'); if (!a || e.defaultPrevented) return; e.preventDefault(); const h = a.getAttribute('href'); if (h.length > 1) location.hash = h.slice(1); }, true);", 1)

# ---------- Sol: model 3D comprimit (Draco, 2,7 MB) i visor des del mateix plugin, sense CDN ----------
js = patch(js, "await loadJS('https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js'); await loadJS('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js'); await loadJS('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js');",
    "await loadJS('vendor/three.min.js'); await loadJS('vendor/OrbitControls.js'); await loadJS('vendor/GLTFLoader.js'); await loadJS('vendor/DRACOLoader.js');", 'visor 3D local')
i = js.index("try { const res = await fetch('model/aixovall.b64.txt');")
j = js.index("sc.add(g.scene); ok(); }, ko));", i) + len("sc.add(g.scene); ok(); }, ko));")
old = js[i:j]
k = old.index("g => { g.scene.traverse(")
cb = old[k:old.index("}, ko));", k) + 1]  # callback g => {...}
js = js[:i] + ("try { const dl = new T.DRACOLoader(); dl.setDecoderPath('vendor/draco/'); const gl = new T.GLTFLoader(); gl.setDRACOLoader(dl);\n"
    "    await new Promise((ok, ko) => gl.load('model/aixovall.glb', " + cb + ", ev => { const tot = ev.total || 2700000; lb.style.width = Math.min(96, ev.loaded/tot*96) + '%'; lt.textContent = 'Carregant el model 3D… ' + Math.round(Math.min(1, ev.loaded/tot)*100) + ' %'; }, ko));") + js[j:]

# ---------- CSS: estats nous ----------
css += """
/* v4: estats del Hub */
.st-agreed .dot,.dot.agreed{background:#e2b93b}
.st-confirmed .dot,.dot.confirmed{background:var(--res)}
.unit.agreed{fill:rgba(226,185,59,.2);stroke:rgba(196,152,24,.95)}
.unit.agreed:hover,.unit.agreed.sel{fill:rgba(226,185,59,.45)}
.pblur{filter:blur(5px);user-select:none}
"""

# ---------- marcatge ----------
# la finestra del banc (#mb) es manté al marcatge: el codi hi penja esdeveniments, i està desactivada (FIN_BANK = false)

body = patch(body, '<div class="legend"><span><i class="dot"></i>Disponible</span><span><i class="dot reserved"></i>Reservat</span><span><i class="dot sold"></i>Venut</span></div>',
    '<div class="legend"><span><i class="dot"></i>Disponible</span><span><i class="dot agreed"></i>Aparaulat</span><span><i class="dot reserved"></i>Reservat</span><span><i class="dot sold"></i>Venut</span></div>', 'llegenda amb aparaulat')
# ---------- idiomes: diccionaris i selector ----------
import json, shutil
cols = {'es': 1, 'fr': 2, 'en': 3}
dic = {k: {} for k in cols}
for ln in (ROOT / 'showroom-src/i18n.tsv').read_text(encoding='utf-8').splitlines():
    if not ln.strip() or ln.startswith('#'): continue
    f = ln.split('\t')
    if len(f) != 4: sys.exit(f'i18n.tsv: línia amb {len(f)} columnes: {ln[:60]}')
    for k, i in cols.items(): dic[k][f[0]] = f[i]
for k, d in dic.items(): (ROOT / f'lang/showroom-{k}.json').write_text(json.dumps(d, ensure_ascii=False, indent=0), encoding='utf-8')
shutil.copyfile(ROOT / 'showroom-src/i18n.js', ROOT / 'assets/sr/i18n.js')
body = patch(body, '  </nav>\n  <div class="foot">', '  </nav>\n  <?php axs_lang_menu( $lang ); ?>\n  <div class="foot">', 'selector d\'idioma al menú')
css += """
/* v4: selector d'idioma */
.m-lang{display:flex;gap:6px;padding:4px 16px 12px}
.m-lang a{flex:1;text-align:center;padding:8px 0;border-radius:999px;font:600 12px var(--f);letter-spacing:.06em;color:var(--ink);background:rgba(28,32,29,.06)}
.m-lang a.on{background:var(--ink);color:#fff}
"""
# missatge del formulari de contacte en l'idioma de la pàgina
js = patch(js, "`Hola, soc ${n}. ${m || 'M’interessa Aixovall Residencial.'}`", "`${(window.axsTr || (t => t))('Hola, soc')} ${n}. ${m || (window.axsTr || (t => t))('M’interessa Aixovall Residencial.')}`", 'missatge de contacte traduït')
(ROOT / 'assets/sr/showroom.css').write_text(css, encoding='utf-8')
(ROOT / 'assets/sr/showroom.js').write_text(js, encoding='utf-8')
tpl = """<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** v4 · Showroom. Generat per tools/build_showroom.py a partir de showroom-src/index.html — no editar a mà.
 * @var string $lang @var array $t @var array $settings @var array $homes */
$axs_cfg_on = ! empty( $settings['cfg_enabled'] );
$axs_homes  = array();
foreach ( $homes as $hm ) {
	$axs_homes[] = array(
		'id' => $hm['id'], 'name' => $hm['name'], 'floor' => (int) $hm['floor'], 'type' => (int) $hm['type'], 'beds' => (int) $hm['bedrooms'],
		'area' => (float) $hm['area'], 'ext' => $hm['ext'], 'extM2' => (float) $hm['ext_m2'], 'status' => $hm['status'],
		/* Mateixa regla que la pàgina actual: preu visible només si està disponible o aparaulat. */
		'price' => in_array( $hm['status'], array( 'available', 'agreed' ), true ) ? (float) $hm['price'] : null,
		'cfg' => ( $axs_cfg_on && '' !== $hm['cfg'] && 'available' === $hm['status'] ) ? axr_url( $lang, $hm['id'] ) : '',
	);
}
$axs_js = isset( $t['js'] ) ? $t['js'] : array();
$axs_boot = array(
	'lang'  => $lang,
	'homes' => $axs_homes,
	'phone' => preg_replace( '/[^0-9]/', '', (string) $settings['phone'] ),
	'st'    => array(
		'available' => isset( $axs_js['st_available'] ) ? $axs_js['st_available'] : 'Disponible',
		'agreed'    => isset( $axs_js['st_agreed'] ) ? $axs_js['st_agreed'] : 'Aparaulat',
		'reserved'  => isset( $axs_js['st_reserved'] ) ? $axs_js['st_reserved'] : 'Reserva tècnica',
		'confirmed' => isset( $axs_js['st_confirmed'] ) ? $axs_js['st_confirmed'] : 'Reserva confirmada',
		'sold'      => isset( $axs_js['st_sold'] ) ? $axs_js['st_sold'] : 'Venut',
	),
);
$axs_base = AXR_URL . 'assets/sr/';
if ( 'ca' !== $lang && file_exists( AXR_DIR . 'lang/showroom-' . $lang . '.json' ) ) {
	$axs_boot['tr'] = json_decode( (string) file_get_contents( AXR_DIR . 'lang/showroom-' . $lang . '.json' ), true );
}
$axs_urls = array();
foreach ( axr_langs() as $code => $name ) { $axs_urls[ $code ] = axr_url( $code ); }
if ( ! function_exists( 'axs_lang_menu' ) ) {
	function axs_lang_menu( $lang ) {
		echo '<div class="m-lang" role="group" aria-label="Idioma">';
		foreach ( axr_langs() as $code => $name ) {
			echo '<a href="' . esc_url( axr_url( $code ) ) . '" data-lang="' . esc_attr( $code ) . '" hreflang="' . esc_attr( $code ) . '" title="' . esc_attr( $name ) . '"' . ( $code === $lang ? ' class="on" aria-current="true"' : '' ) . '>' . esc_html( strtoupper( $code ) ) . '</a>';
		}
		echo '</div>';
	}
}
?><!doctype html>
<html lang="<?php echo esc_attr( $lang ); ?>">
<head>
<?php
$axs_t = 'Aixovall Residencial · Obra nova a Sant Julià de Lòria';
$axs_d = 'Showroom d’Aixovall Residencial: edifici, plantes, habitatges, aparcament, entorn i configurador d’acabats.';
if ( ! empty( $axs_boot['tr'][ $axs_t ] ) ) { $axs_t = $axs_boot['tr'][ $axs_t ]; }
if ( ! empty( $axs_boot['tr'][ $axs_d ] ) ) { $axs_d = $axs_boot['tr'][ $axs_d ]; }
axr_head_common( $lang, $axs_t, $axs_d ); ?>
<script>/* Idioma: el català és el de per defecte; la primera visita s'adapta a l'idioma del navegador (no als cercadors). L'elecció al menú es recorda. */
(function(){ var L = <?php echo wp_json_encode( $axs_urls, JSON_UNESCAPED_SLASHES ); ?>, cur = <?php echo wp_json_encode( $lang ); ?>, k = 'axr-lang', s = null;
 try { s = localStorage.getItem(k); } catch(e){}
 document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[data-lang]'); if (!a) return; e.preventDefault(); try { localStorage.setItem(k, a.dataset.lang); } catch(x){} location.href = L[a.dataset.lang] + location.hash; }, true);
 if (cur !== 'ca' || s || /bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent)) return;
 var b = ((navigator.languages && navigator.languages[0]) || navigator.language || '').slice(0, 2).toLowerCase();
 if (b !== 'ca' && L[b]) location.replace(L[b] + location.hash); })();</script>
<script>/* Amb <base> cap als recursos, un replaceState('#…') canviaria l'adreça a la carpeta d'assets: es manté sempre la de la pàgina. */
(function(){ var H = history; ['pushState', 'replaceState'].forEach(function(m){ var o = H[m]; H[m] = function(s, t, u){ if (typeof u === 'string' && u.charAt(0) === '#') u = location.pathname + location.search + u; return o.call(H, s, t, u); }; }); })();</script>
<base href="<?php echo esc_url( $axs_base ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( $axs_base . 'showroom.css?v=' . axr_ver( 'sr/showroom.css' ) ); ?>">
</head>
<body>
""" + body + """
<script>window.AXS=<?php echo wp_json_encode( $axs_boot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
<script src="<?php echo esc_url( $axs_base . 'i18n.js?v=' . axr_ver( 'sr/i18n.js' ) ); ?>"></script>
<script src="<?php echo esc_url( $axs_base . 'showroom.js?v=' . axr_ver( 'sr/showroom.js' ) ); ?>"></script>
</body>
</html>
"""
(ROOT / 'templates/showroom.php').write_text(tpl, encoding='utf-8')
print('Showroom generat: templates/showroom.php, assets/sr/showroom.css, assets/sr/showroom.js')
