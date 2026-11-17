# obranovaandorra.com · plugin de la web

Plugin de WordPress de la web **Obra Nova Andorra** de BoomBizz (Hostinger, compte info@boombizzandorra.com).
Cada promoció és una carpeta de `promocions/` que funciona com un plugin propi: pàgina pública (showroom),
configurador d'acabats, panell a l'escriptori i connexió pròpia a l'iShowi Hub (boombizzandorra.com).

| Promoció | Carpeta | Adreça |
|---|---|---|
| Aixovall Residencial | `promocions/aixovall-residencial` | `/aixovall-residencial/` (ca), `/aixovall-residencial/es/`, `/fr/`, `/en/` |

## Desplegament
- Hostinger clona aquest repositori a `wp-content/plugins/obranovaandorra` (Git del hosting). Cada desplegament fa *pull* de la branca.
- Branca `main` = producció. Les proves es fan en una branca a part abans de fusionar.
- Activar el plugin «Obra Nova Andorra» a l'escriptori un sol cop.

## Afegir una promoció
1. Carpeta `promocions/<slug>/` amb el seu fitxer principal.
2. Una línia a `ona_promocions()` a `obranovaandorra.php`.

## Història
Aixovall Residencial ve del repositori `carles-apimi/aixovall-residencial` (branca `v4-showroom`, v4.0.0-beta.2).
Les instruccions pròpies de cada promoció són al seu README.
