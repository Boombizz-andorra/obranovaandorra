<?php
/**
 * Aixovall Residencial · v3.4 · Dossier personalitzat + WhatsApp
 *
 * - POST /wp-json/aixovall/v1/dossier  → rep el PDF generat al navegador i el desa a uploads/aixovall-residencial-dossiers/<codi>-<token>.pdf
 * - axr_dossier_notify( $payload )      → envia el lead al webhook de Make (WhatsApp via 360dialog + Airtable CRM)
 * - Pàgina d'ajustos «Dossier i WhatsApp» (webhook, activar/desactivar, prova)
 * - CORS per a les fonts del PDF (apimi.com llegeix els .ttf de backend.apimi.com)
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

const AXR_DOSSIER_DIR = 'aixovall-residencial-dossiers';
const AXR_DOSSIER_MAX = 8388608; // 8 MB

function axr_dossier_cfg() {
	$c = get_option( 'axr_dossier', array() );
	return array_merge( array( 'webhook' => 'https://hook.eu2.make.com/y2ve63m22u7a4lqkbksaqj1lry5xlghq', 'on' => 1, 'secret' => '' ), is_array( $c ) ? $c : array() );
}

function axr_dossier_base_url() {
	$up = wp_upload_dir( null, false );
	return trailingslashit( $up['baseurl'] ) . AXR_DOSSIER_DIR . '/';
}

/* ---------- Carpeta de dossiers i CORS de les fonts ---------- */
function axr_dossier_setup() {
	$up  = wp_upload_dir( null, false );
	$dir = trailingslashit( $up['basedir'] ) . AXR_DOSSIER_DIR;
	if ( ! is_dir( $dir ) ) { wp_mkdir_p( $dir ); }
	if ( is_dir( $dir ) ) {
		if ( ! file_exists( $dir . '/index.php' ) ) { @file_put_contents( $dir . '/index.php', "<?php // Silence is golden.\n" ); }
		$ht = "# Aixovall Residencial: només PDF, sense llistat\nOptions -Indexes\n<FilesMatch \"\\.(?!pdf$)[^.]+$\">\nRequire all denied\n</FilesMatch>\n<FilesMatch \"\\.pdf$\">\nHeader set Content-Disposition \"inline\"\nHeader set X-Robots-Tag \"noindex, nofollow\"\n</FilesMatch>\n";
		if ( (string) @file_get_contents( $dir . '/.htaccess' ) !== $ht ) { @file_put_contents( $dir . '/.htaccess', $ht ); }
	}
	/* Les fonts (.ttf) i el vendor es llegeixen des d'apimi.com amb fetch(): cal CORS. */
	foreach ( array( 'fonts', 'vendor' ) as $sub ) {
		$f = AXR_DIR . 'assets/' . $sub . '/.htaccess';
		$r = "# Aixovall Residencial: fitxers del dossier llegibles des d'apimi.com\n<IfModule mod_headers.c>\nHeader set Access-Control-Allow-Origin \"*\"\n</IfModule>\n";
		if ( is_dir( dirname( $f ) ) && (string) @file_get_contents( $f ) !== $r ) { @file_put_contents( $f, $r ); }
	}
}
add_action( 'init', 'axr_dossier_setup', 25 );

