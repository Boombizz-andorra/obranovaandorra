<?php
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
<base href="<?php echo esc_url( $axs_base ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( $axs_base . 'showroom.css?v=' . axr_ver( 'sr/showroom.css' ) ); ?>">
</head>
<body>

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-full" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.500 10.500z"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/></symbol>
<symbol id="i-minus" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/></symbol>
<symbol id="i-l" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></symbol>
<symbol id="i-r" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="m8.200 10.900 7.600-3.800M8.200 13.100l7.600 3.800"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/></symbol>
<symbol id="i-build" viewBox="0 0 24 24"><path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 8h4M8 12h4M8 16h4"/></symbol>
<symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/></symbol>
<symbol id="i-img" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.500"/><circle cx="9" cy="10" r="1.500"/><path d="m4 18 5-5 4 4 3-3 4 4"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6-5.500-6-11a6 6 0 0 1 12 0c0 5.500-6 11-6 11z"/><circle cx="12" cy="10" r="2.200"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M20 11.500a8 8 0 0 1-11.800 7L4 20l1.500-4A8 8 0 1 1 20 11.500z"/></symbol>
<symbol id="i-crane" viewBox="0 0 24 24"><path d="M7 21V5l12 3M7 8h12M17 8v5M4 21h8M7 5l-3 3"/><rect x="15" y="13" width="4" height="3"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></symbol>
<symbol id="i-cmp" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2.500"/><path d="M12 4v16"/></symbol>
<symbol id="i-brush" viewBox="0 0 24 24"><path d="M14 4l6 6-8 8H6v-6z"/><path d="M4 20h16"/></symbol>
<symbol id="i-cube" viewBox="0 0 24 24"><path d="m12 3 8 4.500v9L12 21l-8-4.500v-9z"/><path d="m4 7.500 8 4.500 8-4.500M12 12v9"/></symbol>
<symbol id="i-plan" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1.500"/><path d="M4 10h7v4M14 4v7h6M11 20v-3"/></symbol>
<symbol id="i-car" viewBox="0 0 24 24"><path d="M5 16v-4l2-5h10l2 5v4M3 16h18v2H3z"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></symbol>
<symbol id="i-cart" viewBox="0 0 24 24"><path d="M4 5h2l2 10h9l2-7H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="16.500" cy="19" r="1.3"/></symbol>
<symbol id="i-cross" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M5 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H5zM19 5h-4a2 2 0 0 0-2 2"/><path d="M19 5v12h-4a2 2 0 0 0-2 2"/></symbol>
<symbol id="i-tree" viewBox="0 0 24 24"><path d="M12 3 6 12h3l-3 5h12l-3-5h3zM12 17v4"/></symbol>
<symbol id="i-road" viewBox="0 0 24 24"><path d="M8 4 5 20M16 4l3 16M12 5v2M12 11v2M12 17v2"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></symbol>
<symbol id="i-rocket" viewBox="0 0 24 24"><path d="M12 3c3 2 5 5.500 5 9l-2 3H9l-2-3c0-3.500 2-7 5-9z"/><circle cx="12" cy="10" r="1.800"/><path d="M9 18l-1 3M15 18l1 3M12 18v3"/></symbol>
<symbol id="i-rise" viewBox="0 0 24 24"><path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 5v4M5.500 9.500l1.500 1.500M18.500 9.500 17 11M9.500 7.500 12 5l2.500 2.500"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></symbol>
</defs></svg>

<!-- INTRO -->
<section id="intro" aria-label="Benvinguda">
  <img class="poster" src="view/v1.webp" alt="">
  <video id="introv" muted loop playsinline preload="auto" poster="view/v1.webp"></video>
  <div class="intro-c">
    <div class="logo"><b>AIXOVALL</b><i></i><span>RESIDENCIAL</span></div>
    <p>15 habitatges d’obra nova a Sant Julià de Lòria. Passeja-t’hi, tria el teu pis i configura’n els acabats.</p>
    <button class="enter" id="enter">Entrar</button>
  </div>
  <div class="intro-foot">Showroom virtual · demo iShowi</div>
</section>

