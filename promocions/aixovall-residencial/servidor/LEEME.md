# Versiones publicadas en backend.apimi.com que no salieron de este repositorio

- **3.4.0** (9/11/2026): publicada directamente en el servidor desde otra sesión (dossier PDF + WhatsApp, protección de archivos que faltan, animación iShowi…). Su código **no está en este repositorio**: el repositorio se quedó en la 2.9.0. Hay que traerla del servidor antes de la próxima versión.
- **3.4.1** (10/11/2026): sobre la 3.4.0 del servidor solo cambian dos cosas:
  - `inc/data.php`: se añade al final el bloque `3.4.1-data-bloque-hub-aviso.php` (aviso inmediato de iShowi Hub 2.4.1 en `POST /wp-json/axr/v1/hub-aviso`, que valida la clave de la promoción en `X-iShowi-Clave`, vuelve a leer el Hub y vacía LiteSpeed; y la página con caché máxima de 5 minutos).
  - `aixovall-residencial.php`: `Version` y `AXR_VERSION` pasan a 3.4.1.
  - Copia del `data.php` 3.4.0 original en el servidor: `wp-content/axr-copia-data-3.4.0-ocrl9x2b.php.txt` (para volver atrás: renombrarla a `wp-content/plugins/aixovall-residencial/inc/data.php`).
  - Subida sin dejar el archivo vacío en ningún momento: archivo temporal y después renombrado encima del original.
- **3.5.0** (10/11/2026): ya sale de este repositorio (el servidor tenía la 3.4.1 idéntica). Plazas de aparcamiento de iShowi Hub 2.5 en el configurador:
  - `inc/data.php`: `axr_hub_data()` guarda también las plazas (`plazas`: referencia, modalidad, precio, estado, zona en %) y el plano (`plano`); nueva `axr_parking_boot()` y ruta pública `GET /wp-json/axr/v1/plazas` (disponibilidad al momento, sin caché).
  - `templates/configurator.php`: `window.AXC.parking`.
  - `assets/js/cfg.js`: al elegir «Plaça d'aparcament» o «Plaça doble» se abre el plano del sótano con las plazas libres (verde), reservadas (naranja) y vendidas; se elige una plaza (individual o doble, una por vivienda), su precio va a los anexos, al resumen, al PDF y a la solicitud. Una modalidad sin plazas libres sale como «Exhaurides». Textos en CA, ES, FR y EN.
  - Las plazas y el plano se dan de alta en el Hub (pestaña Aparcamientos de la promoción).
- **3.6.0** (10/11/2026): estados de la web alineados con iShowi Hub 2.5.2 — Aparaulat (bloqueo de 72 h de una agencia), Reserva tècnica (reserva de 10.000 €), Reserva confirmada (arras) y Venut. Leyenda encima del listado; las viviendas no disponibles salen sin precio (también en los datos de la página y en el selector del configurador); en «Aparaulat» los botones de plano, 3D, configurador y WhatsApp salen atenuados y no se pueden usar. El panel admite los cinco estados.
- **3.6.1** (10/11/2026): segells d'estat (Aparaulat, Reserva tècnica, Reserva confirmada, Venut) al llistat i a la llegenda; en «Aparaulat» el preu es veu difuminat (el Hub 2.5.3 el torna a enviar); en reserva o venut, sense preu.
- **3.6.2** (10/11/2026): «Des de …» (portada, descripció i dades estructurades) amb el preu disponible més baix; a la línia temporal, «Llicència del comú» passa a «Aprovació del comú» (4 idiomes).
