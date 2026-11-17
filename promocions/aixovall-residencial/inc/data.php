<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Habitatges per defecte (llistat oficial del 30/09/2026). */
function axr_default_homes() {
	$h = array(
		array( 'PB-1', 'Baixos 1a', 0, 1, 1, 36.7, 'none', 0, 183500, 'reserved', 'loft', '' ),
		array( 'PB-2', 'Baixos 2a', 0, 2, 2, 60.7, 'patio', 0, 299008, 'reserved', '', '' ),
		array( 'PB-3', 'Baixos 3a', 0, 3, 3, 92.4, 'garden', 0, 480480, 'available', 'laundry', '' ),
		array( '1-1', '1r 1a', 1, 4, 2, 69.9, 'balcony', 5.69, 405420, 'available', 'suite', 't4' ),
		array( '1-2', '1r 2a', 1, 5, 3, 78.8, 'terrace', 9.56, 457040, 'available', '', 't5' ),
		array( '1-3', '1r 3a', 1, 6, 2, 76, 'terrace', 21.81, 440800, 'available', '', 't7' ),
		array( '2-1', '2n 1a', 2, 4, 2, 69.9, 'balcony', 5.69, 440370, 'available', 'suite', 't4' ),
		array( '2-2', '2n 2a', 2, 5, 3, 79.3, 'terrace', 0, 499590, 'available', '', 't5' ),
		array( '2-3', '2n 3a', 2, 7, 2, 71.8, 'terrace', 0, 452340, 'available', '', 't7' ),
		array( '3-1', '3r 1a', 3, 4, 2, 69.9, 'balcony', 5.54, 454350, 'available', 'suite', 't4' ),
		array( '3-2', '3r 2a', 3, 5, 3, 79.3, 'terrace', 0, 515450, 'available', '', 't5' ),
		array( '3-3', '3r 3a', 3, 7, 2, 71.8, 'terrace', 0, 466700, 'available', '', 't7' ),
		array( '4-1', '4t 1a', 4, 8, 2, 72.3, 'balcony', 5.69, 563940, 'available', 'suite', 't4' ),
		array( '4-2', '4t 2a', 4, 9, 3, 80.6, 'terrace', 7.36, 628680, 'available', '', 't5' ),
		array( '4-3', '4t 3a', 4, 10, 2, 76.8, 'terrace', 21.81, 599040, 'available', '', 't7' ),
	);
	$out = array();
	foreach ( $h as $r ) {
		$out[ $r[0] ] = array(
			'id' => $r[0], 'name' => $r[1], 'floor' => $r[2], 'type' => $r[3], 'bedrooms' => $r[4], 'area' => $r[5],
			'ext' => $r[6], 'ext_m2' => $r[7], 'price' => $r[8], 'status' => $r[9], 'detail' => $r[10], 'cfg' => $r[11],
		);
	}
	return $out;
}

function axr_cfg_kinds() { return array( '', 't4', 't5', 't7' ); }

/* 3.6.0: aparaulat (agreed, bloqueig de 72 h), reserva tècnica (reserved, 10.000 €), reserva confirmada (confirmed, arres), venut. */
function axr_statuses() { return array( 'available', 'agreed', 'reserved', 'confirmed', 'sold' ); }

/** Habitatges amb els canvis desats al panell (preu, estat, configurador). */
function axr_homes() {
	static $cache = null;
	if ( null !== $cache ) { return $cache; }
	$homes = axr_default_homes();
	$saved = get_option( 'axr_homes', array() );
	if ( is_array( $saved ) ) {
		foreach ( $saved as $id => $s ) {
			if ( ! isset( $homes[ $id ] ) || ! is_array( $s ) ) { continue; }
			if ( isset( $s['price'] ) ) { $homes[ $id ]['price'] = max( 0, (int) $s['price'] ); }
			if ( isset( $s['status'] ) && in_array( $s['status'], axr_statuses(), true ) ) { $homes[ $id ]['status'] = $s['status']; }
			if ( isset( $s['cfg'] ) && in_array( $s['cfg'], axr_cfg_kinds(), true ) ) {
				/* v2.5: els pisos T5/T9 estrenen configurador encara que el panell s'hagués desat abans sense. */
				if ( '' === $s['cfg'] && 't5' === $homes[ $id ]['cfg'] && ! get_option( 'axr_t5_ack' ) ) { continue; }
				$homes[ $id ]['cfg'] = $s['cfg'];
			}
		}
	}
	if ( function_exists( 'axr_hub_apply_homes' ) ) { $homes = axr_hub_apply_homes( $homes ); }
	$cache = $homes;
	return $homes;
}

