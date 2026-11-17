<?php
/**
 * v4.1 · Imatges del configurador.
 * El repositori no porta els renders del configurador (capes de cuina, terra, bany, mostres, plànols): eren al
 * servidor d'apimi.com. Aquest mòdul els baixa sol des d'allà, en segon pla (WP-Cron, per tandes), a
 * wp-content/uploads/aixovall-residencial/, que és la carpeta que el configurador ja fa servir primer (axr_asset).
 * Panell: Aixovall › Ajustes › «Imatges del configurador» (estat i botó per tornar-ho a provar).
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** D'on es baixen, per ordre (primer el paquet de mitjans, després els fitxers del plugin). */
function axr_media_sources() {
	return apply_filters( 'axr_media_sources', array(
		'https://backend.apimi.com/wp-content/uploads/aixovall-residencial/',
		'https://backend.apimi.com/wp-content/plugins/aixovall-residencial/assets/',
		'https://apimi.com/wp-content/uploads/aixovall-residencial/',
		'https://apimi.com/wp-content/plugins/aixovall-residencial/assets/',
	) );
}

/** Tots els fitxers que pot demanar el configurador (mateixes regles que assets/js/cfg.js). */
function axr_media_list() {
	$cat   = axr_catalog();
	$ids   = function ( $k ) use ( $cat ) { return isset( $cat[ $k ]['ops'] ) ? array_map( function ( $o ) { return $o['id']; }, array_values( $cat[ $k ]['ops'] ) ) : array(); };
	$kinds = array();
	foreach ( axr_homes() as $h ) {
		if ( ! empty( $h['cfg'] ) ) { $kinds[ $h['cfg'] ] = true; }
	}
	foreach ( array_keys( axr_default_types() ) as $k ) { $kinds[ $k ] = true; }
	$f = array();
	foreach ( array_keys( $kinds ) as $k ) {
		$d  = 'cfg/' . $k . '/';
		$ld = 't5' === $k ? 'cfg/t4/' : $d;
		$f[] = $ld . 'su_base.webp';
		foreach ( $ids( 'SV' ) as $o ) { $f[] = $ld . 'su_' . $o . '.webp'; }
		$f[] = $ld . 'co_base.webp';
		foreach ( array( 'SV', 'IL', 'FB', 'FA', 'EC' ) as $g ) {
			foreach ( $ids( $g ) as $o ) { $f[] = $ld . 'co_' . $o . '.webp'; }
		}
		for ( $i = 1; $i <= 4; $i++ ) { $f[] = $d . 'ga_' . $i . '.webp'; }
		$f[] = $d . 'vi_plano.webp';
		$f[] = $d . 'vi_3d.webp';
	}
	$f[] = 'cfg/ba/ba_base.webp';
	foreach ( array( 'SB', 'PV', 'PE', 'MB' ) as $g ) {
		foreach ( $ids( $g ) as $o ) { $f[] = 'cfg/ba/ba_' . $o . '.webp'; }
	}
	foreach ( array_keys( $cat ) as $g ) {
		foreach ( $ids( $g ) as $o ) { $f[] = 'cfg/sw/sw_' . $o . '.jpg'; }
	}
	foreach ( array( 6, 8, 9, 10 ) as $t ) { $f[] = 'cfg/pl/type-' . $t . '.webp'; }
	for ( $t = 1; $t <= 10; $t++ ) { $f[] = 'img/type-' . $t . '.webp'; }
	return array_values( array_unique( $f ) );
}

function axr_media_dir() {
	$up = wp_upload_dir( null, false );
	return $up['basedir'] . '/' . AXR_SLUG . '/';
}

/** Fitxers que encara no són ni al plugin ni a la carpeta de mitjans. */
function axr_media_missing() {
	$dir = axr_media_dir();
	$out = array();
	foreach ( axr_media_list() as $rel ) {
		if ( ! file_exists( AXR_DIR . 'assets/' . $rel ) && ! file_exists( $dir . $rel ) ) { $out[] = $rel; }
	}
	return $out;
}

