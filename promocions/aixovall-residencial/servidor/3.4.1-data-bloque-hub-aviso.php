

/* ====================================================================
 * v3.4.1: aviso inmediato de iShowi Hub (2.4.1) y caché corta de la página.
 * El Hub llama a POST /wp-json/axr/v1/hub-aviso con la clave de la promoción en la cabecera X-iShowi-Clave
 * cada vez que cambia el estado o el precio de una vivienda, un extra o un hito. Se vuelve a leer el Hub y se
 * vacía la caché de LiteSpeed. Por si un aviso no llega, la página no se guarda más de 5 minutos.
 * ==================================================================== */

add_action( 'rest_api_init', function () {
	register_rest_route( 'axr/v1', '/hub-aviso', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'axr_hub_aviso',
	) );
} );

function axr_hub_aviso( $req ) {
	$c = axr_hub_cfg();
	$k = (string) $req->get_header( 'x_ishowi_clave' );
	if ( ! axr_hub_activo() || '' === $k || ! hash_equals( (string) $c['clave'], $k ) ) {
		return new WP_REST_Response( array( 'ok' => false, 'error' => 'Clave no válida.' ), 403 );
	}
	delete_transient( 'axr_hub_data' );
	$d = axr_hub_data( true );
	if ( function_exists( 'axr_purge_cache' ) ) {
		axr_purge_cache();
	}
	update_option( 'axr_hub_aviso_ultimo', current_time( 'mysql' ), false );
	return new WP_REST_Response( array( 'ok' => (bool) $d, 'cuando' => $d ? $d['cuando'] : null ), 200 );
}

add_action( 'template_redirect', function () {
	if ( ! axr_hub_activo() || ! defined( 'AXR_SLUG' ) ) {
		return;
	}
	$p = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) : '';
	if ( 0 !== strpos( trim( $p, '/' ), AXR_SLUG ) ) {
		return;
	}
	do_action( 'litespeed_control_set_ttl', 300 );
	if ( ! headers_sent() ) {
		header( 'Cache-Control: public, max-age=60, s-maxage=300' );
	}
}, 1 );
