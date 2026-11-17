<?php
/**
 * v4.1 · Mode agent (iShowi Hub 2.6, BB-OPE-ESP-006 §15).
 *
 * Els usuaris del Hub (sobretot immobiliàries) entren des del menú del showroom amb el seu usuari i contrasenya
 * del Hub o amb Google. A partir d'aquí veuen l'estat real de cada habitatge i, des de la web mateix, poden
 * aparaular, reservar, pujar documents, triar plaça d'aparcament, desar una configuració provisional, generar el
 * contracte de reserva (.docx) amb les dades del comprador i descarregar plànols i memòria de qualitats.
 *
 * Tot passa pel servidor: el navegador només té una galeta de sessió (axr_ag, HttpOnly) i parla amb
 * /wp-json/axr/v1/agent/*. Aquest servidor parla amb el Hub amb la clau web de la promoció i el token de l'agent.
 * Cada acció es fa al Hub amb l'usuari real (mateixos permisos, regles, avisos i historial que al Hub) i el
 * Hub avisa la web perquè la pàgina pública s'actualitzi al moment.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'AXR_AG_COOKIE', 'axr_ag' );
define( 'AXR_AG_DIES', 14 );

/* ------------------------------------------------------------------ */
/* Connexió amb el Hub                                                 */
/* ------------------------------------------------------------------ */

function axr_ag_activo() {
	return function_exists( 'axr_hub_activo' ) && axr_hub_activo();
}

/** Arrel del Hub (https://boombizzandorra.com/) a partir de l'adreça de l'API. */
function axr_ag_hub_home() {
	$c = axr_hub_cfg();
	return preg_replace( '#/wp-json/.*$#', '/', (string) $c['url'] );
}

/**
 * Crida el Hub. $body: array (JSON) o ['__multipart' => [...camps], '__file' => [path, nom, mime]].
 * Retorna array( codi HTTP, dades | WP_Error ). Amb $raw = true torna la resposta sencera (per als fitxers).
 */
function axr_ag_hub( $method, $path, $body = null, $token = '', $raw = false ) {
	$c       = axr_hub_cfg();
	$url     = trailingslashit( $c['url'] ) . 'agente/promociones/' . (int) $c['promo'] . '/' . ltrim( $path, '/' );
	$headers = array( 'Accept' => 'application/json', 'X-iShowi-Clave' => (string) $c['clave'] );
	if ( $token ) { $headers['X-iShowi-Agente'] = $token; }
	$args = array( 'method' => $method, 'timeout' => 25, 'headers' => $headers );
	if ( is_array( $body ) && isset( $body['__multipart'] ) ) {
		$b    = wp_generate_password( 24, false );
		$data = '';
		foreach ( $body['__multipart'] as $k => $v ) {
			$data .= "--$b\r\nContent-Disposition: form-data; name=\"$k\"\r\n\r\n" . $v . "\r\n";
		}
		if ( ! empty( $body['__file'] ) ) {
			list( $fp, $fname, $fmime ) = $body['__file'];
			$data .= "--$b\r\nContent-Disposition: form-data; name=\"archivo\"; filename=\"" . str_replace( '"', '', $fname ) . "\"\r\nContent-Type: $fmime\r\n\r\n" . file_get_contents( $fp ) . "\r\n";
		}
		$data .= "--$b--\r\n";
		$args['headers']['Content-Type'] = 'multipart/form-data; boundary=' . $b;
		$args['body']                    = $data;
		$args['timeout']                 = 60;
	} elseif ( null !== $body ) {
		$args['headers']['Content-Type'] = 'application/json';
		$args['body']                    = wp_json_encode( $body );
	}
	$r = wp_remote_request( $url, $args );
	if ( is_wp_error( $r ) ) { return array( 0, new WP_Error( 'hub', 'No es pot connectar amb l\'iShowi Hub ara mateix. Torna-ho a provar en un moment.' ) ); }
	$code = (int) wp_remote_retrieve_response_code( $r );
	if ( $raw ) { return array( $code, $r ); }
	$j = json_decode( wp_remote_retrieve_body( $r ), true );
	if ( ! is_array( $j ) ) { return array( $code, new WP_Error( 'hub', 'Resposta inesperada de l\'iShowi Hub (' . $code . ').' ) ); }
	if ( $code >= 400 || empty( $j['ok'] ) ) { return array( $code, new WP_Error( 'hub', isset( $j['error'] ) ? $j['error'] : 'Error ' . $code . ' de l\'iShowi Hub.' ) ); }
	return array( $code, $j );
}

