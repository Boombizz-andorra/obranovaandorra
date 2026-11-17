<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

function axr_register_leads() {
	register_post_type( 'axr_lead', array(
		'labels' => array(
			'name'               => 'Solicitudes',
			'singular_name'      => 'Solicitud',
			'menu_name'          => 'Solicitudes',
			'all_items'          => 'Solicitudes',
			'edit_item'          => 'Ver solicitud',
			'search_items'       => 'Buscar solicitudes',
			'not_found'          => 'Todavía no hay solicitudes.',
			'not_found_in_trash' => 'No hay solicitudes en la papelera.',
		),
		'public'              => false,
		'show_ui'             => true,
		'show_in_menu'        => 'axr-homes',
		'show_in_rest'        => false,
		'exclude_from_search' => true,
		'capability_type'     => 'page',
		'capabilities'        => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap'        => true,
		'supports'            => array( 'title', 'editor' ),
	) );
}
add_action( 'init', 'axr_register_leads' );

function axr_register_rest() {
	register_rest_route( 'aixovall/v1', '/lead', array(
		'methods'             => 'POST',
		'callback'            => 'axr_rest_lead',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'axr_register_rest' );

function axr_rest_lead( $request ) {
	$settings = axr_settings();
	if ( empty( $settings['lead_form'] ) ) {
		return new WP_Error( 'axr_off', 'off', array( 'status' => 403 ) );
	}
	$p = $request->get_json_params();
	if ( ! is_array( $p ) ) { $p = array(); }
	/* Trampa per a robots: el camp ocult ha d'arribar buit. */
	if ( ! empty( $p['website'] ) ) { return array( 'ok' => true ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$key = 'axr_rl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 5 ) { return new WP_Error( 'axr_rate', 'rate', array( 'status' => 429 ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$name  = isset( $p['name'] ) ? sanitize_text_field( mb_substr( (string) $p['name'], 0, 120 ) ) : '';
	$email = isset( $p['email'] ) ? sanitize_email( (string) $p['email'] ) : '';
	$phone = isset( $p['phone'] ) ? sanitize_text_field( mb_substr( (string) $p['phone'], 0, 40 ) ) : '';
	$note  = isset( $p['note'] ) ? sanitize_textarea_field( mb_substr( (string) $p['note'], 0, 2000 ) ) : '';
	$home  = isset( $p['home'] ) ? strtoupper( sanitize_text_field( (string) $p['home'] ) ) : '';
	$lang  = isset( $p['lang'] ) && array_key_exists( $p['lang'], axr_langs() ) ? $p['lang'] : 'ca';
	$sum   = isset( $p['summary'] ) ? sanitize_textarea_field( mb_substr( (string) $p['summary'], 0, 8000 ) ) : '';
	$link  = isset( $p['link'] ) ? esc_url_raw( mb_substr( (string) $p['link'], 0, 600 ) ) : '';
	$homes = axr_homes();

	/* v3.3: el formulari de la landing permet deixar només el telèfon */
	$has_phone = strlen( preg_replace( '/\D/', '', $phone ) ) >= 6;
	if ( '' === $name || empty( $p['consent'] ) || ( ! is_email( $email ) && ! $has_phone ) ) {
		return new WP_Error( 'axr_invalid', 'invalid', array( 'status' => 400 ) );
	}
	if ( '' !== $home && ! isset( $homes[ $home ] ) ) { $home = ''; }
	$home_name = '' !== $home ? $homes[ $home ]['name'] : 'Información general';

	/* v3.4: dades del dossier (porta d'accés del configurador) */
	$intent  = isset( $p['intent'] ) ? sanitize_key( (string) $p['intent'] ) : '';
	$code    = isset( $p['code'] ) ? sanitize_text_field( mb_substr( (string) $p['code'], 0, 24 ) ) : '';
	$pdf_url = isset( $p['pdf_url'] ) ? esc_url_raw( mb_substr( (string) $p['pdf_url'], 0, 600 ) ) : '';
	if ( '' !== $pdf_url && 0 !== strpos( $pdf_url, axr_dossier_base_url() ) ) { $pdf_url = ''; } // només PDFs pujats aquí
	$wa      = isset( $p['wa'] ) ? preg_replace( '/\D/', '', (string) $p['wa'] ) : '';
	$totals  = isset( $p['totals'] ) && is_array( $p['totals'] ) ? array_map( 'floatval', array_intersect_key( $p['totals'], array_flip( array( 'home', 'anx', 'cfg', 'base', 'igi', 'total' ) ) ) ) : array();
	$config  = array();
	if ( isset( $p['config'] ) && is_array( $p['config'] ) ) { foreach ( $p['config'] as $k => $v ) { if ( preg_match( '/^[A-Z0-9.]{1,8}$/', (string) $k ) ) { $config[ (string) $k ] = sanitize_text_field( mb_substr( (string) $v, 0, 12 ) ); } } }
	$utm     = array();
	if ( isset( $p['utm'] ) && is_array( $p['utm'] ) ) { foreach ( $p['utm'] as $k => $v ) { if ( preg_match( '/^(utm_[a-z_]{1,24}|fbclid|landing|when)$/', (string) $k ) ) { $utm[ (string) $k ] = sanitize_text_field( mb_substr( (string) $v, 0, 160 ) ); } } }

	$body  = "Nombre: $name\nCorreo: $email\nTeléfono: $phone\nVivienda: $home_name\nIdioma: $lang\n";
	if ( '' !== $code ) { $body .= "Código: $code\n"; }
	if ( ! empty( $totals['total'] ) ) { $body .= 'Total con IGI: ' . number_format( (float) $totals['total'], 2, ',', '.' ) . " €\n"; }
	if ( '' !== $note ) { $body .= "\nComentarios:\n$note\n"; }
	if ( '' !== $sum ) { $body .= ( 'landing' === $intent ? "\n----- Solicitud desde la web -----\n" : "\n----- Configuración -----\n" ) . "$sum\n"; }
	if ( '' !== $link ) { $body .= "\nAbrir esta configuración: $link\n"; }
	$pdf = '' !== $pdf_url ? $pdf_url : axr_lead_pdf_url( $link, $name, $email, $phone );
	if ( '' !== $pdf ) { $body .= "Descargar el PDF de esta configuración: $pdf\n"; }
	if ( ! empty( $utm['utm_campaign'] ) ) { $body .= "\nCampaña: " . $utm['utm_campaign'] . ( ! empty( $utm['utm_source'] ) ? ' · ' . $utm['utm_source'] : '' ) . "\n"; }

	$id = wp_insert_post( array(
		'post_type'    => 'axr_lead',
		'post_status'  => 'private',
		'post_title'   => $name . ' · ' . $home_name,
		'post_content' => $body,
	), true );
	if ( is_wp_error( $id ) ) { return new WP_Error( 'axr_save', 'save', array( 'status' => 500 ) ); }
	if ( '' !== $pdf ) { update_post_meta( $id, '_axr_pdf', $pdf ); }
	if ( '' !== $code ) { update_post_meta( $id, '_axr_code', $code ); }
	if ( '' !== $wa ) { update_post_meta( $id, '_axr_wa', $wa ); }
	if ( $totals ) { update_post_meta( $id, '_axr_totals', $totals ); }
	if ( $config ) { update_post_meta( $id, '_axr_config', $config ); }
	if ( $utm ) { update_post_meta( $id, '_axr_utm', $utm ); }

	/* v3.4: avís a Make (WhatsApp 360dialog + CRM). Si falla, la sol·licitud queda igualment desada. */
	if ( function_exists( 'axr_dossier_notify' ) ) {
		axr_dossier_notify( array(
			'event'      => 'aixovall.lead',
			'intent'     => '' !== $intent ? $intent : 'configurador',
			'lead_id'    => (int) $id,
			'created_at' => current_time( 'c' ),
			'lead'       => array( 'name' => $name, 'first_name' => preg_split( '/\s+/', trim( $name ) )[0], 'email' => $email, 'phone' => $phone, 'wa' => $wa, 'lang' => $lang, 'consent' => true, 'note' => $note ),
			'home'       => '' !== $home ? array( 'id' => $home, 'name' => $home_name, 'type' => 'T' . (int) $homes[ $home ]['type'], 'floor' => (int) $homes[ $home ]['floor'], 'bedrooms' => (int) $homes[ $home ]['bedrooms'], 'area' => (float) $homes[ $home ]['area'], 'price' => (int) $homes[ $home ]['price'], 'status' => $homes[ $home ]['status'] ) : array( 'id' => '', 'name' => $home_name ),
			'code'       => $code,
			'totals'     => $totals,
			'config'     => $config,
			'summary'    => $sum,
			'link'       => $link,
			'pdf_url'    => $pdf_url,
			'pdf_name'   => '' !== $pdf_url ? basename( wp_parse_url( $pdf_url, PHP_URL_PATH ) ) : '',
			'utm'        => $utm,
			'admin_url'  => admin_url( 'post.php?post=' . (int) $id . '&action=edit' ),
		) );
	}

	$to = is_email( $settings['lead_email'] ) ? $settings['lead_email'] : get_option( 'admin_email' );
	wp_mail( $to, 'Aixovall Residencial · ' . $home_name . ' · ' . $name, $body, is_email( $email ) ? array( 'Reply-To: ' . $name . ' <' . $email . '>' ) : array() );

	return array( 'ok' => true, 'id' => (int) $id );
}

/* ============ v2.5.1 · PDF de la configuració des de la sol·licitud ============ */

/** Enllaç que obre la configuració del client i en descarrega el PDF amb les seves dades (sense enviar cap sol·licitud nova). */
function axr_lead_pdf_url( $link, $name, $email, $phone ) {
	if ( '' === (string) $link || false === strpos( $link, '#c=' ) ) { return ''; }
	$data = wp_json_encode( array( 'n' => (string) $name, 'e' => (string) $email, 't' => (string) $phone ), JSON_UNESCAPED_UNICODE );
	$b64  = rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	return $link . '&p=' . $b64;
}

/** Per a les sol·licituds antigues (sense meta), es reconstrueix des del text desat. */
function axr_lead_pdf_for_post( $post ) {
	$post = get_post( $post );
	if ( ! $post || 'axr_lead' !== $post->post_type ) { return ''; }
	$saved = (string) get_post_meta( $post->ID, '_axr_pdf', true );
	if ( '' !== $saved ) { return $saved; }
	$txt  = (string) $post->post_content;
	$get  = function ( $label ) use ( $txt ) { return preg_match( '/^' . preg_quote( $label, '/' ) . ':[ \t]*(.*)$/mu', $txt, $m ) ? trim( $m[1] ) : ''; };
	$link = preg_match( '/Abrir esta configuración:\s*(\S+)/u', $txt, $m ) ? $m[1] : '';
	return axr_lead_pdf_url( $link, $get( 'Nombre' ), $get( 'Correo' ), $get( 'Teléfono' ) );
}

function axr_lead_row_actions( $actions, $post ) {
	if ( 'axr_lead' !== $post->post_type ) { return $actions; }
	$url = axr_lead_pdf_for_post( $post );
	if ( '' !== $url ) {
		$actions['axr_pdf'] = '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">Descargar PDF</a>';
	}
	return $actions;
}
add_filter( 'post_row_actions', 'axr_lead_row_actions', 10, 2 );

function axr_lead_pdf_box() {
	add_meta_box( 'axr_lead_pdf', 'Configuración en PDF', function ( $post ) {
		$url = axr_lead_pdf_for_post( $post );
		if ( '' === $url ) { echo '<p>Esta solicitud no incluye ninguna configuración.</p>'; return; }
		echo '<p><a class="button button-primary" href="' . esc_url( $url ) . '" target="_blank" rel="noopener">Descargar PDF</a></p>';
		$wa = (string) get_post_meta( $post->ID, '_axr_wa', true );
		if ( '' !== $wa ) { echo '<p><a class="button" href="https://wa.me/' . esc_attr( $wa ) . '" target="_blank" rel="noopener">Abrir WhatsApp del cliente</a></p>'; }
		echo '<p class="description">' . ( 0 === strpos( $url, 'http' ) && false === strpos( $url, '#c=' ) ? 'Dossier en PDF que recibió el cliente por WhatsApp.' : 'Abre la configuración del cliente y descarga el PDF con sus datos. No envía ninguna solicitud nueva.' ) . '</p>';
	}, 'axr_lead', 'side', 'high' );
}
add_action( 'add_meta_boxes_axr_lead', 'axr_lead_pdf_box' );
