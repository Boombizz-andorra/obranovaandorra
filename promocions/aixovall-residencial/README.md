# Aixovall Residencial · plugin de WordPress

Plugin de la promoció **Aixovall Residencial** (Sant Julià de Lòria): pàgina de la promoció en 4 idiomes, configurador d'acabats per habitatge, formulari de sol·licituds i panell de gestió (preus, reserves, opcions).

- Instal·lat a: `backend.apimi.com/wp-content/plugins/aixovall-residencial/`
- Es publica a: <https://apimi.com/aixovall-residencial/> (passthrough del frontend Astro, repo `WEDEVELAPPS/apimi`)
- Configurador: `apimi.com/aixovall-residencial/configurador/<habitatge>/`
- Disseny i desenvolupament: BoomBizz Solucions Comercials

## Què hi ha al repositori

Tot el codi del plugin (PHP, JavaScript, CSS, traduccions i la llibreria jsPDF 2.5.1 de `assets/vendor/`).

**No hi ha les imatges ni els vídeos.** Són al servidor:

- `wp-content/plugins/aixovall-residencial/assets/img/`, `assets/cfg/`, `assets/video/`… (imatges del plugin)
- `wp-content/uploads/aixovall-residencial/` (paquet de mitjans pujat des de *Aixovall › Ajustes*)

Per reinstal·lar el plugin des de zero cal afegir-hi la carpeta `assets` sencera del servidor.

## Branques

| Branca | Contingut |
|---|---|
| `main` | Versió **publicada** a la web. |
| `v2.7.0-ishowi-marca` | Animació i segell iShowi, enllaç a iShowi Hub (ja fusionada a `main`). |
| `v2.5.1-pdf` | Arreglo del PDF i botó «Descargar PDF» (ja fusionada a `main`). |

## Com es publica un canvi

1. Fer el canvi en una branca i revisar-lo.
2. Copiar els fitxers modificats al servidor (editor de plugins del WordPress o gestor de fitxers de Hostinger).
3. Si canvia la versió (`AXR_VERSION`), el plugin purga la caché de LiteSpeed sol en carregar-se.
4. Comprovar a apimi.com (el navegador pot tenir 5 minuts de caché).
5. Fusionar la branca a `main` perquè `main` sigui sempre el que hi ha publicat.

## Historial

- **2.5.0** — versió publicada a 4 de novembre de 2026 (primera còpia en aquest repositori).
- **2.6.0** — 6 de novembre de 2026. Enllaç amb iShowi Hub: a *Aixovall › Ajustes › iShowi Hub* es posen l'adreça de l'API del Hub, el número de promoció i la clau (la dona BoomBizz des de la fitxa de la promoció al Hub). Amb l'enllaç actiu, l'estat i el preu de cada habitatge i el PVP dels extres publicats es llegeixen del Hub cada 5 minuts i manen sobre el panell; si el Hub no respon, es fan servir les últimes dades rebudes. El codi és a `inc/data.php` (funcions `axr_hub_*`).
- **2.7.1** — publicada el 6 de novembre de 2026: enllaç amb iShowi Hub activat a backend.apimi.com (promoció 1, clau del Hub); `inc/data.php` i `inc/admin.php` de la 2.6.0 pujats amb l'editor de plugins. apimi.com llegeix estats i preus del Hub.
- **2.7.0** — 6 de novembre de 2026. Marca iShowi: animació d'entrada d'iShowi en obrir el configurador i l'editor del plànol (una vegada per visita; es pot saltar amb un clic) i segell «iShowi by BoomBizz» al racó superior dret, amb enllaç a boombizzandorra.com. Al peu de la landing, botó «Accedir a iShowi Hub» (boombizzandorra.com/hub/) en 4 idiomes. El pop-up d'avís de demo surt quan acaba l'animació. Publicada el 6 de novembre de 2026; amb aquesta publicació també es van completar els fitxers de la 2.6.0 que faltaven al servidor (`inc/admin.php`, secció iShowi Hub dels Ajustes). Codi: `assets/js/cfg.js` (funcions `ishowiBadge` i `ishowiIntro`), `assets/css/cfg.css`, `templates/page.php` i `assets/css/page.css`.
- **2.5.1** — publicada el 4 de novembre de 2026.
  - El botó «Descarregar PDF» del configurador fallava sempre a apimi.com: les imatges es dibuixen en un canvas i, en venir de `backend.apimi.com`, el navegador el bloquejava (SecurityError). Ara es carreguen amb CORS (`crossOrigin`) i el plugin crea `assets/.htaccess` perquè el servidor ho permeti.
  - Cada sol·licitud porta un enllaç «Descargar PDF» (al correu i a *Aixovall › Solicitudes*) que obre la configuració del client i en descarrega el PDF amb les seves dades, sense enviar cap sol·licitud nova.
- **2.8.0** — publicada el 6 de novembre de 2026. Nou calendari de pagaments: reserva de 10.000 € dins del 10 % d'arres · 10 % fonaments · 20 % sostre · 20 % tancament de façana · 40 % notari (landing, configurador i PDF, 4 idiomes).
- **2.9.0** — publicada el 6 de novembre de 2026. Secció de pagaments en línia temporal vertical (alçada segons el percentatge, barra d’acumulat, bloc «60 % abans de les claus»).

## v4 · Showroom (branca v4-showroom, en proves)

- El showroom nou es genera amb `python3 tools/build_showroom.py` a partir de `showroom-src/index.html` (còpia de l'artefacte de demo). No editeu a mà `templates/showroom.php` ni `assets/sr/showroom.*`: canvieu la font o els pegats de l'script i torneu-lo a executar.
- Dades: els pisos i els estats surten de `axr_homes()` (Hub inclòs). Mateixa regla de preu que la pàgina actual: visible només si està disponible; aparaulat, difuminat.
- Configurador: es manté l'actual (`/configurador/<id>/`). Les entrades del showroom cap al configurador hi porten.
- Activació: casella «Showroom v4» al panell. Sense marcar, els administradors el poden veure amb `?showroom=1`.
- Recursos a `assets/sr/` (imatges, vistes, vídeos). Model 3D del Sol: `assets/sr/model/aixovall.glb` (2,7 MB, Draco), generat des de l'FBX d'ArchiCAD `261005_Sant_Julia_v4.fbx` amb FBX2glTF + gltf-transform (sense mobiliari, cotxes ni plantes interiors; simplificat al 30 %). Visor three.js r147 i descodificador Draco servits des de `assets/sr/vendor/` (sense CDN).
- Idiomes: català per defecte; castellà, francès i anglès a `/es/`, `/fr/`, `/en/`. Els textos es tradueixen amb `showroom-src/i18n.tsv` (columnes ca · es · fr · en; `{n}` = número, `{u}` = nom de pis) → `lang/showroom-*.json`, i `assets/sr/i18n.js` els aplica a la pàgina. La primera visita a la versió catalana s'adapta a l'idioma del navegador (no als cercadors); l'elecció al menú es recorda.
- Pendent: mode agent (Hub 2.5).