/** Tipologies del configurador. */
function axr_default_types() {
	return array(
		't4' => array( 'label' => 'T4', 'util' => 59.78, 'built' => 69.88, 'floor_m2' => 52.07, 'baths' => 2 ),
		't5' => array( 'label' => 'T5', 'util' => 67.36, 'built' => 78.77, 'floor_m2' => 59.88, 'baths' => 2 ),
		't7' => array( 'label' => 'T7', 'util' => 59.90, 'built' => 71.77, 'floor_m2' => 54.96, 'baths' => 1 ),
	);
}

/** Catàleg d'acabats per defecte. Preus sense IGI. */
function axr_default_catalog() {
	$g = array(
		'SV' => array( 'per_m2' => true, 'ops' => array(
			array( 'SV.A', 'Roble Makro Claro', '', 0 ), array( 'SV.B', 'Everest Oak Naturaleza', '', 25 ), array( 'SV.C', 'Roble Rama oscuro', '', 35 ) ) ),
		'FB' => array( 'ops' => array(
			array( 'FB.A', 'Gris Arena', '', 0 ), array( 'FB.B', 'Blanco Iceberg', '', 500 ), array( 'FB.C', 'Roble Claro Sinc', '', 590 ), array( 'FB.D', 'Roble Natural', '', 680 ) ) ),
		'FA' => array( 'ops' => array(
			array( 'FA.A', 'Gris Arena', '', 0 ), array( 'FA.B', 'Blanco Iceberg', '', 500 ), array( 'FA.C', 'Roble Claro Sinc', '', 590 ), array( 'FA.D', 'Roble Natural', '', 680 ) ) ),
		'EC' => array( 'ops' => array(
			array( 'EC.A', 'Corian Abalone', 'ZPC001 ABE', 0 ), array( 'EC.B', 'Corian Ash Concrete', 'ZPC006 HXE', 1000 ) ) ),
		'IL' => array( 'ops' => array(
			array( 'IL.A', '', '', 0 ), array( 'IL.B', '', 'IP38 · 12 V', 480 ) ) ),
		'SB' => array( 'sample' => true, 'ops' => array(
			array( 'SB.A', 'Lambda Rho Blanco', 'Vives', 0 ), array( 'SB.B', 'Dome Bone Rectificado', 'Baldocer', 480 ) ) ),
		'PV' => array( 'sample' => true, 'ops' => array(
			array( 'PV.A', 'Rho Blanco', 'Vives', 0 ), array( 'PV.B', 'Dome Bone Rectificado', 'Baldocer', 650 ), array( 'PV.C', 'Eleganza Saggio', 'Pamesa', 890 ) ) ),
		'PE' => array( 'sample' => true, 'ops' => array(
			array( 'PE.A', 'Nimos Rho Blanco', 'Vives', 0 ), array( 'PE.B', 'Blind Dome Bone', 'Baldocer', 420 ) ) ),
		'MB' => array( 'sample' => true, 'ops' => array(
			array( 'MB.A', 'Ambient Teca', 'Vidrabany', 0 ), array( 'MB.B', 'Ambient Olmo', 'Vidrabany', 260 ) ) ),
		'CR' => array( 'ops' => array(
			array( 'CR.A', '', '', 0 ), array( 'CR.B', '', '', 5500 ) ) ),
		'PA' => array( 'annex' => true, 'ops' => array(
			array( 'PA.0', '', '', 0 ), array( 'PA.A', '', '', 38000 ), array( 'PA.B', '', '', 68000 ) ) ),
		'TR' => array( 'annex' => true, 'ops' => array(
			array( 'TR.0', '', '', 0 ), array( 'TR.A', '', '1,5 m²', 10000 ) ) ),
	);
	$out = array();
	foreach ( $g as $key => $grp ) {
		$ops = array();
		foreach ( $grp['ops'] as $o ) {
			$ops[ $o[0] ] = array( 'id' => $o[0], 'name' => $o[1], 'brand' => $o[2], 'price' => $o[3], 'on' => true );
		}
		$out[ $key ] = array(
			'per_m2' => ! empty( $grp['per_m2'] ),
			'annex'  => ! empty( $grp['annex'] ),
			'sample' => ! empty( $grp['sample'] ),
			'ops'    => $ops,
		);
	}
	return $out;
}

