<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Interpreta la ruta: /aixovall-residencial/[es|fr|en/][configurador/<id>/] */
function axr_parse_route() {
	static $route = null;
	if ( null !== $route ) { return $route; }
	$route = false;
	$uri   = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
	$path  = (string) wp_parse_url( $uri, PHP_URL_PATH );
	$home  = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( '' !== $home && '/' !== $home && 0 === strpos( $path, $home ) ) { $path = substr( $path, strlen( $home ) ); }
	$path = trim( $path, '/' );
	if ( preg_match( '#^' . preg_quote( AXR_SLUG, '#' ) . '(?:/(ca|es|fr|en))?(?:/configurador/([A-Za-z0-9-]{1,12}))?$#', $path, $m ) ) {
		$route = array(
			'lang' => ! empty( $m[1] ) ? $m[1] : 'ca',
			'home' => ! empty( $m[2] ) ? strtoupper( $m[2] ) : '',
		);
	}
	return $route;
}

/* Fa que WordPress resolgui sempre la pàgina base (resposta 200 i cacheable). */
function axr_filter_request( $vars ) {
	if ( is_admin() ) { return $vars; }
	if ( axr_parse_route() ) {
		return array( 'pagename' => AXR_SLUG );
	}
	return $vars;
}
add_filter( 'request', 'axr_filter_request' );

/* Sense redirecció canònica: /es/ o /configurador/… no són pàgines filles reals. */
function axr_no_canonical( $redirect ) {
	return axr_parse_route() ? false : $redirect;
}
add_filter( 'redirect_canonical', 'axr_no_canonical' );

function axr_render() {
	$route = axr_parse_route();
	if ( ! $route || is_admin() ) { return; }
	$lang     = $route['lang'];
	$t        = axr_strings( $lang );
	$settings = axr_settings();
	$homes    = axr_homes();

	status_header( 200 );
	header( 'Content-Type: text/html; charset=utf-8' );

	if ( '' !== $route['home'] ) {
		$home = isset( $homes[ $route['home'] ] ) ? $homes[ $route['home'] ] : null;
		if ( ! $home || '' === $home['cfg'] || empty( $settings['cfg_enabled'] ) ) {
			wp_safe_redirect( axr_url( $lang ) . '#habitatges', 302 );
			exit;
		}
		include AXR_DIR . 'templates/configurator.php';
		exit;
	}
	/* v4: showroom nou si està activat al panell, o en vista prèvia per a administradors (?showroom=1). */
	$axs = ! empty( $settings['showroom'] ) || ( isset( $_GET['showroom'] ) && '1' === $_GET['showroom'] && current_user_can( 'manage_options' ) );
	if ( $axs && file_exists( AXR_DIR . 'templates/showroom.php' ) ) {
		if ( empty( $settings['showroom'] ) ) { nocache_headers(); }
		include AXR_DIR . 'templates/showroom.php';
		exit;
	}
	include AXR_DIR . 'templates/page.php';
	exit;
}
add_action( 'template_redirect', 'axr_render', 0 );

/** Atributs d'imatge amb mides (evita salts de disseny). */
function axr_img( $rel, $alt, $attrs = '' ) {
	static $sizes = null;
	if ( null === $sizes ) {
		$sizes = json_decode( (string) @file_get_contents( AXR_DIR . 'assets/sizes.json' ), true );
		if ( ! is_array( $sizes ) ) { $sizes = array(); }
	}
	$wh = isset( $sizes[ $rel ] ) ? ' width="' . (int) $sizes[ $rel ][0] . '" height="' . (int) $sizes[ $rel ][1] . '"' : '';
	$small = preg_replace( '/\.webp$/', '-800.webp', $rel );
	$srcset = '';
	if ( $small !== $rel && isset( $sizes[ $small ] ) && isset( $sizes[ $rel ] ) ) {
		$srcset = ' srcset="' . esc_url( axr_asset( $small ) ) . ' 800w, ' . esc_url( axr_asset( $rel ) ) . ' ' . (int) $sizes[ $rel ][0] . 'w"';
	}
	return '<img src="' . esc_url( axr_asset( $rel ) ) . '"' . $srcset . ' alt="' . esc_attr( $alt ) . '"' . $wh . ' ' . $attrs . '>';
}

function axr_head_common( $lang, $title, $desc, $home_id = '' ) {
	$settings = axr_settings();
	$locales  = axr_locales();
	echo '<meta charset="utf-8">' . "\n";
	echo '<meta name="viewport" content="width=device-width, initial-scale=1">' . "\n";
	echo '<title>' . esc_html( $title ) . '</title>' . "\n";
	echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";
	echo '<meta name="robots" content="' . ( '' !== $home_id ? 'noindex, follow' : ( ! empty( $settings['noindex'] ) ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' ) ) . '">' . "\n";
	echo '<meta name="theme-color" content="#eeeae3">' . "\n";
	echo '<link rel="canonical" href="' . esc_url( axr_url( $lang, $home_id ) ) . '">' . "\n";
	foreach ( axr_langs() as $code => $name ) {
		echo '<link rel="alternate" hreflang="' . esc_attr( $code ) . '" href="' . esc_url( axr_url( $code, $home_id ) ) . '">' . "\n";
	}
	echo '<link rel="alternate" hreflang="x-default" href="' . esc_url( axr_url( 'ca', $home_id ) ) . '">' . "\n";
	echo '<meta property="og:type" content="website">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
	echo '<meta property="og:description" content="' . esc_attr( $desc ) . '">' . "\n";
	echo '<meta property="og:image" content="' . esc_url( axr_asset( 'img/hero-poster.webp' ) ) . '">' . "\n";
	echo '<meta property="og:locale" content="' . esc_attr( str_replace( '-', '_', $locales[ $lang ] ) ) . '">' . "\n";
	echo '<link rel="icon" href="' . esc_url( axr_asset( 'img/logo-api.webp' ) ) . '" type="image/webp">' . "\n";
}

function axr_ver( $rel ) {
	$f = AXR_DIR . 'assets/' . $rel;
	return AXR_VERSION . '.' . ( file_exists( $f ) ? filemtime( $f ) : 0 );
}
