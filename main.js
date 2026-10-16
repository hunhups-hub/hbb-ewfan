/* =========================================================================
   HAPPY BIRTHDAY แอนฟิว (Anfield) — Cinematic 3D Scrollytelling
   Three.js + GSAP ScrollTrigger + Lenis + canvas-confetti + Web Audio API
   100% procedural: no photos, no image files, no audio files.
   ========================================================================= */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* -------------------------------------------------------------------------
   CENTRALIZED CONFIGURATION — edit this to personalise the experience
   ------------------------------------------------------------------------- */
const BIRTHDAY_CONFIG = {
  recipientName: 'แอนฟิว',
  recipientNameEn: 'ANFIELD',
  heroSubtitle: 'ยินดีต้อนรับสู่จักรวาลวันเกิดของแอนฟิว ค่อยๆ เลื่อนลงเพื่อรับพลังงานดีๆ เลย ↓',
  wishNodes: [
    {
      shape: 'crystal',
      title: 'Level Up! พลังงานเต็มเปี่ยม',
      text: 'ขอให้ปีนี้ของแอนฟิวเต็มไปด้วยพลังบวก สุขภาพแข็งแรง พร้อมลุยทุกเรื่องที่อยากทำ',
    },
    {
      shape: 'rocket',
      title: 'พุ่งชนทุกเป้าหมาย',
      text: 'คิดหรือหวังเรื่องไหนไว้ ขอให้พุ่งทะยานสำเร็จแบบติดจรวดนะ ทั้งเรื่องเรียนและเรื่องที่ชอบเรื่องศิลปินด้วย',
    },
    {
      shape: 'crown',
      title: 'ความสุขระดับInwZa',
      text: 'ขอให้มีแต่เรื่องให้ยิ้มได้ทุกวัน เจอแต่คนดีๆ และมีโมเมนต์เจ๋งๆ ตลอดทั้งปี',
    },
    {
      shape: 'star',
      title: 'โชคดีแบบคูณสิบ',
      text: 'ไม่ว่าจะเจอเรื่องยากแค่ไหน ขอให้แอนฟิวผ่านไปได้แบบชิลๆ และมีแต่ความโชคดีเข้ามาหาเสมอ',
    },
  ],
  letterText:
    'สุขสันต์วันเกิดนะแอนฟิว! 🎉 ขอให้ปีนี้เป็นปีที่โคตรดีสำหรับนายนะ มีความสุขมากๆ คิดอะไรก็ขอให้สมหวังทุกอย่าง สุขภาพแข็งแรง มีไฟในการทำสิ่งที่ชอบต่อไปเรื่อยๆ นะ',
  randomBlessings: [
    '✨ บัฟเสริมดวง SSR: ขอให้สุ่มเจอแต่เรื่องดีๆ และความโชคดีตลอดทั้งปี!',
    '🛡️ เกราะป้องกันความเครียด: ขอให้เรื่องปวดหัวหายเกลี้ยง ทำอะไรก็ราบรื่น!',
    '🚀 บัฟสมองแล่นคูณสิบ: อ่านหนังสือหรือทำโจทย์ยากแค่ไหนก็เข้าใจทะลุปรุโปร่ง!',
    '⚡ บัฟเอเนอร์จี้เต็มร้อย: ตื่นมาสดชื่นทุกวัน ไม่มีคำว่าเหนื่อยล้า!',
    '🌟 บัฟคนรอบข้างดี: ไปที่ไหนก็มีแต่คนคอยซัพพอร์ตและสร้างรอยยิ้ม!',
  ],
  runawayTaunts: [
    'จับไม่ได้หรอก 😜',
    'ตัวเลือกนี้ไม่มีอยู่จริงในจักรวาลนี้นะ 🙅',
    'ปุ่มนี้แพ้ทางความปังของแอนฟิว 🏃💨',
    'ยอมรับความปังไปดีๆ เถอะ ✨',
    'ลองกดปุ่มสีทองข้างๆ ดูสิ 👉',
    'จักรวาลไม่อนุญาตให้ไม่พร้อม 🌌',
  ],
};

/* -------------------------------------------------------------------------
   Environment flags & helpers
   ------------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
const IS_MOBILE = IS_TOUCH || Math.min(window.innerWidth, window.innerHeight) < 640;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const Q = IS_MOBILE ? 0.5 : 1; // particle budget multiplier
const TAU = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const range = (v, a, b) => clamp((v - a) / (b - a));
const rand = (a, b) => a + Math.random() * (b - a);
const randSign = () => (Math.random() < 0.5 ? -1 : 1);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickWeighted = (choices) => {
  const total = choices.reduce((s, c) => s + c[1], 0);
  let r = Math.random() * total;
  for (const [v, w] of choices) {
    if ((r -= w) <= 0) return v;
  }
  return choices[0][0];
};
/** 0 → 1 → 0 window with soft edges, used for card visibility & "activity" */
const fadeWindow = (p, a, b, f = 0.014) => {
  if (p < a - f || p > b + f) return 0;
  return Math.min(smooth(range(p, a - f, a)), 1 - smooth(range(p, b, b + f)));
};

const PALETTE = {
  cyan: 0x7df9ff,
  violet: 0xb388ff,
  gold: 0xffd56b,
  rose: 0xff8ad8,
  white: 0xffffff,
  mint: 0x5cffc8,
  indigo: 0x070522,
};
const CONFETTI_COLORS = ['#7df9ff', '#ffd56b', '#b388ff', '#ff8ad8', '#ffffff', '#5cffc8'];
const col = (hex, mult = 1) => new THREE.Color(hex).multiplyScalar(mult);

/* Shared uniforms (time + world-size → pixel conversion for point sprites) */
const SHARED = {
  uTime: { value: 0 },
  uPointScale: { value: 600 },
};

/* -------------------------------------------------------------------------
   Story layout (scroll progress ranges & world positions)
   ------------------------------------------------------------------------- */
const WISH_COUNT = BIRTHDAY_CONFIG.wishNodes.length;
const CH2 = [0.2, 0.55];
const WISH_RANGES = BIRTHDAY_CONFIG.wishNodes.map((_, i) => {
  const slot = (CH2[1] - CH2[0]) / Math.max(1, WISH_COUNT);
  const a = CH2[0] + slot * i + slot * 0.4;
  return [+a.toFixed(4), +(a + slot * 0.6 - 0.002).toFixed(4)];
});
const WISH_POS = BIRTHDAY_CONFIG.wishNodes.map(
  (_, i) => new THREE.Vector3(i % 2 === 0 ? -3.3 : 3.3, [0.3, 1.0, 0.4, 0.2][i % 4], -34 - i * 24)
);
const LAST_WISH_Z = WISH_COUNT ? WISH_POS[WISH_COUNT - 1].z : -10;
const CAKE_POS = new THREE.Vector3(0, -1.2, LAST_WISH_Z - 28);
const CAKE_LOOK = CAKE_POS.clone().add(new THREE.Vector3(0, 2.0, 0));
const GALAXY_POS = new THREE.Vector3(0, 34, CAKE_POS.z - 41);
const LETTER_CAM_A = new THREE.Vector3(0, 9, CAKE_POS.z + 6);
const LETTER_CAM_B = new THREE.Vector3(0, 11.5, CAKE_POS.z + 1);
const ORB_POS = new THREE.Vector3(0, 36, CAKE_POS.z - 106);

const RANGES = {
  hero: [-1, 0.05],
  cake: [0.585, 0.735],
  letter: [0.78, 0.885],
  finale: [0.925, 9],
};
const CHAPTER_FOCUS = [0, WISH_RANGES[0] ? WISH_RANGES[0][0] + 0.02 : 0.25, 0.64, 0.82, 0.975];

/* -------------------------------------------------------------------------
   GLSL chunks
   ------------------------------------------------------------------------- */
