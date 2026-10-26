// 3D background: glowing core, orbiting app "tiles", particle galaxy.
// If WebGL or the CDN fails, the CSS gradient behind the canvas stays visible.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  // MSAA is pointless on hi-DPI screens and costs a lot of fill-rate there
  renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.5, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove();
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 14);

const palette = {
  dark: { a: 0x54c5f8, b: 0x7c5cff, c: 0xff6bcb, fog: 0x05070d, particle: 0x9fb4ff },
  light: { a: 0x0b8fd6, b: 0x6440f0, c: 0xd63aa0, fog: 0xf4f6fc, particle: 0x6440f0 },
};
const theme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

scene.fog = new THREE.FogExp2(palette[theme()].fog, 0.035);

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const lightA = new THREE.PointLight(palette.dark.a, 60, 50);
lightA.position.set(6, 4, 8);
const lightB = new THREE.PointLight(palette.dark.b, 60, 50);
lightB.position.set(-6, -3, 6);
scene.add(lightA, lightB);

// ---------- Hero group (sits to the right on desktop) ----------
const hero = new THREE.Group();
scene.add(hero);

// Core: faceted glossy icosahedron + wireframe shell
const coreGeo = new THREE.IcosahedronGeometry(2.1, 1);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x1a1f3a, metalness: 0.6, roughness: 0.2,
  flatShading: true, emissive: palette.dark.b, emissiveIntensity: 0.15,
});
const core = new THREE.Mesh(coreGeo, coreMat);
hero.add(core);

const shellMat = new THREE.MeshBasicMaterial({ color: palette.dark.a, wireframe: true, transparent: true, opacity: 0.35 });
const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.9, 1), shellMat);
hero.add(shell);

// Torus rings
const ringMat1 = new THREE.MeshBasicMaterial({ color: palette.dark.a, transparent: true, opacity: 0.55 });
const ringMat2 = new THREE.MeshBasicMaterial({ color: palette.dark.c, transparent: true, opacity: 0.4 });
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4, 0.018, 6, 96), ringMat1);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.012, 6, 96), ringMat2);
ring1.rotation.x = Math.PI / 2.4;
ring2.rotation.x = Math.PI / 1.8;
ring2.rotation.y = 0.4;
hero.add(ring1, ring2);

// Orbiting rounded "app tiles"
const tiles = [];
const tileGeo = new THREE.BoxGeometry(0.55, 0.55, 0.12);
const tileColors = [palette.dark.a, palette.dark.b, palette.dark.c, 0x2ee59d, 0xffb86b];
tileColors.forEach((col, i) => {
  const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, metalness: 0.3, roughness: 0.3 });
  const m = new THREE.Mesh(tileGeo, mat);
  m.userData = { r: 4 + (i % 2) * 0.8, speed: 0.25 + i * 0.05, offset: (i / tileColors.length) * Math.PI * 2, tilt: (i % 2 ? 1 : -1) * 0.35 };
  tiles.push(m);
  hero.add(m);
});

// ---------- Particle galaxy ----------
const COUNT = window.innerWidth < 760 ? 900 : 2000;
const pos = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) {
  const r = 6 + Math.pow(Math.random(), 0.7) * 38;
  const arm = (i % 3) * ((Math.PI * 2) / 3);
  const angle = arm + r * 0.18 + (Math.random() - 0.5) * 0.9;
  pos[i * 3] = Math.cos(angle) * r;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 10 * (1 - r / 50);
  pos[i * 3 + 2] = Math.sin(angle) * r - 10;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const starMat = new THREE.PointsMaterial({
  color: palette.dark.particle, size: 0.07, transparent: true, opacity: 0.85, depthWrite: false,
  blending: THREE.AdditiveBlending, sizeAttenuation: true,
});
const stars = new THREE.Points(starGeo, starMat);
stars.rotation.x = 0.35;
scene.add(stars);

// ---------- Theme ----------
const applyTheme = () => {
  const p = palette[theme()];
  const light = theme() === 'light';
  scene.fog.color.setHex(p.fog);
  shellMat.color.setHex(p.a);
  ringMat1.color.setHex(p.a);
  ringMat2.color.setHex(p.c);
  coreMat.emissive.setHex(p.b);
  coreMat.color.setHex(light ? 0xdfe4ff : 0x1a1f3a);
  starMat.color.setHex(p.particle);
  starMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
  starMat.opacity = light ? 0.5 : 0.85;
  starMat.needsUpdate = true;
  lightA.color.setHex(p.a);
  lightB.color.setHex(p.b);
};
applyTheme();
window.addEventListener('themechange', applyTheme);

// ---------- Layout ----------
const layout = () => {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // On desktop the phone mockup lives on the right, so push the 3D core behind it.
  if (w >= 960) { hero.position.set(4.2, 0.2, -2); hero.scale.setScalar(1); }
  else { hero.position.set(1.5, -6, -10); hero.scale.setScalar(0.7); }
};
layout();
window.addEventListener('resize', layout);

// ---------- Interaction ----------
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

let scrollY = window.scrollY;
window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

// ---------- Loop ----------
const clock = new THREE.Clock();
let running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) { clock.getDelta(); requestAnimationFrame(tick); }
});

function tick() {
  if (!running) return;
  const t = clock.getElapsedTime();
  const vh = window.innerHeight;
  const sp = scrollY / vh; // scroll progress in viewport heights

  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  core.rotation.x = t * 0.15 + sp * 0.6;
  core.rotation.y = t * 0.22 + sp * 0.9;
  shell.rotation.x = -t * 0.08;
  shell.rotation.y = -t * 0.12 - sp * 0.4;
  ring1.rotation.z = t * 0.2;
  ring2.rotation.z = -t * 0.14;

  tiles.forEach((m) => {
    const { r, speed, offset, tilt } = m.userData;
    const a = t * speed + offset;
    m.position.set(Math.cos(a) * r, Math.sin(a * 1.3) * 0.8 + Math.sin(a) * tilt * r * 0.4, Math.sin(a) * r);
    m.rotation.x = t * 0.8 + offset;
    m.rotation.y = t * 0.6;
  });

  // hero drifts back and up as you scroll, so sections stay readable
  // Once the hero is scrolled well past, skip drawing it entirely
  hero.visible = sp < 1.6;
  hero.rotation.y = mouse.x * 0.35;
  hero.rotation.x = mouse.y * 0.2;
  const fade = Math.max(0, 1 - sp * 0.6);
  hero.children.forEach((c) => { if (c.material && 'opacity' in c.material && c.material.transparent) c.material.opacity = c.userData.baseOpacity * fade; });
  const desk = window.innerWidth >= 960;
  hero.position.y = (desk ? 0.2 : -6) + sp * 3;
  hero.position.z = (desk ? -2 : -10) - sp * 8; // recede into the fog

  stars.rotation.y = t * 0.015 + sp * 0.25;
  camera.position.x = mouse.x * 0.8;
  camera.position.y = -mouse.y * 0.5 - sp * 0.8;
  camera.lookAt(0, -sp * 0.8, 0);

  renderer.render(scene, camera);
  if (!reduceMotion) requestAnimationFrame(tick);
}

hero.children.forEach((c) => { c.userData.baseOpacity = c.material?.opacity ?? 1; });
requestAnimationFrame(tick);

// WebGL is up — hide the static fallback gradient's heavy glow a bit so they don't stack
document.querySelector('.bg-fallback')?.style.setProperty('opacity', '0.6');