/** Catàleg amb els canvis desats al panell (nom, marca, preu, activa). */
function axr_catalog() {
	$cat   = axr_default_catalog();
	$saved = get_option( 'axr_catalog', array() );
	if ( ! is_array( $saved ) ) { $saved = array(); }
	foreach ( $cat as $key => $grp ) {
		$first = true;
		foreach ( $grp['ops'] as $id => $op ) {
			$s = isset( $saved[ $key ][ $id ] ) && is_array( $saved[ $key ][ $id ] ) ? $saved[ $key ][ $id ] : null;
			if ( $s ) {
				if ( isset( $s['name'] ) && '' !== $op['name'] && '' !== trim( $s['name'] ) ) { $cat[ $key ]['ops'][ $id ]['name'] = (string) $s['name']; }
				if ( isset( $s['brand'] ) ) { $cat[ $key ]['ops'][ $id ]['brand'] = (string) $s['brand']; }
				if ( isset( $s['price'] ) ) { $cat[ $key ]['ops'][ $id ]['price'] = max( 0, (float) $s['price'] ); }
				/* La primera opció de cada grup és la inclosa: sempre activa. */
				if ( isset( $s['on'] ) && ! $first ) { $cat[ $key ]['ops'][ $id ]['on'] = (bool) $s['on']; }
			}
			$first = false;
		}
	}
	if ( function_exists( 'axr_hub_apply_catalog' ) ) { $cat = axr_hub_apply_catalog( $cat ); }
	return $cat;
}

function axr_types() {
	$types = axr_default_types();
	$saved = get_option( 'axr_types', array() );
	if ( is_array( $saved ) ) {
		foreach ( $types as $k => $t ) {
			if ( isset( $saved[ $k ]['floor_m2'] ) && (float) $saved[ $k ]['floor_m2'] > 0 ) { $types[ $k ]['floor_m2'] = (float) $saved[ $k ]['floor_m2']; }
		}
	}
	return $types;
}

function axr_default_settings() {
	return array(
		'phone'        => '+376 822345',
		'igi'          => 4.5,
		'fin_on'       => 1,
		'fin_url'      => '',
		'email'        => 'apimi@andorra.ad',
		'lead_email'   => 'apimi@andorra.ad',
		'noindex'      => 1,
		'cfg_enabled'  => 1,
		'cfg_section'  => 1,
		'lead_form'    => 1,
		'updated'      => '2026-09-30',
		'showroom'     => 0, /* v4: 1 = la pàgina pública és el showroom nou */
	);
}

function axr_settings() {
	$s = get_option( 'axr_settings', array() );
	return array_merge( axr_default_settings(), is_array( $s ) ? $s : array() );
}

/** URL d'un fitxer d'assets: primer el paquet de mitjans (uploads), després el plugin. */
function axr_asset( $rel ) {
	static $up = null;
	if ( null === $up ) { $up = wp_upload_dir( null, false ); }
	$rel = ltrim( $rel, '/' );
	if ( file_exists( $up['basedir'] . '/' . AXR_SLUG . '/' . $rel ) ) {
		return $up['baseurl'] . '/' . AXR_SLUG . '/' . $rel;
	}
	return AXR_URL . 'assets/' . $rel;
}
function axr_asset_exists( $rel ) {
	$up = wp_upload_dir( null, false );
	return file_exists( $up['basedir'] . '/' . AXR_SLUG . '/' . ltrim( $rel, '/' ) ) || file_exists( AXR_DIR . 'assets/' . ltrim( $rel, '/' ) );
}
/** Fitxers presents al paquet de mitjans (rutes relatives), per al JavaScript. */
function axr_overrides() {
	static $list = null;
	if ( null !== $list ) { return $list; }
	$list = array();
	$up   = wp_upload_dir( null, false );
	$root = $up['basedir'] . '/' . AXR_SLUG;
	if ( ! is_dir( $root ) ) { return $list; }
	try {
		$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $it as $file ) {
			if ( $file->isFile() ) { $list[] = ltrim( str_replace( '\\', '/', substr( $file->getPathname(), strlen( $root ) ) ), '/' ); }
			if ( count( $list ) > 2000 ) { break; }
		}
	} catch ( Exception $e ) {
		$list = array();
	}
	return $list;
}
function axr_asset_bases() {
	$up = wp_upload_dir( null, false );
	return array( 'plugin' => AXR_URL . 'assets/', 'uploads' => $up['baseurl'] . '/' . AXR_SLUG . '/', 'ov' => axr_overrides() );
}