const NOISE_GLSL = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }
`;
const FBM_DEFINE = { FBM_OCTAVES: IS_MOBILE ? 4 : 5 };

const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.7);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

function pointsMaterial(vertexShader, uniforms = {}, opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: opts.fragmentShader || POINT_FRAG,
    uniforms: { uTime: SHARED.uTime, uPointScale: SHARED.uPointScale, ...uniforms },
    transparent: true,
    depthWrite: false,
    blending: opts.blending ?? THREE.AdditiveBlending,
  });
}

/* -------------------------------------------------------------------------
   Procedural textures & small material helpers
   ------------------------------------------------------------------------- */
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.7)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let GLOW_TEX = null;

function makeGlow(color, scale = 1, opacity = 1) {
  const mat = new THREE.SpriteMaterial({
    map: GLOW_TEX,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}
const glowLineMat = (color, mult = 2, opacity = 0.8) =>
  new THREE.LineBasicMaterial({
    color: col(color, mult),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
const glowBasicMat = (color, mult = 2, opacity = 1) =>
  new THREE.MeshBasicMaterial({
    color: col(color, mult),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

function starShape(outer, inner, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * TAU + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/* Generic orbiting sparkle cloud (ring / shell distribution) */
function buildSparkles({ count = 200, rMin = 1, rMax = 2, yRange = 0.5, colors = [PALETTE.white], size = [0.04, 0.1], speed = 0.2, shell = false, opacity = 1 }) {
  const n = Math.max(8, Math.round(count));
  const pos = new Float32Array(n * 3);
  const colr = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const sz = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = rand(rMin, rMax);
    if (shell) {
      const u = rand(-1, 1);
      const th = rand(0, TAU);
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * r, u * r, Math.sin(th) * s * r], i * 3);
    } else {
      const th = rand(0, TAU);
      pos.set([Math.cos(th) * r, rand(-yRange, yRange), Math.sin(th) * r], i * 3);
    }
    c.set(pick(colors)).multiplyScalar(rand(1.0, 2.2));
    colr.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random();
    sz[i] = rand(size[0], size[1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const mat = pointsMaterial(
    /* glsl */ `
    attribute vec3 aColor;
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uPointScale;
    uniform float uOpacity;
    uniform float uSpeed;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float ang = uTime * uSpeed * (0.5 + aSeed);
      float c = cos(ang);
      float s = sin(ang);
      vec3 p = vec3(c * position.x - s * position.z,
                    position.y + sin(uTime * 0.8 + aSeed * 20.0) * 0.08,
                    s * position.x + c * position.z);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(aSize * uPointScale / -mv.z, 1.0, 30.0);
      float tw = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (2.0 + aSeed * 4.0) + aSeed * 50.0), 2.0);
      vColor = aColor * tw;
      vAlpha = uOpacity;
      gl_Position = projectionMatrix * mv;
    }`,
    { uOpacity: { value: opacity }, uSpeed: { value: speed } }
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

/* -------------------------------------------------------------------------
   Environment map (procedural cosmic "studio" for metal/glass reflections)
   ------------------------------------------------------------------------- */
function buildEnvironment(renderer) {
  const env = new THREE.Scene();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0b0826), side: THREE.BackSide })
  );
  env.add(shell);
  const panel = (color, mult, w, h, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: col(color, mult), side: THREE.DoubleSide })
    );
    m.position.copy(pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(PALETTE.violet, 2.2, 60, 18, new THREE.Vector3(0, 30, 0));
  panel(PALETTE.cyan, 3.0, 14, 30, new THREE.Vector3(-30, 4, 8));
  panel(PALETTE.gold, 3.2, 14, 26, new THREE.Vector3(30, 2, 6));
  panel(PALETTE.rose, 1.6, 20, 10, new THREE.Vector3(0, -6, -30));
  panel(0xffffff, 4.0, 8, 8, new THREE.Vector3(10, 18, 25));
  panel(0x2a1a7a, 1.0, 60, 30, new THREE.Vector3(0, -30, 0));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  env.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  return tex;
}

/* -------------------------------------------------------------------------
   Nebula sky dome (follows the camera)
   ------------------------------------------------------------------------- */
function buildNebula() {
  const mat = new THREE.ShaderMaterial({
    defines: FBM_DEFINE,
    uniforms: { uTime: SHARED.uTime, uAurora: { value: 0 }, uWarm: { value: 0.3 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uAurora;
      uniform float uWarm;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y * 0.5 + 0.5;
        vec3 col = mix(vec3(0.006, 0.005, 0.026), vec3(0.03, 0.018, 0.085), smoothstep(0.1, 0.95, h));
        float n1 = fbm(d * 2.2 + vec3(0.0, uTime * 0.006, 0.0));
        float n2 = fbm(d * 4.2 + vec3(uTime * 0.004, 0.0, 3.0) + n1);
        col += vec3(0.24, 0.06, 0.44) * pow(smoothstep(0.38, 0.85, n1), 2.0) * 0.5;
        col += vec3(0.02, 0.2, 0.32) * pow(smoothstep(0.45, 0.9, n2), 2.0) * 0.45;
        col += vec3(0.36, 0.14, 0.05) * pow(smoothstep(0.5, 0.95, n1 * n2 * 1.7), 2.0) * 0.4 * uWarm;
        // celebratory aurora curtains
        float curtain = 0.5 + 0.5 * sin(d.x * 9.0 + d.z * 4.0 + n1 * 6.0 + uTime * 0.25);
        float band = smoothstep(-0.25, 0.25, d.y) * (1.0 - smoothstep(0.35, 0.95, d.y));
        vec3 aur = mix(vec3(0.05, 0.85, 0.5), vec3(0.55, 0.2, 1.0), curtain);
        col += aur * pow(curtain, 3.0) * band * 0.2 * uAurora * (0.4 + n2);
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 32), mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

/* -------------------------------------------------------------------------
   Starfield + bokeh + corridor dust
   ------------------------------------------------------------------------- */
function buildStarfield() {
  const count = Math.round(7000 * Q);
  const pos = new Float32Array(count * 3);
  const colr = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const choices = [
    [PALETTE.white, 0.5],
    [PALETTE.cyan, 0.2],
    [PALETTE.violet, 0.15],
    [PALETTE.gold, 0.1],
    [PALETTE.rose, 0.05],
  ];
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    let x = rand(-230, 230);
    const y = rand(-130, 210);
    const z = rand(-440, 90);
    if (Math.abs(x) < 9 && Math.abs(y) < 7) x += x < 0 ? -10 : 10; // keep the flight corridor clean
    pos.set([x, y, z], i * 3);
    c.set(pickWeighted(choices)).multiplyScalar(rand(0.7, 1.7));
    colr.set([c.r, c.g, c.b], i * 3);
    size[i] = Math.pow(Math.random(), 3) * 1.1 + 0.25;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = pointsMaterial(
    /* glsl */ `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime;
    uniform float uPointScale;
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.4) + aSeed * 61.0);
      gl_PointSize = clamp(aSize * uPointScale / -mv.z, 1.0, 22.0);
      vColor = aColor * tw;
      vAlpha = uOpacity;
      gl_Position = projectionMatrix * mv;
    }`,
    { uOpacity: { value: 1 } }
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function buildBokeh() {
  const count = Math.round(260 * Q);
  const pos = new Float32Array(count * 3);
  const colr = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const z = rand(-300, 40);
    const cy = z > -125 ? 0.5 : lerp(0.5, 34, clamp((-125 - z) / 100));
    let x = rand(-60, 60);
    if (Math.abs(x) < 5) x += x < 0 ? -6 : 6;
    pos.set([x, cy + rand(-30, 40), z], i * 3);
    c.set(pick([PALETTE.cyan, PALETTE.violet, PALETTE.gold, PALETTE.rose, PALETTE.violet])).multiplyScalar(rand(0.12, 0.32));
    colr.set([c.r, c.g, c.b], i * 3);
    size[i] = rand(1.2, 3.6);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = pointsMaterial(
    /* glsl */ `
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime;
    uniform float uPointScale;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec3 p = position;
      p.y += sin(uTime * 0.2 + aSeed * 10.0) * 0.8;
      p.x += cos(uTime * 0.15 + aSeed * 7.0) * 0.6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(aSize * uPointScale / -mv.z, 2.0, 150.0);
      vColor = aColor;
      vAlpha = smoothstep(3.0, 14.0, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
    {},
    {
      fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float disc = smoothstep(1.0, 0.84, d);
        float rim = smoothstep(0.66, 0.93, d) * disc;
        gl_FragColor = vec4(vColor, (disc * 0.5 + rim * 0.65) * vAlpha);
      }`,
    }
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function buildCorridorDust() {
  const count = Math.round(3200 * Q);
  const attrs = { aRadius: new Float32Array(count), aAngle: new Float32Array(count), aSeed: new Float32Array(count), aSize: new Float32Array(count) };
  const pos = new Float32Array(count * 3);
  const colr = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const z = rand(15, -265);
    const cy = z > -125 ? 0.5 : lerp(0.5, 34, clamp((-125 - z) / 100));
    pos.set([0, cy, z], i * 3);
    attrs.aRadius[i] = rand(4.5, 22);
    attrs.aAngle[i] = rand(0, TAU);
    attrs.aSeed[i] = Math.random();
    attrs.aSize[i] = rand(0.04, 0.15);
    c.set(pick([PALETTE.cyan, PALETTE.violet, PALETTE.white, PALETTE.gold])).multiplyScalar(rand(0.6, 1.6));
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  Object.entries(attrs).forEach(([k, v]) => geo.setAttribute(k, new THREE.BufferAttribute(v, 1)));
  const mat = pointsMaterial(
    /* glsl */ `
    attribute vec3 aColor;
    attribute float aRadius;
    attribute float aAngle;
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uPointScale;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float ang = aAngle + uTime * 0.05 * (6.0 / aRadius);
      vec3 p = vec3(cos(ang) * aRadius, position.y + sin(ang) * aRadius * 0.7, position.z);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(aSize * uPointScale / -mv.z, 1.0, 16.0);
      float tw = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 40.0);
      vColor = aColor * (0.5 + tw * 0.7);
      vAlpha = 0.8 * smoothstep(1.5, 6.0, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

/* Glowing arches that turn the void into a corridor + floating geometric debris */
function buildCorridor() {
  const group = new THREE.Group();
  const arches = [];
  const geo = new THREE.TorusGeometry(10.5, 0.03, 8, 200);
  for (let z = -20, k = 0; z > LAST_WISH_Z - 20; z -= 13, k++) {
    const m = new THREE.Mesh(geo, glowBasicMat(k % 2 ? PALETTE.violet : PALETTE.cyan, 1.6, 0.35));
    m.position.set(0, 0.5, z);
    m.rotation.z = rand(0, TAU);
    m.userData.spin = rand(0.05, 0.15) * randSign();
    group.add(m);
    arches.push(m);
  }

  // instanced debris
  const debris = [];
  const dmat = new THREE.MeshStandardMaterial({
    color: 0x2a1d66,
    emissive: new THREE.Color(0x3a2a99),
    emissiveIntensity: 0.35,
    metalness: 0.85,
    roughness: 0.2,
    flatShading: true,
    envMapIntensity: 1.3,
  });
  const geos = [new THREE.OctahedronGeometry(0.32, 0), new THREE.TetrahedronGeometry(0.36, 0), new THREE.IcosahedronGeometry(0.26, 0)];
  const per = Math.round(55 * (IS_MOBILE ? 0.6 : 1));
  const dummy = new THREE.Object3D();
  geos.forEach((g) => {
    const inst = new THREE.InstancedMesh(g, dmat, per);
    const items = [];
    for (let i = 0; i < per; i++) {
      const z = rand(-8, -265);
      const cy = z > -125 ? 0.5 : lerp(0.5, 34, clamp((-125 - z) / 100));
      const a = rand(0, TAU);
      const r = rand(7, 26);
      items.push({
        p: new THREE.Vector3(Math.cos(a) * r, cy + Math.sin(a) * r * 0.7, z),
        r: new THREE.Euler(rand(0, TAU), rand(0, TAU), 0),
        s: rand(0.6, 2.2),
        sp: new THREE.Vector3(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.3, 0.3)),
        bob: rand(0, TAU),
      });
    }
    inst.frustumCulled = false;
    group.add(inst);
    debris.push({ inst, items });
  });

  return {
    group,
    update(t, dt, glow) {
      arches.forEach((a) => {
        a.rotation.z += dt * a.userData.spin;
        a.material.opacity = 0.08 + glow * 0.32;
      });
      debris.forEach(({ inst, items }) => {
        items.forEach((it, i) => {
          it.r.x += dt * it.sp.x;
          it.r.y += dt * it.sp.y;
          dummy.position.set(it.p.x, it.p.y + Math.sin(t * 0.4 + it.bob) * 0.4, it.p.z);
          dummy.rotation.copy(it.r);
          dummy.scale.setScalar(it.s);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        });
        inst.instanceMatrix.needsUpdate = true;
      });
    },
  };
}

/* -------------------------------------------------------------------------
   CHAPTER 1 — Cosmic Portal Crystal
   ------------------------------------------------------------------------- */
