<?php
/**
 * Plugin Name: Aixovall Residencial
 * Description: Pàgina de la promoció Aixovall Residencial en 4 idiomes, configurador d'acabats per habitatge i panell per gestionar preus, reserves i opcions.
 * Version: 4.0.0-beta.2
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: API Immobiliària
 * Text Domain: aixovall-residencial
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'AXR_VERSION', '4.0.0-beta.2' );
define( 'AXR_FILE', __FILE__ );
define( 'AXR_DIR', plugin_dir_path( __FILE__ ) );
define( 'AXR_URL', plugin_dir_url( __FILE__ ) );
define( 'AXR_SLUG', 'aixovall-residencial' );

/* v3.4.0: protecció — si falta algun fitxer del plugin, no es carrega res (evita l'error crític del web). */
foreach ( array( 'inc/data.php', 'inc/i18n.php', 'inc/router.php', 'inc/leads.php', 'inc/dossier.php', 'inc/admin.php', 'templates/page.php', 'templates/configurator.php' ) as $axr_req ) {
	if ( ! file_exists( AXR_DIR . $axr_req ) ) {
		add_action( 'admin_notices', function () use ( $axr_req ) {
			echo '<div class="notice notice-error"><p><strong>Aixovall Residencial:</strong> falta el fitxer <code>' . esc_html( $axr_req ) . '</code>. El plugin està en pausa fins que es restauri.</p></div>';
		} );
		return;
	}
}
unset( $axr_req );

require_once AXR_DIR . 'inc/data.php';
require_once AXR_DIR . 'inc/i18n.php';
require_once AXR_DIR . 'inc/router.php';
require_once AXR_DIR . 'inc/leads.php';
require_once AXR_DIR . 'inc/dossier.php'; /* v3.4: dossier PDF + WhatsApp (Make) */
if ( is_admin() ) {
	require_once AXR_DIR . 'inc/admin.php';
}

/* La v1 mostrava la pàgina amb un shortcode: es manté perquè no quedi text solt si algú el fa servir. */
add_shortcode( 'aixovall_residencial', '__return_empty_string' );

/* Garanteix que existeix la pàgina base (la mateixa que feia servir la v1). */
function axr_maybe_setup() {
	if ( get_option( 'axr_version' ) === AXR_VERSION ) { return; }
	$page = get_page_by_path( AXR_SLUG );
	if ( ! $page ) {
		wp_insert_post( array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => 'Aixovall Residencial',
			'post_name'    => AXR_SLUG,
			'post_content' => '',
		) );
	}
	axr_assets_cors();
	update_option( 'axr_version', AXR_VERSION, false );
	axr_purge_cache();
}
add_action( 'init', 'axr_maybe_setup', 20 );

function axr_purge_cache() {
	if ( has_action( 'litespeed_purge_all' ) ) { do_action( 'litespeed_purge_all' ); }
	if ( function_exists( 'wp_cache_flush' ) ) { wp_cache_flush(); }
}

/* v2.5.1: apimi.com fa servir les imatges del plugin per dibuixar el PDF; cal que el servidor ho permeti (CORS).
   v3.4: també les fonts (.ttf) i els scripts del dossier. */
function axr_assets_cors() {
	$file = AXR_DIR . 'assets/.htaccess';
	$rule = "# Aixovall Residencial: imatges, fonts i scripts disponibles per al PDF del configurador a apimi.com\n<IfModule mod_headers.c>\n<FilesMatch \"\\.(webp|jpe?g|png|ttf|woff2?|js|css)$\">\nHeader set Access-Control-Allow-Origin \"*\"\n</FilesMatch>\n</IfModule>\n";
	if ( ! file_exists( $file ) || (string) @file_get_contents( $file ) !== $rule ) { @file_put_contents( $file, $rule ); }
}