/* ====================================================================
 * v2.6: enlace con iShowi Hub (API pública de lectura, BB-OPE-ESP-006 opción C).
 * Si está configurado, el estado y el precio de cada vivienda y el PVP de los extras publicados
 * se leen del Hub (caché de 5 minutos). Si el Hub no responde, se usan los últimos datos recibidos
 * y, si nunca hubo, los del panel de WordPress. (Va en data.php para poder publicarlo desde el editor de plugins.)
 * ==================================================================== */

function axr_hub_cfg() {
	$c = get_option( 'axr_hub', array() );
	$c = is_array( $c ) ? $c : array();
	return array_merge( array( 'url' => 'https://boombizzandorra.com/wp-json/ishowi/v1/', 'promo' => 0, 'clave' => '', 'activo' => 0 ), $c );
}

function axr_hub_activo() {
	$c = axr_hub_cfg();
	return ! empty( $c['activo'] ) && $c['promo'] && '' !== $c['clave'];
}

/** Descarga los datos públicos del Hub. Devuelve array o WP_Error. */
function axr_hub_fetch() {
	$c   = axr_hub_cfg();
	$url = add_query_arg( 'clave', $c['clave'], trailingslashit( $c['url'] ) . 'publico/promociones/' . (int) $c['promo'] );
	$r   = wp_remote_get( $url, array( 'timeout' => 8, 'headers' => array( 'Accept' => 'application/json' ) ) );
	if ( is_wp_error( $r ) ) { return $r; }
	$code = wp_remote_retrieve_response_code( $r );
	$j    = json_decode( wp_remote_retrieve_body( $r ), true );
	if ( 200 !== $code || ! is_array( $j ) || empty( $j['ok'] ) ) {
		return new WP_Error( 'axr_hub', isset( $j['error'] ) ? $j['error'] : 'El Hub ha respondido ' . $code . '.' );
	}
	return $j;
}

/** Datos del Hub con caché. Mapea estados del Hub (disponible/reservada/vendida) a los de la web. */
function axr_hub_data( $forzar = false ) {
	static $mem = null;
	if ( null !== $mem && ! $forzar ) { return $mem; }
	if ( ! axr_hub_activo() ) { $mem = false; return $mem; }
	$k = 'axr_hub_data';
	$d = $forzar ? false : get_transient( $k );
	if ( ! is_array( $d ) ) {
		$j = axr_hub_fetch();
		if ( is_wp_error( $j ) ) {
			update_option( 'axr_hub_error', array( 'cuando' => current_time( 'mysql' ), 'msg' => $j->get_error_message() ), false );
			$d = get_option( 'axr_hub_ultimo', array() ); // último bueno
			if ( ! is_array( $d ) || empty( $d['homes'] ) ) { $mem = false; return $mem; }
			set_transient( $k, $d, 60 ); // reintenta en un minuto
		} else {
			$map  = array( 'disponible' => 'available', 'reservada' => 'reserved', 'vendida' => 'sold' );
			$fase = array( 'disponible' => 'available', 'aparaulat' => 'agreed', 'reserva_tecnica' => 'reserved', 'reserva_confirmada' => 'confirmed', 'vendida' => 'sold' ); // Hub 2.5.2
			$homes = array();
			foreach ( (array) $j['viviendas'] as $v ) {
				$st = isset( $v['fase'], $fase[ $v['fase'] ] ) ? $fase[ $v['fase'] ] : ( isset( $map[ $v['estado'] ] ) ? $map[ $v['estado'] ] : 'available' );
				$homes[ $v['referencia'] ] = array( 'status' => $st, 'price' => isset( $v['precio'] ) ? (int) round( (float) $v['precio'] ) : 0 );
			}
			$extras = array();
			foreach ( (array) $j['extras'] as $e ) {
				$extras[ $e['codigo'] ] = array( 'price' => (float) $e['pvp'], 'cerrado' => ! empty( $e['cerrado'] ), 'fecha_cierre' => $e['fecha_cierre'] );
			}
			// 3.5.0: plazas de aparcamiento (Hub 2.5) con su zona en el plano.
			$plazas = array();
			foreach ( isset( $j['anexos'] ) ? (array) $j['anexos'] : array() as $x ) {
				if ( empty( $x['referencia'] ) || ( isset( $x['tipo'] ) && 'parking' !== $x['tipo'] ) ) { continue; }
				$plazas[] = array( 'ref' => (string) $x['referencia'], 'mod' => 'doble' === $x['modalidad'] ? 'doble' : 'individual', 'precio' => (float) $x['precio'], 'estado' => (string) $x['estado'], 'zona' => isset( $x['zona'] ) && is_array( $x['zona'] ) ? $x['zona'] : null );
			}
			$plano = isset( $j['planos']['parking']['url'] ) ? array( 'url' => esc_url_raw( $j['planos']['parking']['url'] ), 'w' => (int) $j['planos']['parking']['ancho'], 'h' => (int) $j['planos']['parking']['alto'] ) : null;
			$d = array( 'homes' => $homes, 'extras' => $extras, 'hitos' => (array) $j['hitos'], 'plazas' => $plazas, 'plano' => $plano, 'hub_version' => $j['hub_version'], 'cuando' => current_time( 'mysql' ), 'promocion' => $j['promocion']['nombre'] );
			set_transient( $k, $d, 300 );
			update_option( 'axr_hub_ultimo', $d, false );
			delete_option( 'axr_hub_error' );
		}
	}
	$mem = $d;
	return $mem;
}