function buildPortal() {
  const group = new THREE.Group();
  const crystalRig = new THREE.Group();
  group.add(crystalRig);

  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x24125e,
    emissive: new THREE.Color(0x3a5cff),
    emissiveIntensity: 0.9,
    metalness: 0.55,
    roughness: 0.12,
    flatShading: true,
    envMapIntensity: 1.8,
  });
  const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), crystalMat);
  crystalRig.add(crystal);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.05, 1)), glowLineMat(PALETTE.cyan, 1.8, 0.5));
  crystalRig.add(wire);
  crystalRig.add(makeGlow(PALETTE.cyan, 7.5, 0.75));
  crystalRig.add(makeGlow(0xffffff, 2.6, 0.85));

  const ringDefs = [
    { r: 3.2, c: PALETTE.cyan, tx: 1.15, ty: 0.35, sp: 0.5 },
    { r: 3.85, c: PALETTE.gold, tx: -0.7, ty: 1.05, sp: -0.38 },
    { r: 4.55, c: PALETTE.violet, tx: 0.45, ty: -1.25, sp: 0.3 },
  ];
  const rings = ringDefs.map((d) => {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.04, 12, 240), glowBasicMat(d.c, 2.4, 0.95));
    pivot.add(mesh);
    for (let k = 0; k < 3; k++) {
      const bead = makeGlow(d.c, 1.0, 1);
      const a = (k / 3) * TAU;
      bead.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      mesh.add(bead);
    }
    group.add(pivot);
    return { ...d, pivot, mesh, spin: Math.random() * TAU };
  });

  // halo particles that burst outward as the portal opens
  const count = Math.round(1500 * Q);
  const dir = new Float32Array(count * 3);
  const dist = new Float32Array(count);
  const seed = new Float32Array(count);
  const colr = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = rand(-1, 1);
    const th = rand(0, TAU);
    const s = Math.sqrt(1 - u * u);
    dir.set([Math.cos(th) * s, u * 0.75, Math.sin(th) * s], i * 3);
    dist[i] = rand(8, 46);
    seed[i] = Math.random();
    c.set(pick([PALETTE.cyan, PALETTE.gold, PALETTE.violet, PALETTE.white])).multiplyScalar(rand(1.2, 2.4));
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const bgeo = new THREE.BufferGeometry();
  bgeo.setAttribute('position', new THREE.BufferAttribute(dir, 3));
  bgeo.setAttribute('aDist', new THREE.BufferAttribute(dist, 1));
  bgeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  bgeo.setAttribute('aColor', new THREE.BufferAttribute(colr, 3));
  const burstMat = pointsMaterial(
    /* glsl */ `
    attribute float aDist;
    attribute float aSeed;
    attribute vec3 aColor;
    uniform float uTime;
    uniform float uPointScale;
    uniform float uBurst;
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float ang = uTime * (0.2 + aSeed * 0.5);
      float c = cos(ang);
      float s = sin(ang);
      vec3 d = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);
      float r = mix(2.5 + aSeed * 1.8, 2.5 + aDist, uBurst);
      vec3 p = d * r;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp((0.05 + aSeed * 0.09) * (1.0 + uBurst * 1.5) * uPointScale / -mv.z, 1.0, 36.0);
      vColor = aColor;
      vAlpha = uOpacity * (1.0 - uBurst * 0.45) * smoothstep(0.5, 3.0, -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
    { uBurst: { value: 0 }, uOpacity: { value: 1 } }
  );
  const burst = new THREE.Points(bgeo, burstMat);
  burst.frustumCulled = false;
  group.add(burst);

  return {
    group,
    update(t, dt, rig) {
      crystal.rotation.y += dt * (0.35 + rig.expand * 2.5);
      crystal.rotation.x += dt * 0.12;
      wire.rotation.y -= dt * 0.2;
      wire.rotation.z += dt * 0.1;
      const s = Math.max(0.0001, 1 - rig.shrink);
      crystalRig.scale.setScalar(s * (1 + Math.sin(t * 1.6) * 0.03));
      crystalRig.position.y = Math.sin(t * 0.7) * 0.18;
      crystalMat.emissiveIntensity = 0.8 + rig.align * 1.2 + Math.sin(t * 2) * 0.15;
      rings.forEach((r, i) => {
        r.spin += dt * r.sp * (1 - rig.align * 0.6);
        r.mesh.rotation.z = r.spin;
        const inv = 1 - rig.align;
        const wob = Math.sin(t * 0.5 + i) * 0.15 * inv;
        r.pivot.rotation.set(r.tx * inv + wob, r.ty * inv, 0);
        r.pivot.scale.setScalar(1 + rig.expand * (2.6 + i * 1.4));
        r.pivot.position.z = -rig.expand * i * 4.5;
        r.mesh.material.opacity = 0.95 * (1 - rig.burst * 0.3);
      });
      burstMat.uniforms.uBurst.value = rig.burst;
      burstMat.uniforms.uOpacity.value = 1 - range(rig.p, 0.19, 0.28);
      group.visible = rig.p < 0.32;
    },
  };
}

/* -------------------------------------------------------------------------
   CHAPTER 2 — Symbolic sculptures
   Each returns { root, inner, lightColor, lightBase, update(t, dt, act) → lightMultiplier }
   ------------------------------------------------------------------------- */
function buildEnergyCrystal() {
  const accent = PALETTE.cyan;
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0c2f4a,
    emissive: new THREE.Color(accent),
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.06,
    flatShading: true,
    envMapIntensity: 2.2,
  });
  const geo = new THREE.OctahedronGeometry(1.15, 0);
  const main = new THREE.Mesh(geo, mat);
  main.scale.set(1, 1.5, 1);
  inner.add(main);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), glowLineMat(accent, 2.4, 0.9));
  edges.scale.set(1.025, 1.535, 1.025);
  inner.add(edges);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), new THREE.MeshBasicMaterial({ color: col(0xffffff, 3) }));
  inner.add(core);
  inner.add(makeGlow(accent, 6.5, 0.5));
  inner.add(makeGlow(0xffffff, 1.8, 0.7));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.022, 8, 180), glowBasicMat(accent, 2, 0.7));
  ring.rotation.x = Math.PI / 2.3;
  inner.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.015, 8, 180), glowBasicMat(PALETTE.violet, 2, 0.5));
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = 0.5;
  inner.add(ring2);
  const shardMats = [accent, PALETTE.violet].map(
    (cc) => new THREE.MeshStandardMaterial({ color: 0x111133, emissive: new THREE.Color(cc), emissiveIntensity: 1.6, flatShading: true, metalness: 0.4, roughness: 0.2 })
  );
  const shards = [];
  for (let k = 0; k < 8; k++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.09, 0.2), 0), shardMats[k % 2]);
    shards.push({ m, r: rand(1.6, 2.6), a: (k / 8) * TAU, y: rand(-1.1, 1.1), sp: rand(0.4, 0.9) });
    inner.add(m);
  }
  inner.add(buildSparkles({ count: 140 * Q + 40, rMin: 1.4, rMax: 3.2, shell: true, colors: [accent, PALETTE.white], size: [0.03, 0.08], speed: 0.25 }));
  return {
    root,
    inner,
    lightColor: accent,
    lightBase: 26,
    update(t, dt, act) {
      inner.rotation.y += dt * (0.45 + act * 1.8);
      inner.position.y = Math.sin(t * 1.1) * 0.22;
      mat.emissiveIntensity = 0.45 + act * 1.3 + Math.sin(t * 3) * 0.12 * (0.3 + act);
      core.rotation.x += dt * 2;
      core.rotation.y += dt * 1.3;
      core.scale.setScalar(1 + Math.sin(t * 5) * 0.15 * (0.3 + act));
      ring.rotation.z += dt * 0.6;
      ring2.rotation.z -= dt * 0.4;
      shards.forEach((s) => {
        s.a += dt * s.sp * (1 + act);
        s.m.position.set(Math.cos(s.a) * s.r, s.y + Math.sin(t + s.a) * 0.2, Math.sin(s.a) * s.r);
        s.m.rotation.x += dt * 2;
        s.m.rotation.y += dt * 1.5;
      });
      inner.scale.setScalar(1 + act * 0.08 + Math.sin(t * 4) * 0.03 * act);
      return 1 + Math.sin(t * 3) * 0.15;
    },
  };
}

function buildRocket() {
  const accent = PALETTE.violet;
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const tilt = new THREE.Group();
  tilt.rotation.set(0.2, 0, -0.55);
  inner.add(tilt);
  const spin = new THREE.Group();
  tilt.add(spin);

  const hull = new THREE.MeshStandardMaterial({ color: 0xece8ff, metalness: 0.7, roughness: 0.22, envMapIntensity: 1.5 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: col(accent, 0.55),
    emissive: new THREE.Color(accent),
    emissiveIntensity: 0.6,
    metalness: 0.6,
    roughness: 0.3,
    envMapIntensity: 1.2,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc94d, metalness: 1, roughness: 0.25, envMapIntensity: 1.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2840, metalness: 0.9, roughness: 0.35, envMapIntensity: 1.2, side: THREE.DoubleSide });

  const profile = [
    [0, -1.1], [0.36, -1.1], [0.45, -0.85], [0.5, -0.3], [0.49, 0.3], [0.42, 0.8], [0.28, 1.15], [0.12, 1.42], [0, 1.52],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  spin.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), hull));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.05, 10, 48), accentMat);
  band.position.y = 0.78;
  band.rotation.x = Math.PI / 2;
  spin.add(band);
  const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.05, 10, 48), accentMat);
  band2.position.y = -0.85;
  band2.rotation.x = Math.PI / 2;
  spin.add(band2);
  const winFrame = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 32), goldMat);
  winFrame.position.set(0, 0.3, 0.5);
  spin.add(winFrame);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ color: col(PALETTE.cyan, 1.8) }));
  glass.position.set(0, 0.3, 0.505);
  spin.add(glass);
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.55, -0.45);
  finShape.lineTo(0.62, -0.98);
  finShape.lineTo(0, -0.62);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  finGeo.translate(0, 0, -0.03);
  for (let k = 0; k < 3; k++) {
    const holder = new THREE.Group();
    holder.rotation.y = (k / 3) * TAU;
    const fin = new THREE.Mesh(finGeo, accentMat);
    fin.position.set(0.4, -0.32, 0);
    holder.add(fin);
    spin.add(holder);
  }
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.26, 32, 1, true), dark);
  nozzle.position.y = -1.22;
  spin.add(nozzle);

  // exhaust flames
  const flameMat = new THREE.ShaderMaterial({
    uniforms: { uTime: SHARED.uTime, uPower: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float k = uv.y;
        p.x += sin(uTime * 30.0 + p.y * 8.0) * 0.025 * k;
        p.z += cos(uTime * 27.0 + p.y * 7.0) * 0.025 * k;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uPower;
      varying vec2 vUv;
      void main() {
        float k = vUv.y;
        vec3 c = mix(vec3(2.6, 2.8, 3.2), mix(vec3(0.3, 1.4, 2.4), vec3(1.2, 0.35, 2.2), k), smoothstep(0.0, 0.35, k));
        float a = pow(1.0 - k, 1.4) * uPower;
        gl_FragColor = vec4(c, clamp(a, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.27, 1.5, 24, 6, true), flameMat);
  flame.rotation.x = Math.PI;
  flame.position.y = -1.35 - 0.75;
  tilt.add(flame);
  const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.85, 20, 4, true), flameMat);
  flame2.rotation.x = Math.PI;
  flame2.position.y = -1.35 - 0.42;
  tilt.add(flame2);
  const exhaustGlow = makeGlow(PALETTE.cyan, 2.6, 0.9);
  exhaustGlow.position.y = -1.5;
  tilt.add(exhaustGlow);

  // comet trail
  const n = Math.round(520 * Q + 120);
  const off = new Float32Array(n * 2);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU);
    const r = Math.sqrt(Math.random());
    off.set([Math.cos(a) * r, Math.sin(a) * r], i * 2);
    seed[i] = Math.random();
  }
  const tgeo = new THREE.BufferGeometry();
  tgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  tgeo.setAttribute('aOff', new THREE.BufferAttribute(off, 2));
  tgeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const trailMat = pointsMaterial(
    /* glsl */ `
    attribute vec2 aOff;
    attribute float aSeed;
    uniform float uTime;
    uniform float uPointScale;
    uniform float uPower;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float life = fract(uTime * (0.45 + aSeed * 0.35) + aSeed * 13.1);
      float spread = 0.12 + life * 1.15;
      vec3 p = vec3(aOff.x * spread, -1.55 - life * (6.0 + uPower * 2.5), aOff.y * spread);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float sz = mix(0.2, 0.05, life) * (0.6 + aSeed * 0.8);
      gl_PointSize = clamp(sz * uPointScale / -mv.z, 1.0, 40.0);
      vec3 cool = mix(vec3(0.4, 1.0, 1.8), vec3(0.9, 0.4, 1.8), life);
      vColor = mix(vec3(2.0, 2.2, 2.6), cool, smoothstep(0.0, 0.25, life));
      vAlpha = pow(1.0 - life, 1.6);
      gl_Position = projectionMatrix * mv;
    }`,
    { uPower: flameMat.uniforms.uPower }
  );
  const trail = new THREE.Points(tgeo, trailMat);
  trail.frustumCulled = false;
  tilt.add(trail);
  inner.add(makeGlow(accent, 6, 0.32));
  inner.add(buildSparkles({ count: 90 * Q + 30, rMin: 1.6, rMax: 3.4, shell: true, colors: [accent, PALETTE.cyan, PALETTE.white], size: [0.03, 0.07], speed: 0.3 }));

  return {
    root,
    inner,
    lightColor: accent,
    lightBase: 24,
    update(t, dt, act) {
      inner.position.y = Math.sin(t * 1.3) * 0.25;
      tilt.rotation.z = -0.55 + Math.sin(t * 0.9) * 0.07;
      tilt.rotation.x = 0.2 + Math.sin(t * 0.7) * 0.05;
      spin.rotation.y += dt * (0.4 + act * 1.2);
      const power = 1 + act * 0.9 + Math.sin(t * 25) * 0.08;
      flameMat.uniforms.uPower.value = power;
      flame.scale.set(1, 0.85 + power * 0.25 + Math.sin(t * 40) * 0.05, 1);
      exhaustGlow.material.opacity = 0.6 + act * 0.4;
      accentMat.emissiveIntensity = 0.5 + act * 1.0;
      return 0.9 + Math.sin(t * 20) * 0.1;
    },
  };
}

function buildCrown() {
  const accent = PALETTE.gold;
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const crown = new THREE.Group();
  crown.rotation.x = 0.38;
  inner.add(crown);

  const gold = new THREE.MeshStandardMaterial({
    color: 0xffc24a,
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 2.0,
    emissive: new THREE.Color(0x4a2a00),
    emissiveIntensity: 0.5,
    side: THREE.DoubleSide,
  });
  crown.add(new THREE.Mesh(new THREE.CylinderGeometry(1.12, 0.96, 0.62, 64, 1, true), gold));
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.065, 12, 72), gold);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.31;
  crown.add(topRim);
  const botRim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.075, 12, 72), gold);
  botRim.rotation.x = Math.PI / 2;
  botRim.position.y = -0.31;
  crown.add(botRim);

  const gemColors = [PALETTE.cyan, PALETTE.rose, PALETTE.violet];
  const gemMats = gemColors.map(
    (cc) => new THREE.MeshStandardMaterial({ color: col(cc, 0.4), emissive: new THREE.Color(cc), emissiveIntensity: 2.0, metalness: 0.2, roughness: 0.1, flatShading: true })
  );
  const spikeGeoT = new THREE.ConeGeometry(0.17, 0.95, 14);
  const spikeGeoS = new THREE.ConeGeometry(0.15, 0.6, 14);
  const tipGeo = new THREE.SphereGeometry(0.11, 16, 12);
  const bandGemGeo = new THREE.OctahedronGeometry(0.13, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    const tall = k % 2 === 0;
    const h = tall ? 0.95 : 0.6;
    const spike = new THREE.Mesh(tall ? spikeGeoT : spikeGeoS, gold);
    spike.position.set(Math.cos(a) * 1.08, 0.31 + h / 2, Math.sin(a) * 1.08);
    crown.add(spike);
    const tip = new THREE.Mesh(tipGeo, gemMats[k % 3]);
    tip.position.set(Math.cos(a) * 1.08, 0.31 + h + 0.06, Math.sin(a) * 1.08);
    crown.add(tip);
    const b = a + Math.PI / 8;
    const gem = new THREE.Mesh(bandGemGeo, gemMats[(k + 1) % 3]);
    gem.position.set(Math.cos(b) * 1.07, 0, Math.sin(b) * 1.07);
    crown.add(gem);
  }
  const velvet = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 32, 16, 0, TAU, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x4b1677, roughness: 0.85, metalness: 0, emissive: new THREE.Color(0x2a0a4a), emissiveIntensity: 0.6 })
  );
  velvet.scale.set(1, 0.6, 1);
  velvet.position.y = -0.2;
  crown.add(velvet);
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffe2a0), emissiveIntensity: 2.6, flatShading: true }));
  jewel.position.y = 0.66;
  crown.add(jewel);
  inner.add(makeGlow(accent, 7, 0.42));
  const sparkles = buildSparkles({ count: 180 * Q + 50, rMin: 1.7, rMax: 2.6, yRange: 0.7, colors: [accent, PALETTE.white, PALETTE.rose], size: [0.03, 0.09], speed: 0.35 });
  inner.add(sparkles);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.02, 8, 160), glowBasicMat(accent, 2.2, 0.6));
  halo.rotation.x = Math.PI / 2 + 0.38;
  halo.position.y = -0.5;
  inner.add(halo);

  return {
    root,
    inner,
    lightColor: accent,
    lightBase: 30,
    update(t, dt, act) {
      crown.rotation.y += dt * (0.35 + act * 1.2);
      inner.position.y = Math.sin(t * 1.0) * 0.2;
      gemMats.forEach((m, i) => (m.emissiveIntensity = 1.6 + Math.sin(t * 3 + i * 2) * 0.6 + act * 1.2));
      jewel.rotation.y += dt * 1.5;
      halo.scale.setScalar(1 + Math.sin(t * 2) * 0.04 + act * 0.1);
      inner.scale.setScalar(1 + act * 0.07);
      return 1 + Math.sin(t * 2.4) * 0.12;
    },
  };
}

function buildSupernova() {
  const accent = PALETTE.gold;
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);

  const geo = new THREE.ExtrudeGeometry(starShape(1.35, 0.58), {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.1,
    bevelSegments: 3,
    curveSegments: 1,
  });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfff0c8,
    emissive: new THREE.Color(0xffb347),
    emissiveIntensity: 1.2,
    metalness: 0.35,
    roughness: 0.25,
    envMapIntensity: 1.4,
  });
  const star = new THREE.Mesh(geo, mat);
  inner.add(star);
  inner.add(makeGlow(accent, 9, 0.6));
  inner.add(makeGlow(0xffffff, 3.4, 0.85));
  inner.add(makeGlow(PALETTE.rose, 14, 0.18));

  // light rays
  const rays = new THREE.Group();
  const rayGeo = new THREE.PlaneGeometry(0.2, 1, 1, 1);
  rayGeo.translate(0, 0.5, 0);
  const rayMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: col(0xffe0a0, 2.2) }, uOpacity: { value: 0.7 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float a = (1.0 - vUv.y) * pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0);
        gl_FragColor = vec4(uColor, a * uOpacity);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const rayList = [];
  for (let k = 0; k < 16; k++) {
    const m = new THREE.Mesh(rayGeo, rayMat);
    m.rotation.z = (k / 16) * TAU + rand(-0.08, 0.08);
    m.position.z = -0.25;
    const L = k % 2 ? rand(2.0, 3.0) : rand(3.4, 4.6);
    m.userData = { L, w: rand(0.7, 1.4), ph: rand(0, TAU) };
    rays.add(m);
    rayList.push(m);
  }
  inner.add(rays);

  const shocks = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 128), glowBasicMat(accent, 2.2, 0.6));
    m.material.side = THREE.DoubleSide;
    inner.add(m);
    return m;
  });
  inner.add(buildSparkles({ count: 260 * Q + 60, rMin: 1.8, rMax: 4.8, shell: true, colors: [accent, PALETTE.white, PALETTE.rose], size: [0.03, 0.1], speed: 0.18 }));

  return {
    root,
    inner,
    lightColor: 0xffc070,
    lightBase: 34,
    update(t, dt, act) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
      star.rotation.y = Math.sin(t * 0.7) * 0.6;
      star.rotation.z += dt * 0.25 * (1 + act);
      mat.emissiveIntensity = 1.0 + pulse * 0.7 + act * 1.1;
      star.scale.setScalar(1 + pulse * 0.05 + act * 0.08);
      rays.rotation.z -= dt * 0.15;
      rayList.forEach((r, i) => {
        const L = r.userData.L * (0.75 + 0.25 * Math.sin(t * 2.6 + r.userData.ph)) * (1 + act * 0.45);
        r.scale.set(r.userData.w, L, 1);
      });
      rayMat.uniforms.uOpacity.value = 0.45 + act * 0.45;
      shocks.forEach((s, j) => {
        const ph = (t * 0.42 + j * 0.5) % 1;
        s.scale.setScalar(1 + ph * (5 + act * 3));
        s.material.opacity = Math.pow(1 - ph, 2) * (0.3 + act * 0.6);
      });
      inner.position.y = Math.sin(t * 0.9) * 0.18;
      return 0.6 + pulse * 0.8;
    },
  };
}

const SCULPTURE_BUILDERS = { crystal: buildEnergyCrystal, rocket: buildRocket, crown: buildCrown, star: buildSupernova };
const SHAPE_META = {
  crystal: { label: 'ENERGY CRYSTAL', accent: 'cyan', note: 76 },
  rocket: { label: 'COMET ROCKET', accent: 'violet', note: 79 },
  crown: { label: 'GOLDEN CROWN', accent: 'gold', note: 81 },
  star: { label: 'SUPERNOVA STAR', accent: 'rose', note: 84 },
};

/* -------------------------------------------------------------------------
   CHAPTER 3 — Multi-Tier 3D Birthday Cake Centerpiece (Interactive Stop)
   ------------------------------------------------------------------------- */
function buildCake() {
  const root = new THREE.Group();
  root.position.copy(CAKE_POS);

  const cakeRig = new THREE.Group();
  root.add(cakeRig);

  // Floating cosmic pedestal
  const pedMat = new THREE.MeshStandardMaterial({
    color: 0x1a1438,
    emissive: new THREE.Color(0x241458),
    emissiveIntensity: 0.55,
    metalness: 0.75,
    roughness: 0.22,
    envMapIntensity: 1.6,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffcf5c,
    emissive: new THREE.Color(0x523200),
    emissiveIntensity: 0.45,
    metalness: 0.95,
    roughness: 0.2,
    envMapIntensity: 2.0,
  });

  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.35, 0.28, 64), pedMat);
  pedTop.position.y = -0.16;
  cakeRig.add(pedTop);

  const pedCone = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.55, 1.35, 48), pedMat);
  pedCone.position.y = -0.95;
  cakeRig.add(pedCone);

  const pedGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    new THREE.MeshStandardMaterial({
      color: 0x7df9ff,
      emissive: new THREE.Color(PALETTE.cyan),
      emissiveIntensity: 1.5,
      flatShading: true,
    })
  );
  pedGem.position.y = -1.85;
  cakeRig.add(pedGem);

  const pedRim = new THREE.Mesh(new THREE.TorusGeometry(2.56, 0.055, 12, 96), goldMat);
  pedRim.rotation.x = Math.PI / 2;
  pedRim.position.y = -0.04;
  cakeRig.add(pedRim);

  // Floating orbital pedestal rings
  const pedRing1 = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.025, 10, 160), glowBasicMat(PALETTE.cyan, 2.0, 0.65));
  pedRing1.rotation.x = Math.PI / 2;
  pedRing1.position.y = -0.25;
  cakeRig.add(pedRing1);

  const pedRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.02, 10, 160), glowBasicMat(PALETTE.violet, 2.0, 0.45));
  pedRing2.rotation.x = Math.PI / 2 + 0.14;
  pedRing2.position.y = -0.55;
  cakeRig.add(pedRing2);

  // 3 Cake Tiers
  const tiers = [
    { r: 1.95, h: 1.05, y: 0.525, body: 0x3b1f6e, em: 0x200d44, icing: 0xff9ce3, trim: PALETTE.gold },
    { r: 1.42, h: 0.92, y: 1.51, body: 0x233b7a, em: 0x0c1e4a, icing: 0x8cf6ff, trim: PALETTE.rose },
    { r: 0.96, h: 0.78, y: 2.36, body: 0x4c2178, em: 0x280d48, icing: 0xffe08a, trim: PALETTE.cyan },
  ];

  const sprinkleColors = [PALETTE.cyan, PALETTE.gold, PALETTE.rose, PALETTE.violet, PALETTE.mint];
  const sprinkleGeo = new THREE.CapsuleGeometry(0.028, 0.08, 4, 8);
  const dripGeo = new THREE.SphereGeometry(0.09, 12, 10);
  const beadGeo = new THREE.SphereGeometry(0.065, 12, 10);

  tiers.forEach((t, idx) => {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: t.body,
      emissive: new THREE.Color(t.em),
      emissiveIntensity: 0.55,
      roughness: 0.42,
      metalness: 0.15,
      envMapIntensity: 1.1,
    });
    const icingMat = new THREE.MeshStandardMaterial({
      color: t.icing,
      emissive: new THREE.Color(t.icing),
      emissiveIntensity: 0.28,
      roughness: 0.25,
      metalness: 0.12,
      envMapIntensity: 1.35,
    });

    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r * 1.02, t.h, 64), bodyMat);
    cyl.position.y = t.y;
    cakeRig.add(cyl);

    // Top icing cap
    const topY = t.y + t.h / 2;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 1.015, t.r * 1.015, 0.09, 64), icingMat);
    cap.position.y = topY;
    cakeRig.add(cap);

    // Scalloped icing rim + drips
    const rim = new THREE.Mesh(new THREE.TorusGeometry(t.r * 1.01, 0.065, 12, 72), icingMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = topY + 0.01;
    cakeRig.add(rim);

    const dripCount = 18 - idx * 3;
    for (let i = 0; i < dripCount; i++) {
      const a = (i / dripCount) * TAU + idx * 0.3;
      const len = 0.12 + (i % 3) * 0.075;
      const drip = new THREE.Mesh(dripGeo, icingMat);
      drip.scale.set(0.85, len / 0.09, 0.85);
      drip.position.set(Math.cos(a) * (t.r * 1.01), topY - len * 0.45, Math.sin(a) * (t.r * 1.01));
      cakeRig.add(drip);
    }

    // Bottom pearl piping
    const botY = t.y - t.h / 2 + 0.055;
    const beadCount = 28 - idx * 6;
    for (let i = 0; i < beadCount; i++) {
      const a = (i / beadCount) * TAU;
      const bead = new THREE.Mesh(beadGeo, goldMat);
      bead.position.set(Math.cos(a) * (t.r * 1.02), botY, Math.sin(a) * (t.r * 1.02));
      cakeRig.add(bead);
    }

    // Sprinkles on top ring
    const spCount = 24 - idx * 5;
    for (let i = 0; i < spCount; i++) {
      const a = (i / spCount) * TAU + rand(-0.1, 0.1);
      const rr = rand(t.r * 0.68, t.r * 0.94);
      const smat = new THREE.MeshStandardMaterial({
        color: sprinkleColors[i % sprinkleColors.length],
        emissive: new THREE.Color(sprinkleColors[i % sprinkleColors.length]),
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const sp = new THREE.Mesh(sprinkleGeo, smat);
      sp.position.set(Math.cos(a) * rr, topY + 0.055, Math.sin(a) * rr);
      sp.rotation.set(Math.PI / 2, rand(0, TAU), 0);
      cakeRig.add(sp);
    }
  });

  // Center star topper on top tier
  const topSurfaceY = 2.75;
  const topperGeo = new THREE.ExtrudeGeometry(starShape(0.32, 0.145), {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  topperGeo.center();
  const topperMat = new THREE.MeshStandardMaterial({
    color: 0xfff2b2,
    emissive: new THREE.Color(PALETTE.gold),
    emissiveIntensity: 1.5,
    metalness: 0.6,
    roughness: 0.15,
  });
  const topper = new THREE.Mesh(topperGeo, topperMat);
  topper.position.set(0, topSurfaceY + 0.82, 0);
  cakeRig.add(topper);
  const topperStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 12), goldMat);
  topperStem.position.set(0, topSurfaceY + 0.28, 0);
  cakeRig.add(topperStem);

  // 5 Candles arranged around the top tier
  const candleCount = 5;
  const candleRadius = 0.62;
  const candleH = 0.58;
  const candleGeo = new THREE.CylinderGeometry(0.068, 0.074, candleH, 24);
  const wickGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8);
  const flameGeo = new THREE.SphereGeometry(0.09, 20, 20);

  const flameMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: SHARED.uTime,
      uLife: { value: 1.0 },
      uWind: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uLife;
      uniform float uWind;
      varying float vH;
      varying vec3 vN;
      void main() {
        float h = clamp(position.y / 0.09 * 0.5 + 0.5, 0.0, 1.0);
        vH = h;
        vec3 p = position;
        // Teardrop pinch at top
        float pinch = mix(1.0, 0.12, pow(h, 1.35));
        p.xz *= pinch;
        p.y *= 2.15;
        // Dynamic flicker sway (use modelMatrix position for per-candle phase on all mobile GPUs)
        float phase = modelMatrix[3].x * 3.7 + modelMatrix[3].z * 2.3;
        float sway = sin(uTime * 19.0 + phase + h * 4.0) * 0.032 * h * h;
        float swayZ = cos(uTime * 15.0 + phase * 0.7 + h * 3.5) * 0.025 * h * h;
        p.x += sway + uWind * 0.18 * h * h;
        p.z += swayZ;
        p *= max(0.0001, uLife);
        vN = normalMatrix * normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLife;
      varying float vH;
      void main() {
        vec3 base = vec3(0.3, 0.7, 2.2);
        vec3 mid = vec3(2.8, 1.8, 0.45);
        vec3 tip = vec3(2.4, 0.55, 0.12);
        vec3 c = mix(base, mid, smoothstep(0.0, 0.35, vH));
        c = mix(c, tip, smoothstep(0.45, 0.95, vH));
        float a = (1.0 - smoothstep(0.82, 1.0, vH)) * uLife;
        gl_FragColor = vec4(c, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const candles = [];
  const wickPositions = [];
  for (let i = 0; i < candleCount; i++) {
    const a = (i / candleCount) * TAU + Math.PI / 5;
    const x = Math.cos(a) * candleRadius;
    const z = Math.sin(a) * candleRadius;
    const cColor = [PALETTE.cyan, PALETTE.rose, PALETTE.gold, PALETTE.violet, PALETTE.mint][i % 5];
    const cMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(cColor),
      emissiveIntensity: 0.45,
      roughness: 0.25,
    });
    const candle = new THREE.Mesh(candleGeo, cMat);
    candle.position.set(x, topSurfaceY + candleH / 2, z);
    cakeRig.add(candle);

    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.014, 8, 24),
      new THREE.MeshBasicMaterial({ color: col(cColor, 1.8) })
    );
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = 0.08;
    candle.add(stripe);

    const wick = new THREE.Mesh(wickGeo, new THREE.MeshBasicMaterial({ color: 0x221a28 }));
    wick.position.set(x, topSurfaceY + candleH + 0.04, z);
    cakeRig.add(wick);

    const flamePivot = new THREE.Group();
    flamePivot.position.set(x, topSurfaceY + candleH + 0.14, z);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flamePivot.add(flameMesh);

    const halo = makeGlow(0xffb84d, 0.85, 0.9);
    halo.position.y = 0.05;
    flamePivot.add(halo);
    cakeRig.add(flamePivot);

    candles.push({ flamePivot, flameMesh, halo, phase: i * 1.37 });
    wickPositions.push(new THREE.Vector3(x, topSurfaceY + candleH + 0.1, z));
  }

  // Dynamic PointLight representing the warm candle flames + celebratory aurora shift
  const flameLight = new THREE.PointLight(0xffb14a, 28, 18, 1.5);
  flameLight.position.set(0, topSurfaceY + 1.2, 0);
  cakeRig.add(flameLight);

  const auroraLight = new THREE.PointLight(PALETTE.cyan, 0, 26, 1.4);
  auroraLight.position.set(0, topSurfaceY + 2.2, 0);
  cakeRig.add(auroraLight);

  // Smoke particles rising from the wicks after blow-out
  const smokePerCandle = Math.round(36 * Q + 16);
  const smokeTotal = smokePerCandle * candleCount;
  const sOrigin = new Float32Array(smokeTotal * 3);
  const sSeed = new Float32Array(smokeTotal);
  for (let i = 0; i < smokeTotal; i++) {
    const w = wickPositions[i % candleCount];
    sOrigin.set([w.x, w.y, w.z], i * 3);
    sSeed[i] = Math.random();
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sOrigin, 3));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  const smokeMat = pointsMaterial(
    /* glsl */ `
    attribute float aSeed;
    uniform float uTime;
    uniform float uPointScale;
    uniform float uSmoke;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float cycle = fract(uTime * (0.28 + aSeed * 0.22) + aSeed * 11.3);
      vec3 p = position;
      p.y += cycle * 2.4;
      p.x += sin(uTime * 1.8 + aSeed * 19.0 + cycle * 6.0) * (0.04 + cycle * 0.32);
      p.z += cos(uTime * 1.5 + aSeed * 13.0 + cycle * 5.0) * (0.04 + cycle * 0.32);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float sz = mix(0.08, 0.34, cycle);
      gl_PointSize = clamp(sz * uPointScale / -mv.z, 1.0, 48.0);
      vColor = mix(vec3(0.85, 0.92, 1.0), vec3(0.55, 0.78, 1.0), cycle);
      vAlpha = sin(cycle * 3.14159) * (1.0 - cycle * 0.5) * 0.55 * uSmoke;
      gl_Position = projectionMatrix * mv;
    }`,
    { uSmoke: { value: 0 } },
    { blending: THREE.NormalBlending }
  );
  const smokePts = new THREE.Points(sGeo, smokeMat);
  smokePts.frustumCulled = false;
  cakeRig.add(smokePts);

  // Orbiting cake sparkles
  const cakeSparkles = buildSparkles({
    count: 180 * Q + 60,
    rMin: 2.2,
    rMax: 4.2,
    yRange: 2.2,
    colors: [PALETTE.gold, PALETTE.cyan, PALETTE.rose, PALETTE.white],
    size: [0.035, 0.095],
    speed: 0.25,
  });
  cakeSparkles.position.y = 1.2;
  cakeRig.add(cakeSparkles);

  const state = {
    lit: true,
    life: 1,
    smoke: 0,
    aurora: 0,
    wind: 0,
  };

  return {
    root,
    state,
    blowOut() {
      if (!state.lit) return false;
      state.lit = false;
      if (HAS_GSAP) {
        gsap.to(state, { life: 0, duration: 0.45, ease: 'power2.in' });
        gsap.fromTo(state, { smoke: 1 }, { smoke: 0.18, duration: 7, ease: 'power1.out' });
        gsap.to(state, { aurora: 1, duration: 1.4, ease: 'power2.out' });
      } else {
        state.life = 0;
        state.smoke = 0.5;
        state.aurora = 1;
      }
      return true;
    },
    relight() {
      state.lit = true;
      if (HAS_GSAP) {
        gsap.to(state, { life: 1, smoke: 0, aurora: 0, wind: 0, duration: 0.7, ease: 'back.out(1.7)' });
      } else {
        state.life = 1;
        state.smoke = 0;
        state.aurora = 0;
        state.wind = 0;
      }
    },
    update(t, dt, act) {
      cakeRig.rotation.y += dt * (0.22 + state.aurora * 0.28);
      cakeRig.position.y = Math.sin(t * 0.95) * 0.14;
      pedGem.rotation.y -= dt * 1.1;
      pedRing1.rotation.z += dt * 0.4;
      pedRing2.rotation.z -= dt * 0.3;
      topper.rotation.y += dt * (0.8 + state.aurora * 1.4);

      flameMat.uniforms.uLife.value = state.life;
      flameMat.uniforms.uWind.value = state.wind;
      smokeMat.uniforms.uSmoke.value = state.smoke;

      const flicker = 0.85 + 0.15 * Math.sin(t * 17.0) * Math.cos(t * 23.0);
      candles.forEach((c) => {
        const w = 0.88 + 0.16 * Math.sin(t * 14.0 + c.phase);
        c.flamePivot.scale.set(w, 0.9 + 0.18 * Math.cos(t * 18.0 + c.phase), w);
        c.halo.material.opacity = 0.85 * state.life * w;
        c.flamePivot.visible = state.life > 0.01;
      });

      flameLight.intensity = (24 + act * 12) * state.life * flicker;
      auroraLight.intensity = state.aurora * 36 * (0.85 + 0.15 * Math.sin(t * 2.5));
      auroraLight.color.setHSL((t * 0.08) % 1, 0.85, 0.65);
    },
  };
}

/* -------------------------------------------------------------------------
   CHAPTER 4 — Swirling 3D Galaxy / Particle Vortex
   ------------------------------------------------------------------------- */
function buildGalaxy() {
  const root = new THREE.Group();
  root.position.copy(GALAXY_POS);
  // Tilt the galactic disc so the upward-tilted camera in Ch4 views it at a dramatic angle
  root.rotation.set(1.05, 0.18, -0.22);

  const count = Math.round(6200 * Q + 1800);
  const radiusAttr = new Float32Array(count);
  const angleAttr = new Float32Array(count);
  const heightAttr = new Float32Array(count);
  const colorAttr = new Float32Array(count * 3);
  const sizeAttr = new Float32Array(count);
  const seedAttr = new Float32Array(count);
  const dummyPos = new Float32Array(count * 3);

  const coreCol = new THREE.Color(0xffe7a8).multiplyScalar(2.0);
  const midCol = new THREE.Color(PALETTE.violet).multiplyScalar(1.6);
  const outerCol = new THREE.Color(PALETTE.cyan).multiplyScalar(1.5);
  const roseCol = new THREE.Color(PALETTE.rose).multiplyScalar(1.6);
  const tmp = new THREE.Color();

  const arms = 4;
  for (let i = 0; i < count; i++) {
    const u = Math.pow(Math.random(), 1.55);
    const r = 0.4 + u * 24.0;
    const arm = (i % arms) * (TAU / arms);
    const spin = r * 0.46;
    const scatter = (Math.random() - 0.5) * (0.35 + u * 1.15);
    const a = arm + spin + scatter;
    const y = (Math.random() - 0.5) * (1.2 * Math.exp(-r * 0.12) + 0.25);

    radiusAttr[i] = r;
    angleAttr[i] = a;
    heightAttr[i] = y;
    seedAttr[i] = Math.random();
    sizeAttr[i] = rand(0.06, 0.24) * (1.15 - u * 0.5);

    if (u < 0.28) {
      tmp.copy(coreCol).lerp(roseCol, u / 0.28);
    } else if (u < 0.68) {
      tmp.copy(roseCol).lerp(midCol, (u - 0.28) / 0.4);
    } else {
      tmp.copy(midCol).lerp(outerCol, (u - 0.68) / 0.32);
    }
    colorAttr.set([tmp.r, tmp.g, tmp.b], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
  geo.setAttribute('aRadius', new THREE.BufferAttribute(radiusAttr, 1));
  geo.setAttribute('aAngle', new THREE.BufferAttribute(angleAttr, 1));
  geo.setAttribute('aHeight', new THREE.BufferAttribute(heightAttr, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colorAttr, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizeAttr, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seedAttr, 1));

  const mat = pointsMaterial(
    /* glsl */ `
    attribute float aRadius;
    attribute float aAngle;
    attribute float aHeight;
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime;
    uniform float uPointScale;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float omega = 0.28 / (0.6 + pow(aRadius, 0.65));
      float ang = aAngle + uTime * omega;
      vec3 p = vec3(cos(ang) * aRadius, aHeight + sin(uTime * 0.6 + aSeed * 12.0) * 0.08, sin(ang) * aRadius);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(aSize * uPointScale / -mv.z, 1.0, 32.0);
      float tw = 0.65 + 0.35 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 40.0);
      vColor = aColor * tw;
      vAlpha = smoothstep(26.0, 20.0, aRadius);
      gl_Position = projectionMatrix * mv;
    }`
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  root.add(pts);

  root.add(makeGlow(0xffe6a3, 14, 0.85));
  root.add(makeGlow(PALETTE.violet, 26, 0.42));

  return {
    root,
    update(t, dt) {
      root.rotation.z += dt * 0.025;
    },
  };
}

/* -------------------------------------------------------------------------
   CHAPTER 5 — Giant Floating 3D Starlight Blessing Orb
   ------------------------------------------------------------------------- */
function buildBlessingOrb() {
  const root = new THREE.Group();
  root.position.copy(ORB_POS);

  const orbRig = new THREE.Group();
  root.add(orbRig);

  // Inner animated plasma / starlight core shader
  const orbMat = new THREE.ShaderMaterial({
    defines: FBM_DEFINE,
    uniforms: {
      uTime: SHARED.uTime,
      uCharge: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uCharge;
      varying vec3 vN;
      varying vec3 vP;
      varying vec3 vEye;
      void main() {
        vP = position;
        vN = normalize(normalMatrix * normal);
        vec3 p = position * (1.0 + sin(uTime * 2.2 + length(position) * 3.0) * 0.015 * (1.0 + uCharge * 2.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vEye = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uCharge;
      varying vec3 vN;
      varying vec3 vP;
      varying vec3 vEye;
      ${NOISE_GLSL}
      void main() {
        vec3 n = normalize(vN);
        float fres = pow(1.0 - max(0.0, dot(n, normalize(vEye))), 2.2);
        float f1 = fbm(vP * 1.4 + vec3(uTime * 0.22, -uTime * 0.16, uTime * 0.12));
        float f2 = fbm(vP * 2.8 - vec3(uTime * 0.3, uTime * 0.2, -0.5) + f1);
        vec3 deep = vec3(0.08, 0.04, 0.28);
        vec3 cyan = vec3(0.45, 1.35, 1.65);
        vec3 gold = vec3(1.85, 1.35, 0.48);
        vec3 violet = vec3(1.1, 0.45, 1.75);
        vec3 col = mix(deep, violet, smoothstep(0.25, 0.75, f1));
        col = mix(col, cyan, smoothstep(0.4, 0.85, f2));
        col += gold * pow(f1 * f2, 2.2) * (1.6 + uCharge * 2.4);
        col += mix(cyan, gold, uCharge * 0.6) * fres * (1.35 + uCharge * 1.4);
        gl_FragColor = vec4(col, 0.94);
      }
    `,
    transparent: true,
  });

  const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(2.15, 5), orbMat);
  orbRig.add(coreSphere);

  // Geodesic wireframe cage
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.38, 2)),
    glowLineMat(PALETTE.cyan, 1.9, 0.55)
  );
  orbRig.add(cage);

  // 3 Gyroscopic Rings
  const gyroDefs = [
    { r: 3.05, c: PALETTE.gold, rx: 0.8, ry: 0.2, sp: 0.55 },
    { r: 3.55, c: PALETTE.cyan, rx: -0.5, ry: 0.9, sp: -0.42 },
    { r: 4.1, c: PALETTE.violet, rx: 0.3, ry: -1.1, sp: 0.32 },
  ];
  const gyros = gyroDefs.map((d) => {
    const g = new THREE.Group();
    g.rotation.set(d.rx, d.ry, 0);
    const m = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.038, 12, 180), glowBasicMat(d.c, 2.2, 0.85));
    g.add(m);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU;
      const b = makeGlow(d.c, 0.85, 0.95);
      b.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      m.add(b);
    }
    orbRig.add(g);
    return { g, m, sp: d.sp };
  });

  orbRig.add(makeGlow(PALETTE.cyan, 11, 0.55));
  orbRig.add(makeGlow(PALETTE.gold, 6.5, 0.5));

  const orbSparkles = buildSparkles({
    count: 340 * Q + 100,
    rMin: 2.6,
    rMax: 5.8,
    shell: true,
    colors: [PALETTE.cyan, PALETTE.gold, PALETTE.violet, PALETTE.white],
    size: [0.04, 0.11],
    speed: 0.3,
  });
  orbRig.add(orbSparkles);

  const orbLight = new THREE.PointLight(PALETTE.cyan, 32, 28, 1.4);
  root.add(orbLight);

  const state = { boost: 0, charge: 0 };

  return {
    root,
    state,
    triggerSpin() {
      if (HAS_GSAP) {
        gsap.killTweensOf(state);
        gsap.fromTo(state, { boost: 12, charge: 1 }, { boost: 0, charge: 0, duration: 2.4, ease: 'expo.out' });
        gsap.fromTo(orbRig.scale, { x: 1.18, y: 1.18, z: 1.18 }, { x: 1, y: 1, z: 1, duration: 1.4, ease: 'elastic.out(1, 0.45)' });
      } else {
        state.boost = 0;
        state.charge = 0;
      }
    },
    update(t, dt) {
      const mul = 1 + state.boost;
      coreSphere.rotation.y += dt * 0.35 * mul;
      coreSphere.rotation.x += dt * 0.12 * mul;
      cage.rotation.y -= dt * 0.25 * mul;
      cage.rotation.z += dt * 0.18 * mul;
      gyros.forEach((gy, i) => {
        gy.m.rotation.z += dt * gy.sp * mul;
        gy.g.rotation.x += dt * 0.15 * (i % 2 ? -1 : 1) * (0.4 + state.boost * 0.25);
      });
      orbRig.position.y = Math.sin(t * 0.85) * 0.24;
      orbMat.uniforms.uCharge.value = state.charge;
      orbLight.intensity = 30 + state.charge * 45 + Math.sin(t * 2.5) * 4;
    },
  };
}

