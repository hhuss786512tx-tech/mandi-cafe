/**
 * Procedural hero: a copper mandi tray with a mound of saffron rice, a roasted
 * chicken quarter, fried onion, raisins and almonds, with saffron threads and
 * cardamom pods drifting in the warm light above it.
 *
 * No external model: every mesh is built from primitives, so the chunk is small
 * and there is nothing to download besides Three itself.
 */
import {
  ACESFilmicToneMapping, BufferAttribute, BufferGeometry, CanvasTexture, CapsuleGeometry, CircleGeometry, Color, DirectionalLight,
  DoubleSide, Group, InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PMREMGenerator, PerspectiveCamera,
  PointLight, Quaternion, RepeatWrapping, Scene, SphereGeometry, TorusGeometry, Vector2, Vector3,
  WebGLRenderer, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface HeroOptions { immediate?: boolean }

// Deterministic PRNG so the poster render and the live scene match.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noiseTexture(size = 256, seed = 7): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const rnd = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + rnd() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // soften
  ctx.globalAlpha = 0.5; ctx.filter = 'blur(1px)'; ctx.drawImage(c, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

function contactShadow(): Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const m = new Mesh(new CircleGeometry(2.1, 48), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = -0.012; m.renderOrder = -1;
  return m;
}

function tray(): Mesh {
  // Profile (radius, height): base, up the flared lip, back inside for wall thickness.
  const pts = [
    [0, 0], [0.98, 0], [1.14, 0.03], [1.28, 0.1], [1.36, 0.19], [1.375, 0.235], [1.35, 0.25],
    [1.3, 0.225], [1.22, 0.14], [1.1, 0.075], [0.95, 0.05], [0, 0.05],
  ].map(([x, y]) => new Vector2(x, y));
  const geo = new LatheGeometry(pts, 128);
  const rough = noiseTexture(256, 3);
  rough.repeat.set(6, 2);
  const mat = new MeshPhysicalMaterial({
    color: new Color('#b8683a'), metalness: 1, roughness: 0.34, roughnessMap: rough,
    clearcoat: 0.12, clearcoatRoughness: 0.5, side: DoubleSide,
  });
  const m = new Mesh(geo, mat);
  m.receiveShadow = true; m.castShadow = true;
  return m;
}

// Rice mound: spheroid dome of radius R, height H sitting on the tray floor.
const R = 0.86, H = 0.4, FLOOR = 0.05;
function onDome(rnd: () => number, out: Vector3, shell = 1, maxTheta = Math.PI / 2): Vector3 {
  const theta = Math.acos(1 - rnd() * (1 - Math.cos(maxTheta)));
  const phi = rnd() * Math.PI * 2;
  out.set(R * shell * Math.sin(theta) * Math.cos(phi), FLOOR + H * shell * Math.cos(theta), R * shell * Math.sin(theta) * Math.sin(phi));
  return out;
}
const domeNormal = (p: Vector3) => new Vector3(p.x / (R * R), (p.y - FLOOR) / (H * H), p.z / (R * R)).normalize();

function rice(count: number, rnd: () => number): Group {
  const g = new Group();
  const core = new Mesh(new SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ color: '#dcbb74', roughness: 0.95 }));
  core.scale.set(R * 0.985, H * 0.985, R * 0.985); core.position.y = FLOOR;
  core.castShadow = true; core.receiveShadow = true;
  g.add(core);

  const geo = new CapsuleGeometry(0.0085, 0.034, 2, 5);
  const mat = new MeshStandardMaterial({ roughness: 0.72, metalness: 0 });
  const inst = new InstancedMesh(geo, mat, count);
  const dummy = new Object3D(), p = new Vector3();
  const base = new Color('#ecd493'), saff = new Color('#d9a541'), dark = new Color('#c4933a'), pale = new Color('#f4e4b6');
  const c = new Color();
  for (let i = 0; i < count; i++) {
    onDome(rnd, p, 0.97 + rnd() * 0.05);
    dummy.position.copy(p);
    dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    const s = 0.85 + rnd() * 0.4;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    const r = rnd();
    c.copy(r < 0.1 ? saff : r < 0.14 ? dark : r < 0.3 ? pale : base).offsetHSL(0, 0, (rnd() - 0.5) * 0.05);
    inst.setColorAt(i, c);
  }
  inst.castShadow = true; inst.receiveShadow = true;
  g.add(inst);
  return g;
}

