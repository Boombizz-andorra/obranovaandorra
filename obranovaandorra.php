<?php
/**
 * Plugin Name: Obra Nova Andorra
 * Description: Web de les promocions d'obra nova de BoomBizz a Andorra (obranovaandorra.com). Cada promoció és un mòdul a promocions/<slug>/ amb el seu showroom, el seu configurador i la seva connexió a l'iShowi Hub.
 * Version: 1.4.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: BoomBizz Solucions Comercials
 * Text Domain: obranovaandorra
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'ONA_VERSION', '1.4.0' );
define( 'ONA_DIR', plugin_dir_path( __FILE__ ) );

/* Promocions actives. Cada una carrega el seu fitxer principal i funciona com un plugin independent
 * (la seva pàgina, el seu panell i la seva clau del Hub). Per afegir-ne una: carpeta nova + línia aquí. */
function ona_promocions() {
	return array(
		'aixovall-residencial' => 'promocions/aixovall-residencial/aixovall-residencial.php',
	);
}
foreach ( ona_promocions() as $ona_slug => $ona_file ) {
	if ( file_exists( ONA_DIR . $ona_file ) ) { require_once ONA_DIR . $ona_file; }
}
unset( $ona_slug, $ona_file );

/* Mentre no hi hagi portada amb selector de promocions, la portada porta a l'única promoció. */
add_action( 'template_redirect', function () {
	if ( is_admin() || ! ( is_front_page() || is_home() ) ) { return; }
	$p = ona_promocions();
	if ( 1 === count( $p ) ) { wp_safe_redirect( home_url( '/' . key( $p ) . '/' ), 302 ); exit; }
}, 1 );