/* -------------------------------------------------------------------------
   Procedural Web Audio API Synthesizer (Ambient Pad, Chimes & SFX)
   Zero external audio assets — 100% native Web Audio synthesis.
   ------------------------------------------------------------------------- */
function createSoundEngine() {
  let ctx = null;
  let master = null;
  let ambGain = null;
  let chimeTimer = null;
  let enabled = false;

  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      startAmbientLoop();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function startAmbientLoop() {
    if (!ctx || ambGain) return;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.0001;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    filter.Q.value = 1.2;

    // Gentle LFO modulating filter warmth
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Warm Maj9 cosmic pad (C4, E4, G4, B4, D5)
    const padNotes = [48, 55, 60, 64, 67, 71, 74];
    padNotes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = midiToFreq(n);
      osc.detune.value = (i - 3) * 4.5;
      g.gain.value = i < 2 ? 0.045 : 0.022;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    });

    filter.connect(ambGain);
    ambGain.connect(master);

    // Gentle random starlight chimes
    const pentatonic = [72, 74, 76, 79, 81, 83, 84, 86, 88, 91];
    chimeTimer = window.setInterval(() => {
      if (!enabled || !ctx || ctx.state !== 'running') return;
      if (Math.random() < 0.65) {
        playBell(pick(pentatonic), rand(0.035, 0.07), rand(1.8, 3.0));
      }
    }, 2200);
  }

  function playBell(midi, peak = 0.08, dur = 1.8, when = 0) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + when;
    const f = midiToFreq(midi);

    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const g = c.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(f, t0);
    osc2.frequency.setValueAtTime(f * 2, t0);

    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.18, t0);
    osc2.connect(g2);
    g2.connect(g);
    osc1.connect(g);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    g.connect(master);
    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + dur + 0.05);
    osc2.stop(t0 + dur + 0.05);
  }

  return {
    isEnabled: () => enabled,
    setEnabled(on) {
      enabled = !!on;
      const c = ensureCtx();
      if (c && ambGain) {
        const now = c.currentTime;
        ambGain.gain.cancelScheduledValues(now);
        ambGain.gain.setValueAtTime(Math.max(0.0001, ambGain.gain.value), now);
        ambGain.gain.exponentialRampToValueAtTime(enabled ? 0.5 : 0.0001, now + 0.6);
      }
      if (enabled) {
        playBell(72, 0.07, 1.5, 0);
        playBell(76, 0.07, 1.6, 0.12);
        playBell(79, 0.08, 1.8, 0.24);
        playBell(84, 0.09, 2.2, 0.36);
      }
    },
    toggle() {
      this.setEnabled(!enabled);
      return enabled;
    },
    playChime(midi = 79) {
      playBell(midi, 0.09, 1.8, 0);
      playBell(midi + 7, 0.05, 2.1, 0.09);
    },
    playPortalWhoosh() {
      if (!enabled) return;
      const c = ensureCtx();
      if (!c) return;
      [60, 67, 72, 76, 79, 84, 88].forEach((m, i) => playBell(m, 0.06, 2.0, i * 0.06));
    },
    playBlowOut() {
      if (!enabled) return;
      [72, 76, 79, 83, 84, 88, 91, 96].forEach((m, i) => playBell(m, 0.09, 2.3, i * 0.08));
    },
    playTypeTick() {
      if (!enabled) return;
      playBell(pick([84, 86, 88, 91, 93]), 0.018, 0.18, 0);
    },
    playOrbSpin() {
      if (!enabled) return;
      [67, 71, 74, 79, 83, 86, 91, 95].forEach((m, i) => playBell(m, 0.085, 1.9, i * 0.065));
    },
    playDodge() {
      if (!enabled) return;
      const c = ensureCtx();
      if (!c) return;
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t0);
      osc.frequency.exponentialRampToValueAtTime(760, t0 + 0.14);
      g.gain.setValueAtTime(0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    },
    playFinaleSong() {
      if (!enabled) return;
      // Happy Birthday melody in C major
      const seq = [
        [67, 0.0], [67, 0.22], [69, 0.45], [67, 0.82], [72, 1.2], [71, 1.58],
        [67, 2.2], [67, 2.42], [69, 2.65], [67, 3.02], [74, 3.4], [72, 3.78],
        [79, 4.35], [84, 4.6],
      ];
      seq.forEach(([m, t]) => playBell(m, 0.1, 1.6, t));
    },
  };
}

