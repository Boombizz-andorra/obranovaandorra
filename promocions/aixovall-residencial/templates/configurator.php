<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
/** @var string $lang @var array $t @var array $settings @var array $home */
$c       = $t['cfg'];
$locales = axr_locales();
$types   = axr_types();
$type    = $types[ $home['cfg'] ];
$catalog = array();
foreach ( axr_catalog() as $key => $grp ) {
	$ops = array();
	foreach ( $grp['ops'] as $op ) {
		if ( empty( $op['on'] ) ) { continue; }
		$ops[] = array( 'id' => $op['id'], 'name' => $op['name'], 'brand' => $op['brand'], 'price' => (float) $op['price'] );
	}
	$catalog[ $key ] = array( 'perM2' => $grp['per_m2'], 'annex' => $grp['annex'], 'sample' => $grp['sample'], 'ops' => $ops );
}
$lang_urls = array();
foreach ( axr_langs() as $code => $name ) { $lang_urls[ $code ] = axr_url( $code, $home['id'] ); }
$boot = array(
	'lang' => $lang, 'locale' => $locales[ $lang ], 'assets' => axr_asset_bases(), 'i18n' => $c,
	'home' => array( 'id' => $home['id'], 'name' => $home['name'], 'floor' => $home['floor'], 'type' => $home['type'], 'bedrooms' => $home['bedrooms'], 'area' => $home['area'], 'ext' => $home['ext'], 'extM2' => $home['ext_m2'], 'price' => $home['price'], 'status' => $home['status'] ),
	'kind' => $home['cfg'], 'type' => array( 'label' => $type['label'], 'util' => $type['util'], 'built' => $type['built'], 'floorM2' => $type['floor_m2'], 'baths' => $type['baths'] ),
	'catalog' => $catalog, 'phone' => $settings['phone'],
	'back' => axr_url( $lang ) . '#habitatges', 'self' => axr_url( $lang, $home['id'] ),
	'lead' => ! empty( $settings['lead_form'] ) ? esc_url_raw( rest_url( 'aixovall/v1/lead' ) ) : '',
	'jspdf' => AXR_URL . 'assets/vendor/jspdf.umd.min.js?v=2.5.1',
	'planta' => AXR_URL . 'assets/planta/planta.html',
	'pv'     => AXR_VERSION,
	'igi' => (float) $settings['igi'],
	'parking' => function_exists( 'axr_parking_boot' ) ? axr_parking_boot() : null,
	'fin' => ! empty( $settings['fin_on'] ),
	'finUrl' => '' !== trim( (string) $settings['fin_url'] ) ? esc_url_raw( $settings['fin_url'] ) : 'mailto:' . $settings['email'] . '?subject=' . rawurlencode( 'Finançament · Aixovall Residencial · ' . $home['name'] ),
);
$title = str_replace( '{home}', $home['name'], $c['title'] );
?><!doctype html>
<html lang="<?php echo esc_attr( $lang ); ?>">
<head>
<?php axr_head_common( $lang, $title, $t['page']['cs_lead'], $home['id'] ); ?>
<link rel="stylesheet" href="<?php echo esc_url( AXR_URL . 'assets/css/cfg.css?v=' . axr_ver( 'css/cfg.css' ) ); ?>">
</head>
<body>
<div id="axc">
<header class="axc-top">
  <a class="axc-back" href="<?php echo esc_url( axr_url( $lang ) . '#habitatges' ); ?>" aria-label="<?php echo esc_attr( $c['back'] ); ?>"><span aria-hidden="true">←</span></a>
  <a class="axc-brand" href="<?php echo esc_url( axr_url( $lang ) ); ?>"><span>AIXOVALL</span><small><?php echo esc_html( $c['sub'] ); ?></small></a>
  <div class="axc-home"><strong><?php echo esc_html( $home['name'] ); ?></strong><span>T<?php echo (int) $home['type']; ?> · <span id="axc-price"></span></span></div>
  <div class="axc-lang" role="navigation" aria-label="<?php echo esc_attr( $c['lang_label'] ); ?>"><?php foreach ( axr_langs() as $code => $name ) : ?><a href="<?php echo esc_url( $lang_urls[ $code ] ); ?>" data-lang="<?php echo esc_attr( $code ); ?>" hreflang="<?php echo esc_attr( $code ); ?>" title="<?php echo esc_attr( $name ); ?>"<?php echo $code === $lang ? ' aria-current="true"' : ''; ?>><?php echo esc_html( strtoupper( $code ) ); ?></a><?php endforeach; ?></div>
</header>
<nav class="axc-steps-wrap" aria-label="<?php echo esc_attr( $c['sub'] ); ?>"><ol class="axc-steps" id="axc-steps"></ol></nav>
<main class="axc-main">
  <div class="axc-grid" id="axc-grid">
    <div class="axc-viewer" id="axc-viewer"></div>
    <div class="axc-panel" id="axc-panel"></div>
  </div>
</main>
<div class="axc-nav">
  <button type="button" id="axc-prev" class="axc-btn"><span aria-hidden="true">←</span> <?php echo esc_html( $c['prev'] ); ?></button>
  <div class="axc-tot" aria-live="polite"><span><?php echo esc_html( $c['total'] ); ?></span><b id="axc-total"></b></div>
  <button type="button" id="axc-next" class="axc-btn axc-primary"><?php echo esc_html( $c['next'] ); ?> <span aria-hidden="true">→</span></button>
</div>
<noscript><p style="padding:24px"><?php echo esc_html( str_replace( '{phone}', $settings['phone'], $t['page']['noscript'] ) ); ?></p></noscript>
</div>
<script>window.AXC=<?php echo wp_json_encode( $boot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
<?php
/* v3.3 · selector de pis i mesura */
$ax_hl = array();
foreach ( axr_homes() as $ax_h ) {
	$ax_hl[] = array( 'id' => $ax_h['id'], 'name' => $ax_h['name'], 'floor' => $ax_h['floor'], 'type' => $ax_h['type'], 'bedrooms' => $ax_h['bedrooms'], 'area' => $ax_h['area'], 'ext' => $ax_h['ext'], 'extM2' => $ax_h['ext_m2'], 'price' => 'available' === $ax_h['status'] ? $ax_h['price'] : null, 'status' => $ax_h['status'], 'cfg' => ( ! empty( $settings['cfg_enabled'] ) && '' !== $ax_h['cfg'] && 'agreed' !== $ax_h['status'] ) ? axr_url( $lang, $ax_h['id'] ) : '' );
}
$ax_ht = array( 'building_alt' => isset( $t['page']['exp_alt'] ) ? $t['page']['exp_alt'] : '' );
foreach ( $t['js'] as $ax_k => $ax_v ) { if ( preg_match( '/^(floor_-?\d_t|ext_|st_)/', $ax_k ) ) { $ax_ht[ $ax_k ] = $ax_v; } }
$ax_track = array( 'pixel' => '2355120198569529', 'ga4' => '', 'capi' => '' );
?>
<script>window.AXH=<?php echo wp_json_encode( array( 'homes' => $ax_hl, 't' => $ax_ht ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;window.AXTRACK=<?php echo wp_json_encode( $ax_track, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
<script src="<?php echo esc_url( AXR_URL . 'assets/js/cfg.js?v=' . axr_ver( 'js/cfg.js' ) ); ?>" defer></script>
</body>
</html>
