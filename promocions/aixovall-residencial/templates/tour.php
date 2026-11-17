<?php
/**
 * v4.2 · Tour virtual 360° d'una tipologia (/aixovall-residencial/tour-virtual/t4/).
 * Panoràmiques equirectangulars renderitzades des del model del pis pilot (assets/tour/<tipus>/).
 * Visor WebGL propi, sense dependències: arrossegar per mirar, punts al terra per moure's
 * entre estances, minimapa i llista d'estances.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$tt_dir  = AXR_DIR . 'assets/tour/' . $tour . '/';
$tt_url  = AXR_URL . 'assets/tour/' . $tour . '/';
$tt_data = json_decode( (string) @file_get_contents( $tt_dir . 'tour.json' ), true );
if ( ! is_array( $tt_data ) || empty( $tt_data['scenes'] ) ) {
	wp_safe_redirect( axr_url( $lang ) . '#habitatges', 302 );
	exit;
}
$tt_ver   = defined( 'AXR_VERSION' ) ? AXR_VERSION : '1';
$tt_back  = axr_url( $lang ) . '#habitatges';
$tt_title = isset( $tt_data['title'] ) ? $tt_data['title'] : 'Tour virtual';
?><!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?php echo esc_html( $tt_title ); ?> · Aixovall Residencial</title>
<meta name="robots" content="noindex">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#111;color:#fff;font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden;-webkit-tap-highlight-color:transparent}
#gl{position:fixed;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
#gl.drag{cursor:grabbing}
#fade{position:fixed;inset:0;background:#111;opacity:1;pointer-events:none;transition:opacity .45s}
#hs{position:fixed;inset:0;pointer-events:none;overflow:hidden}
.hp{position:absolute;left:0;top:0;pointer-events:auto;border:0;background:none;cursor:pointer;transform-origin:50% 50%;padding:0}
.hp i{display:block;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;border:3px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 2px rgba(0,0,0,.25),inset 0 0 0 2px rgba(0,0,0,.12);transform:scaleY(.42);transition:background .2s}
.hp:after{content:'';position:absolute;left:-36px;top:-24px;width:72px;height:48px}
.hp:hover i,.hp:focus-visible i{background:rgba(255,255,255,.55)}
.hp span{position:absolute;left:0;top:-58px;transform:translateX(-50%);white-space:nowrap;font-size:13px;font-weight:600;background:rgba(17,17,17,.72);padding:4px 10px;border-radius:99px;opacity:0;transition:opacity .2s}
.hp:hover span,.hp:focus-visible span,.hp.near span{opacity:1}
header{position:fixed;left:12px;right:12px;top:max(12px,env(safe-area-inset-top));display:flex;gap:8px;align-items:center;pointer-events:none}
header>*{pointer-events:auto}
.pill{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:99px;border:0;background:rgba(17,17,17,.72);color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.pill:hover{background:rgba(17,17,17,.9)}
.pill.round{width:42px;padding:0;justify-content:center}
.ttl{flex:1;min-width:0;padding:0 6px;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.ttl b{display:block;font-size:16px}.ttl small{display:block;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav{position:fixed;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:0 12px;pointer-events:none}
nav button{pointer-events:auto;height:38px;padding:0 14px;border-radius:99px;border:0;background:rgba(17,17,17,.68);color:#fff;font:inherit;font-size:14px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
nav button.on{background:#fff;color:#111;font-weight:600}
#map{position:fixed;right:12px;top:66px;width:190px;background:rgba(17,17,17,.68);border-radius:14px;padding:10px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
#map svg{display:block;width:100%;height:auto}
#map .d{cursor:pointer}
#map .d circle{fill:#fff;opacity:.55}
#map .d.on circle{opacity:1;fill:#c8a26a}
#map text{fill:#fff;font-size:9px;opacity:.9}
#map .cone{fill:#c8a26a;opacity:.35}
#note{position:fixed;left:12px;bottom:62px;max-width:380px;font-size:12px;opacity:.82;text-shadow:0 1px 3px rgba(0,0,0,.7)}
#load{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;pointer-events:none}
#load .bar{width:180px;height:3px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden}#load .bar i{display:block;height:100%;width:0;background:#fff;transition:width .2s}
#help{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(17,17,17,.72);padding:12px 18px;border-radius:12px;text-align:center;pointer-events:none;transition:opacity .6s}
#gyro[hidden]{display:none}#gyro.on{background:#fff;color:#111}
@media (max-width:700px){#map{width:130px;top:62px}#note{display:none}.ttl small{display:none}nav button{height:34px;padding:0 11px;font-size:13px}}
/* mòbil en horitzontal: la vista ocupa tota la pantalla, estances en una sola fila desplaçable i minimapa petit */
@media (orientation:landscape) and (max-height:520px){header{left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));top:8px}.pill{height:38px}.pill.round{width:38px}#map{width:120px;top:54px;right:max(12px,env(safe-area-inset-right));padding:6px}#note{display:none}.ttl small{display:block}
 nav{bottom:max(6px,env(safe-area-inset-bottom));flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;pointer-events:auto;padding:0 max(12px,env(safe-area-inset-left))}nav::-webkit-scrollbar{display:none}nav button{flex:none;height:32px;padding:0 11px;font-size:13px}nav:before,nav:after{content:'';margin:auto}}
