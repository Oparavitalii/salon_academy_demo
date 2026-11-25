/**
 * Benefits_Scene — the 3D block of `/courses` «Переваги навчання» (owner 01.11.2026: «перероби … на
 * 3d візуалізацію», picked «Справжній 3D (Three.js)»). Built by kl Skills/Web_Effects/Web_3D_Scroll_Site:
 * one canvas, lazy chunk (this file is only reached through `import()`), tiers low / mid (never `off`
 * once running), DPR cap, no CDN (RoomEnvironment is generated locally), pause off screen,
 * context loss → the poster.
 *
 * Scene: four glossy photo prints in a 3D coverflow. The scroll position of the text steps
 * (`getProgress`, 0…n-1, continuous) slides the row so the step being read faces the camera; its
 * neighbours stand turned ~46° and back, the far ones fade into the fog. Pink dust, a soft
 * round floor shadow, ACES tone mapping, pointer parallax on a mouse.
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type SceneTier = 'low' | 'mid';

type Options = {
  canvas: HTMLCanvasElement;
  images: string[];
  /** 0 … images.length - 1, continuous — read every frame, never pushed. */
  getProgress: () => number;
  tier: SceneTier;
  /** CSS colours of the section, so fog and shadow melt into the page. */
  background: string;
  accent: string;
  /** First frame drawn → the page swaps the poster for the canvas. */
  onLive: () => void;
  /** Context lost → the page shows the poster again. */
  onLost: () => void;
};

const CARD_W = 1.6;
const CARD_H = 2.0;
/** Coverflow: the front print at FRONT_Z; a neighbour sits SIDE_X aside, BACK_Z behind, turned TURN rad. */
const FRONT_Z = 1.6;
const SIDE_X = 1.35;
const BACK_Z = 1.0;
const TURN = 0.8;
const FAR_X = 0.55;

/** Rounded-rectangle face with UVs 0…1 (ShapeGeometry gives shape-space UVs). */
function roundedFace(w: number, h: number, r: number): BufferGeometry {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ShapeGeometry(s, 8);
  const pos = g.attributes.position as BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - y) / h;
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  return g;
}

/** Cover-fit a photo texture into the 4 : 5 face. */
function cover(tex: Texture) {
  const img = tex.image as { width: number; height: number } | undefined;
  if (!img?.width) return;
  const face = CARD_W / CARD_H;
  const pic = img.width / img.height;
  if (pic > face) {
    tex.repeat.set(face / pic, 1);
    tex.offset.set((1 - face / pic) / 2, 0);
  } else {
    tex.repeat.set(1, pic / face);
    tex.offset.set(0, (1 - pic / face) / 2);
  }
}

/** Soft round shadow drawn on a 2D canvas (no extra light, no shadow maps). */
function shadowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(44,22,37,0.32)');
    grd.addColorStop(1, 'rgba(44,22,37,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(c);
}