function scatter(geo: SphereGeometry | TorusGeometry, mat: MeshStandardMaterial, count: number, rnd: () => number, scale: Vector3, maxTheta: number, tilt = 0.5): InstancedMesh {
  const inst = new InstancedMesh(geo, mat, count);
  const dummy = new Object3D(), p = new Vector3(), q = new Quaternion(), up = new Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    onDome(rnd, p, 1.015, maxTheta);
    dummy.position.copy(p);
    q.setFromUnitVectors(up, domeNormal(p));
    dummy.quaternion.copy(q);
    dummy.rotateY(rnd() * Math.PI * 2);
    dummy.rotateX((rnd() - 0.5) * tilt);
    const s = 0.8 + rnd() * 0.45;
    dummy.scale.copy(scale).multiplyScalar(s);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.castShadow = true;
  return inst;
}

function roastTexture(seed = 5): CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#b0602a'; ctx.fillRect(0, 0, size, size);
  // darker roasted blotches and paler fatty patches
  for (let i = 0; i < 90; i++) {
    const x = rnd() * size, y = rnd() * size, r = 14 + rnd() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd() < 0.68;
    g.addColorStop(0, dark ? `rgba(74,32,12,${0.35 + rnd() * 0.4})` : `rgba(225,160,90,${0.2 + rnd() * 0.3})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine grain
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 22;
    img.data[i] += n; img.data[i + 1] += n * 0.8; img.data[i + 2] += n * 0.6;
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = 'srgb';
  return t;
}

/** Displace vertices along their normals with layered sine noise so primitives read as cooked meat, not geometry. */
function lumpy<T extends BufferGeometry>(geo: T, amp: number, freq: number, seed: number): T {
  const pos = geo.attributes.position as BufferAttribute, nor = geo.attributes.normal as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * freq + seed) * Math.cos(y * freq * 1.3 + seed * 2) + 0.5 * Math.sin((x + z) * freq * 2.1 + seed * 3) + 0.25 * Math.sin(z * freq * 4.3 - y * freq * 3.1);
    const d = n * amp;
    pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function chickenQuarter(): Group {
  const g = new Group();
  const map = roastTexture(5);
  map.repeat.set(2, 1.2);
  const bump = noiseTexture(256, 11);
  bump.repeat.set(4, 4);
  const skin = new MeshPhysicalMaterial({
    map, roughness: 0.55, metalness: 0, bumpMap: bump, bumpScale: 0.03,
    clearcoat: 0.22, clearcoatRoughness: 0.55, sheen: 0.25, sheenColor: new Color('#e0913c'),
  });
  // thigh: a flattened, lumpy spheroid
  const thighGeo = new SphereGeometry(0.31, 56, 40);
  thighGeo.scale(1.2, 0.5, 0.82);
  lumpy(thighGeo, 0.028, 9, 1.7);
  const thigh = new Mesh(thighGeo, skin);
  thigh.rotation.y = 0.2;
  g.add(thigh);
  // drumstick: tapered lathe, lumpy, angled off the thigh
  const prof = [[0.001, 0], [0.105, 0], [0.12, 0.09], [0.11, 0.22], [0.08, 0.36], [0.05, 0.46], [0.03, 0.52], [0.001, 0.54]].map(([x, y]) => new Vector2(x, y));
  const drumGeo = new LatheGeometry(prof, 48);
  lumpy(drumGeo, 0.012, 14, 4.2);
  const drum = new Mesh(drumGeo, skin);
  drum.rotation.z = Math.PI / 2 + 0.3;
  drum.rotation.y = -0.15;
  drum.position.set(0.3, 0.0, 0.14);
  g.add(drum);
  // exposed bone at the drumstick tip
  const bone = new Mesh(new SphereGeometry(0.04, 20, 14), new MeshStandardMaterial({ color: '#efe2c8', roughness: 0.65 }));
  bone.scale.set(1, 0.8, 1.3);
  bone.position.set(0.8, -0.13, 0.22);
  g.add(bone);
  g.traverse(o => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function floating(rnd: () => number) {
  const threads = new InstancedMesh(new CapsuleGeometry(0.003, 0.07, 1, 4), new MeshStandardMaterial({ color: '#b8341a', roughness: 0.65, emissive: new Color('#6a1a0a'), emissiveIntensity: 0.3 }), 55);
  const pods = new InstancedMesh(new SphereGeometry(0.04, 12, 8), new MeshStandardMaterial({ color: '#8b9450', roughness: 0.9 }), 10);
  type P = { p: Vector3; r: Vector3; v: number; phase: number; sx: number };
  const mk = (n: number, spread: number): P[] => Array.from({ length: n }, () => ({
    p: new Vector3((rnd() - 0.5) * spread * 2, 0.35 + rnd() * 1.8, (rnd() - 0.5) * spread * 1.4),
    r: new Vector3(rnd() * 6, rnd() * 6, rnd() * 6), v: 0.02 + rnd() * 0.05, phase: rnd() * 6.28, sx: 0.7 + rnd() * 0.6,
  }));
  const T = mk(55, 1.9), Pd = mk(10, 1.6);
  const dummy = new Object3D();
  const update = (t: number, animate: boolean) => {
    const write = (list: P[], mesh: InstancedMesh, scale: Vector3, spin: number) => {
      list.forEach((o, i) => {
        const y = animate ? o.p.y + Math.sin(t * 0.35 + o.phase) * 0.06 + ((t * o.v + o.phase) % 1.9) : o.p.y + (o.phase % 1.2);
        dummy.position.set(o.p.x + Math.sin(t * 0.2 + o.phase) * 0.05, 0.3 + (y % 1.9), o.p.z);
        dummy.rotation.set(o.r.x + t * spin * 0.3, o.r.y + t * spin, o.r.z + t * spin * 0.2);
        dummy.scale.copy(scale).multiplyScalar(o.sx);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    write(T, threads, new Vector3(1, 1, 1), 0.5);
    write(Pd, pods, new Vector3(0.45, 1, 0.5), 0.3);
  };
  return { threads, pods, update };
}

export function createHero(host: HTMLElement, canvas: HTMLCanvasElement, opts: HeroOptions = {}) {
  const mobile = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
  const rnd = mulberry32(2024);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !mobile;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const camera = new PerspectiveCamera(30, 1, 0.1, 40);
  const camBase = new Vector3(0, 2.1, 4.6);
  const lookAt = new Vector3(0, 0.25, 0);

  // Lights: warm key, soft fill, copper-glint rim.
  const key = new DirectionalLight('#ffd9a6', 3.4);
  key.position.set(2.6, 4.2, 2.2);
  key.castShadow = !mobile;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -2.2;
  key.shadow.camera.right = key.shadow.camera.top = 2.2;
  key.shadow.camera.near = 1; key.shadow.camera.far = 12;
  key.shadow.bias = -0.0008; key.shadow.radius = 4;
  const fill = new DirectionalLight('#ffe6cc', 0.7);
  fill.position.set(-3.2, 2, -1);
  const rim = new PointLight('#ffb35c', 14, 9, 2);
  rim.position.set(-1.6, 1.3, -2.6);
  scene.add(key, fill, rim);

  // Rig: parallax tilts the whole dish; `dish` spins slowly.
  const rig = new Group(), dish = new Group();
  dish.add(contactShadow(), tray(), rice(mobile ? 5000 : 11000, rnd));
  dish.add(scatter(new SphereGeometry(0.024, 10, 8), new MeshStandardMaterial({ color: '#3a1d17', roughness: 0.8 }), 40, rnd, new Vector3(1, 0.7, 1.45), 1.2));
  dish.add(scatter(new SphereGeometry(0.055, 12, 8), new MeshStandardMaterial({ color: '#dcb68c', roughness: 0.85 }), 26, rnd, new Vector3(1, 0.4, 0.62), 1.15));
  dish.add(scatter(new TorusGeometry(0.055, 0.007, 5, 14, Math.PI * 1.4), new MeshStandardMaterial({ color: '#6b3312', roughness: 0.6 }), 34, rnd, new Vector3(1, 0.45, 1), 1.25, 0.6));
  const chicken = chickenQuarter();
  chicken.position.set(-0.1, FLOOR + H + 0.08, 0.02);
  chicken.rotation.set(0.1, -0.55, -0.08);
  dish.add(chicken);
  const air = floating(rnd);
  rig.add(dish, air.threads, air.pods);
  scene.add(rig);

  // ---- sizing ----
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull back on tall/narrow viewports so the tray stays fully in frame
    const k = camera.aspect < 1.1 ? Math.pow(1.1 / camera.aspect, 0.55) : 1;
    camBase.set(0.1, 2.1 * k, 4.6 * k);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // ---- interaction ----
  const target = new Vector2(), current = new Vector2();
  const onPointer = (e: PointerEvent) => {
    target.set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    target.set(MathUtils.clamp(e.gamma / 30, -1, 1), MathUtils.clamp((e.beta - 45) / 30, -1, 1));
  };
  // iOS requires a user-gesture permission prompt for orientation; only attach where it is free.
  if (!('requestPermission' in (DeviceOrientationEvent as unknown as { requestPermission?: unknown }))) {
    window.addEventListener('deviceorientation', onOrient, { passive: true });
  }
  const heroEl = host.closest<HTMLElement>('[data-hero]') ?? host;
  let scroll = 0;
  const onScroll = () => { scroll = MathUtils.clamp(window.scrollY / Math.max(1, heroEl.offsetHeight), 0, 1); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- render loop: only while visible and the tab is active ----
  let visible = true, hidden = document.hidden, raf = 0, t0 = performance.now();
  const still = Boolean(opts.immediate); // headless captures render one frame and never loop
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; tick(); }, { threshold: 0 });
  if (!still) {
    io.observe(host);
    document.addEventListener('visibilitychange', () => { hidden = document.hidden; tick(); });
  }

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    current.lerp(target, 0.05);
    rig.rotation.x = current.y * 0.07;
    rig.rotation.z = -current.x * 0.04;
    dish.rotation.y = t * 0.1 + scroll * 1.1 + current.x * 0.15;
    const ease = scroll * scroll * (3 - 2 * scroll);
    camera.position.set(camBase.x, camBase.y + ease * 0.8, camBase.z + ease * 1.6);
    camera.lookAt(lookAt);
    air.update(t, true);
    renderer.render(scene, camera);
  };
  const loop = (now: number) => { frame(now); raf = (visible && !hidden) ? requestAnimationFrame(loop) : 0; };
  const tick = () => { if (!still && visible && !hidden && !raf) raf = requestAnimationFrame(loop); };

  if (opts.immediate) {
    // Poster/OG render: one deterministic frame, then signal the screenshot script.
    current.set(0.15, -0.1); target.copy(current);
    frame(t0 + 1800);
    host.classList.add('is-3d');
    (window as Window & { __sceneReady?: boolean }).__sceneReady = true;
    // Still frame only: headless renders (poster, OG, screenshots) never loop.
  } else {
    frame(t0);
    host.classList.add('is-3d');
    tick();
  }

  return {
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
    },
  };
}