<div id="app" hidden>
  <!-- global top bar -->
  <div class="top" id="top">
    <button class="pill dark" id="b-menu" aria-label="Obrir el menú"><svg class="i"><use href="#i-menu"/></svg>Menú</button>
    <button class="pill dark round" id="b-back" aria-label="Tornar" hidden><svg class="i"><use href="#i-back"/></svg></button>
    <span class="crumb" id="crumb"></span>
    <span class="sp"></span>
    <div class="tabs" id="pis-tabs" hidden></div>
    <div class="dn" id="dn" hidden role="group" aria-label="Dia o nit">
      <button data-n="2" aria-label="Matí" title="Matí"><svg class="i"><use href="#i-rise"/></svg></button>
      <button data-n="0" aria-label="Tarda" title="Tarda"><svg class="i"><use href="#i-sun"/></svg></button>
      <button data-n="1" aria-label="Nit" title="Nit"><svg class="i"><use href="#i-moon"/></svg></button>
      <button data-n="a" aria-label="Cicle automàtic del dia" title="Cicle automàtic"><svg class="i"><use href="#i-play"/></svg></button>
    </div>
    <button class="pill round" id="b-full" aria-label="Pantalla completa"><svg class="i"><use href="#i-full"/></svg></button>
  </div>

  <!-- EDIFICI -->
  <section class="screen" id="s-edifici">
    <div class="vp" id="e-vp"><div class="pz" id="e-pz" style="width:1600px;height:900px">
      <div class="live"><img class="base" id="e-img" alt="Vista exterior d’Aixovall Residencial">
      <canvas id="e-gl" width="1600" height="900"></canvas>
      <video id="e-vid" muted playsinline preload="auto"></video>
      <div class="e-mist"></div><div id="e-cars"></div></div>
      <svg class="ov" id="e-ov" viewBox="0 0 1600 900"></svg>
      <div id="e-labs"></div>
    </div></div>
    <div class="viewdots" id="e-dots"></div>
    <button class="pill dark round navarrow l" id="e-prev" aria-label="Vista anterior"><svg class="i"><use href="#i-l"/></svg></button>
    <button class="pill dark round navarrow r" id="e-next" aria-label="Vista següent"><svg class="i"><use href="#i-r"/></svg></button>
    <div class="side bl"><button class="pill dark round" data-z="1.35" aria-label="Apropar"><svg class="i"><use href="#i-plus"/></svg></button><button class="pill round" data-z="0.74" aria-label="Allunyar"><svg class="i"><use href="#i-minus"/></svg></button></div>
    <div class="dock" id="dock"><button data-info="obra"><svg class="i"><use href="#i-crane"/></svg>Obra</button><button data-info="pagaments"><svg class="i"><use href="#i-info"/></svg>Pagaments</button><button data-info="financ"><svg class="i"><use href="#i-chat"/></svg>Finançament</button><button data-go="aparcament"><svg class="i"><use href="#i-car"/></svg>Aparcament</button><button data-go="entorn"><svg class="i"><use href="#i-pin"/></svg>Entorn</button><button data-go="sol"><svg class="i"><use href="#i-sun"/></svg>Sol</button></div>
    <div class="pill sm hint" id="e-hint">Toca una planta · mou el cursor per canviar l’angle</div>
  </section>

  <!-- PLANTA -->
  <section class="screen planbg" id="s-planta">
    <div class="vp" id="p-vp"><div class="pz" id="p-pz" style="width:968px;height:1173px">
      <img class="base" id="p-img" alt="" style="object-fit:contain;mix-blend-mode:multiply">
      <svg class="ov" id="p-ov" viewBox="0 0 968 1173"></svg>
      <div id="p-labs"></div>
    </div></div>
    <div class="floors" id="floors" role="group" aria-label="Plantes"></div>
    <div class="legend"><span><i class="dot"></i>Disponible</span><span><i class="dot agreed"></i>Aparaulat</span><span><i class="dot reserved"></i>Reservat</span><span><i class="dot sold"></i>Venut</span></div>
  </section>

  <!-- HABITATGES -->
  <section class="screen" id="s-habitatges"><div class="page"><div class="wrap">
    <h1>Habitatges</h1>
    <p class="lead">Pisos d’1, 2 i 3 dormitoris. Preus sense IGI, actualitzats el 30/09/2026.</p>
    <div class="tools">
      <select id="f-floor" aria-label="Planta"><option value="">Totes les plantes</option><option value="0">Planta baixa</option><option value="1">Primera</option><option value="2">Segona</option><option value="3">Tercera</option><option value="4">Àtic</option></select>
      <select id="f-beds" aria-label="Dormitoris"><option value="">Dormitoris: tots</option><option value="1">1 dormitori</option><option value="2">2 dormitoris</option><option value="3">3 dormitoris</option></select>
      <select id="f-sort" aria-label="Ordenar"><option value="floor">Ordre: planta</option><option value="up">Preu: de menys a més</option><option value="down">Preu: de més a menys</option><option value="area">Superfície</option></select>
      <label class="chk"><input type="checkbox" id="f-av"> Només disponibles</label>
      <label class="chk"><input type="checkbox" id="f-fav"> Preferits</label>
      <span class="count" id="f-count"></span>
    </div>
    <div class="cards" id="cards"></div>
  </div></div>
  <button class="pill dark cmpbar" id="cmpbar"><svg class="i"><use href="#i-cmp"/></svg><span></span></button>
  </section>

  <!-- PIS -->
  <section class="screen" id="s-pis">
    <div class="vp" id="u-vp"><div class="pz" id="u-pz"><img class="base" id="u-img" alt="" style="object-fit:contain"></div></div>
    <div class="side bl" style="bottom:auto;top:50%;transform:translateY(-50%)"><button class="pill dark round" data-z="1.35" aria-label="Apropar"><svg class="i"><use href="#i-plus"/></svg></button><button class="pill round" data-z="0.74" aria-label="Allunyar"><svg class="i"><use href="#i-minus"/></svg></button></div>
    <div class="ref" id="u-ref"></div>
    <div class="ubar">
      <div class="info"><span><b id="u-name"></b> <span class="badge" id="u-st"></span></span><b id="u-price"></b></div>
      <button class="btn ghost" id="u-fitxa"><svg class="i"><use href="#i-info"/></svg>Fitxa</button>
      <button class="btn wood" id="u-cfg"><svg class="i"><use href="#i-brush"/></svg>Configurar acabats</button>
    </div>
  </section>

  <!-- CONFIGURADOR -->
  <section class="screen" id="s-cfg">
    <div class="c-stage">
      <div class="blur" id="c-blur"></div>
      <button class="pill round c-close" id="c-close" aria-label="Sortir del configurador"><svg class="i"><use href="#i-x"/></svg></button>
      <div class="c-steps" id="c-steps"></div>
      <div class="c-frame"><div class="c-canvas" id="c-canvas"></div></div>
    </div>
    <div class="c-panel">
      <div class="c-scroll" id="c-scroll"></div>
      <div class="c-bar">
        <div class="tot"><small id="c-totl">Configuracions</small><b id="c-tot">0 €</b></div>
        <button class="btn ghost" id="c-prev">Anterior</button>
        <button class="btn" id="c-next">Següent</button>
      </div>
      <div class="c-mbrow"><button class="mb-strip" data-mb="cfg"><img class="bk-logo" src="img/creand.webp" alt="Creand"><span>Vols saber més sobre com finançar-ho?</span><svg class="i"><use href="#i-r"/></svg></button></div>
    </div>
  </section>

  <!-- GALERIA -->
  <section class="screen" id="s-galeria"><div class="page"><div class="wrap">
    <h1>Galeria</h1><p class="lead">Imatges il·lustratives dels habitatges. Toca’n una per veure-la a pantalla completa.</p>
    <div class="gal" id="gal"></div>
    <p class="note">Els renders i les imatges són referencials i no tenen implicacions contractuals.</p>
  </div></div></section>

  <!-- OBRA -->
  <section class="screen" id="s-obra"><div class="page"><div class="wrap">
    <h1>Avanç de l’obra</h1><p class="lead">Llicència del comú concedida. Inici d’obres previst entre desembre de 2026 i gener de 2027.</p>
    <div class="grid2">
      <div class="box"><h2>Calendari</h2><ul class="tl">
        <li class="done"><b>Projecte arquitectònic</b><small>Fet</small></li>
        <li class="done"><b>Llicència del comú</b><small>Fet</small></li>
        <li class="next"><b>Inici d’obres</b><small>Des. 2026 – gen. 2027 · pròxim pas</small></li>
        <li><b>Fonaments</b><small>Pagament del 10 % quan un arquitecte certifica la fase</small></li>
        <li><b>Teulada</b><small>Pagament del 20 % quan un arquitecte certifica la fase</small></li>
        <li><b>Tancament de façana</b><small>Pagament del 20 % quan un arquitecte certifica la fase</small></li>
        <li><b>Entrega</b><small>Prevista el 1r trimestre de 2029 · 40 % a notari</small></li>
      </ul><p class="note">Dates orientatives. El contracte d’arres defineix els compromisos del promotor.</p></div>
      <div class="box"><h2>Reserva i pagaments</h2>
        <ul class="pay"><li><span>Reserva<small>Et guardem el pis un mes · compta dins de les arres</small></span><b>10.000 €</b></li><li><span>Arres<small>Fins al 10 %, menys la reserva ja pagada</small></span><b>10 %</b></li><li><span>Fonaments</span><b>10 %</b></li><li><span>Sostre</span><b>20 %</b></li><li><span>Tancament de façana</span><b>20 %</b></li><li><span>Notari<small>A l’escriptura pública</small></span><b>40 %</b></li></ul>
        <p class="note">Cal afegir l’IGI (4,5 %) a cada pagament. Venciments segons contracte i avanç certificat de l’obra.</p>
        <div class="row2"><a class="btn" href="#habitatges">Veure habitatges</a><button class="btn ghost" data-info="financ">Finançament</button></div>
      </div>
    </div>
  </div></div></section>

  <!-- UBICACIO -->
  <section class="screen" id="s-ubicacio"><div class="page"><div class="wrap">
    <h1>Ubicació</h1><p class="lead">Aixovall, parròquia de Sant Julià de Lòria, Andorra.</p>
    <div class="grid2">
      <div class="box"><h2>On és</h2><p>Aixovall és un nucli de Sant Julià de Lòria, al sud del país, al costat de la carretera general que uneix la frontera espanyola amb Andorra la Vella.</p>
        <a class="btn" style="margin-top:14px" href="https://www.google.com/maps/search/?api=1&query=Aixovall%2C+Sant+Juli%C3%A0+de+L%C3%B2ria%2C+Andorra" target="_blank" rel="noopener"><svg class="i"><use href="#i-pin"/></svg>Obrir a Google Maps</a>
        <p class="note">A la versió publicada, aquest apartat mostra el mapa interactiu i els punts d’interès de l’entorn.</p></div>
      <div class="box" style="padding:0;overflow:hidden"><img src="img/terrace-t5.webp" alt="Vista des d’una terrassa" style="width:100%;height:100%;object-fit:cover;min-height:260px"></div>
    </div>
  </div></div></section>

  <!-- ENTORN -->
  <section class="screen split" id="s-entorn">
    <div class="stg" id="en-stg">
      <svg id="en-svg" preserveAspectRatio="xMidYMid slice"></svg>
      <div id="en-marks"></div>
      <div id="en-photo"></div>
      <div id="en-hud"><span class="pill sm dark" id="en-alt"></span><button class="pill sm" id="en-replay"><svg class="i"><use href="#i-rocket"/></svg>Repetir</button></div>
    </div>
    <div class="pan">
      <div class="cat">Entorn</div><h2>Tot a prop d’Aixovall</h2>
      <p class="sub" style="margin:4px 0 0">Al peu de la CG-1, entre Sant Julià de Lòria i Andorra la Vella.</p>
      <div class="cats" id="en-cats"></div>
      <ul class="plist" id="en-list"></ul>
      <p class="note">Distàncies en línia recta. Minuts en cotxe aproximats, en condicions normals de trànsit; pendents de verificar. Mapa esquemàtic a escala. Línies de bus pendents de confirmar.</p>
      <a class="btn ghost" style="margin-top:10px" href="https://www.google.com/maps/search/?api=1&query=42.47738%2C1.49059" target="_blank" rel="noopener"><svg class="i"><use href="#i-pin"/></svg>Obrir a Google Maps</a>
    </div>
  </section>

  <!-- SOL -->
  <section class="screen split" id="s-sol">
    <div class="stg">
      <div id="so-bg"></div><div id="so-bgn"></div><div id="so-tint"></div><div id="so-glow"></div>
      <canvas id="so-3d" aria-label="Model 3D de l’edifici amb el sol i les ombres. Arrossega per girar."></canvas><div id="so-load" hidden><span id="so-lt">Carregant el model 3D…</span><div class="prog"><i id="so-lb"></i></div></div>
      <div class="so-view" id="so-view" hidden><button class="pill sm" data-cam="carrer">Carrer</button><button class="pill sm" data-cam="aeri">Aeri</button><button class="pill sm" data-cam="sol">Des del sol</button></div>
      <div class="so-read"><span class="pill dark"><b id="so-when"></b></span><span class="pill" id="so-status"></span></div>
    </div>
    <div class="pan">
      <div class="cat">Sol i orientació</div><h2>On toca el sol, i quan</h2>
      <div class="sl"><span>Mes</span><input type="range" class="mo" id="so-m" min="1" max="12" step="1" aria-label="Mes"><output id="so-mo"></output></div>
      <div class="months"><span>G</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span></div>
      <div class="sl"><span>Hora</span><input type="range" id="so-h" min="5" max="22" step="0.25" aria-label="Hora"><output id="so-ho"></output></div>
      <div class="row2" style="margin-top:8px"><button class="btn ghost" id="so-play" style="min-height:42px"><svg class="i"><use href="#i-play"/></svg>Reproduir el dia</button><button class="btn ghost" id="so-now" style="min-height:42px">Ara</button></div>
      <div class="charts"><svg id="so-sky" viewBox="0 0 300 150" role="img" aria-label="Recorregut del sol sobre el perfil de muntanyes"></svg><svg id="so-plan" viewBox="-110 -110 220 220" role="img" aria-label="Planta de l’edifici amb la direcció del sol i l’ombra"></svg></div>
      <div class="fac" id="so-fac"></div>
      <p class="note">Model 3D d’ArchiCAD de Magnesi Arquitectes amb ombres en temps real. Posició del sol calculada per a Aixovall (42,4774° N, 1,4906° E, 934 m), dia 21 de cada mes, hora oficial. Perfil de muntanyes obtingut d’un model d’elevació de 90 m: no inclou arbres ni edificis veïns, i el vessant immediat de darrere és aproximat. Orientació mesurada sobre ortofoto (±5°). Estimació orientativa, no és un estudi tècnic d’assolellament.</p>
    </div>
  </section>

  <!-- APARCAMENT -->
  <section class="screen split" id="s-aparcament">
    <div class="stg"><div id="ap-plan"></div><div class="so-read"><span class="pill dark" id="ap-hint">Toca una plaça del plànol</span><button class="pill" id="ap-replay"><svg class="i"><use href="#i-play"/></svg>Repetir</button></div></div>
    <div class="pan">
      <div class="cat">Aparcament</div><h2>Planta −1 · 13 places</h2>
      <p class="sub" style="margin:4px 0 0">Amb el cotxe s’hi accedeix per l’ascensor de vehicles. Tria una plaça al plànol i mira com hi arribes.</p>
      <div class="seg" id="ap-type" role="group" aria-label="Tipus de plaça"><button data-t="A" class="on">Plaça</button><button data-t="B">Plaça doble</button></div>
      <div class="apc" id="ap-card"></div>
      <ul class="pay"><li><span>Plaça d’aparcament</span><b id="ap-pa"></b></li><li><span>Plaça doble<small>P2 + P3 o P8 + P9</small></span><b id="ap-pb"></b></li><li><span>Traster<small>1,5 m²</small></span><b id="ap-tr"></b></li></ul>
      <div style="display:grid;gap:8px;margin-top:14px"><a class="btn wood" id="ap-wa" target="_blank" rel="noopener"><svg class="i"><use href="#i-chat"/></svg>Preguntar per aquesta plaça</a><a class="btn ghost" href="#habitatges"><svg class="i"><use href="#i-grid"/></svg>Tria pis i afegeix-la al configurador</a></div>
      <p class="note">Plànol de projecte de la planta −1. Places numerades segons el plànol; la disponibilitat i l’assignació de cada plaça es confirmen amb la tarifa oficial. Imports sense IGI. L’aparcament i el traster s’afegeixen al preu de l’habitatge.</p>
    </div>
  </section>

  <!-- CONTACTE -->
  <section class="screen" id="s-contacte"><div class="page"><div class="wrap">
    <h1>Contacte</h1><p class="lead">Comercialitza API Immobiliària. Escriu-nos i t’ho expliquem sense compromís.</p>
    <div class="grid2">
      <form class="box" id="cform"><h2>Parlem-ne</h2>
        <div class="field"><label for="cn">Nom i cognoms</label><input id="cn" autocomplete="name" required></div>
        <div class="field"><label for="cm">Missatge</label><textarea id="cm" placeholder="M’interessa Aixovall Residencial…"></textarea></div>
        <button class="btn wood" style="width:100%"><svg class="i"><use href="#i-chat"/></svg>Continuar per WhatsApp</button>
        <p class="note">S’obrirà WhatsApp amb el missatge preparat per a API Immobiliària (+376 822345). No s’envia res des d’aquesta pàgina.</p>
        <p id="cout" class="note" hidden></p>
      </form>
      <div class="box"><h2>Qui hi ha darrere</h2>
        <ul class="pay"><li><span>Comercialitza<small>WhatsApp i telèfon +376 822345 · apimi@andorra.ad</small></span><b>API Immobiliària</b></li><li><span>Promotor</span><b>Construccions Estapé</b></li><li><span>Arquitectura</span><b>Magnesi Arquitectes</b></li></ul>
        <p class="note">Showroom i configurador: iShowi, de BoomBizz Solucions Comercials.</p></div>
    </div>
  </div></div></section>