/* ------------------------------------------------------------------ */
/* Sessió a la web                                                     */
/* ------------------------------------------------------------------ */

function axr_ag_sid() {
	$s = isset( $_COOKIE[ AXR_AG_COOKIE ] ) ? preg_replace( '/[^A-Za-z0-9]/', '', (string) $_COOKIE[ AXR_AG_COOKIE ] ) : '';
	return 40 === strlen( $s ) ? $s : '';
}

function axr_ag_session() {
	$sid = axr_ag_sid();
	if ( ! $sid ) { return null; }
	$s = get_transient( 'axr_ag_' . $sid );
	return is_array( $s ) && ! empty( $s['token'] ) ? $s : null;
}

function axr_ag_cookie( $value, $expire ) {
	$args = array( 'expires' => $expire, 'path' => COOKIEPATH ? COOKIEPATH : '/', 'domain' => COOKIE_DOMAIN ? COOKIE_DOMAIN : '', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax' );
	setcookie( AXR_AG_COOKIE, $value, $args );
	// Indicador llegible des del navegador (sense cap dada): evita una crida al servidor als visitants normals.
	setcookie( AXR_AG_COOKIE . '_on', $value ? '1' : '', array_merge( $args, array( 'httponly' => false ) ) );
}

function axr_ag_open( array $hub ) {
	$sid = wp_generate_password( 40, false, false );
	set_transient( 'axr_ag_' . $sid, array( 'token' => $hub['token'], 'actor' => $hub['actor'], 'creat' => time() ), AXR_AG_DIES * DAY_IN_SECONDS );
	axr_ag_cookie( $sid, time() + AXR_AG_DIES * DAY_IN_SECONDS );
	return $sid;
}

function axr_ag_close() {
	$s = axr_ag_session();
	if ( $s ) {
		axr_ag_hub( 'POST', 'salir', array(), $s['token'] );
		delete_transient( 'axr_ag_' . axr_ag_sid() );
	}
	axr_ag_cookie( '', time() - 3600 );
}

/* ------------------------------------------------------------------ */
/* Rutes REST per al navegador                                         */
/* ------------------------------------------------------------------ */

function axr_ag_resp( $data, $code = 200 ) {
	do_action( 'litespeed_control_set_nocache', 'Aixovall: mode agent' );
	$r = new WP_REST_Response( $data, $code );
	$r->header( 'Cache-Control', 'no-store, max-age=0, private' );
	$r->header( 'X-LiteSpeed-Cache-Control', 'no-cache' );
	return $r;
}

function axr_ag_err( $msg, $code = 400 ) {
	return axr_ag_resp( array( 'ok' => false, 'error' => $msg ), $code );
}

/** Totes les rutes: només des de la mateixa web (capçalera pròpia, que una altra web no pot enviar sense permís). */
function axr_ag_perm( WP_REST_Request $req ) {
	return '1' === (string) $req->get_header( 'x_axr_agent' );
}

/** Sessió obligatòria; torna la sessió o una resposta d'error. Si el Hub diu que el token ha caducat, es tanca. */
function axr_ag_need() {
	if ( ! axr_ag_activo() ) { return axr_ag_err( 'L\'enllaç amb l\'iShowi Hub no està configurat en aquesta web.', 503 ); }
	$s = axr_ag_session();
	return $s ? $s : axr_ag_err( 'Cal entrar amb el teu usuari de l\'iShowi Hub.', 401 );
}

function axr_ag_from_hub( array $res ) {
	list( $code, $j ) = $res;
	if ( is_wp_error( $j ) ) {
		if ( 401 === $code || 403 === $code ) { axr_ag_close(); }
		return axr_ag_err( $j->get_error_message(), $code ? $code : 502 );
	}
	if ( function_exists( 'axr_purge_cache' ) && 'GET' !== ( isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : '' ) ) {
		delete_transient( 'axr_hub_data' ); // la pàgina pública es refà amb l'estat nou (el Hub també avisa)
	}
	return axr_ag_resp( $j );
}

add_action( 'rest_api_init', function () {
	$r = function ( $method, $route, $cb ) {
		// Les descàrregues (GET) s'obren amb un enllaç normal: només depenen de la galeta de sessió.
		$perm = 'GET' === $method && in_array( $route, array( 'document', 'descarregable' ), true ) ? '__return_true' : 'axr_ag_perm';
		register_rest_route( 'axr/v1', '/agent/' . $route, array( 'methods' => $method, 'callback' => $cb, 'permission_callback' => $perm ) );
	};
	$r( 'POST', 'login', 'axr_ag_api_login' );
	$r( 'POST', 'logout', function () { axr_ag_close(); return axr_ag_resp( array( 'ok' => true ) ); } );
	$r( 'GET', 'estat', 'axr_ag_api_estat' );
	$r( 'POST', 'aparaular', function ( $q ) { return axr_ag_api_fwd( $q, 'aparaular', array( 'referencia', 'nombre', 'documento', 'email', 'telefono', 'direccion', 'otros_compradores', 'idioma' ) ); } );
	$r( 'POST', 'alliberar', function ( $q ) { return axr_ag_api_fwd( $q, 'alliberar', array( 'referencia', 'motivo' ) ); } );
	$r( 'POST', 'placa', function ( $q ) { return axr_ag_api_fwd( $q, 'plaza', array( 'referencia', 'anexo' ) ); } );
	$r( 'POST', 'comprador', function ( $q ) { return axr_ag_api_fwd( $q, 'comprador', array( 'referencia', 'nombre', 'documento', 'email', 'telefono', 'direccion', 'otros_compradores', 'idioma' ) ); } );
	$r( 'POST', 'configuracio', function ( $q ) { return axr_ag_api_fwd( $q, 'configuracion', array( 'referencia', 'lineas', 'resumen', 'enlace', 'total' ) ); } );
	$r( 'POST', 'document', 'axr_ag_api_doc_up' );
	$r( 'GET', 'document', 'axr_ag_api_doc_down' );
	$r( 'POST', 'contracte', 'axr_ag_api_contract' );
	$r( 'GET', 'descarregable', 'axr_ag_api_file' );
} );

function axr_ag_api_login( WP_REST_Request $req ) {
	if ( ! axr_ag_activo() ) { return axr_ag_err( 'L\'enllaç amb l\'iShowi Hub no està configurat en aquesta web.', 503 ); }
	list( $code, $j ) = axr_ag_hub( 'POST', 'login', array( 'usuario' => (string) $req->get_param( 'usuario' ), 'clave' => (string) $req->get_param( 'clave' ) ) );
	if ( is_wp_error( $j ) ) { return axr_ag_err( $j->get_error_message(), $code ? $code : 502 ); }
	axr_ag_open( $j );
	return axr_ag_resp( array( 'ok' => true, 'actor' => $j['actor'] ) );
}

function axr_ag_api_estat() {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	$res = axr_ag_hub( 'GET', 'estado', null, $s['token'] );
	if ( ! is_wp_error( $res[1] ) ) {
		$res[1]['descarregables'] = axr_ag_files();
		$res[1]['contracte']      = axr_ag_contract_defaults( $res[1]['actor'] );
		$res[1]['cfg']            = array();
		foreach ( axr_homes() as $h ) {
			if ( '' !== $h['cfg'] ) { $res[1]['cfg'][ $h['id'] ] = axr_url( 'ca', $h['id'] ); }
		}
	}
	return axr_ag_from_hub( $res );
}

function axr_ag_api_fwd( WP_REST_Request $req, $path, array $keys ) {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	$b = array();
	foreach ( $keys as $k ) {
		if ( null !== $req->get_param( $k ) ) { $b[ $k ] = $req->get_param( $k ); }
	}
	return axr_ag_from_hub( axr_ag_hub( 'POST', $path, $b, $s['token'] ) );
}

function axr_ag_api_doc_up( WP_REST_Request $req ) {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	$f = $req->get_file_params();
	$f = isset( $f['archivo'] ) ? $f['archivo'] : null;
	if ( ! $f || ! empty( $f['error'] ) || ! is_uploaded_file( $f['tmp_name'] ) ) { return axr_ag_err( 'No ha arribat el fitxer. Torna-ho a provar.' ); }
	if ( (int) $f['size'] > 10 * 1024 * 1024 ) { return axr_ag_err( 'El fitxer passa de 10 MB.' ); }
	$mime = function_exists( 'finfo_open' ) ? finfo_file( finfo_open( FILEINFO_MIME_TYPE ), $f['tmp_name'] ) : (string) $f['type'];
	if ( ! in_array( $mime, array( 'application/pdf', 'image/jpeg', 'image/png' ), true ) ) { return axr_ag_err( 'Format no admès: puja un PDF, JPG o PNG.' ); }
	return axr_ag_from_hub( axr_ag_hub( 'POST', 'documentos', array(
		'__multipart' => array( 'referencia' => (string) $req->get_param( 'referencia' ), 'tipo' => (string) $req->get_param( 'tipo' ), 'fase' => (string) $req->get_param( 'fase' ) ),
		'__file'      => array( $f['tmp_name'], sanitize_file_name( $f['name'] ), $mime ),
	), $s['token'] ) );
}

function axr_ag_api_doc_down( WP_REST_Request $req ) {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	list( $code, $r ) = axr_ag_hub( 'GET', 'documento/' . (int) $req->get_param( 'id' ), null, $s['token'], true );
	if ( is_wp_error( $r ) || 200 !== $code ) {
		$j = is_wp_error( $r ) ? null : json_decode( wp_remote_retrieve_body( $r ), true );
		return axr_ag_err( $j && isset( $j['error'] ) ? $j['error'] : 'No s\'ha pogut obrir el document.', $code ? $code : 502 );
	}
	nocache_headers();
	header( 'Content-Type: ' . wp_remote_retrieve_header( $r, 'content-type' ) );
	header( 'Content-Disposition: ' . ( wp_remote_retrieve_header( $r, 'content-disposition' ) ? wp_remote_retrieve_header( $r, 'content-disposition' ) : 'inline' ) );
	header( 'X-Content-Type-Options: nosniff' );
	echo wp_remote_retrieve_body( $r ); // phpcs:ignore WordPress.Security.EscapeOutput -- fitxer binari
	exit;
}

/* ------------------------------------------------------------------ */
/* Entrar amb Google: el Hub torna aquí amb ?axr_ag=codi               */
/* ------------------------------------------------------------------ */

function axr_ag_google_url( $lang = 'ca' ) {
	$c      = axr_hub_cfg();
	$vuelta = set_url_scheme( axr_url( $lang ), 'https' );
	return add_query_arg( array( 'promo' => (int) $c['promo'], 'vuelta' => rawurlencode( $vuelta ) ), axr_ag_hub_home() . 'hub/agente/google' );
}

add_action( 'template_redirect', function () {
	if ( empty( $_GET['axr_ag'] ) && empty( $_GET['axr_ag_err'] ) ) { return; }
	$route = function_exists( 'axr_parse_route' ) ? axr_parse_route() : false;
	if ( ! $route ) { return; }
	$back = axr_url( $route['lang'] );
	if ( ! empty( $_GET['axr_ag'] ) && axr_ag_activo() ) {
		list( , $j ) = axr_ag_hub( 'POST', 'canje', array( 'codigo' => sanitize_text_field( wp_unslash( $_GET['axr_ag'] ) ) ) );
		if ( ! is_wp_error( $j ) ) {
			axr_ag_open( $j );
			wp_safe_redirect( $back . '#habitatges' );
			exit;
		}
		wp_safe_redirect( add_query_arg( 'agerr', 'canje', $back ) );
		exit;
	}
	wp_safe_redirect( add_query_arg( 'agerr', sanitize_key( wp_unslash( $_GET['axr_ag_err'] ) ), $back ) );
	exit;
}, 0 );

/* ------------------------------------------------------------------ */
/* Descarregables (plànols, memòria de qualitats)                      */
/* ------------------------------------------------------------------ */

function axr_ag_files() {
	$base = AXR_DIR . 'descarregables/';
	$out  = array();
	$grp  = array( '' => 'Documentació', 'planols' => 'Plànols de planta', 'tipologies' => 'Plànols per tipologia' );
	foreach ( $grp as $sub => $nom ) {
		foreach ( (array) glob( $base . ( $sub ? $sub . '/' : '' ) . '*.pdf' ) as $f ) {
			$rel   = ltrim( ( $sub ? $sub . '/' : '' ) . basename( $f ), '/' );
			$title = trim( str_replace( array( 'Aixovall_', '_' ), array( '', ' ' ), basename( $f, '.pdf' ) ) );
			$out[] = array( 'grup' => $nom, 'f' => $rel, 'nom' => $title, 'kb' => (int) round( filesize( $f ) / 1024 ) );
		}
	}
	return $out;
}

function axr_ag_api_file( WP_REST_Request $req ) {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	$rel = (string) $req->get_param( 'f' );
	if ( ! preg_match( '#^(?:(planols|tipologies)/)?[A-Za-z0-9_\-]+\.pdf$#', $rel ) || ! is_file( AXR_DIR . 'descarregables/' . $rel ) ) {
		return axr_ag_err( 'Fitxer no trobat.', 404 );
	}
	$p = AXR_DIR . 'descarregables/' . $rel;
	nocache_headers();
	header( 'Content-Type: application/pdf' );
	header( 'Content-Length: ' . filesize( $p ) );
	header( 'Content-Disposition: inline; filename="' . basename( $p ) . '"' );
	readfile( $p );
	exit;
}

/* ------------------------------------------------------------------ */
/* Contracte de reserva (.docx)                                        */
/* ------------------------------------------------------------------ */

/** Dades de l'intermediari per defecte: les desades per aquesta immobiliària o, si no, les fiscals del Hub. */
function axr_ag_contract_defaults( $actor ) {
	$e   = isset( $actor['entidad'] ) && is_array( $actor['entidad'] ) ? $actor['entidad'] : array();
	$pick = function ( $keys ) use ( $e ) {
		foreach ( $keys as $k ) {
			foreach ( $e as $ek => $ev ) {
				if ( 0 === strpos( $ek, $k ) && is_scalar( $ev ) && '' !== trim( (string) $ev ) ) { return trim( (string) $ev ); }
			}
		}
		return '';
	};
	$d = array(
		'rao'          => $pick( array( 'razon_social', 'fiscal_nombre', 'fiscal_razon', 'razon', 'nombre' ) ),
		'comercial'    => $pick( array( 'nombre_comercial', 'nombre' ) ),
		'nrt'          => $pick( array( 'nrt', 'nif', 'fiscal_nif', 'cif' ) ),
		'domicili'     => $pick( array( 'direccion_fiscal', 'fiscal_direccion', 'domicilio', 'direccion' ) ),
		'poblacio'     => $pick( array( 'poblacion', 'parroquia' ) ),
		'representant' => $pick( array( 'representante' ) ),
		'carrec'       => 'agent immobiliari autoritzat',
		'banc'         => $pick( array( 'banco', 'entidad_banc' ) ),
		'iban'         => $pick( array( 'iban', 'fiscal_iban' ) ),
		'email'        => $pick( array( 'email_fiscal', 'email', 'correo' ) ),
		'logo'         => $pick( array( 'logo' ) ),
	);
	$saved = get_option( 'axr_ag_int', array() );
	$k     = $actor['rol'] . '-' . (int) $actor['entidad_id'];
	if ( is_array( $saved ) && ! empty( $saved[ $k ] ) && is_array( $saved[ $k ] ) ) {
		$d = array_merge( $d, array_filter( $saved[ $k ], 'strlen' ) );
	}
	return $d;
}

/** Import en lletres en català (euros, sense cèntims o amb cèntims). */
function axr_ca_words( $n ) {
	$n = (int) $n;
	$u = array( 'zero', 'un', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou' );
	$d = array( 2 => 'vint', 3 => 'trenta', 4 => 'quaranta', 5 => 'cinquanta', 6 => 'seixanta', 7 => 'setanta', 8 => 'vuitanta', 9 => 'noranta' );
	$c99 = function ( $x ) use ( $u, $d ) {
		if ( $x < 20 ) { return $u[ $x ]; }
		$t = intdiv( $x, 10 );
		$r = $x % 10;
		return $d[ $t ] . ( $r ? ( 2 === $t ? '-i-' : '-' ) . $u[ $r ] : '' );
	};
	$c999 = function ( $x ) use ( $c99, $u ) {
		$h = intdiv( $x, 100 );
		$r = $x % 100;
		$s = 0 === $h ? '' : ( 1 === $h ? 'cent' : $u[ $h ] . '-cents' );
		return trim( $s . ( $r ? ' ' . $c99( $r ) : '' ) );
	};
	if ( 0 === $n ) { return 'zero'; }
	$out = array();
	$mil = intdiv( $n, 1000000 );
	if ( $mil ) { $out[] = 1 === $mil ? 'un milió' : $c999( $mil ) . ' milions'; }
	$th = intdiv( $n % 1000000, 1000 );
	if ( $th ) { $out[] = 1 === $th ? 'mil' : $c999( $th ) . ' mil'; }
	$r = $n % 1000;
	if ( $r ) { $out[] = $c999( $r ); }
	return implode( ' ', $out );
}

function axr_ag_eur( $n ) {
	return number_format( (float) $n, ( floor( $n ) == $n ) ? 0 : 2, ',', '.' );
}

function axr_ag_date_ca( $ymd ) {
	$m = array( 1 => 'gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre' );
	$t = strtotime( $ymd ? $ymd : current_time( 'Y-m-d' ) );
	$mm = $m[ (int) gmdate( 'n', $t ) ];
	return gmdate( 'j', $t ) . ' ' . ( preg_match( '/^[aeiou]/', $mm ) ? "d'" : 'de ' ) . $mm . ' de ' . gmdate( 'Y', $t );
}

function axr_ag_xml( $s ) {
	return htmlspecialchars( (string) $s, ENT_XML1 | ENT_QUOTES, 'UTF-8' );
}

/** Genera el .docx a partir del model de VIMICO (contractes/model-reserva.docx). Retorna el camí del fitxer temporal o WP_Error. */
function axr_ag_contract_docx( array $v, array $int, $logo_url = '' ) {
	if ( ! class_exists( 'ZipArchive' ) ) { return new WP_Error( 'zip', 'El servidor no té ZipArchive.' ); }
	$tpl = AXR_DIR . 'contractes/model-reserva.docx';
	$tmp = wp_tempnam( 'contracte-reserva' );
	if ( ! copy( $tpl, $tmp ) ) { return new WP_Error( 'tpl', 'No s\'ha pogut preparar el model.' ); }
	$z = new ZipArchive();
	if ( true !== $z->open( $tmp ) ) { return new WP_Error( 'zip', 'Model de contracte malmès.' ); }
	$x   = $z->getFromName( 'word/document.xml' );
	$com = $int['comercial'] ? $int['comercial'] : $int['rao'];
	$e   = 'axr_ag_xml';
	$de  = function ( $w ) { return ( preg_match( '/^[aeiouàèéíòóúh]/iu', trim( $w ) ) ? "d'" : 'de ' ) . trim( $w ); }; // «d'agent», «de Finques…»
	// Dades de l'intermediari en lloc de les de VIMICO, SLU (de més concret a més general).
	$rep = array(
		"API IMMOBILIÀRIA · VIMICO, SLU · Escaldes-Engordany, Principat d'Andorra" => $e( mb_strtoupper( $com ) . ' · ' . $int['rao'] . ( $int['poblacio'] ? ' · ' . $int['poblacio'] : '' ) ),
		'VIMICO, SLU, que opera sota el nom comercial API IMMOBILIÀRIA'           => $e( $int['rao'] . ( $com !== $int['rao'] ? ', que opera sota el nom comercial ' . mb_strtoupper( $com ) : '' ) ),
		'NRT L-713223-K'                                                          => $e( 'NRT ' . $int['nrt'] ),
		"l'Avinguda del Fener, 16, AD700 Escaldes-Engordany, Principat d'Andorra" => $e( $int['domicili'] ),
		"en qualitat d'agent immobiliari autoritzat"                              => $e( 'en qualitat ' . $de( $int['carrec'] ) ),
		'ANTONI MARTÍNEZ-ILLESCAS BERMEJO'                                        => $e( mb_strtoupper( $int['representant'] ) ),
		'API Immobiliària (VIMICO, SLU)'                                          => $e( $com . ' (' . $int['rao'] . ')' ),
		'API Immobiliària — VIMICO, SLU'                                          => $e( $com . ' — ' . $int['rao'] ),
		"d'API Immobiliària"                                                      => $e( $de( $com ) ),
		'API Immobiliària'                                                        => $e( $com ),
		'VIMICO, SLU'                                                             => $e( $int['rao'] ),
		'MORA BANC'                                                               => $e( mb_strtoupper( $int['banc'] ) ),
		'AD09 0007 0028 0002 2949 9058'                                           => $e( $int['iban'] ),
		'apimi@andorra.ad'                                                        => $e( $int['email'] ),
	);
	foreach ( $rep as $a => $b ) {
		$x = str_replace( $e( $a ), $b, str_replace( $a, $b, $x ) );
	}
	foreach ( $v as $k => $val ) {
		$x = str_replace( '{{' . $k . '}}', $e( $val ), $x );
	}
	// Logotip: el de la immobiliària si en té; si no, cap (el model porta el d'API Immobiliària).
	$logo_ok = false;
	if ( $logo_url && function_exists( 'wp_get_image_editor' ) ) {
		$r = wp_remote_get( $logo_url, array( 'timeout' => 10 ) );
		if ( ! is_wp_error( $r ) && 200 === (int) wp_remote_retrieve_response_code( $r ) ) {
			$src = wp_tempnam( 'logo' );
			file_put_contents( $src, wp_remote_retrieve_body( $r ) );
			$ed = wp_get_image_editor( $src );
			if ( ! is_wp_error( $ed ) ) {
				$ed->resize( 785, 785, false );
				$out = $src . '.jpg';
				$sv  = $ed->save( $out, 'image/jpeg' );
				if ( ! is_wp_error( $sv ) && is_file( $sv['path'] ) ) {
					$z->addFromString( 'word/media/image1.jpg', file_get_contents( $sv['path'] ) );
					$logo_ok = true;
					@unlink( $sv['path'] );
				}
			}
			@unlink( $src );
		}
	}
	if ( ! $logo_ok ) {
		$x = preg_replace( '#<w:drawing>.*?</w:drawing>#s', '', $x );
	}
	$z->addFromString( 'word/document.xml', $x );
	$z->close();
	return $tmp;
}

function axr_ag_api_contract( WP_REST_Request $req ) {
	$s = axr_ag_need();
	if ( $s instanceof WP_REST_Response ) { return $s; }
	list( $code, $st ) = axr_ag_hub( 'GET', 'estado', null, $s['token'] );
	if ( is_wp_error( $st ) ) { return axr_ag_from_hub( array( $code, $st ) ); }
	$ref = (string) $req->get_param( 'referencia' );
	$viv = null;
	foreach ( $st['viviendas'] as $x ) {
		if ( $x['referencia'] === $ref ) { $viv = $x; }
	}
	if ( ! $viv ) { return axr_ag_err( 'Habitatge no trobat.', 404 ); }
	if ( ! $viv['mia'] && 'disponible' !== $viv['fase'] ) { return axr_ag_err( 'Aquest habitatge no està disponible.', 409 ); }
	$p    = function ( $k, $def = '' ) use ( $req ) { $v = $req->get_param( $k ); return null === $v ? $def : sanitize_text_field( (string) $v ); };
	$def  = axr_ag_contract_defaults( $st['actor'] );
	$int  = array();
	foreach ( array_keys( $def ) as $k ) { $int[ $k ] = $p( 'int_' . $k, $def[ $k ] ); }
	foreach ( array( 'rao', 'nrt', 'domicili', 'representant', 'iban' ) as $k ) {
		if ( '' === trim( $int[ $k ] ) ) { return axr_ag_err( 'Falten dades de la immobiliària per al contracte (raó social, NRT, domicili, representant i IBAN).' ); }
	}
	// Es recorden per a la propera vegada (per immobiliària).
	$saved = get_option( 'axr_ag_int', array() );
	$saved = is_array( $saved ) ? $saved : array();
	$saved[ $st['actor']['rol'] . '-' . (int) $st['actor']['entidad_id'] ] = array_diff_key( $int, array( 'logo' => 1 ) );
	update_option( 'axr_ag_int', $saved, false );

	$op    = $viv['operacion'];
	$homes = axr_homes();
	$home  = isset( $homes[ $ref ] ) ? $homes[ $ref ] : null;
	$total = $op ? (float) $op['precio_total'] : (float) $viv['precio'];
	$res   = $op && $op['reserva_importe'] > 0 ? (float) $op['reserva_importe'] : (float) $st['parametros']['reserva_importe'];
	$c     = $op && $op['comprador'] ? $op['comprador'] : array();
	$anx   = $op && ! empty( $op['anexos'] ) ? 'Plaça d\'aparcament ' . implode( ', ', $op['anexos'] ) : 'Cap';
	$vals  = array(
		'LLOC_SIGNATURA'           => $p( 'lloc', $int['poblacio'] ? $int['poblacio'] : 'Andorra la Vella' ),
		'DATA_SIGNATURA'           => axr_ag_date_ca( $p( 'data' ) ),
		'NOM_COMPRADOR'            => $p( 'nom', isset( $c['nombre'] ) ? $c['nombre'] : '' ),
		'NACIONALITAT_COMPRADOR'   => $p( 'nacionalitat', 'andorrana' ),
		'TIPUS_DOCUMENT_COMPRADOR' => $p( 'tipus_doc', 'passaport' ),
		'NUM_DOCUMENT_COMPRADOR'   => $p( 'num_doc', isset( $c['documento'] ) ? $c['documento'] : '' ),
		'ADREÇA_COMPRADOR'         => $p( 'adreca', isset( $c['direccion'] ) ? $c['direccion'] : '' ),
		'TELEFON_COMPRADOR'        => $p( 'telefon', isset( $c['telefono'] ) ? $c['telefono'] : '' ),
		'EMAIL_COMPRADOR'          => $p( 'email', isset( $c['email'] ) ? $c['email'] : '' ),
		'UNITAT'                   => $home ? $home['name'] : $ref,
		'TIPOLOGIA'                => ( $viv['tipologia'] ? $viv['tipologia'] : ( $home ? 'T' . $home['type'] : '' ) ) . ( $viv['dormitorios'] ? ' · ' . $viv['dormitorios'] . ' dormitoris' : '' ),
		'M2_UTILS'                 => axr_ag_eur( $viv['m2_utiles'] > 0 ? $viv['m2_utiles'] : ( $home ? $home['area'] : 0 ) ),
		'ANNEXOS_UNITAT'           => $anx,
		'PREU_TOTAL'               => axr_ag_eur( $total ),
		'PREU_TOTAL_LLETRES'       => mb_strtoupper( axr_ca_words( floor( $total ) ) . ' euros' . ( $total - floor( $total ) > 0.004 ? ' amb ' . axr_ca_words( round( ( $total - floor( $total ) ) * 100 ) ) . ' cèntims' : '' ) ),
		'IMPORT_10'                => axr_ag_eur( round( $total * 0.10, 2 ) ),
		'IMPORT_ARRES_PENDENT'     => axr_ag_eur( round( $total * 0.10 - $res, 2 ) ),
		'IMPORT_20'                => axr_ag_eur( round( $total * 0.20, 2 ) ),
		'IMPORT_40'                => axr_ag_eur( round( $total * 0.40, 2 ) ),
	);
	foreach ( array( 'NOM_COMPRADOR', 'NUM_DOCUMENT_COMPRADOR' ) as $k ) {
		if ( '' === trim( $vals[ $k ] ) ) { return axr_ag_err( 'Falten el nom i el document del comprador.' ); }
	}
	$f = axr_ag_contract_docx( $vals, $int, $int['logo'] );
	if ( is_wp_error( $f ) ) { return axr_ag_err( $f->get_error_message(), 500 ); }
	$name = 'Contracte-reserva-Aixovall-' . sanitize_file_name( $vals['UNITAT'] . '-' . $vals['NOM_COMPRADOR'] ) . '.docx';
	nocache_headers();
	header( 'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document' );
	header( 'Content-Length: ' . filesize( $f ) );
	header( 'Content-Disposition: attachment; filename="' . str_replace( '"', '', $name ) . '"; filename*=UTF-8\'\'' . rawurlencode( $name ) );
	readfile( $f );
	@unlink( $f );
	exit;
}

/* ------------------------------------------------------------------ */
/* Recursos al showroom i al configurador                              */
/* ------------------------------------------------------------------ */

function axr_ag_boot( $lang ) {
	return array(
		'on'     => axr_ag_activo(),
		'rest'   => esc_url_raw( rest_url( 'axr/v1/agent/' ) ),
		'google' => axr_ag_activo() ? axr_ag_google_url( $lang ) : '',
		'lang'   => $lang,
	);
}

/** S'imprimeix al final del showroom (templates/showroom.php). */
function axr_agent_assets( $lang ) {
	if ( ! axr_ag_activo() ) { return; }
	echo '<script>window.AXA_BOOT=' . wp_json_encode( axr_ag_boot( $lang ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';</script>' . "\n";
	echo '<link rel="stylesheet" href="' . esc_url( AXR_URL . 'assets/agent/agent.css?v=' . axr_ver( 'agent/agent.css' ) ) . '">' . "\n";
	echo '<script src="' . esc_url( AXR_URL . 'assets/agent/agent.js?v=' . axr_ver( 'agent/agent.js' ) ) . '"></script>' . "\n";
}

/** Al configurador: botó «Desar com a configuració provisional» per a l'agent amb el pis aparaulat o reservat. */
function axr_agent_cfg_assets( $home ) {
	if ( ! axr_ag_activo() ) { return; }
	$b = axr_ag_boot( 'ca' ) + array( 'home' => $home['id'], 'back' => axr_url( 'ca' ) . '#pis-' . strtolower( $home['id'] ) );
	echo '<script>window.AXA_BOOT=' . wp_json_encode( $b, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';</script>' . "\n";
	echo '<link rel="stylesheet" href="' . esc_url( AXR_URL . 'assets/agent/agent.css?v=' . axr_ver( 'agent/agent.css' ) ) . '">' . "\n";
	echo '<script src="' . esc_url( AXR_URL . 'assets/agent/agent-cfg.js?v=' . axr_ver( 'agent/agent-cfg.js' ) ) . '" defer></script>' . "\n";
}
