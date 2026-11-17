<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

function axr_admin_menu() {
	add_menu_page( 'Aixovall Residencial', 'Aixovall', 'manage_options', 'axr-homes', 'axr_admin_homes', 'dashicons-building', 21 );
	add_submenu_page( 'axr-homes', 'Viviendas · precios y reservas', 'Viviendas', 'manage_options', 'axr-homes', 'axr_admin_homes' );
	add_submenu_page( 'axr-homes', 'Configurador de acabados', 'Configurador', 'manage_options', 'axr-cfg', 'axr_admin_cfg' );
	add_submenu_page( 'axr-homes', 'Ajustes de Aixovall', 'Ajustes', 'manage_options', 'axr-settings', 'axr_admin_settings' );
}
add_action( 'admin_menu', 'axr_admin_menu' );

function axr_admin_css() {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || false === strpos( (string) $screen->id, 'axr-' ) ) { return; }
	echo '<style>
	.axr-wrap{max-width:1100px}.axr-wrap h2{margin-top:28px}
	.axr-table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #c3c4c7}
	.axr-table th,.axr-table td{padding:8px 10px;border-bottom:1px solid #e3e3e6;text-align:left;vertical-align:middle}
	.axr-table th{background:#f6f7f7;font-weight:600}
	.axr-table input[type=number]{width:120px}.axr-table input[type=text]{width:100%;max-width:260px}
	.axr-table tr.axr-group td{background:#f0f0f1;font-weight:600}
	.axr-muted{color:#646970}.axr-pill{display:inline-block;padding:2px 8px;border-radius:10px;background:#f0f0f1;font-size:12px}
	.axr-links a{display:inline-block;margin:0 10px 6px 0}
	.axr-card{background:#fff;border:1px solid #c3c4c7;padding:14px 18px;margin:16px 0;max-width:820px}
	.axr-st-available{color:#1a7f37}.axr-st-reserved{color:#9a6700}.axr-st-sold{color:#b32d2e}
	@media(max-width:782px){.axr-table{display:block;overflow-x:auto}}
	</style>';
}
add_action( 'admin_head', 'axr_admin_css' );

function axr_admin_notice_saved() {
	if ( isset( $_GET['axr_saved'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>Cambios guardados. La página pública ya muestra los datos nuevos.</p></div>';
	}
}

function axr_admin_links() {
	echo '<p class="axr-links"><strong>Ver la página:</strong> ';
	foreach ( axr_langs() as $code => $name ) {
		echo '<a href="' . esc_url( axr_url( $code ) ) . '" target="_blank" rel="noopener">' . esc_html( $name ) . ' ↗</a>';
	}
	echo '</p>';
}

function axr_admin_redirect( $page ) {
	axr_purge_cache();
	wp_safe_redirect( admin_url( 'admin.php?page=' . $page . '&axr_saved=1' ) );
	exit;
}

/* ---------- Guardado ---------- */
function axr_admin_save() {
	if ( empty( $_POST['axr_action'] ) || ! current_user_can( 'manage_options' ) ) { return; }
	$action = sanitize_key( wp_unslash( $_POST['axr_action'] ) );
	check_admin_referer( 'axr_' . $action );

	if ( 'homes' === $action ) {
		$in    = isset( $_POST['homes'] ) && is_array( $_POST['homes'] ) ? wp_unslash( $_POST['homes'] ) : array();
		$save  = array();
		foreach ( axr_default_homes() as $id => $h ) {
			if ( ! isset( $in[ $id ] ) || ! is_array( $in[ $id ] ) ) { continue; }
			$status = isset( $in[ $id ]['status'] ) ? sanitize_key( $in[ $id ]['status'] ) : 'available';
			$cfg    = isset( $in[ $id ]['cfg'] ) ? sanitize_key( $in[ $id ]['cfg'] ) : '';
			$save[ $id ] = array(
				'price'  => isset( $in[ $id ]['price'] ) ? max( 0, (int) preg_replace( '/[^0-9]/', '', (string) $in[ $id ]['price'] ) ) : $h['price'],
				'status' => in_array( $status, axr_statuses(), true ) ? $status : 'available',
				'cfg'    => in_array( $cfg, axr_cfg_kinds(), true ) ? $cfg : '',
			);
		}
		update_option( 'axr_homes', $save, false );
		update_option( 'axr_t5_ack', 1, false );
		$s            = axr_settings();
		$s['updated'] = current_time( 'Y-m-d' );
		update_option( 'axr_settings', $s, false );
		axr_admin_redirect( 'axr-homes' );
	}

	if ( 'cfg' === $action ) {
		$in   = isset( $_POST['cat'] ) && is_array( $_POST['cat'] ) ? wp_unslash( $_POST['cat'] ) : array();
		$save = array();
		foreach ( axr_default_catalog() as $key => $grp ) {
			foreach ( $grp['ops'] as $id => $op ) {
				$fid = str_replace( '.', '_', $id );
				if ( ! isset( $in[ $key ][ $fid ] ) || ! is_array( $in[ $key ][ $fid ] ) ) { continue; }
				$r = $in[ $key ][ $fid ];
				$save[ $key ][ $id ] = array(
					'name'  => isset( $r['name'] ) ? sanitize_text_field( $r['name'] ) : $op['name'],
					'brand' => isset( $r['brand'] ) ? sanitize_text_field( $r['brand'] ) : $op['brand'],
					'price' => isset( $r['price'] ) ? max( 0, (float) str_replace( ',', '.', (string) $r['price'] ) ) : $op['price'],
					'on'    => ! empty( $r['on'] ),
				);
			}
		}
		update_option( 'axr_catalog', $save, false );
		$tin   = isset( $_POST['types'] ) && is_array( $_POST['types'] ) ? wp_unslash( $_POST['types'] ) : array();
		$types = array();
		foreach ( axr_default_types() as $k => $t ) {
			if ( isset( $tin[ $k ]['floor_m2'] ) ) { $types[ $k ]['floor_m2'] = max( 0, (float) str_replace( ',', '.', (string) $tin[ $k ]['floor_m2'] ) ); }
		}
		update_option( 'axr_types', $types, false );
		$s                = axr_settings();
		$s['cfg_enabled'] = empty( $_POST['cfg_enabled'] ) ? 0 : 1;
		$s['cfg_section'] = empty( $_POST['cfg_section'] ) ? 0 : 1;
		$s['lead_form']   = empty( $_POST['lead_form'] ) ? 0 : 1;
		update_option( 'axr_settings', $s, false );
		axr_admin_redirect( 'axr-cfg' );
	}

	if ( 'cfg_reset' === $action ) {
		delete_option( 'axr_catalog' );
		delete_option( 'axr_types' );
		axr_admin_redirect( 'axr-cfg' );
	}

	if ( 'settings' === $action ) {
		$s               = axr_settings();
		$s['phone']      = isset( $_POST['phone'] ) ? sanitize_text_field( wp_unslash( $_POST['phone'] ) ) : $s['phone'];
		$email           = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
		$lead            = isset( $_POST['lead_email'] ) ? sanitize_email( wp_unslash( $_POST['lead_email'] ) ) : '';
		if ( is_email( $email ) ) { $s['email'] = $email; }
		if ( is_email( $lead ) ) { $s['lead_email'] = $lead; }
		$s['noindex']    = empty( $_POST['noindex'] ) ? 0 : 1;
		$s['fin_on']     = empty( $_POST['fin_on'] ) ? 0 : 1;
		$s['showroom']   = empty( $_POST['showroom'] ) ? 0 : 1;
		$s['fin_url']    = isset( $_POST['fin_url'] ) ? esc_url_raw( wp_unslash( $_POST['fin_url'] ) ) : '';
		if ( isset( $_POST['igi'] ) ) { $s['igi'] = max( 0, min( 30, (float) str_replace( ',', '.', wp_unslash( $_POST['igi'] ) ) ) ); }
		update_option( 'axr_settings', $s, false );
		axr_admin_redirect( 'axr-settings' );
	}

	if ( 'media' === $action ) {
		$msg = axr_admin_import_media();
		set_transient( 'axr_media_msg', $msg, 60 );
		axr_purge_cache();
		wp_safe_redirect( admin_url( 'admin.php?page=axr-settings' ) );
		exit;
	}
}
add_action( 'admin_init', 'axr_admin_save' );

/** Importa un .zip d'imatges i vídeos a uploads/aixovall-residencial (només formats de mitjans). */
function axr_admin_import_media() {
	if ( empty( $_FILES['axr_zip']['tmp_name'] ) || ! empty( $_FILES['axr_zip']['error'] ) ) { return 'No se ha recibido ningún archivo.'; }
	if ( ! class_exists( 'ZipArchive' ) ) { return 'El servidor no puede abrir archivos .zip.'; }
	$zip = new ZipArchive();
	if ( true !== $zip->open( $_FILES['axr_zip']['tmp_name'] ) ) { return 'El archivo no es un .zip válido.'; }
	$up      = wp_upload_dir( null, false );
	$dest    = $up['basedir'] . '/' . AXR_SLUG;
	$allowed = array( 'webp', 'jpg', 'jpeg', 'png', 'mp4', 'webm' );
	$count   = 0;
	for ( $i = 0; $i < $zip->numFiles; $i++ ) {
		$name = $zip->getNameIndex( $i );
		if ( false === $name || '/' === substr( $name, -1 ) ) { continue; }
		$name = str_replace( '\\', '/', $name );
		if ( false !== strpos( $name, '..' ) || 0 === strpos( $name, '/' ) || 0 === strpos( basename( $name ), '.' ) ) { continue; }
		$ext = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
		if ( ! in_array( $ext, $allowed, true ) ) { continue; }
		if ( ! preg_match( '#^[A-Za-z0-9._/-]+$#', $name ) ) { continue; }
		$target = $dest . '/' . $name;
		if ( ! wp_mkdir_p( dirname( $target ) ) ) { continue; }
		$data = $zip->getFromIndex( $i );
		if ( false === $data ) { continue; }
		if ( false !== file_put_contents( $target, $data ) ) { $count++; }
	}
	$zip->close();
	return $count ? sprintf( 'Paquete importado: %d archivos.', $count ) : 'El .zip no contenía imágenes ni vídeos válidos.';
}

/* ---------- Viviendas ---------- */
function axr_admin_homes() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$homes  = axr_homes();
	$labels = array( 'available' => 'Disponible', 'agreed' => 'Apalabrado (72 h)', 'reserved' => 'Reserva técnica (10.000 €)', 'confirmed' => 'Reserva confirmada (arras)', 'sold' => 'Vendido' );
	$floors = array( 0 => 'Planta baja', 1 => 'Primera', 2 => 'Segunda', 3 => 'Tercera', 4 => 'Ático' );
	$count  = array_fill_keys( axr_statuses(), 0 );
	foreach ( $homes as $h ) { if ( isset( $count[ $h['status'] ] ) ) { $count[ $h['status'] ]++; } }
	echo '<div class="wrap axr-wrap"><h1>Aixovall Residencial · Viviendas</h1>';
	axr_admin_notice_saved();
	axr_admin_links();
	echo '<p><span class="axr-pill axr-st-available">' . (int) $count['available'] . ' disponibles</span> <span class="axr-pill axr-st-reserved">' . (int) $count['agreed'] . ' apalabradas</span> <span class="axr-pill axr-st-reserved">' . (int) $count['reserved'] . ' con reserva técnica</span> <span class="axr-pill axr-st-reserved">' . (int) $count['confirmed'] . ' con reserva confirmada</span> <span class="axr-pill axr-st-sold">' . (int) $count['sold'] . ' vendidas</span></p>';
	echo '<form method="post"><input type="hidden" name="axr_action" value="homes">';
	wp_nonce_field( 'axr_homes' );
	echo '<table class="axr-table"><thead><tr><th>Vivienda</th><th>Planta</th><th>Tipología</th><th>Dorm.</th><th>Superficie</th><th>Precio (€, sin IGI)</th><th>Estado</th><th>Configurador</th></tr></thead><tbody>';
	foreach ( $homes as $id => $h ) {
		$n = 'homes[' . esc_attr( $id ) . ']';
		echo '<tr><td><strong>' . esc_html( $h['name'] ) . '</strong></td><td>' . esc_html( $floors[ $h['floor'] ] ) . '</td><td>T' . (int) $h['type'] . '</td><td>' . (int) $h['bedrooms'] . '</td><td>' . esc_html( number_format_i18n( $h['area'], 1 ) ) . ' m²</td>';
		echo '<td><input type="number" min="0" step="1" name="' . $n . '[price]" value="' . (int) $h['price'] . '"></td>';
		echo '<td><select name="' . $n . '[status]">';
		foreach ( $labels as $k => $l ) { echo '<option value="' . esc_attr( $k ) . '"' . selected( $h['status'], $k, false ) . '>' . esc_html( $l ) . '</option>'; }
		echo '</select></td><td><select name="' . $n . '[cfg]">';
		foreach ( array( '' => 'Sin configurador', 't4' => 'Configurador T4', 't5' => 'Configurador T5', 't7' => 'Configurador T7' ) as $k => $l ) { echo '<option value="' . esc_attr( $k ) . '"' . selected( $h['cfg'], $k, false ) . '>' . esc_html( $l ) . '</option>'; }
		echo '</select></td></tr>';
	}
	echo '</tbody></table>';
	if ( function_exists( 'axr_hub_activo' ) && axr_hub_activo() ) { echo '<p class="axr-muted"><strong>Enlace con iShowi Hub activo:</strong> el precio y el estado que ves vienen del Hub y mandan sobre lo que guardes aquí. Cámbialos en el Hub (Ajustes › iShowi Hub para desactivar el enlace).</p>'; }
	echo '<p class="axr-muted">El precio y el estado se muestran en la lista de viviendas de la página y en el configurador. Al guardar, la fecha de actualización que aparece bajo la lista pasa a ser la de hoy.</p>';
	submit_button( 'Guardar viviendas' );
	echo '</form></div>';
}

/* ---------- Configurador ---------- */
function axr_admin_cfg() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$cat   = axr_catalog();
	$types = axr_types();
	$s     = axr_settings();
	$names = array(
		'SV' => 'Suelo de la vivienda (precio por m²)', 'FB' => 'Cocina · frontal bajo', 'FA' => 'Cocina · frontal alto', 'EC' => 'Cocina · encimera', 'IL' => 'Cocina · iluminación LED',
		'SB' => 'Baño · suelo', 'PV' => 'Baño · pared vertical', 'PE' => 'Baño · pared especial (fondo de ducha)', 'MB' => 'Baño · mueble',
		'CR' => 'Acristalamiento', 'PA' => 'Aparcamiento (se suma al precio de la vivienda)', 'TR' => 'Trastero (se suma al precio de la vivienda)',
	);
	$fixed = array(
		'IL.A' => 'Sin LED', 'IL.B' => 'Con LED', 'CR.A' => 'Cristales dobles', 'CR.B' => 'Cristales triples',
		'PA.0' => 'Sin aparcamiento', 'PA.A' => 'Plaza de aparcamiento', 'PA.B' => 'Doble plaza', 'TR.0' => 'Sin trastero', 'TR.A' => 'Trastero',
	);
	echo '<div class="wrap axr-wrap"><h1>Aixovall Residencial · Configurador</h1>';
	axr_admin_notice_saved();
	echo '<form method="post"><input type="hidden" name="axr_action" value="cfg">';
	wp_nonce_field( 'axr_cfg' );
	echo '<div class="axr-card"><p><label><input type="checkbox" name="cfg_enabled" value="1"' . checked( ! empty( $s['cfg_enabled'] ), true, false ) . '> <strong>Configurador activo</strong> (botón «Configurar» en la lista de viviendas)</label></p>';
	echo '<p><label><input type="checkbox" name="cfg_section" value="1"' . checked( ! empty( $s['cfg_section'] ), true, false ) . '> Mostrar la sección «Configura el teu pis al teu gust» en la página</label></p>';
	echo '<p><label><input type="checkbox" name="lead_form" value="1"' . checked( ! empty( $s['lead_form'] ), true, false ) . '> Permitir que el cliente envíe su configuración a API (se guarda en «Solicitudes» y llega por correo)</label></p></div>';

	echo '<h2>Superficie de suelo por tipología</h2><p class="axr-muted">El suplemento del suelo se calcula multiplicando el precio por m² por esta superficie (útil sin baños).</p><table class="axr-table" style="max-width:520px"><thead><tr><th>Tipología</th><th>Útil</th><th>m² de suelo</th></tr></thead><tbody>';
	foreach ( $types as $k => $t ) {
		echo '<tr><td><strong>' . esc_html( $t['label'] ) . '</strong></td><td>' . esc_html( number_format_i18n( $t['util'], 2 ) ) . ' m²</td><td><input type="number" step="0.01" min="0" name="types[' . esc_attr( $k ) . '][floor_m2]" value="' . esc_attr( $t['floor_m2'] ) . '"></td></tr>';
	}
	echo '</tbody></table>';

	echo '<h2>Opciones y precios</h2><p class="axr-muted">Precios en euros, sin IGI. La primera opción de cada grupo es la incluida de serie y no se puede desactivar. Las opciones desactivadas no se ofrecen al cliente.</p>';
	echo '<table class="axr-table"><thead><tr><th>Activa</th><th>Código</th><th>Nombre</th><th>Marca / referencia</th><th>Precio</th></tr></thead><tbody>';
	foreach ( $cat as $key => $grp ) {
		echo '<tr class="axr-group"><td colspan="5">' . esc_html( $names[ $key ] ) . ( $grp['sample'] ? ' <span class="axr-muted">· precios de ejemplo, pendientes de tarifa</span>' : '' ) . '</td></tr>';
		$first = true;
		foreach ( $grp['ops'] as $id => $op ) {
			$n = 'cat[' . esc_attr( $key ) . '][' . esc_attr( str_replace( '.', '_', $id ) ) . ']';
			echo '<tr><td>';
			if ( $first ) { echo '<input type="hidden" name="' . $n . '[on]" value="1"><span class="axr-muted">Incluida</span>'; }
			else { echo '<input type="checkbox" name="' . $n . '[on]" value="1"' . checked( $op['on'], true, false ) . '>'; }
			echo '</td><td><code>' . esc_html( '.0' === substr( $id, -2 ) ? '—' : $id ) . '</code></td><td>';
			if ( isset( $fixed[ $id ] ) ) { echo esc_html( $fixed[ $id ] ) . ' <span class="axr-muted">(traducido automáticamente)</span>'; }
			else { echo '<input type="text" name="' . $n . '[name]" value="' . esc_attr( $op['name'] ) . '">'; }
			echo '</td><td><input type="text" name="' . $n . '[brand]" value="' . esc_attr( $op['brand'] ) . '"></td>';
			echo '<td><input type="number" step="0.01" min="0" name="' . $n . '[price]" value="' . esc_attr( $op['price'] ) . '">' . ( $grp['per_m2'] ? ' €/m²' : ' €' ) . '</td></tr>';
			$first = false;
		}
	}
	echo '</tbody></table>';
	submit_button( 'Guardar configurador' );
	echo '</form>';
	echo '<form method="post" onsubmit="return confirm(\'¿Restaurar los nombres y precios originales del configurador?\');"><input type="hidden" name="axr_action" value="cfg_reset">';
	wp_nonce_field( 'axr_cfg_reset' );
	submit_button( 'Restaurar valores originales', 'secondary' );
	echo '</form></div>';
}

/* ---------- Ajustes ---------- */
function axr_admin_settings() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$s   = axr_settings();
	$msg = get_transient( 'axr_media_msg' );
	echo '<div class="wrap axr-wrap"><h1>Aixovall Residencial · Ajustes</h1>';
	axr_admin_notice_saved();
	if ( $msg ) { delete_transient( 'axr_media_msg' ); echo '<div class="notice notice-info is-dismissible"><p>' . esc_html( $msg ) . '</p></div>'; }
	axr_admin_links();
	echo '<form method="post"><input type="hidden" name="axr_action" value="settings">';
	wp_nonce_field( 'axr_settings' );
	echo '<table class="form-table" role="presentation"><tbody>';
	echo '<tr><th><label for="axr-phone">Teléfono de contacto</label></th><td><input id="axr-phone" class="regular-text" type="text" name="phone" value="' . esc_attr( $s['phone'] ) . '"></td></tr>';
	echo '<tr><th><label for="axr-email">Correo de contacto</label></th><td><input id="axr-email" class="regular-text" type="email" name="email" value="' . esc_attr( $s['email'] ) . '"><p class="description">Se muestra en la página.</p></td></tr>';
	echo '<tr><th><label for="axr-lead">Correo para solicitudes</label></th><td><input id="axr-lead" class="regular-text" type="email" name="lead_email" value="' . esc_attr( $s['lead_email'] ) . '"><p class="description">Aquí llegan las configuraciones que envían los clientes.</p></td></tr>';
	echo '<tr><th><label for="axr-igi">IGI (%)</label></th><td><input id="axr-igi" class="small-text" type="number" step="0.1" min="0" max="30" name="igi" value="' . esc_attr( $s['igi'] ) . '"> %<p class="description">Se suma en el resumen y en el PDF del configurador: vivienda, anexos y configuraciones.</p></td></tr>';
	echo '<tr><th>Financiación</th><td><label><input type="checkbox" name="fin_on" value="1"' . checked( ! empty( $s['fin_on'] ), true, false ) . '> Mostrar el bloque de financiación (MoraBanc, demo) en la página y en el resumen del configurador</label><p><input class="regular-text" type="url" name="fin_url" placeholder="https://… (vacío = correo a API)" value="' . esc_attr( $s['fin_url'] ) . '"></p><p class="description">Enlace del botón «Contactar con MoraBanc». Si lo dejas vacío, abre un correo a la dirección de contacto.</p></td></tr>';
	echo '<tr><th>Showroom v4</th><td><label><input type="checkbox" name="showroom" value="1"' . checked( ! empty( $s['showroom'] ), true, false ) . '> Mostrar el nuevo showroom como página pública</label><p class="description">Sin marcar, los administradores pueden verlo igualmente añadiendo <code>?showroom=1</code> a la dirección de la página. El configurador sigue siendo el actual.</p></td></tr>';
	echo '<tr><th>Buscadores</th><td><label><input type="checkbox" name="noindex" value="1"' . checked( ! empty( $s['noindex'] ), true, false ) . '> Pedir a Google que no indexe la página (recomendado mientras esté en este dominio provisional)</label></td></tr>';
	echo '</tbody></table>';
	submit_button( 'Guardar ajustes' );
	echo '</form>';

	axr_admin_hub_section();

	$video = axr_asset_exists( 'video/intro-720.mp4' );
	echo '<h2>Paquete de medios</h2><div class="axr-card"><p>Estado del vídeo de portada: <strong>' . ( $video ? 'instalado' : 'no instalado (la portada muestra la imagen fija)' ) . '</strong>.</p>';
	echo '<p class="axr-muted">Sube aquí un .zip con imágenes o vídeos para añadirlos o sustituirlos sin reinstalar el plugin. Debe respetar las carpetas del plugin (por ejemplo <code>video/intro-720.mp4</code> o <code>cfg/t7/co_base.webp</code>). Solo se aceptan .webp, .jpg, .png, .mp4 y .webm.</p>';
	echo '<form method="post" enctype="multipart/form-data"><input type="hidden" name="axr_action" value="media">';
	wp_nonce_field( 'axr_media' );
	echo '<input type="file" name="axr_zip" id="axr-zip" accept=".zip" required> ';
	submit_button( 'Importar paquete', 'secondary', 'submit', false );
	echo '</form></div></div>';
}