/** Aplica estado y precio del Hub sobre las viviendas del panel. */
function axr_hub_apply_homes( $homes ) {
	$d = axr_hub_data();
	if ( ! $d ) { return $homes; }
	foreach ( $d['homes'] as $ref => $h ) {
		if ( isset( $homes[ $ref ] ) ) {
			$homes[ $ref ]['status'] = $h['status'];
			if ( $h['price'] > 0 ) { $homes[ $ref ]['price'] = $h['price']; }
			$homes[ $ref ]['hub'] = true;
		}
	}
	return $homes;
}

/** Aplica el PVP del Hub a las opciones del catálogo que coinciden por código (SV.A, FB.B…). */
function axr_hub_apply_catalog( $cat ) {
	$d = axr_hub_data();
	if ( ! $d || empty( $d['extras'] ) ) { return $cat; }
	foreach ( $cat as $key => $grp ) {
		foreach ( $grp['ops'] as $id => $op ) {
			if ( isset( $d['extras'][ $id ] ) ) {
				$cat[ $key ]['ops'][ $id ]['price'] = $d['extras'][ $id ]['price'];
				$cat[ $key ]['ops'][ $id ]['hub']   = true;
			}
		}
	}
	return $cat;
}

/* Panel: guardar ajustes y sincronizar. */
add_action( 'admin_init', function () {
	if ( ! isset( $_POST['axr_action'] ) || ! current_user_can( 'manage_options' ) ) { return; }
	$action = sanitize_key( wp_unslash( $_POST['axr_action'] ) );
	if ( 'hub' === $action ) {
		check_admin_referer( 'axr_hub' );
		$c = axr_hub_cfg();
		$c['url']    = isset( $_POST['hub_url'] ) ? esc_url_raw( wp_unslash( $_POST['hub_url'] ) ) : $c['url'];
		$c['promo']  = isset( $_POST['hub_promo'] ) ? max( 0, (int) $_POST['hub_promo'] ) : 0;
		$c['clave']  = isset( $_POST['hub_clave'] ) ? sanitize_text_field( wp_unslash( $_POST['hub_clave'] ) ) : '';
		$c['activo'] = empty( $_POST['hub_activo'] ) ? 0 : 1;
		update_option( 'axr_hub', $c, false );
		delete_transient( 'axr_hub_data' );
		$j = axr_hub_activo() ? axr_hub_fetch() : null;
		set_transient( 'axr_hub_msg', $j && ! is_wp_error( $j ) ? 'Conectado con el Hub: ' . $j['promocion']['nombre'] . ', ' . count( $j['viviendas'] ) . ' viviendas y ' . count( $j['extras'] ) . ' extras publicados (Hub ' . $j['hub_version'] . ').' : ( $j ? 'No se ha podido leer del Hub: ' . $j->get_error_message() : 'Enlace con el Hub desactivado: se usan los datos del panel.' ), 60 );
		wp_safe_redirect( admin_url( 'admin.php?page=axr-settings&saved=1' ) );
		exit;
	}
	if ( 'hub_sync' === $action ) {
		check_admin_referer( 'axr_hub_sync' );
		delete_transient( 'axr_hub_data' );
		$d = axr_hub_data( true );
		set_transient( 'axr_hub_msg', $d ? 'Sincronizado con el Hub a las ' . $d['cuando'] . '.' : 'No se ha podido sincronizar.', 60 );
		wp_safe_redirect( admin_url( 'admin.php?page=axr-settings&saved=1' ) );
		exit;
	}
} );

