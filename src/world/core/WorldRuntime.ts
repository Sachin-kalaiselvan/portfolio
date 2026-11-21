import { DirectionalLight, HemisphereLight, PMREMGenerator, Vector3, type Group, type Material, type CanvasTexture } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createStore, type Store } from './store';
import { Disposables } from './disposables';
import { FixedStepLoop } from './FixedStepLoop';
import { WorldError, type CameraMode, type IntroStep, type Tier, type TierChoice, type WorldState } from './types';
import { clamp, lerp } from './maths';
import { Renderer } from '../render/Renderer';
import { TIERS } from '../render/quality';
import { loadRapier, Physics } from '../physics/Physics';
import { VehiclePhysics } from '../vehicle/VehiclePhysics';
import { VehicleVisual } from '../vehicle/VehicleVisual';
import { VEHICLE } from '../vehicle/vehicle.config';
import { CameraDirector, type FollowTarget, type Shot } from '../camera/CameraDirector';
import { Input, type TouchState } from '../input/Input';
import { createMaterials, type Materials } from '../world/kit';
import { BOARD_HEIGHT, DISTRICTS, START, SUN_DIR, nearestRoadPoint, districtAt, type DistrictId } from '../world/layout';
import { DistrictManager } from '../world/DistrictManager';
import { Hub, TOWER } from '../world/hub';
import { buildBoard, loadBoardFonts, paintBoard } from '../world/board';
import type { DistrictContext } from '../world/district';
import { Discovery } from '../discovery/Discovery';
import { hrefFor, placementById, spotForSlug } from '../content/placements';
import { IntroSequencer, INTRO_TIMINGS, RETURN_TIMINGS } from '../intro/IntroSequencer';
import { aerialShot, behindShot, identityShot, vehicleShot } from '../intro/shots';
import { AudioManager } from '../audio/AudioManager';
import { FrameMonitor } from '../perf/FrameMonitor';
import { QualityGovernor, initialTier, measuredTier } from '../perf/tiers';
import { StatsOverlay } from '../perf/StatsOverlay';
import { detectCapability, tierCeiling } from '../boot/capability';
import { readPrefs, writePrefs } from '../boot/prefs';
import { projects } from '../../content/projects';
import { experiments } from '../../content/experiments';

export interface WorldOptions {
  /** Start the car at a case study's district and skip the intro. */
  spawnSlug?: string | null;
  /** Show the dev stats overlay. */
  stats?: boolean;
  /** Called when a discovery point opens real content. */
  onNavigate(href: string): void;
  /** Called when 3D has to stop and the page should take over. */
  onFallback(message: string): void;
}

export interface WorldRuntime {
  store: Store<WorldState>;
  skipIntro(): void;
  startDriving(): void;
  openPoint(id?: string): void;
  closePanel(): void;
  setTier(choice: TierChoice): void;
  setCameraMode(mode: CameraMode): void;
  setAudio(on: boolean): void;
  setFpsCap(cap: 30 | 60 | 0): void;
  setTouch(t: Partial<TouchState>): void;
  setMenu(open: boolean): void;
  setMap(open: boolean): void;
  respawn(): void;
  horn(): void;
  replayIntro(): void;
  spawnAt(slug: string): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}

const FOCUS_SECONDS = 1.1;
const BOARD_TEXTURE = { low: 2048, medium: 4096, high: 4096 } as const;