/* -------------------------------------------------------------------------
   Microphone Blow Detector (Web Audio API AnalyserNode — iOS & Android ready)
   ------------------------------------------------------------------------- */
function createMicDetector({ onLevel, onBlow, onError }) {
  let stream = null;
  let ctx = null;
  let rafId = 0;
  let active = false;
  let charge = 0;

  async function start() {
    if (active) return true;
    if (!window.isSecureContext) {
      onError?.('ไมโครโฟนต้องเปิดผ่าน HTTPS เท่านั้น กดปุ่ม "กดเป่าเทียนอธิษฐาน ✨" หรือแตะที่เค้กแทนได้เลย!');
      return false;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError?.('เบราว์เซอร์นี้ไม่รองรับไมโครโฟน กดปุ่ม "กดเป่าเทียนอธิษฐาน ✨" หรือแตะที่เค้กได้เลย!');
      return false;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        onError?.('อุปกรณ์ไม่รองรับระบบเสียงไมค์ กดปุ่ม "กดเป่าเทียนอธิษฐาน ✨" แทนได้เลย!');
        return false;
      }
      // Create AudioContext inside user gesture before awaiting permission
      ctx = new AC();
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      src.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      active = true;
      charge = 0;

      const tick = () => {
        if (!active) return;
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Wind/breath energy in low-to-mid frequency bins
        let sum = 0;
        const bins = 48;
        for (let i = 0; i < bins; i++) sum += freqData[i];
        const freqAvg = sum / (bins * 255);

        // Time-domain RMS amplitude (helps on mobile phones with aggressive DSP filtering)
        let sq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          sq += v * v;
        }
        const rms = Math.sqrt(sq / timeData.length);

        const level = clamp(Math.max(freqAvg * 2.35, rms * 3.2), 0, 1);
        onLevel?.(level);

        const threshold = IS_MOBILE ? 0.28 : 0.34;
        if (level > threshold) {
          charge += 0.095 + (level - threshold) * 0.28;
        } else {
          charge = Math.max(0, charge - 0.022);
        }
        if (charge >= 1) {
          stop();
          onBlow?.();
          return;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      return true;
    } catch (err) {
      stop();
      onError?.('ไม่สามารถเปิดไมค์ได้ (หรือยังไม่ได้อนุญาต) กดปุ่ม "กดเป่าเทียนอธิษฐาน ✨" หรือแตะที่เค้กแทนได้เลย!');
      return false;
    }
  }

  function stop() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
    }
  }

  return { start, stop, isActive: () => active };
}