function axr_admin_hub_section() {
	$c   = axr_hub_cfg();
	$d   = axr_hub_activo() ? get_option( 'axr_hub_ultimo', array() ) : array();
	$err = get_option( 'axr_hub_error', array() );
	$msg = get_transient( 'axr_hub_msg' );
	if ( $msg ) { delete_transient( 'axr_hub_msg' ); echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( $msg ) . '</p></div>'; }
	echo '<h2>iShowi Hub</h2><div class="axr-card"><p>Con el enlace activo, el estado y el precio de cada vivienda y el PVP de los extras se leen del Hub (cada 5 minutos) y mandan sobre lo que haya en este panel. La clave la da BoomBizz desde la ficha de la promoción en el Hub.</p>';
	if ( axr_hub_activo() ) {
		echo '<p>Estado: ' . ( ! empty( $d['cuando'] ) ? '<strong>conectado</strong> · última lectura ' . esc_html( $d['cuando'] ) . ' · ' . count( $d['homes'] ) . ' viviendas, ' . count( $d['extras'] ) . ' extras · Hub ' . esc_html( $d['hub_version'] ) : '<strong>sin datos todavía</strong>' ) . ( ! empty( $err['msg'] ) ? ' · <span style="color:#b32d2e">último error ' . esc_html( $err['cuando'] ) . ': ' . esc_html( $err['msg'] ) . '</span>' : '' ) . '</p>';
		echo '<form method="post" style="margin-bottom:12px"><input type="hidden" name="axr_action" value="hub_sync">'; wp_nonce_field( 'axr_hub_sync' ); submit_button( 'Sincronizar ahora', 'secondary', 'submit', false ); echo '</form>';
	}
	echo '<form method="post"><input type="hidden" name="axr_action" value="hub">';
	wp_nonce_field( 'axr_hub' );
	echo '<table class="form-table" role="presentation"><tbody>';
	echo '<tr><th>Enlace</th><td><label><input type="checkbox" name="hub_activo" value="1"' . checked( ! empty( $c['activo'] ), true, false ) . '> Leer viviendas y extras del Hub</label></td></tr>';
	echo '<tr><th><label for="axr-hub-url">Dirección de la API del Hub</label></th><td><input id="axr-hub-url" class="regular-text" type="url" name="hub_url" value="' . esc_attr( $c['url'] ) . '"></td></tr>';
	echo '<tr><th><label for="axr-hub-promo">Número de promoción</label></th><td><input id="axr-hub-promo" class="small-text" type="number" min="1" name="hub_promo" value="' . (int) $c['promo'] . '"></td></tr>';
	echo '<tr><th><label for="axr-hub-clave">Clave</label></th><td><input id="axr-hub-clave" class="regular-text" type="text" name="hub_clave" value="' . esc_attr( $c['clave'] ) . '" autocomplete="off"></td></tr>';
	echo '</tbody></table>';
	submit_button( 'Guardar y probar la conexión' );
	echo '</form></div>';
}


/* =======================================================================
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

/* ------------------------------------------------------------------ */
/* 3.5.0 · Plazas de aparcamiento del Hub en el configurador            */
/* ------------------------------------------------------------------ */

/** Datos de aparcamiento para el configurador: plano y plazas (o null si el Hub aún no tiene plazas). */
function axr_parking_boot() {
	$d = function_exists( 'axr_hub_data' ) ? axr_hub_data() : false;
	if ( ! $d || empty( $d['plazas'] ) ) { return null; }
	return array( 'plano' => isset( $d['plano'] ) ? $d['plano'] : null, 'plazas' => $d['plazas'], 'live' => esc_url_raw( rest_url( 'axr/v1/plazas' ) ) );
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'axr/v1', '/plazas', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$p = axr_parking_boot();
			do_action( 'litespeed_control_set_nocache', 'Aixovall: disponibilidad de plazas' );
			$r = new WP_REST_Response( array( 'ok' => (bool) $p, 'plazas' => $p ? $p['plazas'] : array() ), 200 );
			$r->header( 'Cache-Control', 'no-store, max-age=0' );
			$r->header( 'X-LiteSpeed-Cache-Control', 'no-cache' );
			$r->header( 'Access-Control-Allow-Origin', '*' );
			return $r;
		},
	) );
} );