export async function createWorld(container: HTMLElement, opts: WorldOptions): Promise<WorldRuntime> {
  const prefs = readPrefs();
  const cap = detectCapability();
  if (!cap.webgl2) throw new WorldError('no-webgl', 'This browser does not have WebGL 2.');
  const ceiling = tierCeiling(cap);
  let tier: Tier = initialTier(prefs.tierChoice, prefs.measuredTier, ceiling);
  const d = new Disposables();

  const store = createStore<WorldState>({
    mode: 'booting',
    introStep: 'loading',
    loadProgress: 0.05,
    tier,
    tierChoice: prefs.tierChoice,
    renderScale: 1,
    fpsCap: prefs.fpsCap ?? TIERS[tier].fpsCapDefault,
    cameraMode: prefs.cameraMode,
    audioEnabled: false,
    reducedMotion: cap.reducedMotion,
    inputDevice: 'keyboard',
    nearby: null,
    district: null,
    speed: 0,
    discovered: prefs.discovered,
    message: null,
    hint: null,
    towerFloors: TOWER.baseFloors,
    toppedOut: false,
    menuOpen: false,
    mapOpen: false,
    car: { x: START.position[0], z: START.position[1], heading: START.heading },
    justFound: null,
  });

  // ——— Engine ———————————————————————————————————————————————
  const renderer = new Renderer(container, tier);
  d.add(() => renderer.dispose());
  renderer.renderScale = TIERS[tier].renderScaleMax;
  renderer.resize();
  store.set({ renderScale: renderer.renderScale, loadProgress: 0.15 });

  let R;
  try {
    R = await loadRapier();
  } catch {
    d.dispose();
    throw new WorldError('asset-failed', 'The physics engine could not load.');
  }
  store.set({ loadProgress: 0.45 });
  await loadBoardFonts();
  store.set({ loadProgress: 0.55 });

  const physics = new Physics(R);
  d.add(() => physics.dispose());
  const mats: Materials = createMaterials();
  d.add(() => Object.values(mats).forEach((m: Material) => m.dispose()));
  const scene = renderer.scene;

  // ——— Light ————————————————————————————————————————————————
  const hemi = new HemisphereLight('#f6f1e7', '#9c7b58', 1.25);
  const sun = new DirectionalLight('#fff0da', 2.3);
  sun.castShadow = true;
  scene.add(hemi, sun, sun.target);
  // A soft studio reflection for the glass and steel; generated once, no file.
  const pmrem = new PMREMGenerator(renderer.renderer);
  const room = new RoomEnvironment();
  const envTex = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  room.traverse((o) => (o as unknown as { geometry?: { dispose(): void } }).geometry?.dispose());
  pmrem.dispose();
  d.add(() => envTex.dispose());
  const sunDir = new Vector3(...SUN_DIR).normalize();
  const applyShadowSettings = () => {
    const t = TIERS[tier];
    sun.castShadow = t.shadows;
    if (t.shadows) {
      sun.shadow.mapSize.set(t.shadowMapSize, t.shadowMapSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null as never;
      const c = sun.shadow.camera;
      c.left = c.bottom = -t.shadowExtent;
      c.right = c.top = t.shadowExtent;
      c.near = 1;
      c.far = 260;
      c.updateProjectionMatrix();
      sun.shadow.bias = -0.0006;
      sun.shadow.normalBias = 0.04;
    }
  };
  applyShadowSettings();

  // ——— World ————————————————————————————————————————————————
  const statusOf = (slug: string) => projects.find((p) => p.slug === slug)?.status ?? null;
  const ctx: DistrictContext = {
    statusOf,
    experiments: experiments.map((e) => ({ name: e.name, kind: e.kind, status: e.status })),
    papillon: projects.some((p) => p.slug === 'papillon-interiors'),
  };
  const districts = new DistrictManager(scene, physics, mats, ctx, true, TIERS[tier].detailRadius, TIERS[tier].propDensity);
  d.add(() => districts.dispose());
  store.set({ loadProgress: 0.65 });

  const hub = new Hub(mats, true, true);
  scene.add(hub.group);
  const removeHub = physics.addStatic(hub.builder.colliders);
  d.add(() => {
    removeHub();
    hub.dispose();
  });

  let board: { group: Group; texture: CanvasTexture; materials: Material[] } | null = null;
  let removeBoard: (() => void) | null = null;
  const paint = () => {
    const size = Math.min(BOARD_TEXTURE[tier], cap.maxTextureSize);
    const canvas = paintBoard(size, districts.marks, [...districts.massing, ...hub.builder.massing], !TIERS[tier].shadows);
    if (board) {
      board.texture.image = canvas;
      board.texture.needsUpdate = true;
      return;
    }
    const b = buildBoard(canvas, true);
    board = b;
    scene.add(b.group);
    removeBoard = physics.addStatic(b.colliders);
  };
  paint();
  d.add(() => {
    removeBoard?.();
    if (board) {
      board.texture.dispose();
      board.materials.forEach((m) => m.dispose());
      board.group.traverse((o) => (o as unknown as { geometry?: { dispose(): void } }).geometry?.dispose());
      board.group.removeFromParent();
    }
  });
  store.set({ loadProgress: 0.8 });

  // ——— Car, camera, input ————————————————————————————————————
  const spawn = opts.spawnSlug ? spotForSlug(opts.spawnSlug) : null;
  const car = new VehiclePhysics(physics, START.position[0], START.position[1], START.heading);
  const visual = new VehicleVisual(scene, TIERS[tier].carLod);
  d.add(() => {
    visual.dispose();
    car.dispose();
  });
  const input = new Input(renderer.renderer.domElement);
  d.add(() => input.dispose());
  input.onDevice = (dev) => store.set({ inputDevice: dev });
  const director = new CameraDirector(renderer.camera, physics, input);
  director.reducedMotion = cap.reducedMotion;
  director.followMode = prefs.cameraMode;

  const audio = new AudioManager();
  d.add(() => audio.dispose());

  const discovery = new Discovery(districts.spots, prefs.discovered, prefs.visited as DistrictId[]);
  hub.setFloors(discovery.towerFloors(TOWER.baseFloors, TOWER.floors), false);
  if (discovery.allDistrictsVisited(DISTRICTS.length)) hub.topOut(false);
  store.set({ towerFloors: discovery.towerFloors(TOWER.baseFloors, TOWER.floors), toppedOut: hub.toppedOut });

  const stats = opts.stats ? new StatsOverlay(container) : null;
  if (stats) d.add(() => stats.dispose());

  // On Medium and High, build every district under the intro so the aerial shot is complete.
  if (tier !== 'low') districts.buildAll();
  store.set({ loadProgress: 1 });

  // ——— State ————————————————————————————————————————————————
  const loop = new FixedStepLoop(physics.dt);
  const monitor = new FrameMonitor(120);
  const governor = new QualityGovernor(prefs.tierChoice === 'auto');
  const intro = new IntroSequencer(prefs.introSeen ? RETURN_TIMINGS : INTRO_TIMINGS, cap.reducedMotion);
  const follow: FollowTarget = { position: new Vector3(), heading: START.heading, speed: 0, topSpeed: VEHICLE.topSpeed };
  let focusTimer = 0;
  let pendingHref: string | null = null;
  let measuring = prefs.tierChoice === 'auto' && !prefs.measuredTier ? { t: 0 } : null;
  let behindFrom: Shot | null = null;
  let lastSuspension = car.wheels.map((w) => w.suspension);
  let storeTick = 0;
  let idleFor = 0;
  let hintTimer = 0;
  let foundTimer = 0;
  let raf = 0;
  let running = false;
  let disposed = false;
  let last = 0;
  let sinceRender = 0;
  let lastElapsed = 1 / 60;

  const persistDiscovery = () => writePrefs({ discovered: [...discovery.discovered], visited: [...discovery.visitedDistricts] });

  const setMode = (mode: WorldState['mode']) => {
    store.set({ mode });
    input.context = mode === 'intro' ? 'intro' : mode === 'controls' ? 'controls' : mode === 'driving' ? 'driving' : mode === 'panel' || mode === 'focus' ? 'panel' : 'off';
    visual.group.visible = true;
  };

  const updateFollow = () => {
    follow.position.copy(visual.position);
    follow.heading = car.heading();
    follow.speed = car.speed;
  };

  intro.onStep = (step: IntroStep) => {
    store.set({ introStep: step });
    if (step === 'behind') {
      updateFollow();
      behindFrom = vehicleShot(1, renderer.aspect < 0.8, visual.position);
    }
    if (step === 'controls') {
      updateFollow();
      director.snapBehind(follow);
      director.switchTo(prefs.cameraMode === 'overhead' ? 'overhead' : 'chase', cap.reducedMotion ? 0 : 0.6);
      setMode('controls');
      writePrefs({ introSeen: true });
    }
  };

  /** Heading that points the car (and so the chase camera) at what a spot frames. */
  const faceSubject = (s: { x: number; z: number; framing: { look: [number, number, number] } }) =>
    Math.atan2(s.framing.look[2] - s.z, s.framing.look[0] - s.x);

  const placeCar = (x: number, z: number, heading: number) => {
    car.teleport(x, z, heading);
    visual.update(car, 1, 0);
    updateFollow();
    director.snapBehind(follow);
  };

  // ——— Interactions ———————————————————————————————————————————
  const openPoint = (id?: string) => {
    const mode = store.get().mode;
    if (mode !== 'driving' && mode !== 'controls') return;
    const spot = id ? districts.spots.find((s) => s.id === id) : discovery.current;
    const place = spot ? placementById(spot.id) : null;
    if (!spot || !place) return;
    const f = spot.framing;
    const look = new Vector3(f.look[0], BOARD_HEIGHT + f.look[1], f.look[2]);
    const pos = new Vector3(look.x + Math.cos(f.dir) * f.dist, look.y + f.height, look.z + Math.sin(f.dir) * f.dist);
    director.switchTo('focus', FOCUS_SECONDS, { position: pos, target: look, fov: renderer.aspect < 0.8 ? 58 : 42 });
    if (discovery.discover(spot.id)) {
      audio.chime('discover');
      persistDiscovery();
      const floors = discovery.towerFloors(TOWER.baseFloors, TOWER.floors);
      hub.setFloors(floors, !cap.reducedMotion);
      store.set({ discovered: [...discovery.discovered], towerFloors: floors, justFound: place.label });
      foundTimer = 3;
    } else audio.chime('ui');
    pendingHref = hrefFor(place.target);
    focusTimer = cap.reducedMotion ? 0.05 : FOCUS_SECONDS;
    setMode('focus');
  };

  const closePanel = () => {
    if (store.get().mode !== 'panel' && store.get().mode !== 'focus') return;
    pendingHref = null;
    setMode('driving');
    director.switchTo(director.followMode === 'overhead' ? 'overhead' : 'chase', cap.reducedMotion ? 0 : 0.9);
    resume();
  };

  const respawn = () => {
    const { point, heading } = nearestRoadPoint(car.curr.x, car.curr.z);
    placeCar(point[0], point[1], heading);
    store.set({ hint: null });
  };

  input.on('interact', () => openPoint());
  input.on('reset', () => car.rightInPlace());
  input.on('horn', () => audio.horn());
  input.on('skip', () => intro.skip());
  input.on('lights', () => (visual.headlights = !visual.headlights));
  input.on('camera', () => setCameraMode(store.get().cameraMode === 'follow' ? 'overhead' : 'follow'));
  input.on('map', () => store.set({ mapOpen: !store.get().mapOpen }));
  const driveContext = () => {
    const m = store.get().mode;
    return m === 'driving' ? 'driving' : m === 'controls' ? 'controls' : m === 'intro' ? 'intro' : m === 'off' || m === 'booting' || m === 'error' ? 'off' : 'panel';
  };
  const setMenu = (open: boolean) => {
    store.set({ menuOpen: open });
    // While the menu is open only Escape reaches the world.
    input.context = open ? 'panel' : driveContext();
  };
  input.on('escape', () => {
    const s = store.get();
    if (s.mode === 'panel' || s.mode === 'focus') return;
    if (s.mapOpen) store.set({ mapOpen: false });
    else setMenu(!s.menuOpen);
  });
  input.onFirstDrive = () => {
    if (store.get().mode === 'controls') setMode('driving');
  };
  car.onRecover = (kind) => {
    if (kind === 'upright') car.rightInPlace();
    else if (kind === 'reset') respawn();
    else {
      store.set({ hint: store.get().inputDevice === 'touch' ? 'Stuck? Use Reset in the menu.' : 'Stuck? Press R to reset.' });
      hintTimer = 5;
    }
  };

  const setCameraMode = (mode: CameraMode) => {
    director.followMode = mode;
    store.set({ cameraMode: mode });
    writePrefs({ cameraMode: mode });
    const m = store.get().mode;
    if (m === 'driving' || m === 'controls') director.switchTo(mode === 'overhead' ? 'overhead' : 'chase', cap.reducedMotion ? 0 : 0.8);
  };

  const applyTier = (next: Tier) => {
    if (next === tier) return;
    tier = next;
    const t = TIERS[tier];
    renderer.applyTier(tier);
    renderer.setRenderScale(t.renderScaleMax);
    applyShadowSettings();
    districts.detailRadius = t.detailRadius;
    visual.setLod(t.carLod);
    paint();
    monitor.reset();
    const fpsCap = readPrefs().fpsCap ?? t.fpsCapDefault;
    store.set({ tier, renderScale: renderer.renderScale, fpsCap });
  };

  const setTier = (choice: TierChoice) => {
    writePrefs({ tierChoice: choice });
    governor.auto = choice === 'auto';
    measuring = null;
    store.set({ tierChoice: choice });
    applyTier(choice === 'auto' ? initialTier('auto', readPrefs().measuredTier, ceiling) : choice);
  };

  // ——— Frame ————————————————————————————————————————————————
  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const elapsed = last ? (now - last) / 1000 : 1 / 60;
    const s = store.get();
    // FPS cap, and a low idle rate when nothing is moving.
    const capFps = idleFor > 4 && s.mode === 'driving' && !hub.toppedOut ? 20 : s.fpsCap;
    if (capFps && elapsed < 1 / capFps - 0.002) return;
    last = now;
    const dt = Math.min(elapsed, 0.1);
    lastElapsed = elapsed;
    monitor.push(elapsed * 1000);
    tick(dt, s);
    sinceRender = 0;
    renderer.render();
  };

  const tick = (dt: number, s: WorldState) => {
    // Physics: fixed steps, car intent only while driving.
    const intent = input.intent();
    const { steps, alpha } = loop.advance(dt);
    for (let i = 0; i < steps; i++) {
      car.preStep(intent, physics.dt);
      physics.step();
      car.postStep(physics.dt);
    }
    visual.update(car, alpha, dt);
    districts.syncProps();
    updateFollow();
    const moving = Math.abs(car.speed) > 0.2 || Math.abs(intent.throttle) > 0 || Math.abs(intent.steer) > 0 || director.isBlending;
    idleFor = moving ? 0 : idleFor + dt;

    // Intro shots.
    if (s.mode === 'intro') {
      // The intro keeps to wall-clock time even on slow frames (up to a quarter second per frame).
      intro.update(Math.min(lastElapsed, 0.25));
      const portrait = renderer.aspect < 0.8;
      const p = intro.progress;
      if (intro.step === 'aerial') director.setCinematic(aerialShot(p, portrait));
      else if (intro.step === 'identity') director.setCinematic(identityShot(p, portrait, cap.reducedMotion));
      else if (intro.step === 'vehicle') director.setCinematic(vehicleShot(p, portrait, visual.position));
      else if (intro.step === 'behind' && behindFrom) director.setCinematic(behindShot(p, behindFrom, director.behindShot(follow)));
      if (measuring) {
        measuring.t += dt;
        if (measuring.t > 4.5 && monitor.count >= 60) {
          const next = measuredTier(tier, monitor.percentile(95), ceiling);
          writePrefs({ measuredTier: next });
          measuring = null;
          applyTier(next);
          if (tier !== 'low') districts.buildAll();
        }
      }
    }

    // Focus: the camera flies to the point, then the page opens.
    if (s.mode === 'focus') {
      focusTimer -= dt;
      if (focusTimer <= 0 && pendingHref) {
        const href = pendingHref;
        pendingHref = null;
        setMode('panel');
        opts.onNavigate(href);
        pause();
      }
    }

    // Driving: discovery, districts, governor.
    if (s.mode === 'driving' || s.mode === 'controls') {
      districts.update(car.curr.x, car.curr.z);
      if (discovery.update(car.curr.x, car.curr.z)) {
        const c = discovery.current;
        store.set({ nearby: c ? { id: c.id, label: discovery.label(c.id) } : null });
      }
      const here = districtAt(car.curr.x, car.curr.z);
      if ((here?.id ?? null) !== s.district) {
        store.set({ district: here?.id ?? null });
        director.areaDistance = here && districts.isTight(here.id) ? 0.75 : here ? 1 : 1.1;
        if (here && discovery.visit(here.id)) {
          persistDiscovery();
          if (discovery.allDistrictsVisited(DISTRICTS.length) && !hub.toppedOut) {
            hub.topOut(!cap.reducedMotion);
            store.set({ toppedOut: true, towerFloors: TOWER.floors, justFound: 'Every district visited. The tower is topped out.' });
            foundTimer = 4;
            audio.chime('discover');
          }
        }
      }
      const action = governor.update(dt, monitor.percentile(95), tier, renderer.renderScale, monitor.count);
      if (action?.kind === 'scale') {
        renderer.setRenderScale(action.value);
        store.set({ renderScale: renderer.renderScale });
      } else if (action?.kind === 'tier') {
        writePrefs({ measuredTier: action.value });
        applyTier(action.value);
      } else if (action?.kind === 'fallback') {
        fallback('This device is struggling with the 3D world, so here is the page view.');
        return;
      }
    }

    if (hintTimer > 0 && (hintTimer -= dt) <= 0) store.set({ hint: null });
    if (foundTimer > 0 && (foundTimer -= dt) <= 0) store.set({ justFound: null });

    // Ambient life and the tower.
    hub.update(dt, !cap.reducedMotion);

    // Sun and shadow camera follow what the camera looks at.
    const focus = s.mode === 'intro' ? new Vector3(0, 0, 10) : visual.position;
    sun.target.position.set(focus.x, BOARD_HEIGHT, focus.z);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 120);

    // Tilt-shift softens while driving fast.
    if (TIERS[tier].tiltShift) {
      const v = clamp(Math.abs(car.speed) / VEHICLE.topSpeed, 0, 1);
      renderer.setTiltAmount(s.mode === 'intro' ? 1 : lerp(1, 0.55, v));
    }

    director.update(s.mode === 'intro' ? null : follow, dt);

    audio.update({
      speed: car.speed,
      topSpeed: VEHICLE.topSpeed,
      throttle: Math.abs(intent.throttle),
      slip: Math.abs(intent.steer) * clamp(Math.abs(car.speed) / VEHICLE.topSpeed, 0, 1),
      braking: car.braking,
      bump: Math.max(...car.wheels.map((w, i) => Math.abs(w.suspension - lastSuspension[i]))),
    });
    lastSuspension = car.wheels.map((w) => w.suspension);

    storeTick += dt;
    if (storeTick > 0.2) {
      storeTick = 0;
      store.set({ speed: Math.abs(car.speed), car: { x: car.curr.x, z: car.curr.z, heading: car.heading() } });
    }
    stats?.update(dt, {
      tier,
      scale: renderer.renderScale.toFixed(2),
      fps: (1000 / Math.max(1, monitor.mean())).toFixed(0),
      p95: monitor.percentile(95).toFixed(1) + ' ms',
      calls: renderer.info().calls,
      tris: renderer.info().triangles,
      detail: districts.loadedCount(),
      speed: car.speed.toFixed(1),
    });
  };

  const start = () => {
    if (running || disposed) return;
    running = true;
    last = 0;
    loop.reset();
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
    audio.suspend();
  };
  const resume = () => {
    if (store.get().mode === 'panel' || document.hidden) return;
    audio.resume();
    start();
  };

  const fallback = (message: string) => {
    pause();
    store.set({ mode: 'error', message });
    opts.onFallback(message);
  };

  renderer.onContextLost = () => fallback('The graphics context was lost, so here is the page view.');
  d.listen(document, 'visibilitychange', () => (document.hidden ? pause() : resume()));
  const ro = new ResizeObserver(() => {
    renderer.resize();
    if (!running) renderer.render();
  });
  ro.observe(container);
  d.add(() => ro.disconnect());
  void sinceRender;

  // ——— Begin ————————————————————————————————————————————————
  if (spawn) {
    const s = districts.spots.find((x) => x.id === spawn.id);
    if (s) placeCar(s.x, s.z, faceSubject(s));
    store.set({ introStep: 'done' });
    director.switchTo(prefs.cameraMode === 'overhead' ? 'overhead' : 'chase', 0);
    setMode('controls');
  } else {
    // Settle the car on the board before the first shot.
    for (let i = 0; i < 60; i++) {
      car.preStep({ throttle: 0, brake: 1, steer: 0 }, physics.dt);
      physics.step();
      car.postStep(physics.dt);
    }
    visual.update(car, 1, 0);
    setMode('intro');
    intro.start();
  }
  start();

  return {
    store,
    skipIntro: () => intro.skip(),
    startDriving: () => {
      if (store.get().mode === 'controls') setMode('driving');
    },
    openPoint,
    closePanel,
    setTier,
    setCameraMode,
    setAudio: (on) => {
      const ok = on ? audio.enable() : (audio.disable(), true);
      writePrefs({ audio: on && ok });
      store.set({ audioEnabled: on && ok });
      if (on && ok) audio.chime('ui');
    },
    setFpsCap: (fpsCap) => {
      writePrefs({ fpsCap });
      store.set({ fpsCap });
    },
    setTouch: (t) => input.setTouch(t),
    setMenu,
    setMap: (open) => store.set({ mapOpen: open }),
    respawn,
    horn: () => audio.horn(),
    replayIntro: () => {
      setMenu(false);
      placeCar(START.position[0], START.position[1], START.heading);
      director.switchTo('cinematic', 0);
      setMode('intro');
      intro.start();
      resume();
    },
    spawnAt: (slug) => {
      const p = spotForSlug(slug);
      const s = p && districts.spots.find((x) => x.id === p.id);
      if (!s) return;
      placeCar(s.x, s.z, faceSubject(s));
      setMode('controls');
      director.switchTo(director.followMode === 'overhead' ? 'overhead' : 'chase', 0);
      resume();
    },
    pause,
    resume,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      pause();
      store.set({ mode: 'off' });
      d.dispose();
    },
  };
}