/* -------------------------------------------------------------------------
   Confetti Burst Helper
   ------------------------------------------------------------------------- */
function burstConfetti(preset = 'standard') {
  if (typeof window.confetti !== 'function') return;
  const cf = window.confetti;
  if (preset === 'cake') {
    cf({ particleCount: 90, spread: 80, origin: { y: 0.62 }, colors: CONFETTI_COLORS });
    setTimeout(() => cf({ particleCount: 65, angle: 60, spread: 60, origin: { x: 0.1, y: 0.65 }, colors: CONFETTI_COLORS }), 180);
    setTimeout(() => cf({ particleCount: 65, angle: 120, spread: 60, origin: { x: 0.9, y: 0.65 }, colors: CONFETTI_COLORS }), 320);
  } else if (preset === 'blessing') {
    cf({ particleCount: 80, spread: 95, startVelocity: 38, origin: { y: 0.55 }, colors: CONFETTI_COLORS });
  } else if (preset === 'finale') {
    const end = performance.now() + 3400;
    const frame = () => {
      cf({
        particleCount: 7,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.65 },
        colors: CONFETTI_COLORS,
      });
      cf({
        particleCount: 7,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.65 },
        colors: CONFETTI_COLORS,
      });
      if (performance.now() < end) requestAnimationFrame(frame);
    };
    cf({ particleCount: 120, spread: 110, origin: { y: 0.5 }, colors: CONFETTI_COLORS });
    requestAnimationFrame(frame);
  }
}

/* -------------------------------------------------------------------------
   DOM Setup & Application Boot
   ------------------------------------------------------------------------- */
function populateDOM() {
  const nameTh = $('#hero-name-th');
  if (nameTh) nameTh.textContent = `(${BIRTHDAY_CONFIG.recipientName})`;
  const heroSub = $('#hero-subtitle');
  if (heroSub) heroSub.textContent = BIRTHDAY_CONFIG.heroSubtitle;

  const wishHost = $('#wish-overlays');
  if (wishHost) {
    wishHost.innerHTML = '';
    BIRTHDAY_CONFIG.wishNodes.forEach((node, i) => {
      const meta = SHAPE_META[node.shape] || SHAPE_META.crystal;
      const [a, b] = WISH_RANGES[i];
      // Sculpture is at x < 0 for even i (left side of screen), so put card on the opposite side!
      const sideClass = i % 2 === 0 ? 'overlay--right' : 'overlay--left';
      const num = String(i + 1).padStart(2, '0');
      const wrap = document.createElement('div');
      wrap.className = `overlay overlay--side ${sideClass}`;
      wrap.dataset.show = `${a},${b}`;
      wrap.dataset.wishIndex = String(i);
      wrap.innerHTML = `
        <article class="glass-card backdrop-blur-md bg-white/10 border border-white/20" data-accent="${meta.accent}">
          <div class="wish-head">
            <span class="wish-num">${num}</span>
            <div class="wish-meta">
              <p class="card-kicker font-jakarta">CHAPTER 02 · WISH ARTIFACT ${num}</p>
              <span class="wish-shape">${meta.label}</span>
            </div>
          </div>
          <h3 class="card-title">${node.title}</h3>
          <p class="card-text">${node.text}</p>
          <div class="buff-bar" aria-hidden="true">
            <span>LUCK BUFF +100%</span>
            <div class="buff-track"><i></i></div>
          </div>
        </article>
      `;
      wishHost.appendChild(wrap);
    });
  }
}