function axr_media_state() {
	$s = get_option( 'axr_media_import', array() );
	return array_merge( array( 'estat' => 'pendent', 'baixats' => 0, 'no_trobats' => array(), 'provats' => array(), 'cuando' => '' ), is_array( $s ) ? $s : array() );
}

/** Una tanda: baixa fitxers durant uns 20 segons i torna a programar-se si en queden. */
function axr_media_import_batch() {
	$st   = axr_media_state();
	$dir  = axr_media_dir();
	$t0   = microtime( true );
	$left = array_values( array_diff( axr_media_missing(), $st['provats'] ) );
	foreach ( $left as $rel ) {
		if ( microtime( true ) - $t0 > 20 ) { break; }
		$st['provats'][] = $rel;
		$ok = false;
		foreach ( axr_media_sources() as $base ) {
			$r = wp_remote_get( $base . str_replace( '%2F', '/', rawurlencode( $rel ) ), array( 'timeout' => 15, 'redirection' => 2 ) );
			if ( is_wp_error( $r ) || 200 !== (int) wp_remote_retrieve_response_code( $r ) ) { continue; }
			$type = (string) wp_remote_retrieve_header( $r, 'content-type' );
			$body = wp_remote_retrieve_body( $r );
			if ( 0 !== strpos( $type, 'image/' ) || strlen( $body ) < 200 ) { continue; }
			wp_mkdir_p( dirname( $dir . $rel ) );
			if ( false !== file_put_contents( $dir . $rel, $body ) ) { $ok = true; $st['baixats']++; break; }
		}
		if ( ! $ok ) { $st['no_trobats'][] = $rel; }
	}
	$rest = array_values( array_diff( axr_media_missing(), $st['provats'] ) );
	$st['estat']  = $rest ? 'en_curs' : 'fet';
	$st['cuando'] = current_time( 'mysql' );
	$st['no_trobats'] = array_values( array_unique( $st['no_trobats'] ) );
	update_option( 'axr_media_import', $st, false );
	if ( $rest ) {
		wp_schedule_single_event( time() + 5, 'axr_media_import' );
	} elseif ( function_exists( 'axr_purge_cache' ) ) {
		axr_purge_cache();
	}
	return $st;
}
add_action( 'axr_media_import', 'axr_media_import_batch' );

/* Si falten imatges i encara no s'ha provat, s'engega sol. */
add_action( 'init', function () {
	$st = axr_media_state();
	if ( 'pendent' === $st['estat'] && ! wp_next_scheduled( 'axr_media_import' ) && axr_media_missing() ) {
		wp_schedule_single_event( time() + 10, 'axr_media_import' );
	}
}, 20 );

/* Panell: estat i botó per tornar-ho a provar. */
add_action( 'admin_init', function () {
	if ( empty( $_POST['axr_action'] ) || 'media_import' !== $_POST['axr_action'] || ! current_user_can( 'manage_options' ) ) { return; }
	check_admin_referer( 'axr_media_import' );
	update_option( 'axr_media_import', array( 'estat' => 'en_curs' ), false );
	axr_media_import_batch();
} );

function axr_admin_media_section() {
	$st   = axr_media_state();
	$miss = axr_media_missing();
	$tot  = count( axr_media_list() );
	echo '<h2>Imatges del configurador</h2><div class="axr-card"><p>' . esc_html( ( $tot - count( $miss ) ) . ' de ' . $tot . ' imatges a punt.' );
	if ( 'en_curs' === $st['estat'] ) { echo ' ' . esc_html( 'S\'estan baixant d\'apimi.com en segon pla (' . (int) $st['baixats'] . ' fins ara).' ); }
	if ( 'fet' === $st['estat'] && $st['no_trobats'] ) { echo ' ' . esc_html( count( $st['no_trobats'] ) . ' no existeixen a l\'origen (normal per a opcions sense render, com «sense pàrquing»).' ); }
	echo '</p>';
	if ( $miss ) {
		echo '<form method="post"><input type="hidden" name="axr_action" value="media_import">';
		wp_nonce_field( 'axr_media_import' );
		submit_button( 'Baixar ara les imatges que falten', 'secondary', 'submit', false );
		echo '</form>';
	}
	echo '</div>';
}