</div>

<!-- overlays -->
<div id="scrim"></div>
<aside id="menu" aria-label="Menú" aria-hidden="true">
  <button class="pill round sm x" id="m-x" aria-label="Tancar el menú"><svg class="i"><use href="#i-x"/></svg></button>
  <div class="logo"><b>AIXOVALL</b><i></i><span>RESIDENCIAL</span></div>
  <div class="addr"><b>Aixovall Residencial</b>Aixovall · Sant Julià de Lòria · Andorra</div>
  <nav id="m-nav">
    <a href="#inici" data-s="inici"><svg class="i"><use href="#i-home"/></svg>Inici</a>
    <a href="#edifici" data-s="edifici"><svg class="i"><use href="#i-build"/></svg>Edifici</a>
    <a href="#planta-1" data-s="planta"><svg class="i"><use href="#i-layers"/></svg>Plantes</a>
    <a href="#habitatges" data-s="habitatges"><svg class="i"><use href="#i-grid"/></svg>Habitatges</a>
    <a href="#aparcament" data-s="aparcament"><svg class="i"><use href="#i-car"/></svg>Aparcament</a>
    <a href="#cfg-1-1" data-s="cfg"><svg class="i"><use href="#i-brush"/></svg>Configurador</a>
    <a href="#galeria" data-s="galeria"><svg class="i"><use href="#i-img"/></svg>Galeria</a>
    <a href="#obra" data-s="obra"><svg class="i"><use href="#i-crane"/></svg>Avanç de l’obra</a>
    <a href="#entorn" data-s="entorn"><svg class="i"><use href="#i-pin"/></svg>Entorn</a>
    <a href="#sol" data-s="sol"><svg class="i"><use href="#i-sun"/></svg>Sol i orientació</a>
    <a href="#contacte" data-s="contacte"><svg class="i"><use href="#i-chat"/></svg>Contacte</a>
  </nav>
  <?php axs_lang_menu( $lang ); ?>
  <div class="foot"><div><a class="pill sm" href="https://wa.me/376822345" target="_blank" rel="noopener"><svg class="i"><use href="#i-chat"/></svg>WhatsApp</a><button class="pill sm" id="m-share"><svg class="i"><use href="#i-share"/></svg>Copiar enllaç</button></div>API Immobiliària · +376 822345<br>Powered by iShowi · BoomBizz</div>
