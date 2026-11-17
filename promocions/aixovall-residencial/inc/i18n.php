<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

function axr_langs() { return array( 'ca' => 'Català', 'es' => 'Español', 'fr' => 'Français', 'en' => 'English' ); }
function axr_locales() { return array( 'ca' => 'ca-AD', 'es' => 'es-ES', 'fr' => 'fr-FR', 'en' => 'en-GB' ); }

function axr_strings( $lang ) {
	static $cache = array();
	if ( isset( $cache[ $lang ] ) ) { return $cache[ $lang ]; }
	$base = json_decode( (string) file_get_contents( AXR_DIR . 'lang/ca.json' ), true );
	if ( ! is_array( $base ) ) { $base = array(); }
	if ( 'ca' !== $lang && file_exists( AXR_DIR . 'lang/' . $lang . '.json' ) ) {
		$tr = json_decode( (string) file_get_contents( AXR_DIR . 'lang/' . $lang . '.json' ), true );
		if ( is_array( $tr ) ) {
			foreach ( $base as $section => $items ) {
				if ( isset( $tr[ $section ] ) && is_array( $tr[ $section ] ) ) { $base[ $section ] = array_merge( $items, $tr[ $section ] ); }
			}
		}
	}
	$cache[ $lang ] = $base;
	return $base;
}

/** URL pública: pàgina o configurador, en un idioma. */
function axr_url( $lang = 'ca', $home = '' ) {
	$u = trailingslashit( home_url( '/' . AXR_SLUG ) );
	if ( 'ca' !== $lang ) { $u .= $lang . '/'; }
	if ( '' !== $home ) { $u .= 'configurador/' . rawurlencode( strtolower( $home ) ) . '/'; }
	return $u;
}