/* ---------- REST: pujada del PDF ---------- */
function axr_dossier_rest() {
	register_rest_route( 'aixovall/v1', '/dossier', array(
		'methods'             => 'POST',
		'callback'            => 'axr_rest_dossier',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'axr_dossier_rest' );

function axr_rest_dossier( $request ) {
	$settings = axr_settings();
	if ( empty( $settings['lead_form'] ) ) { return new WP_Error( 'axr_off', 'off', array( 'status' => 403 ) ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$key = 'axr_dl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 10 ) { return new WP_Error( 'axr_rate', 'rate', array( 'status' => 429 ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$files = $request->get_file_params();
	if ( empty( $files['file']['tmp_name'] ) || ! empty( $files['file']['error'] ) ) { return new WP_Error( 'axr_nofile', 'nofile', array( 'status' => 400 ) ); }
	$f = $files['file'];
	if ( (int) $f['size'] > AXR_DOSSIER_MAX || (int) $f['size'] < 1024 ) { return new WP_Error( 'axr_size', 'size', array( 'status' => 413 ) ); }
	$head = (string) @file_get_contents( $f['tmp_name'], false, null, 0, 5 );
	if ( '%PDF-' !== $head ) { return new WP_Error( 'axr_type', 'type', array( 'status' => 415 ) ); }

	$homes = axr_homes();
	$home  = strtoupper( sanitize_text_field( (string) $request->get_param( 'home' ) ) );
	if ( ! isset( $homes[ $home ] ) ) { return new WP_Error( 'axr_home', 'home', array( 'status' => 400 ) ); }
	$code  = preg_replace( '/[^A-Z0-9-]/', '', strtoupper( (string) $request->get_param( 'code' ) ) );
	if ( '' === $code ) { $code = 'AX-' . str_replace( '-', '', $home ); }

	$up   = wp_upload_dir( null, false );
	$dir  = trailingslashit( $up['basedir'] ) . AXR_DOSSIER_DIR;
	if ( ! is_dir( $dir ) ) { axr_dossier_setup(); }
	if ( ! is_dir( $dir ) || ! is_writable( $dir ) ) { return new WP_Error( 'axr_dir', 'dir', array( 'status' => 500 ) ); }
	$token = wp_generate_password( 12, false, false );
	$name  = 'Aixovall_' . str_replace( '-', '', $home ) . '_' . $code . '_' . $token . '.pdf';
	if ( ! @move_uploaded_file( $f['tmp_name'], $dir . '/' . $name ) && ! @copy( $f['tmp_name'], $dir . '/' . $name ) ) {
		return new WP_Error( 'axr_write', 'write', array( 'status' => 500 ) );
	}
	@chmod( $dir . '/' . $name, 0644 );
	return array( 'ok' => true, 'url' => axr_dossier_base_url() . $name, 'name' => $name, 'code' => $code );
}

/* ---------- Webhook a Make ---------- */
function axr_dossier_notify( $payload ) {
	$c = axr_dossier_cfg();
	if ( empty( $c['on'] ) || '' === trim( (string) $c['webhook'] ) || ! wp_http_validate_url( $c['webhook'] ) ) { return false; }
	$payload['source']  = 'apimi.com/aixovall-residencial';
	$payload['version'] = AXR_VERSION;
	$headers = array( 'Content-Type' => 'application/json; charset=utf-8' );
	if ( '' !== (string) $c['secret'] ) { $headers['x-make-apikey'] = (string) $c['secret']; }
	$r = wp_remote_post( $c['webhook'], array(
		'timeout'  => 6,
		'blocking' => true,
		'headers'  => $headers,
		'body'     => wp_json_encode( $payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
	) );
	$ok = ! is_wp_error( $r ) && wp_remote_retrieve_response_code( $r ) < 300;
	update_option( 'axr_dossier_last', array( 'when' => current_time( 'mysql' ), 'ok' => $ok, 'code' => is_wp_error( $r ) ? $r->get_error_message() : wp_remote_retrieve_response_code( $r ), 'event' => isset( $payload['event'] ) ? $payload['event'] : '' ), false );
	if ( ! empty( $payload['lead_id'] ) ) { update_post_meta( (int) $payload['lead_id'], '_axr_make', $ok ? 'ok' : 'error' ); }
	return $ok;
}

/* ---------- Neteja: els PDF caduquen als 90 dies ---------- */
function axr_dossier_cleanup() {
	$up  = wp_upload_dir( null, false );
	$dir = trailingslashit( $up['basedir'] ) . AXR_DOSSIER_DIR;
	if ( ! is_dir( $dir ) ) { return; }
	foreach ( (array) glob( $dir . '/*.pdf' ) as $file ) {
		if ( filemtime( $file ) < time() - 90 * DAY_IN_SECONDS ) { @unlink( $file ); }
	}
}
add_action( 'axr_dossier_cleanup', 'axr_dossier_cleanup' );
add_action( 'init', function () { if ( ! wp_next_scheduled( 'axr_dossier_cleanup' ) ) { wp_schedule_event( time() + DAY_IN_SECONDS, 'daily', 'axr_dossier_cleanup' ); } }, 30 );

/* ---------- Ajustos: Aixovall › Dossier i WhatsApp ---------- */
if ( is_admin() ) {
	add_action( 'admin_menu', function () {
		add_submenu_page( 'axr-homes', 'Dossier y WhatsApp', 'Dossier y WhatsApp', 'manage_options', 'axr-dossier', 'axr_admin_dossier' );
	}, 20 );

	add_action( 'admin_init', function () {
		if ( ! isset( $_POST['axr_action'] ) || ! current_user_can( 'manage_options' ) ) { return; }
		$action = sanitize_key( wp_unslash( $_POST['axr_action'] ) );
		if ( 'dossier' === $action ) {
			check_admin_referer( 'axr_dossier' );
			$c            = axr_dossier_cfg();
			$c['webhook'] = isset( $_POST['webhook'] ) ? esc_url_raw( wp_unslash( $_POST['webhook'] ) ) : '';
			$c['secret']  = isset( $_POST['secret'] ) ? sanitize_text_field( wp_unslash( $_POST['secret'] ) ) : '';
			$c['on']      = empty( $_POST['on'] ) ? 0 : 1;
			update_option( 'axr_dossier', $c, false );
			wp_safe_redirect( admin_url( 'admin.php?page=axr-dossier&axr_saved=1' ) );
			exit;
		}
		if ( 'dossier_test' === $action ) {
			check_admin_referer( 'axr_dossier_test' );
			$ok = axr_dossier_notify( array( 'event' => 'lead.test', 'intent' => 'test', 'lead_id' => 0, 'created_at' => current_time( 'c' ), 'lead' => array( 'name' => 'Prova Aixovall', 'first_name' => 'Prova', 'email' => get_option( 'admin_email' ), 'phone' => '', 'wa' => '', 'lang' => 'ca', 'consent' => true ), 'home' => array( 'id' => '1-1', 'name' => '1r 1a' ), 'code' => 'AX-11-TEST', 'totals' => array( 'total' => 0 ), 'pdf_url' => '' ) );
			set_transient( 'axr_dossier_msg', $ok ? 'Prueba enviada a Make correctamente (evento lead.test; Make no envía WhatsApp ni crea contacto con este evento).' : 'Make no ha respondido correctamente. Revisa la URL del webhook.', 60 );
			wp_safe_redirect( admin_url( 'admin.php?page=axr-dossier' ) );
			exit;
		}
	} );

	function axr_admin_dossier() {
		if ( ! current_user_can( 'manage_options' ) ) { return; }
		$c    = axr_dossier_cfg();
		$last = get_option( 'axr_dossier_last', array() );
		$msg  = get_transient( 'axr_dossier_msg' );
		$up   = wp_upload_dir( null, false );
		$dir  = trailingslashit( $up['basedir'] ) . AXR_DOSSIER_DIR;
		$cnt  = is_dir( $dir ) ? count( (array) glob( $dir . '/*.pdf' ) ) : 0;
		echo '<div class="wrap axr-wrap"><h1>Aixovall Residencial · Dossier y WhatsApp</h1>';
		if ( isset( $_GET['axr_saved'] ) ) { echo '<div class="notice notice-success is-dismissible"><p>Cambios guardados.</p></div>'; }
		if ( $msg ) { delete_transient( 'axr_dossier_msg' ); echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( $msg ) . '</p></div>'; }
		echo '<div class="axr-card"><p>Cuando un cliente deja sus datos en el paso 7 del configurador, el navegador genera el <strong>dossier en PDF</strong> (planos, acabados, precio y calendario de pagos), lo sube aquí y WordPress avisa a <strong>Make</strong>, que lo envía por <strong>WhatsApp (360dialog)</strong> y crea el contacto en el <strong>CRM de Airtable</strong>.</p>';
		echo '<p class="axr-muted">Dossieres guardados: <strong>' . (int) $cnt . '</strong> en <code>' . esc_html( str_replace( ABSPATH, '', $dir ) ) . '</code> (se borran a los 90 días). ' . ( ! empty( $last['when'] ) ? 'Último aviso a Make: ' . esc_html( $last['when'] ) . ' · ' . ( ! empty( $last['ok'] ) ? '<span class="axr-st-available">correcto</span>' : '<span class="axr-st-sold">error ' . esc_html( (string) $last['code'] ) . '</span>' ) : 'Todavía no se ha enviado ningún aviso a Make.' ) . '</p></div>';
		echo '<form method="post"><input type="hidden" name="axr_action" value="dossier">';
		wp_nonce_field( 'axr_dossier' );
		echo '<table class="form-table" role="presentation"><tbody>';
		echo '<tr><th>Activo</th><td><label><input type="checkbox" name="on" value="1"' . checked( ! empty( $c['on'] ), true, false ) . '> Avisar a Make de cada solicitud del configurador y de la landing</label></td></tr>';
		echo '<tr><th><label for="axr-webhook">Webhook de Make</label></th><td><input id="axr-webhook" class="regular-text" type="url" name="webhook" placeholder="https://hook.eu2.make.com/…" value="' . esc_attr( $c['webhook'] ) . '"><p class="description">Escenario «Aixovall · Dossier configurador → WhatsApp + CRM».</p></td></tr>';
		echo '<tr><th><label for="axr-secret">Clave (opcional)</label></th><td><input id="axr-secret" class="regular-text" type="text" name="secret" autocomplete="off" value="' . esc_attr( $c['secret'] ) . '"><p class="description">Se envía en la cabecera <code>x-make-apikey</code> si el webhook de Make pide clave.</p></td></tr>';
		echo '</tbody></table>';
		submit_button( 'Guardar' );
		echo '</form>';
		echo '<form method="post"><input type="hidden" name="axr_action" value="dossier_test">';
		wp_nonce_field( 'axr_dossier_test' );
		submit_button( 'Enviar una prueba a Make', 'secondary' );
		echo '</form></div>';
	}
}