</aside>
<div id="sheet" role="dialog" aria-modal="false" aria-hidden="true"><div class="grab"></div><button class="x" id="sh-x" aria-label="Tancar"><svg class="i"><use href="#i-x"/></svg></button><div class="body" id="sh-body"></div></div>
<div id="lb" role="dialog" aria-label="Galeria" aria-hidden="true"><div class="st"><img id="lb-img" alt=""><button class="pill round" style="position:absolute;top:14px;right:14px" id="lb-x" aria-label="Tancar"><svg class="i"><use href="#i-x"/></svg></button><button class="pill dark round navarrow l" id="lb-p" aria-label="Anterior"><svg class="i"><use href="#i-l"/></svg></button><button class="pill dark round navarrow r" id="lb-n" aria-label="Següent"><svg class="i"><use href="#i-r"/></svg></button><span class="pill sm dark cap" id="lb-cap"></span></div><div class="strip" id="lb-strip"></div></div>
<div class="pill dark" id="toast" role="status"></div>
<div id="mb" role="dialog" aria-modal="true" aria-labelledby="mb-t" aria-hidden="true"><div class="mbc" id="mb-c"></div></div>


<script>window.AXS=<?php echo wp_json_encode( $axs_boot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
<script src="<?php echo esc_url( $axs_base . 'i18n.js?v=' . axr_ver( 'sr/i18n.js' ) ); ?>"></script>
<script src="<?php echo esc_url( $axs_base . 'showroom.js?v=' . axr_ver( 'sr/showroom.js' ) ); ?>"></script>
</body>
</html>