</style>
</head>
<body>
<canvas id="gl" aria-label="Vista panoràmica 360°. Arrossega per mirar al voltant."></canvas>
<div id="hs"></div>
<div id="fade"></div>
<div id="load"><span id="lt">Carregant el tour…</span><div class="bar"><i id="lb"></i></div></div>
<header>
	<a class="pill round" href="<?php echo esc_url( $tt_back ); ?>" id="back" aria-label="Tornar a la web" title="Tornar a la web"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></a>
	<div class="ttl"><b><?php echo esc_html( $tt_title ); ?></b><small id="room"></small></div>
	<button class="pill round" id="gyro" hidden aria-pressed="false" aria-label="Mirar movent el telèfon" title="Mirar movent el telèfon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="5" width="8" height="14" rx="1.6"/><path d="M3.5 9.5a8 8 0 0 0 0 5M20.5 9.5a8 8 0 0 1 0 5"/></svg></button>
	<button class="pill round" id="fs" aria-label="Pantalla completa" title="Pantalla completa"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
</header>
<div id="map" aria-label="Minimapa"></div>
<p id="note"><?php echo esc_html( isset( $tt_data['note'] ) ? $tt_data['note'] : '' ); ?></p>
<nav id="rooms" aria-label="Estances"></nav>
<div id="help">Arrossega per mirar · Toca els cercles per moure’t</div>
<script>
(() => {
const T = <?php echo wp_json_encode( $tt_data ); ?>, BASE = <?php echo wp_json_encode( $tt_url ); ?>, VER = <?php echo wp_json_encode( $tt_ver ); ?>;
const $ = s => document.querySelector(s), cv = $('#gl'), hs = $('#hs');
const FLOOR = T.floor, S = T.scenes, byId = id => S.find(s => s.id === id);
const gl = cv.getContext('webgl', {antialias:false, preserveDrawingBuffer:false});
if (!gl){ $('#lt').textContent = 'Aquest navegador no pot mostrar el tour 360°.'; return; }
/* Panoràmica equirectangular de Blender: centre = davant de la càmera (+Y), dreta = +X, amunt = +Z. */
const vs = 'attribute vec2 p;varying vec2 q;void main(){q=p;gl_Position=vec4(p,0.,1.);}';
const fs = 'precision highp float;varying vec2 q;uniform sampler2D t;uniform float yaw,pitch,tx,ty;const float PI=3.14159265;'
 + 'void main(){vec3 d=normalize(vec3(q.x*tx,1.,q.y*ty));' // x dreta, y endavant, z amunt
 + 'float cp=cos(pitch),sp=sin(pitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);'
 + 'float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.y*sy,-d.x*sy+d.y*cy,d.z);'
 + 'float u=.5+atan(d.x,d.y)/(2.*PI);float v=.5+asin(clamp(d.z,-1.,1.))/PI;gl_FragColor=texture2D(t,vec2(u,v));}';
const sh = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return s; };
const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
const U = n => gl.getUniformLocation(pr, n), uYaw = U('yaw'), uPitch = U('pitch'), uTx = U('tx'), uTy = U('ty');
const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
[[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER, gl.LINEAR],[gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(a => gl.texParameteri(gl.TEXTURE_2D, a[0], a[1]));
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
const maxT = gl.getParameter(gl.MAX_TEXTURE_SIZE);

let yaw = 0, pitch = -0.08, fov = 1.45, cur = null, dirty = true, W = 0, H = 0, dpr = 1;
const imgs = {};
function load(id, onp){ if (imgs[id]) return imgs[id];
  return imgs[id] = new Promise((ok, ko) => { const x = new XMLHttpRequest(); x.open('GET', BASE + id + '.jpg?v=' + VER); x.responseType = 'blob';
    x.onprogress = e => onp && e.total && onp(e.loaded / e.total);
    x.onload = () => { if (x.status !== 200) return ko(new Error('HTTP ' + x.status)); const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = URL.createObjectURL(x.response); }; x.onerror = ko; x.send(); }); }
function resize(){ dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; gl.viewport(0, 0, cv.width, cv.height); dirty = true; }
addEventListener('resize', resize); resize();
const tans = () => { const ty = Math.tan(fov / 2) * (W > H ? 1 : 1.25), tx = ty * W / H; return [tx, ty]; };

/* direcció del món → píxel de pantalla (mateixa transformació que el shader, invertida) */
function project(dx, dy, dz){ const cy = Math.cos(yaw), sy = Math.sin(yaw); let x = dx * cy - dy * sy, y = dx * sy + dy * cy, z = dz;
  const cp = Math.cos(pitch), sp = Math.sin(pitch); const y2 = y * cp + z * sp, z2 = -y * sp + z * cp; if (y2 <= 0.05) return null;
  const [tx, ty] = tans(); return [W / 2 + (x / y2) / tx * W / 2, H / 2 - (z2 / y2) / ty * H / 2, y2]; }

function hotspots(){ hs.innerHTML = ''; if (!cur) return; S.forEach(s => { if (s.id === cur.id) return; const b = document.createElement('button'); b.className = 'hp'; b.dataset.id = s.id; b.setAttribute('aria-label', 'Anar a ' + s.label); b.innerHTML = '<i></i><span>' + s.label + '</span>'; b.onclick = () => go(s.id); hs.appendChild(b); }); }
function placeHS(){ if (!cur) return; hs.querySelectorAll('.hp').forEach(b => { const s = byId(b.dataset.id); const dx = s.pos[0] - cur.pos[0], dy = s.pos[1] - cur.pos[1], dz = FLOOR - cur.pos[2]; const d = Math.hypot(dx, dy);
  const p = project(dx, dy, dz); if (!p){ b.style.display = 'none'; return; } b.style.display = '';
  const k = Math.max(.35, Math.min(1.25, 2.2 / d)); b.style.transform = `translate(${p[0]}px,${p[1]}px)`; b.firstChild.style.transform = `scale(${k},${k * .42})`; b.lastChild.style.top = (-30 * k - 26) + 'px'; b.style.opacity = d > 6.5 ? .55 : 1; b.classList.toggle('near', Math.abs(p[0] - W / 2) < W * .18); }); }

function map(){ const xs = S.map(s => s.pos[0]), ys = S.map(s => s.pos[1]); const x0 = Math.min(...xs) - 1.2, x1 = Math.max(...xs) + 3.4, y0 = Math.min(...ys) - 1.6, y1 = Math.max(...ys) + 1.6;
  const w = 200, h = w * (y1 - y0) / (x1 - x0), X = x => (x - x0) / (x1 - x0) * w, Y = y => h - (y - y0) / (y1 - y0) * h;
  $('#map').innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Situació de les estances"><path id="cone" class="cone" d=""/>` + S.map(s => `<g class="d" data-id="${s.id}" transform="translate(${X(s.pos[0]).toFixed(1)},${Y(s.pos[1]).toFixed(1)})"><circle r="5"/><text x="7" y="3">${s.short || s.label}</text></g>`).join('') + '</svg>';
  $('#map').onclick = e => { const g = e.target.closest('.d'); if (g) go(g.dataset.id); };
  map.X = X; map.Y = Y; }
function cone(){ if (!cur || !map.X) return; const cx = map.X(cur.pos[0]), cy = map.Y(cur.pos[1]), r = 26, a = fov * .5 * (W / H);
  const pt = t => [cx + Math.sin(t) * r, cy - Math.cos(t) * r]; const p1 = pt(yaw - Math.min(a, 1.2)), p2 = pt(yaw + Math.min(a, 1.2));
  $('#cone').setAttribute('d', `M${cx},${cy}L${p1[0].toFixed(1)},${p1[1].toFixed(1)}A${r},${r} 0 0 1 ${p2[0].toFixed(1)},${p2[1].toFixed(1)}Z`); }

/* ---------- mirar movent el telèfon (giroscopi) ---------- */
const gy = {on:false, dev:null, off:0};
function setYaw(v){ yaw = v; if (gy.on && gy.dev != null) gy.off = v - gy.dev; }
function onOri(e){ if (!gy.on || e.alpha == null || e.beta == null) return; const R = Math.PI / 180, a = e.alpha * R, b = e.beta * R, g = (e.gamma || 0) * R;
  const sA = Math.sin(a), cA = Math.cos(a), sB = Math.sin(b), cB = Math.cos(b), sG = Math.sin(g), cG = Math.cos(g);
  /* cap on apunta la càmera del darrere (eix −Z del dispositiu) en coordenades del món: val igual en vertical i en horitzontal */
  const x = -(cA * sG + sA * sB * cG), y = -(sA * sG - cA * sB * cG), z = -(cB * cG);
  const dv = Math.atan2(x, y), pv = Math.asin(Math.max(-1, Math.min(1, z)));
  if (gy.dev == null) gy.off = yaw - dv; // en activar-lo, la vista no salta
  gy.dev = dv; yaw = dv + gy.off; pitch = Math.max(-1.45, Math.min(1.45, pv)); dirty = true; }
function gyro(on){ gy.on = on; gy.dev = null; const b = $('#gyro'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
  if (on) addEventListener('deviceorientation', onOri); else removeEventListener('deviceorientation', onOri); }
const DOE = window.DeviceOrientationEvent;
if (DOE && (matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window)){ $('#gyro').hidden = false; $('#help').textContent = 'Arrossega per mirar · Toca els cercles per moure’t · Activa el mòbil per mirar movent-lo';
  $('#gyro').onclick = async () => { if (gy.on) return gyro(false);
    try { if (typeof DOE.requestPermission === 'function'){ const r = await DOE.requestPermission(); if (r !== 'granted'){ const h = $('#help'); h.textContent = 'Cal permetre l’accés al moviment del telèfon'; h.style.opacity = 1; setTimeout(() => h.style.opacity = 0, 3500); return; } } } catch(e){ return; }
    gyro(true); setTimeout(() => { if (gy.on && gy.dev == null){ gyro(false); const h = $('#help'); h.textContent = 'Aquest dispositiu no té sensor de moviment'; h.style.opacity = 1; setTimeout(() => h.style.opacity = 0, 3500); } }, 1500); }; }
addEventListener('orientationchange', () => setTimeout(resize, 250));
let busy = false;
async function go(id, first){ if (busy || (cur && cur.id === id)) return; busy = true; const s = byId(id);
  if (!first){ $('#fade').style.opacity = 1; }
  let im; try { im = await load(id, f => { $('#lb').style.width = Math.round(f * 100) + '%'; }); } catch(e){ $('#lt').textContent = 'No s’ha pogut carregar la imatge.'; busy = false; return; }
  if (!first) await new Promise(r => setTimeout(r, 260));
  /* en entrar a una estança, mirem en la direcció del moviment (com Matterport) */
  if (cur && !first){ setYaw(Math.atan2(s.pos[0] - cur.pos[0], s.pos[1] - cur.pos[1])); } else if (s.yaw != null) setYaw(s.yaw);
  if (s.pitch != null && first) pitch = s.pitch;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
  cur = s; $('#room').textContent = s.label; document.title = s.label + ' · ' + T.title + ' · Aixovall Residencial';
  document.querySelectorAll('#rooms button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  document.querySelectorAll('#map .d').forEach(g => g.classList.toggle('on', g.dataset.id === id));
  try { history.replaceState(null, '', '#' + id); } catch(e){}
  hotspots(); dirty = true; $('#fade').style.opacity = 0; $('#load').style.display = 'none'; busy = false;
  S.forEach(o => { if (o.id !== id) setTimeout(() => load(o.id).catch(() => { delete imgs[o.id]; }), 400); }); }

function frame(){ requestAnimationFrame(frame); if (!dirty || !cur) return; dirty = false; const [tx, ty] = tans();
  gl.uniform1f(uYaw, yaw); gl.uniform1f(uPitch, pitch); gl.uniform1f(uTx, tx); gl.uniform1f(uTy, ty); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); placeHS(); cone(); }

/* interacció: arrossegar, roda / pessic per fer zoom, fletxes del teclat */
const pts = new Map(); let lx = 0, ly = 0, moved = 0, pinch = 0;
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); lx = e.clientX; ly = e.clientY; moved = 0; cv.classList.add('drag'); $('#help').style.opacity = 0; });
cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
  if (pts.size === 2){ const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(pinch / d); pinch = d; return; }
  const [, ty] = tans(); const k = 2 * ty / H; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  if (gy.on && gy.dev != null){ gy.off -= dx * k; yaw = gy.dev + gy.off; dirty = true; return; } // amb el moviment actiu, el dit només gira a dreta i esquerra
  yaw -= dx * k; pitch = Math.max(-1.45, Math.min(1.45, pitch + dy * k)); dirty = true; });