export function startBenefitsScene(o: Options): () => void {
  /** Something changed outside the loop (texture loaded, resize) → draw once more. */
  let dirty = true;
  let tier = o.tier;

  const renderer = new WebGLRenderer({
    canvas: o.canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const setDpr = () =>
    renderer.setPixelRatio(
      // Owner 01.11: «фото тепер розмиті» — a 1.5 / 1 cap blurred the prints on 3x phones. The stage
      // is small and frames are drawn only while it moves, so the screen's own density is affordable.
      Math.min(window.devicePixelRatio || 1, tier === 'mid' ? 3 : 2),
    );
  setDpr();

  const scene = new Scene();
  scene.fog = new Fog(new Color(o.background), 7.2, 13);
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const camera = new PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(0, 0.25, 6.6);

  scene.add(new AmbientLight(0xffffff, 0.25));
  const key = new DirectionalLight(0xffffff, 1.15);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new PointLight(new Color(o.accent), 14, 12);
  rim.position.set(-3, 1.4, -1.5);
  scene.add(rim);

  // ---- the ring of prints ----
  const ring = new Group();
  scene.add(ring);
  const loader = new TextureLoader();
  const frameGeo = new RoundedBoxGeometry(
    CARD_W + 0.08,
    CARD_H + 0.08,
    0.06,
    3,
    0.07,
  );
  const faceGeo = roundedFace(CARD_W, CARD_H, 0.06);
  const frameMat = new MeshPhysicalMaterial({
    color: 0xfbf3f8,
    roughness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.9,
  });
  const cards: Group[] = [];
  const faces: MeshPhysicalMaterial[] = [];
  o.images.forEach((src, i) => {
    const card = new Group();
    const frame = new Mesh(frameGeo, frameMat);
    card.add(frame);
    const mat = new MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.3,
    });
    faces.push(mat);
    loader.load(src, (tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      cover(tex);
      mat.map = tex;
      mat.needsUpdate = true;
      dirty = true;
    });
    const face = new Mesh(faceGeo, mat);
    face.position.z = 0.032;
    card.add(face);
    card.position.set(i * SIDE_X, 0, FRONT_Z - BACK_Z);
    ring.add(card);
    cards.push(card);
  });

  // ---- floor shadow + pink dust ----
  const shadowTex = shadowTexture();
  const shadow = new Mesh(
    new PlaneGeometry(3.6, 1.5),
    new MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -CARD_H / 2 - 0.3, FRONT_Z - 0.1);
  scene.add(shadow);

  let dust: Points | null = null;
  const makeDust = () => {
    if (dust) {
      scene.remove(dust);
      dust.geometry.dispose();
      (dust.material as PointsMaterial).dispose();
      dust = null;
    }
    if (tier === 'low') return;
    const count = 140;
    const p = new Float32Array(count * 3);
    let seed = 20261101;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      p[i * 3] = (rnd() - 0.5) * 7;
      p[i * 3 + 1] = (rnd() - 0.5) * 3.6;
      p[i * 3 + 2] = (rnd() - 0.5) * 6;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(p, 3));
    dust = new Points(
      g,
      new PointsMaterial({
        color: new Color(o.accent),
        size: 0.035,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    scene.add(dust);
  };
  makeDust();

  // ---- size, pointer, visibility ----
  const resize = () => {
    const w = o.canvas.clientWidth || 1;
    const h = o.canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow (phone) stage: step back so the front print and its neighbours fit.
    camera.position.z = camera.aspect < 0.9 ? 8.4 : 7.4;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(o.canvas);
  resize();

  const fine = window.matchMedia('(pointer: fine)').matches;
  let px = 0;
  let py = 0;
  const onPointer = (e: PointerEvent) => {
    const r = o.canvas.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    py = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  if (fine)
    window.addEventListener('pointermove', onPointer, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(o.canvas);

  // ---- loop ----
  let raf = 0;
  let last = performance.now();
  let shown = 0;
  let first = true;
  let frames = 0;
  let windowStart = last;
  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Render on demand: only while the row moves, the camera eases to the pointer, or something
    // new arrived (texture, resize). Idle = no GPU work (CI caught a software-GL page frozen by a
    // scene that drew 60 times a second for nothing).
    const target = o.getProgress();
    const camX = px * 0.35;
    const camY = 0.25 - py * 0.2;
    const moving =
      Math.abs(target - shown) > 0.0005 ||
      Math.abs(camX - camera.position.x) > 0.0005 ||
      Math.abs(camY - camera.position.y) > 0.0005;
    if (!moving && !dirty) {
      windowStart = now;
      frames = 0;
      raf = requestAnimationFrame(frame);
      return;
    }
    dirty = false;
    shown += (target - shown) * Math.min(1, dt * 5);
    cards.forEach((c, i) => {
      const off = i - shown;
      const cd = Math.max(-1, Math.min(1, off));
      c.position.x = cd * SIDE_X + (off - cd) * FAR_X;
      c.position.z = FRONT_Z - Math.abs(cd) * BACK_Z - Math.abs(off - cd) * 0.7;
      c.rotation.y = -cd * TURN;
      const near = Math.max(0, 1 - Math.abs(off));
      const s = 0.9 + 0.1 * near;
      c.scale.setScalar(s);
      faces[i].envMapIntensity = 0.2 + 0.25 * near;
    });
    if (dust) dust.rotation.y += dt * 0.03;
    camera.position.x += (camX - camera.position.x) * Math.min(1, dt * 3);
    camera.position.y += (camY - camera.position.y) * Math.min(1, dt * 3);
    camera.lookAt(0, -0.05, FRONT_Z - 1.2);

    renderer.render(scene, camera);
    if (first) {
      first = false;
      o.onLive();
    }

    // Monitor: average fps over 2 s → mid ↔ low (never off while running).
    frames++;
    if (now - windowStart > 2000) {
      const fps = (frames * 1000) / (now - windowStart);
      frames = 0;
      windowStart = now;
      if (fps < 38 && tier === 'mid') {
        tier = 'low';
        setDpr();
        makeDust();
        resize();
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const onLost = (e: Event) => {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    o.onLost();
  };
  o.canvas.addEventListener('webglcontextlost', onLost);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('pointermove', onPointer);
    o.canvas.removeEventListener('webglcontextlost', onLost);
    faces.forEach((m) => {
      m.map?.dispose();
      m.dispose();
    });
    frameGeo.dispose();
    faceGeo.dispose();
    frameMat.dispose();
    shadowTex.dispose();
    env.dispose();
    pmrem.dispose();
    if (dust) {
      dust.geometry.dispose();
      (dust.material as PointsMaterial).dispose();
    }
    renderer.dispose();
  };
}