function initApp() {
  populateDOM();

  const sound = createSoundEngine();
  const canvas = $('#webgl');
  const loaderBar = $('#loader-bar i');
  const loaderStatus = $('#loader-status');
  const enterBtns = $('#enter-buttons');
  const loaderEl = $('#loader');

  const setLoadProgress = (pct, msg) => {
    if (loaderBar) loaderBar.style.width = `${pct}%`;
    if (msg && loaderStatus) loaderStatus.textContent = msg;
  };
  setLoadProgress(25, 'กำลังสร้างดวงดาวและเนบิวลา 3 มิติ...');

  /* ---------- Three.js Renderer, Scene, Camera, Postprocessing ---------- */
  let renderer = null;
  let composer = null;
  let bloomPass = null;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(PALETTE.indigo, 0.0085);

  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(0, 0.2, 11);

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !IS_MOBILE,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    GLOW_TEX = makeGlowTexture();
    scene.environment = buildEnvironment(renderer);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      IS_MOBILE ? 0.65 : 0.82,
      0.55,
      0.22
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
  } catch (err) {
    console.warn('WebGL fallback mode:', err);
  }

  setLoadProgress(55, 'กำลังเสกคริสตัล จรวด มงกุฎ และเค้กวันเกิด...');

  /* ---------- Build 3D World Objects ---------- */
  const ambientLight = new THREE.AmbientLight(0x8878ff, 0.65);
  scene.add(ambientLight);
  const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.45);
  keyLight.position.set(12, 24, 16);
  scene.add(keyLight);

  let nebula = null;
  let portal = null;
  let corridor = null;
  const sculptures = [];
  let cake = null;
  let galaxy = null;
  let blessingOrb = null;

  if (renderer) {
    nebula = buildNebula();
    scene.add(nebula);
    scene.add(buildStarfield());
    scene.add(buildBokeh());
    scene.add(buildCorridorDust());

    corridor = buildCorridor();
    scene.add(corridor.group);

    portal = buildPortal();
    scene.add(portal.group);

    BIRTHDAY_CONFIG.wishNodes.forEach((node, i) => {
      const builder = SCULPTURE_BUILDERS[node.shape] || buildEnergyCrystal;
      const sc = builder();
      sc.root.position.copy(WISH_POS[i]);
      const light = new THREE.PointLight(sc.lightColor, sc.lightBase, 22, 1.5);
      sc.root.add(light);
      sc.light = light;
      scene.add(sc.root);
      sculptures.push(sc);
    });

    cake = buildCake();
    scene.add(cake.root);

    galaxy = buildGalaxy();
    scene.add(galaxy.root);

    blessingOrb = buildBlessingOrb();
    scene.add(blessingOrb.root);
  }

  setLoadProgress(85, 'กำลังเชื่อมต่อเส้นทางกล้อง 3 มิติ...');

  /* ---------- Camera Path Splines & Master Scrub Rig ---------- */
  // Desktop widescreen curves (side-by-side sculpture + card)
  const corridorPosCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, -18),
    new THREE.Vector3(1.15, 0.4, WISH_POS[0].z + 5.8),
    new THREE.Vector3(-1.15, 1.0, WISH_POS[1].z + 5.8),
    new THREE.Vector3(1.15, 0.5, WISH_POS[2].z + 5.8),
    new THREE.Vector3(-1.15, 0.3, WISH_POS[3].z + 5.8),
    new THREE.Vector3(0, 0.8, CAKE_POS.z + 11.5),
  ]);
  const corridorLookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, -30),
    WISH_POS[0].clone().add(new THREE.Vector3(1.1, 0, 0)),
    WISH_POS[1].clone().add(new THREE.Vector3(-1.1, 0, 0)),
    WISH_POS[2].clone().add(new THREE.Vector3(1.1, 0, 0)),
    WISH_POS[3].clone().add(new THREE.Vector3(-1.1, 0, 0)),
    CAKE_LOOK.clone(),
  ]);

  // Portrait mobile curves: center sculptures horizontally in the upper half of the phone screen
  const corridorPosCurvePortrait = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, -17),
    new THREE.Vector3(WISH_POS[0].x * 0.45, WISH_POS[0].y + 0.15, WISH_POS[0].z + 7.6),
    new THREE.Vector3(WISH_POS[1].x * 0.45, WISH_POS[1].y + 0.15, WISH_POS[1].z + 7.6),
    new THREE.Vector3(WISH_POS[2].x * 0.45, WISH_POS[2].y + 0.15, WISH_POS[2].z + 7.6),
    new THREE.Vector3(WISH_POS[3].x * 0.45, WISH_POS[3].y + 0.15, WISH_POS[3].z + 7.6),
    new THREE.Vector3(0, 1.1, CAKE_POS.z + 13.0),
  ]);
  const corridorLookCurvePortrait = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.1, -30),
    WISH_POS[0].clone().add(new THREE.Vector3(0, -1.05, 0)),
    WISH_POS[1].clone().add(new THREE.Vector3(0, -1.05, 0)),
    WISH_POS[2].clone().add(new THREE.Vector3(0, -1.05, 0)),
    WISH_POS[3].clone().add(new THREE.Vector3(0, -1.05, 0)),
    CAKE_LOOK.clone().add(new THREE.Vector3(0, -1.15, 0)),
  ]);

  const rig = {
    p: 0,
    align: 0,
    expand: 0,
    burst: 0,
    shrink: 0,
    flash: 0,
    finaleSpin: 0,
  };

  /* ---------- Lenis + GSAP ScrollTrigger Setup ---------- */
  // On touch/mobile devices, native OS momentum scrolling is smoother and never traps touch inside cards
  let lenis = null;
  if (typeof window.Lenis !== 'undefined' && !IS_TOUCH) {
    lenis = new window.Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
    });
  }

  if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#journey',
        start: 'top top',
        end: 'bottom bottom',
        scrub: IS_MOBILE ? 0.65 : 1.5,
      },
    });
    tl.to(rig, { p: 1, duration: 1, ease: 'none' }, 0);
    tl.to(rig, { align: 1, duration: 0.09, ease: 'power2.inOut' }, 0.015);
    tl.to(rig, { expand: 1, burst: 1, duration: 0.11, ease: 'power2.in' }, 0.075);
    tl.to(rig, { shrink: 1, duration: 0.055, ease: 'power2.in' }, 0.105);
    tl.to(rig, { flash: 1, duration: 0.025, ease: 'power2.in' }, 0.115);
    tl.to(rig, { flash: 0, duration: 0.055, ease: 'power2.out' }, 0.14);
  }

  /* ---------- Overlays, Navigation Dots, Quick-Step Dock, Typewriter ---------- */
  const overlays = $$('.overlay[data-show]').map((el) => {
    const [a, b] = el.dataset.show.split(',').map(Number);
    const wishIdx = el.dataset.wishIndex !== undefined ? Number(el.dataset.wishIndex) : -1;
    return { el, a, b, wishIdx, wasActive: false };
  });
  const navBtns = $$('#chapter-nav button');
  const progressBar = $('#progress-line i');
  const flashEl = $('#flash');

  // 8-stop journey stations for effortless mobile & desktop stepping
  const JOURNEY_STOPS = [
    { p: 0.0, label: 'ประตูมิติ ✨' },
    ...BIRTHDAY_CONFIG.wishNodes.map((w, i) => ({
      p: +((WISH_RANGES[i][0] + WISH_RANGES[i][1]) * 0.5).toFixed(4),
      label: `พรที่ ${i + 1} · ${w.title.split('!')[0].slice(0, 14)}`,
    })),
    { p: 0.65, label: 'เป่าเทียนเค้ก 🎂' },
    { p: 0.83, label: 'จดหมายจากใจ 📜' },
    { p: 0.975, label: 'ลูกแก้วแห่งพร 🔮' },
  ];

  const stepPrevBtn = $('#step-prev');
  const stepNextBtn = $('#step-next');
  const stepIndicatorBtn = $('#step-indicator');
  const stepBadge = $('#step-badge');
  const stepName = $('#step-name');
  const scrollCta = $('#scroll-cta');

  const scrollToProgress = (targetP) => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const y = clamp(targetP, 0, 1) * maxScroll;
    if (lenis) lenis.scrollTo(y, { duration: 1.35 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  function getActiveStopIndex(p) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < JOURNEY_STOPS.length; i++) {
      const d = Math.abs(p - JOURNEY_STOPS[i].p);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  let currentStopIdx = 0;
  function syncStepDock(p) {
    const idx = getActiveStopIndex(p);
    if (idx !== currentStopIdx || stepBadge?.textContent === '1/8') {
      currentStopIdx = idx;
      if (stepBadge) stepBadge.textContent = `${idx + 1}/${JOURNEY_STOPS.length}`;
      if (stepName) stepName.textContent = JOURNEY_STOPS[idx].label;
    }
    if (stepPrevBtn) stepPrevBtn.disabled = p < 0.03;
    if (stepNextBtn) stepNextBtn.disabled = p > 0.95;
  }

  stepPrevBtn?.addEventListener('click', () => {
    const idx = Math.max(0, getActiveStopIndex(rig.p) - 1);
    scrollToProgress(JOURNEY_STOPS[idx].p);
  });
  stepNextBtn?.addEventListener('click', () => {
    const idx = Math.min(JOURNEY_STOPS.length - 1, getActiveStopIndex(rig.p) + 1);
    scrollToProgress(JOURNEY_STOPS[idx].p);
  });
  stepIndicatorBtn?.addEventListener('click', () => {
    const nextIdx = (getActiveStopIndex(rig.p) + 1) % JOURNEY_STOPS.length;
    scrollToProgress(JOURNEY_STOPS[nextIdx].p);
  });
  scrollCta?.addEventListener('click', () => {
    scrollToProgress(JOURNEY_STOPS[1]?.p ?? 0.25);
  });

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.goto || 0);
      scrollToProgress(CHAPTER_FOCUS[idx] ?? 0);
    });
  });

  // Typewriter for Chapter 4
  const letterCard = $('#letter-card');
  const letterTyped = $('#letter-typed');
  const graphemes =
    typeof Intl !== 'undefined' && Intl.Segmenter
      ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(BIRTHDAY_CONFIG.letterText)].map((s) => s.segment)
      : [...BIRTHDAY_CONFIG.letterText];

  let typeIndex = 0;
  let typeTimer = 0;
  let typeStarted = false;
  let typeDone = false;

  function finishTypewriter() {
    if (typeTimer) clearTimeout(typeTimer);
    typeTimer = 0;
    typeStarted = true;
    typeDone = true;
    typeIndex = graphemes.length;
    if (letterTyped) letterTyped.textContent = BIRTHDAY_CONFIG.letterText;
    letterCard?.classList.add('is-done');
  }

  function stepTypewriter() {
    if (typeDone) return;
    if (typeIndex < graphemes.length) {
      typeIndex++;
      if (letterTyped) letterTyped.textContent = graphemes.slice(0, typeIndex).join('');
      if (typeIndex % 3 === 0) sound.playTypeTick();
      const ch = graphemes[typeIndex - 1];
      const delay = ch === ' ' || ch === '!' ? 55 : 26;
      typeTimer = window.setTimeout(stepTypewriter, delay);
    } else {
      finishTypewriter();
    }
  }

  function startTypewriter() {
    if (typeStarted) return;
    typeStarted = true;
    stepTypewriter();
  }

  letterCard?.addEventListener('click', finishTypewriter);
  letterCard?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finishTypewriter();
    }
  });

  /* ---------- Chapter 3: Candle Blow-Out & Microphone Controls ---------- */
  const btnMic = $('#btn-mic');
  const btnBlow = $('#btn-blow');
  const btnRelight = $('#btn-relight');
  const cakeTitle = $('#cake-title');
  const cakeText = $('#cake-text');
  const cakeActions = $('#cake-actions');
  const cakeAfter = $('#cake-after');
  const micMeter = $('#mic-meter');
  const micFill = $('#mic-meter-fill');
  const micStatus = $('#mic-status');

  const mic = createMicDetector({
    onLevel(lv) {
      if (micFill) micFill.style.width = `${Math.round(lv * 100)}%`;
      if (cake) cake.state.wind = lv * 1.4;
    },
    onBlow() {
      extinguishCandles('mic');
    },
    onError(msg) {
      if (micMeter) micMeter.hidden = false;
      if (micStatus) micStatus.textContent = msg;
    },
  });

  function extinguishCandles(source = 'click') {
    mic.stop();
    if (cake && !cake.blowOut()) return;
    sound.playBlowOut();
    burstConfetti('cake');
    if (nebula) {
      if (HAS_GSAP) gsap.to(nebula.material.uniforms.uAurora, { value: 1, duration: 1.5 });
      else nebula.material.uniforms.uAurora.value = 1;
    }
    if (cakeTitle) cakeTitle.textContent = 'คำอธิษฐานของแอนฟิวถูกส่งขึ้นสู่ดวงดาวแล้ว! 🌟';
    if (cakeText) {
      cakeText.textContent =
        source === 'mic'
          ? 'พลังลมเป่าสุดยอด! ขอให้ทุกสิ่งที่แอนฟิวอธิษฐานไว้เป็นจริงทุกประการ ✨'
          : 'เทียนดับลงพร้อมแสงออโรร่าแห่งการเริ่มต้นใหม่ ขอให้สมหวังทุกเรื่องเลยนะ ✨';
    }
    if (micMeter) micMeter.hidden = true;
    if (cakeActions) cakeActions.hidden = true;
    if (cakeAfter) cakeAfter.hidden = false;
  }

  btnBlow?.addEventListener('click', () => extinguishCandles('click'));
  btnMic?.addEventListener('click', async () => {
    if (micMeter) micMeter.hidden = false;
    if (micStatus) micStatus.textContent = 'กำลังฟังเสียงลม... เป่าใส่ไมค์แรงๆ เลย 💨';
    await mic.start();
  });
  btnRelight?.addEventListener('click', () => {
    cake?.relight();
    sound.playChime(79);
    if (nebula) {
      if (HAS_GSAP) gsap.to(nebula.material.uniforms.uAurora, { value: 0, duration: 1.0 });
      else nebula.material.uniforms.uAurora.value = 0;
    }
    if (cakeTitle) cakeTitle.textContent = 'ถึงเวลาอธิษฐานแล้ว 🎂';
    if (cakeText) cakeText.textContent = 'หลับตา อธิษฐานในใจให้เต็มที่ แล้วเป่าเทียนให้ดับทุกเล่มเลย! (แตะที่เค้ก 3 มิติเพื่อเป่าก็ได้นะ)';
    if (cakeActions) cakeActions.hidden = false;
    if (cakeAfter) cakeAfter.hidden = true;
  });

  /* ---------- Chapter 5: Random Blessing Generator & Runaway Button ---------- */
  const btnBlessing = $('#btn-blessing');
  const blessingModal = $('#blessing-modal');
  const blessingText = $('#blessing-text');
  const blessingAgain = $('#blessing-again');
  const blessingClose = $('#blessing-close');
  let lastBlessingIdx = -1;

  function rollBlessing() {
    const list = BIRTHDAY_CONFIG.randomBlessings;
    let idx = Math.floor(Math.random() * list.length);
    if (list.length > 1 && idx === lastBlessingIdx) idx = (idx + 1) % list.length;
    lastBlessingIdx = idx;

    blessingOrb?.triggerSpin();
    sound.playOrbSpin();
    burstConfetti('blessing');

    if (blessingText) {
      blessingText.classList.remove('is-reveal');
      void blessingText.offsetWidth;
      blessingText.textContent = list[idx];
      blessingText.classList.add('is-reveal');
    }
    if (blessingModal) {
      blessingModal.hidden = false;
      blessingModal.classList.remove('is-closing');
    }
  }

  function closeModal(modalEl) {
    if (!modalEl || modalEl.hidden) return;
    modalEl.classList.add('is-closing');
    setTimeout(() => {
      modalEl.hidden = true;
      modalEl.classList.remove('is-closing');
    }, 280);
  }

  btnBlessing?.addEventListener('click', rollBlessing);
  blessingAgain?.addEventListener('click', rollBlessing);
  blessingClose?.addEventListener('click', () => closeModal(blessingModal));
  blessingModal?.addEventListener('click', (e) => {
    if (e.target === blessingModal) closeModal(blessingModal);
  });

  // Direct tap on 3D stage (Canvas) for Cake (Ch3) and Blessing Orb (Ch5)
  let stageTapStart = null;
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target !== canvas && !e.target.classList?.contains('overlay')) return;
      stageTapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    { passive: true }
  );
  window.addEventListener(
    'pointerup',
    (e) => {
      if (!stageTapStart) return;
      const dist = Math.hypot(e.clientX - stageTapStart.x, e.clientY - stageTapStart.y);
      const dt = performance.now() - stageTapStart.t;
      stageTapStart = null;
      if (dist > 28 || dt > 550) return;
      if (!loaderEl?.classList.contains('is-hidden')) return;
      if (!blessingModal?.hidden || !finaleModal?.hidden || !shareModal?.hidden) return;

      // Check if tap was outside any visible glass-card
      if (e.target.closest?.('.glass-card, .hud-top, #chapter-nav, #step-dock, .modal')) return;

      if (rig.p >= RANGES.cake[0] && rig.p <= RANGES.cake[1]) {
        if (cake?.state.lit) extinguishCandles('click');
      } else if (rig.p >= RANGES.finale[0]) {
        rollBlessing();
      }
    },
    { passive: true }
  );

  // Playful Runaway Button ("ยังไม่พร้อมอะ") — safe bounds for mobile & desktop
  const btnRunaway = $('#btn-runaway');
  const btnReady = $('#btn-ready');
  const tauntEl = $('#runaway-taunt');
  let dodgeCount = 0;

  function dodgeRunaway(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dodgeCount++;
    sound.playDodge();
    if (tauntEl) {
      tauntEl.textContent = BIRTHDAY_CONFIG.runawayTaunts[(dodgeCount - 1) % BIRTHDAY_CONFIG.runawayTaunts.length];
    }
    if (btnReady) {
      const grow = Math.min(1.18, 1 + dodgeCount * 0.03);
      btnReady.style.transform = `scale(${grow})`;
    }
    if (!btnRunaway) return;
    // Compute a safe offset that stays inside the viewport/card on both mobile and desktop
    const maxX = Math.min(95, Math.max(36, window.innerWidth * 0.18));
    const maxY = IS_MOBILE ? 36 : 56;
    const dirX = dodgeCount % 2 === 0 ? 1 : -1;
    const dx = rand(28, maxX) * dirX;
    const dy = rand(-maxY, maxY * 0.55);
    const rot = rand(-12, 12);
    btnRunaway.style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${rot.toFixed(1)}deg)`;
  }

  btnRunaway?.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'touch') dodgeRunaway(e);
  });
  btnRunaway?.addEventListener('touchstart', dodgeRunaway, { passive: false });
  btnRunaway?.addEventListener('click', dodgeRunaway);

  // Ready Button ("พร้อมรับความปัง!") -> Grand Finale
  const finaleModal = $('#finale-modal');
  const finaleReplay = $('#finale-replay');
  const finaleClose = $('#finale-close');

  btnReady?.addEventListener('click', () => {
    sound.playFinaleSong();
    burstConfetti('finale');
    blessingOrb?.triggerSpin();
    if (nebula && HAS_GSAP) gsap.to(nebula.material.uniforms.uAurora, { value: 1, duration: 1.2 });
    if (HAS_GSAP) {
      gsap.fromTo(rig, { finaleSpin: 0 }, { finaleSpin: TAU, duration: 3.4, ease: 'power2.inOut' });
    }
    if (finaleModal) {
      finaleModal.hidden = false;
      finaleModal.classList.remove('is-closing');
    }
  });
  finaleClose?.addEventListener('click', () => closeModal(finaleModal));
  finaleReplay?.addEventListener('click', () => {
    closeModal(finaleModal);
    scrollToProgress(0);
  });

  /* ---------- Share & Mobile QR Modal ---------- */
  const PUBLIC_WEB_URL = 'https://hunhups-hub.github.io/hbb-ewfan/';
  const shareToggle = $('#share-toggle');
  const shareModal = $('#share-modal');
  const shareQrImg = $('#share-qr-img');
  const shareUrlInput = $('#share-url-input');
  const shareCopyBtn = $('#share-copy');
  const shareNativeBtn = $('#share-native');
  const shareCloseBtn = $('#share-close');

  function getShareableUrl() {
    const href = window.location.href;
    if (href.startsWith('file:') || href.includes('localhost') || href.includes('127.0.0.1')) {
      return PUBLIC_WEB_URL;
    }
    return href;
  }

  function openShareModal() {
    const url = getShareableUrl();
    if (shareUrlInput) shareUrlInput.value = url;
    if (shareQrImg) {
      const encoded = encodeURIComponent(url);
      shareQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encoded}`;
    }
    if (shareNativeBtn) {
      shareNativeBtn.hidden = typeof navigator.share !== 'function';
    }
    if (shareModal) {
      shareModal.hidden = false;
      shareModal.classList.remove('is-closing');
    }
    sound.playChime(84);
  }

  shareToggle?.addEventListener('click', openShareModal);
  shareCloseBtn?.addEventListener('click', () => closeModal(shareModal));
  shareModal?.addEventListener('click', (e) => {
    if (e.target === shareModal) closeModal(shareModal);
  });
  shareCopyBtn?.addEventListener('click', async () => {
    const url = getShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      if (shareUrlInput) {
        shareUrlInput.select();
        document.execCommand('copy');
      }
    }
    if (shareCopyBtn) {
      const prev = shareCopyBtn.textContent;
      shareCopyBtn.textContent = 'คัดลอกลิงก์แล้ว! ✅';
      setTimeout(() => {
        shareCopyBtn.textContent = prev;
      }, 2000);
    }
    sound.playChime(88);
  });
  shareNativeBtn?.addEventListener('click', async () => {
    const url = getShareableUrl();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: "Happy Birthday แอนฟิว ✦ Anfield's Cosmic Universe",
          text: 'สุขสันต์วันเกิดนะแอนฟิว! เข้ามาดูจักรวาลวันเกิด 3 มิติของนายได้เลย ✨🎂',
          url,
        });
      } catch {
        // user cancelled share sheet
      }
    }
  });

  /* ---------- Sound Toggle & Loader Entry Gate ---------- */
  const soundToggle = $('#sound-toggle');
  const soundLabel = $('#sound-label');
  function syncSoundUI(on) {
    soundToggle?.classList.toggle('is-on', on);
    soundToggle?.setAttribute('aria-pressed', String(on));
    if (soundLabel) soundLabel.textContent = on ? 'เปิดเสียงอยู่' : 'เปิดเสียง';
  }
  soundToggle?.addEventListener('click', () => {
    syncSoundUI(sound.toggle());
  });

  function enterExperience(withSound) {
    sound.setEnabled(withSound);
    syncSoundUI(withSound);
    loaderEl?.classList.add('is-hidden');
  }
  $('#enter-sound')?.addEventListener('click', () => enterExperience(true));
  $('#enter-silent')?.addEventListener('click', () => enterExperience(false));

  setLoadProgress(100, 'จักรวาลของแอนฟิวพร้อมแล้ว ✨');
  if (enterBtns) enterBtns.hidden = false;
  window.__APP_READY__ = true;

  /* ---------- Pointer / Touch / Gyroscope Parallax & Resize Handling ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.ty = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      const t0 = e.touches && e.touches[0];
      if (!t0) return;
      pointer.tx = (t0.clientX / Math.max(1, window.innerWidth) - 0.5) * 1.4;
      pointer.ty = (t0.clientY / Math.max(1, window.innerHeight) - 0.5) * 1.2;
    },
    { passive: true }
  );
  window.addEventListener(
    'deviceorientation',
    (e) => {
      if (e.gamma == null || e.beta == null) return;
      pointer.tx = clamp(e.gamma / 30, -1, 1);
      pointer.ty = clamp((e.beta - 45) / 35, -1, 1);
    },
    { passive: true }
  );

  function updateSizing() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / Math.max(1, h);
    camera.aspect = aspect;
    // Dynamically widen vertical FOV on narrow portrait phone screens so horizontal FOV fits 3D sculptures
    camera.fov = aspect < 0.85 ? clamp(52 + (0.85 - aspect) * 38, 56, 68) : 52;
    camera.updateProjectionMatrix();
    SHARED.uPointScale.value = h * 0.55;
    if (renderer) {
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    }
  }
  updateSizing();
  window.addEventListener('resize', updateSizing);

  /* ---------- Camera Pose Evaluation Across the 5 Scroll Chapters ---------- */
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const portalTriggered = { value: false };

  function evaluateCamera(p, t) {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const isPortrait = aspect < 0.85;

    if (p <= 0.2) {
      // Chapter 1: Float before Portal Crystal, then fly straight through at p ~ 0.12
      const u = range(p, 0, 0.2);
      const fly = Math.pow(u, 1.85);
      const startZ = isPortrait ? 13.4 : 11.0;
      const z = lerp(startZ, -18.0, fly);
      const y = lerp(0.2, 0.5, u) + Math.sin(t * 0.7) * 0.12 * (1 - u);
      const x = Math.cos(t * 0.5) * 0.14 * (1 - u);
      camPos.set(x, y, z);
      camLook.set(0, lerp(isPortrait ? -0.25 : 0.0, 0.4, u), lerp(0.0, -30.0, u));
    } else if (p <= 0.55) {
      // Chapter 2: Smooth curved path past the 4 symbolic sculptures
      const u = range(p, 0.2, 0.55);
      if (isPortrait) {
        corridorPosCurvePortrait.getPointAt(u, camPos);
        corridorLookCurvePortrait.getPointAt(u, camLook);
      } else {
        corridorPosCurve.getPointAt(u, camPos);
        corridorLookCurve.getPointAt(u, camLook);
      }
    } else if (p <= 0.75) {
      // Chapter 3: Orbit & zoom in front of the 3D Multi-Tier Birthday Cake
      const u = smooth(range(p, 0.55, 0.75));
      const ang = lerp(-0.35, 0.38, u);
      const dist = isPortrait ? lerp(12.8, 10.2, Math.sin(u * Math.PI)) : lerp(10.8, 7.6, Math.sin(u * Math.PI));
      const sideOffset = isPortrait ? 0 : 1.75; // shift camera right on desktop so cake frames on the left opposite the right-hand card
      camPos.set(
        CAKE_POS.x + Math.sin(ang) * dist + sideOffset,
        CAKE_POS.y + lerp(2.1, 2.55, u),
        CAKE_POS.z + Math.cos(ang) * dist
      );
      camLook.copy(CAKE_LOOK);
      if (!isPortrait) camLook.x += 1.05;
      else camLook.y -= 1.25;
    } else if (p <= 0.9) {
      // Chapter 4: Tilt upward toward the swirling 3D Galaxy / Particle Vortex
      const u = smooth(range(p, 0.75, 0.9));
      const enter = smooth(range(p, 0.75, 0.79));
      tmpA.set(CAKE_POS.x + (isPortrait ? 0 : 1.5), CAKE_POS.y + 2.5, CAKE_POS.z + (isPortrait ? 10.2 : 8.2));
      tmpB.lerpVectors(LETTER_CAM_A, LETTER_CAM_B, u);
      camPos.lerpVectors(tmpA, tmpB, enter);
      tmpA.copy(CAKE_LOOK);
      tmpB.copy(GALAXY_POS);
      if (isPortrait) tmpB.y -= 5.0;
      camLook.lerpVectors(tmpA, tmpB, enter);
    } else {
      // Chapter 5: Glide up to the Giant Floating 3D Starlight Blessing Orb
      const u = smooth(range(p, 0.9, 1.0));
      const spinA = rig.finaleSpin;
      const baseDist = isPortrait ? 12.6 : 9.4;
      const sideShift = isPortrait ? 0 : -2.1; // card is on left on desktop, so frame orb on the right
      tmpA.copy(LETTER_CAM_B);
      tmpB.set(
        ORB_POS.x + Math.sin(spinA) * baseDist + sideShift,
        ORB_POS.y + (isPortrait ? -0.3 : 0.2),
        ORB_POS.z + Math.cos(spinA) * baseDist
      );
      camPos.lerpVectors(tmpA, tmpB, u);
      tmpA.copy(GALAXY_POS);
      tmpB.copy(ORB_POS);
      if (!isPortrait) tmpB.x -= 1.25;
      else tmpB.y -= 1.55;
      camLook.lerpVectors(tmpA, tmpB, u);
    }

    // Subtle pointer parallax
    if (!REDUCED_MOTION) {
      camPos.x += pointer.x * 0.28;
      camPos.y += -pointer.y * 0.2;
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  /* ---------- Render & Animation Loop ---------- */
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const t = now * 0.001;
    SHARED.uTime.value = t;

    if (!HAS_GSAP) {
      const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      rig.p = clamp(window.scrollY / maxS, 0, 1);
      rig.align = smooth(range(rig.p, 0.015, 0.105));
      rig.expand = smooth(range(rig.p, 0.075, 0.185));
      rig.burst = rig.expand;
      rig.shrink = smooth(range(rig.p, 0.105, 0.16));
    }

    pointer.x = lerp(pointer.x, pointer.tx, 0.06);
    pointer.y = lerp(pointer.y, pointer.ty, 0.06);

    const p = rig.p;

    // Portal sound cue when flying through
    if (p > 0.1 && p < 0.16 && !portalTriggered.value) {
      portalTriggered.value = true;
      sound.playPortalWhoosh();
    } else if (p < 0.05) {
      portalTriggered.value = false;
    }

    // Update HUD progress bar, chapter nav dots & quick-step dock
    if (progressBar) progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (flashEl) flashEl.style.opacity = String(rig.flash.toFixed(3));

    const activeCh = p < 0.2 ? 0 : p < 0.55 ? 1 : p < 0.75 ? 2 : p < 0.9 ? 3 : 4;
    navBtns.forEach((b, idx) => b.classList.toggle('is-active', idx === activeCh));
    syncStepDock(p);

    // Update fixed HTML overlay visibility & chimes
    overlays.forEach((ov) => {
      const w = fadeWindow(p, ov.a, ov.b, 0.016);
      const vis = w > 0.01;
      ov.el.classList.toggle('is-visible', vis);
      ov.el.classList.toggle('is-interactive', w > 0.45);
      ov.el.classList.toggle('is-active', w > 0.55);
      ov.el.style.opacity = w.toFixed(3);

      if (w > 0.6 && !ov.wasActive) {
        ov.wasActive = true;
        if (ov.wishIdx >= 0) {
          const shape = BIRTHDAY_CONFIG.wishNodes[ov.wishIdx]?.shape;
          sound.playChime(SHAPE_META[shape]?.note || 79);
        }
      } else if (w < 0.2) {
        ov.wasActive = false;
      }
    });

    // Trigger Chapter 4 Typewriter when scrolled into view
    if (p >= RANGES.letter[0] - 0.01 && p <= RANGES.letter[1] + 0.01) {
      startTypewriter();
    }

    // Update 3D scene
    evaluateCamera(p, t);
    if (nebula) {
      nebula.position.copy(camera.position);
      nebula.material.uniforms.uWarm.value = 0.25 + fadeWindow(p, 0.52, 0.76, 0.05) * 0.65;
    }
    portal?.update(t, dt, rig);
    corridor?.update(t, dt, fadeWindow(p, 0.16, 0.58, 0.05));

    sculptures.forEach((sc, i) => {
      const [a, b] = WISH_RANGES[i];
      const act = fadeWindow(p, a, b, 0.03);
      const mul = sc.update(t, dt, act);
      sc.light.intensity = sc.lightBase * (0.45 + act * 0.95) * mul;
    });

    cake?.update(t, dt, fadeWindow(p, RANGES.cake[0], RANGES.cake[1], 0.04));
    galaxy?.update(t, dt);
    blessingOrb?.update(t, dt);

    if (composer) composer.render();
    else if (renderer) renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