const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) cv.classList.remove('drag'); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
/* clic sense arrossegar al terra: anar a l'estança més propera en aquella direcció */
cv.addEventListener('click', e => { if (moved > 6 || !cur) return; let best = null, bd = 1e9; hs.querySelectorAll('.hp').forEach(b => { if (b.style.display === 'none') return; const r = b.getBoundingClientRect(); const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY); if (d < bd){ bd = d; best = b; } }); if (best && bd < 90) go(best.dataset.id); });
function zoom(f){ fov = Math.max(.55, Math.min(1.9, fov * f)); dirty = true; }
cv.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); }, {passive:false});
addEventListener('keydown', e => { const k = {ArrowLeft:[-.08,0], ArrowRight:[.08,0], ArrowUp:[0,.06], ArrowDown:[0,-.06]}[e.key]; if (!k) return; yaw += k[0]; pitch = Math.max(-1.45, Math.min(1.45, pitch + k[1])); dirty = true; });
$('#fs').onclick = () => { const d = document; if (d.fullscreenElement) d.exitFullscreen(); else (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement); };
/* si s'ha obert en una pestanya nova des de la web, «tornar» la tanca */
$('#back').onclick = e => { if (window.opener && !window.opener.closed){ e.preventDefault(); try { window.opener.focus(); } catch(_){} window.close(); } };
setTimeout(() => $('#help').style.opacity = 0, 5000);

$('#rooms').innerHTML = S.map(s => `<button data-id="${s.id}">${s.label}</button>`).join('');
$('#rooms').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.id); };
map(); frame();
const h0 = location.hash.slice(1); go(byId(h0) ? h0 : S[0].id, true);
})();
</script>
</body>
</html>
