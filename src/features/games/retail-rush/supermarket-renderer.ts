import * as THREE from 'three';
import { CUSTOMERS, PRODUCT_IDS, PRODUCTS, type ProductId } from './scenarios';
import type { StoreVisualState, VisualCallbacks } from './visual-state';

type Actor = { root: THREE.Group; arms: THREE.Group[]; legs: THREE.Group[]; basket: THREE.Group; goods: THREE.Group; bubble: THREE.Sprite; stage: string; since: number; status: string; id: number; route: number };

/** GPU-only presentation. The snapshot is never mutated and animations never invoke gameplay actions. */
export function createSupermarket(host: HTMLElement, read: () => StoreVisualState, actions: VisualCallbacks, quality: 'high' | 'low', onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: quality === 'high', alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.7 : 1));
  renderer.shadowMap.enabled = quality === 'high';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-9, 9, 7, -7, .1, 100);
  const target = new THREE.Vector3(0, .7, 0);
  camera.position.set(12, 13, 18); camera.lookAt(target);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1); geometries.add(boxGeo);
  const sphereGeo = new THREE.SphereGeometry(1, 16, 12); geometries.add(sphereGeo);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12); geometries.add(cylinderGeo);
  function material(color: string, metal = 0, glow = false) {
    const key = `${color}-${metal}-${glow}`;
    if (!matCache.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: metal ? .3 : .62, metalness: metal, emissive: glow ? color : '#000000', emissiveIntensity: glow ? .7 : 0 });
      materials.add(m); matCache.set(key, m);
    }
    return matCache.get(key)!;
  }
  function shape(parent: THREE.Object3D, geo: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, metal = 0, glow = false) {
    const mesh = new THREE.Mesh(geo, material(color, metal, glow));
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function box(parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, metal = 0, glow = false) { return shape(parent, boxGeo, x, y, z, sx, sy, sz, color, metal, glow); }
  function ball(parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string) { return shape(parent, sphereGeo, x, y, z, sx, sy, sz, color); }
  function label(text: string, width: number, height: number, bg = '#102744', color = '#ffffff') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 192;
    const context = canvas.getContext('2d')!;
    context.fillStyle = bg; context.fillRect(0, 0, 768, 192);
    context.strokeStyle = '#88b6e0'; context.lineWidth = 8; context.strokeRect(6, 6, 756, 180);
    context.fillStyle = color; context.font = 'bold 62px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, 384, 100, 725);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const m = new THREE.MeshBasicMaterial({ map: texture }); materials.add(m);
    const g = new THREE.PlaneGeometry(width, height); geometries.add(g);
    return new THREE.Mesh(g, m);
  }
  const ambient = new THREE.HemisphereLight('#e1f0ff', '#563d24', 2.65); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0d5', 4.3); sun.position.set(0, 10, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); sun.shadow.bias = -.001; scene.add(sun);
  const blue = new THREE.DirectionalLight('#79b9ff', 2.25); blue.position.set(-8, 5, -4); scene.add(blue);
  const warmAccent = new THREE.PointLight('#ffbf69', quality === 'high' ? 10 : 5, 12, 2); warmAccent.position.set(-3.8, 4.8, -1.5); scene.add(warmAccent);
  const coolAccent = new THREE.PointLight('#70b7ff', quality === 'high' ? 7 : 3.5, 15, 2); coolAccent.position.set(5.5, 4.2, 3.5); scene.add(coolAccent);
  const room = new THREE.Group(); scene.add(room);
  box(room, 0, -.24, 0, 15, .45, 11.8, '#263c57', .45);
  box(room, 0, -.015, 5.9, 15, .035, .035, '#ffca6f', 0, true);
  // Individually beveled-looking tile seams, warm alternating porcelain.
  const tileTransform = new THREE.Object3D();
  for (const variant of [0, 1]) {
    const tiles = new THREE.InstancedMesh(boxGeo, material(variant ? '#c8c9c4' : '#aeb7bd', .12), variant ? 120 : 60);
    let index = 0;
    for (let x = 0; x < 15; x++) for (let z = 0; z < 12; z++) {
      if (((x + z) % 3 === 0 ? 0 : 1) !== variant) continue;
      tileTransform.position.set(x - 7, .015, z - 5.5); tileTransform.scale.set(.982, .055, .982); tileTransform.updateMatrix(); tiles.setMatrixAt(index++, tileTransform.matrix);
    }
    tiles.receiveShadow = true; room.add(tiles);
  }
  box(room, 0, 1.8, -5.65, 15, 3.6, .22, '#1a2637');
  box(room, 7.35, 1.8, -2.8, .2, 3.6, 5.8, '#25364a', .2);
  box(room, 0, 3.65, -5.5, 15.1, .15, .55, '#94b3d4', .6);
  box(room, 0, .5, -5.4, 15, .08, .12, '#ffc976', 0, true);
  // Slatted timber feature wall and brand.
  for (let x = -7; x < -3.6; x += .16) box(room, x, 1.8, -5.48, .055, 3.4, .1, '#976c45');
  const brand = label('RUSH MART', 4.3, 1.05); brand.position.set(-4.6, 2.55, -5.2); room.add(brand);
  const tagline = label('FRESH FINDS. SMART DECISIONS.', 4.3, .28); tagline.position.set(-4.6, 1.78, -5.18); room.add(tagline);
  const banner = label('BAKERY  /  FRESH PRODUCE  /  DAILY NEEDS', 7.8, .45); banner.position.set(2, 3.05, -5.46); room.add(banner);
  // Rear chilled cabinets, shelves, bottle-shaped stock.
  for (let n = 0; n < 7; n++) {
    const x = -2.3 + n * 1.27;
    box(room, x, 1.22, -5.15, 1.2, 2.4, .65, '#172c43', .5);
    box(room, x, 1.28, -4.79, 1.05, 2.12, .035, '#4b819d', .65);
    for (let r = 0; r < 3; r++) {
      box(room, x, .5 + r * .62, -4.64, 1.1, .045, .45, '#c5d8e4', .6);
      for (let p = 0; p < 4; p++) { shape(room, cylinderGeo, x - .36 + p * .24, .73 + r * .62, -4.65, .075, .3, .075, p % 2 ? '#d1eaff' : '#6db6ee'); }
    }
    box(room, x + .42, 1.3, -4.59, .025, .4, .025, '#e4f6ff', .8);
  }
  for (let n = 0; n < 6; n++) {
    const x = -6 + n * 2.3;
    box(room, x, 3.3, -4.7, .13, .18, .4, '#152031', .6);
    box(room, x, 3.19, -4.5, .13, .025, .22, '#ffe0a0', 0, true);
  }
  const shelfGroups: THREE.Group[] = [];
  const stockGroups: THREE.Group[] = [];
  const shelfMeshes: THREE.Object3D[] = [];
  const halos: THREE.Mesh[] = [];
  PRODUCT_IDS.forEach((id, index) => {
    const group = new THREE.Group(); group.position.set(-4.25 + index * 3.65, 0, -.65); room.add(group); shelfGroups.push(group);
    box(group, 0, .12, 0, 2.72, .24, 1.3, '#263548', .6);
    const halo = box(group, 0, .08, .02, 2.85, .055, 1.4, '#ffc364', 0, true); halos.push(halo);
    box(group, 0, 1.35, -.48, 2.55, 2.7, .13, '#142c48', .35);
    for (const side of [-1, 1]) {
      box(group, side * 1.3, 1.45, 0, .15, 2.9, 1.2, '#adc0cc', .8);
      box(group, side * 1.24, 1.4, .62, .035, 2.4, .025, '#ffd79a', 0, true);
    }
    for (let r = 0; r < 3; r++) { box(group, 0, .3 + r * .67, .04, 2.6, .08, 1.1, '#a8b6c2', .7); box(group, 0, .28 + r * .67, .61, 2.6, .09, .035, '#eff3f5', .2); }
    box(group, 0, 2.65, 0, 2.7, .62, 1.17, '#102f51', .4);
    const sign = label(PRODUCTS[id].name.toUpperCase(), 2.45, .46); sign.position.set(0, 2.65, .6); group.add(sign);
    const aisle = label(`AISLE ${index + 1}`, 1.1, .22); aisle.position.set(-.65, 3.04, .59); group.add(aisle);
    const stock = new THREE.Group(); group.add(stock); stockGroups.push(stock);
    group.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.userData.product = id; shelfMeshes.push(obj); } });
  });
  function product(parent: THREE.Group, id: ProductId, x: number, y: number, z: number) {
    if (id === 'water') {
      shape(parent, cylinderGeo, x, y + .23, z, .13, .4, .13, '#8cccf0', .15);
      shape(parent, cylinderGeo, x, y + .46, z, .07, .12, .07, '#c2e8ff', .15);
      shape(parent, cylinderGeo, x, y + .53, z, .075, .04, .075, '#216fca');
      shape(parent, cylinderGeo, x, y + .23, z, .135, .16, .135, '#1c73be');
    } else if (id === 'milk') {
      box(parent, x, y + .24, z, .28, .47, .28, '#eff7ef');
      const roof = box(parent, x, y + .5, z, .2, .17, .28, '#6799d6'); roof.rotation.z = .32;
      box(parent, x, y + .24, z + .145, .27, .22, .01, '#1a55a0');
      ball(parent, x, y + .26, z + .155, .055, .065, .01, '#ffffff');
    } else {
      const pack = ball(parent, x, y + .24, z, .16, .25, .09, '#efb243'); pack.rotation.z = x * .08;
      box(parent, x, y + .22, z + .09, .2, .16, .015, '#b3352f');
      ball(parent, x, y + .23, z + .11, .055, .045, .012, '#ffe0a0');
    }
  }
  function plant(x: number, z: number, scale = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); room.add(g);
    shape(g, cylinderGeo, 0, .25, 0, .34, .5, .34, '#33495b', .45);
    for (let n = 0; n < 9; n++) {
      const angle = n * 2.4;
      const leaf = ball(g, Math.sin(angle) * .24, .7 + n * .065, Math.cos(angle) * .24, .12, .48, .085, n % 2 ? '#3a743b' : '#618c38'); leaf.rotation.set(Math.cos(angle) * .7, angle, Math.sin(angle) * .7);
    }
  }
  plant(-6.6, 4.4, 1.3); plant(6.6, 3.8); plant(6.55, -4.5); plant(-6.6, -4.4);
  // Pallet and delivery bay; only the animated parcel represents an actual order.
  for (let n = 0; n < 5; n++) box(room, -6 + n * .32, .12, 1.9, .23, .18, 1.55, '#ac7d4f');
  for (const z of [1.3, 2.5]) box(room, -5.35, .045, z, 1.8, .08, .14, '#6e4b32');
  const deliverySign = label('DELIVERY BAY', 2, .4); deliverySign.position.set(-5.4, .5, 3.1); deliverySign.rotation.x = -.3; room.add(deliverySign);
  const parcel = new THREE.Group(); room.add(parcel);
  box(parcel, 0, .42, 0, .85, .75, .75, '#bd905e'); box(parcel, 0, .8, 0, .14, .02, .75, '#f4d79c'); box(parcel, 0, .45, .38, .32, .2, .015, '#f2e8d7');
  // Entrance at the right, glass leaves slide solely in response to visual visitors.
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#9ed9ed', transparent: true, opacity: .28, roughness: .1, metalness: .2, side: THREE.DoubleSide }); materials.add(glassMat);
  const doors: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(7.25, 0, side * .65 + .8); room.add(g); doors.push(g);
    const pane = new THREE.Mesh(boxGeo, glassMat); pane.position.y = 1.35; pane.scale.set(.07, 2.7, 1.25); g.add(pane);
    for (const edge of [-.62, .62]) box(g, 0, 1.35, edge, .09, 2.75, .04, '#9db1c2', .8);
    box(g, -.1, 1.35, side * -.4, .08, .4, .04, '#d7e4e9', .8);
  }
  box(room, 7.24, 2.95, .8, .2, .5, 3.1, '#115843');
  const entrance = label('ENTRANCE', 2.8, .4, '#0c513e'); (entrance.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide; entrance.rotation.y = -Math.PI / 2; entrance.position.set(7.1, 2.95, .8); room.add(entrance);
  box(room, 6.3, .065, 1.1, 1.5, .03, 2.1, '#25394b');
  // Ribbed checkout, marble top, scanner, POS screen and receipt printer.
  const counter = new THREE.Group(); counter.position.set(2.35, 0, 3.5); room.add(counter);
  box(counter, 0, .66, 0, 4.15, 1.3, 1.48, '#163654', .25);
  for (let n = 0; n < 38; n++) box(counter, -1.95 + n * .105, .65, .755, .035, 1.12, .035, '#456784', .6);
  box(counter, 0, 1.35, 0, 4.35, .16, 1.7, '#d6d9d7', .45);
  box(counter, 0, .08, .77, 4.1, .055, .035, '#ffce78', 0, true);
  box(counter, 0, 1.2, .78, 4.15, .035, .035, '#ffce78', 0, true);
  const posSign = label('POS / CHECKOUT', 2.8, .48); posSign.position.set(0, .76, .8); counter.add(posSign);
  box(counter, .3, 1.5, 0, .55, .1, .42, '#112031', .4);
  box(counter, .3, 1.8, -.12, .08, .55, .08, '#233b50', .7);
  const screen = box(counter, .3, 2.05, -.1, .94, .65, .07, '#0a1425', .5); screen.rotation.x = -.18;
  const display = label('RUSH POS', .82, .5, '#9acddd', '#154369'); display.position.set(.3, 2.05, -.047); display.rotation.x = -.18; counter.add(display);
  box(counter, 1.3, 1.55, .1, .4, .3, .4, '#172332', .5);
  box(counter, -.65, 1.5, .15, .28, .1, .3, '#162231', .5);
  const confirmation = box(counter, -.65, 1.56, .15, .2, .02, .06, '#3ee0ae', 0, true);
  box(counter, -1.4, 1.6, 0, .45, .5, .3, '#c7ac7a');
  // Friendly articulated geometry characters, with parented limbs and basket.
  function bubble(text: string) {
    const c = document.createElement('canvas'); c.width = 768; c.height = 192; const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff7e9'; ctx.beginPath(); ctx.roundRect(8, 8, 752, 155, 45); ctx.fill(); ctx.beginPath(); ctx.moveTo(330, 160); ctx.lineTo(380, 190); ctx.lineTo(410, 160); ctx.fill();
    ctx.fillStyle = '#17324d'; ctx.font = 'bold 42px Arial'; ctx.textAlign = 'center'; ctx.fillText(text, 384, 99, 710);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; textures.add(tex);
    const m = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }); materials.add(m);
    const sprite = new THREE.Sprite(m); sprite.scale.set(2.5, .65, 1); sprite.position.y = 2.85; sprite.renderOrder = 5; return sprite;
  }
  function actor(id: number, cashier = false): Actor {
    const g = new THREE.Group(); room.add(g);
    const skin = ['#d3a17c', '#ad7756', '#edc4a3', '#96634a', '#d7aa86', '#c58b68'][id % 6];
    const shirt = cashier ? '#55a5b6' : ['#de8a65', '#6696bb', '#dfc298', '#9392bb', '#75a68e', '#c86871'][id % 6];
    ball(g, 0, 1.35, 0, .26, .4, .17, shirt);
    shape(g, cylinderGeo, 0, 1.69, 0, .085, .15, .085, skin);
    ball(g, 0, 1.94, 0, .205, .25, .19, skin);
    ball(g, 0, 2.08, -.035, .215, .17, .185, '#3a2926');
    if (id % 2) ball(g, 0, 1.96, -.16, .18, .28, .1, '#3a2926');
    for (const x of [-.075, .075]) { ball(g, x, 1.97, .175, .028, .034, .016, '#f7eee1'); ball(g, x, 1.97, .19, .014, .021, .01, '#253446'); }
    ball(g, 0, 1.9, .194, .034, .035, .03, skin);
    ball(g, 0, 1.83, .177, .055, .014, .018, '#9d5146');
    const arms: THREE.Group[] = []; const legs: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * .28, 1.57, 0); g.add(arm); arms.push(arm);
      ball(arm, 0, -.14, 0, .085, .2, .085, shirt); ball(arm, 0, -.39, .015, .065, .15, .065, skin); ball(arm, 0, -.54, .025, .068, .075, .065, skin);
      const leg = new THREE.Group(); leg.position.set(side * .12, 1.05, 0); g.add(leg); legs.push(leg);
      shape(leg, cylinderGeo, 0, -.39, 0, .085, .77, .085, '#253950'); ball(leg, 0, -.92, .07, .1, .09, .18, '#e9e5de');
    }
    const basket = new THREE.Group(); arms[1].add(basket); basket.position.set(.08, -.72, .08);
    box(basket, 0, 0, 0, .42, .25, .3, '#a93740', .2);
    for (let n = 0; n < 5; n++) box(basket, -.18 + n * .09, .015, .16, .025, .19, .015, '#ec7c72');
    box(basket, 0, .22, 0, .42, .025, .025, '#eaa58e');
    for (const side of [-1, 1]) box(basket, side * .2, .13, 0, .02, .18, .02, '#eaa58e');
    basket.visible = !cashier;
    const goods = new THREE.Group(); basket.add(goods); goods.scale.setScalar(.5);
    product(goods, CUSTOMERS.find(c => c.id === id)?.productId ?? 'water', 0, .02, 0); goods.visible = false;
    if (cashier) box(g, 0, 1.23, .17, .34, .5, .035, '#102d47');
    const b = bubble(cashier ? 'Welcome to Rush Mart!' : 'Hello!'); g.add(b); b.visible = false;
    return { root: g, arms, legs, basket, goods, bubble: b, stage: 'enter', since: 0, status: 'pending', id, route: 0 };
  }
  const cashier = actor(2, true); cashier.root.position.set(2.1, 0, 2.15);
  const actors = CUSTOMERS.map(c => actor(c.id)); actors.forEach(a => { a.root.visible = false; });
  const cash = box(room, 2, 1.7, 2.65, .25, .015, .12, '#9fc69c'); cash.visible = false;
  const receipt = bubble('Thank you!'); receipt.position.set(2.5, 2.8, 3); receipt.visible = false; room.add(receipt);
  let lastRevenue = read().revenue ?? 0; let saleAt = -100; let lastTime = performance.now(); let frame = 0; let stopped = false;
  const stockValues = [-1, -1, -1];
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  const click = (e: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...shelfMeshes, ...counter.children], false);
    if (hits[0]?.object.userData.product) actions.select(hits[0].object.userData.product as ProductId);
    else if (hits.length) actions.checkout();
  };
  renderer.domElement.addEventListener('click', click);
  const lost = (e: Event) => { e.preventDefault(); stopped = true; cancelAnimationFrame(frame); onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  function resize() {
    const w = host.clientWidth; const h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); const aspect = w / h; const vertical = Math.max(6.9, 9.7 / aspect);
    camera.left = -vertical * aspect; camera.right = vertical * aspect; camera.top = vertical; camera.bottom = -vertical; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const started = performance.now();
  function animate(now: number) {
    if (stopped) return;
    frame = requestAnimationFrame(animate);
    if (document.hidden) { lastTime = now; return; }
    const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now;
    const t = (now - started) / 1000; const s = read();
    if ((s.revenue ?? 0) > lastRevenue) {
      saleAt = t; const amount = (s.revenue ?? 0) - lastRevenue;
      // Amount comes only from confirmed engine revenue, never inferred from a price button.
      const old = receipt.material as THREE.SpriteMaterial; if (old.map) { old.map.dispose(); textures.delete(old.map); } old.dispose(); materials.delete(old);
      const replacement = bubble(`LKR ${amount.toLocaleString('en-LK')} · Thank you!`); receipt.material = replacement.material;
    }
    lastRevenue = s.revenue ?? 0;
    PRODUCT_IDS.forEach((id, i) => {
      const count = s.inventory[id];
      if (stockValues[i] !== count) {
        const group = stockGroups[i]; group.clear(); stockValues[i] = count;
        // One visible package per actual unit, bounded for GPU safety.
        for (let n = 0; n < Math.min(count, 36); n++) product(group, id, -.92 + (n % 6) * .365, .35 + Math.floor(n / 6) % 3 * .67, .22 - Math.floor(n / 18) * .35);
      }
      halos[i].visible = s.selected === id || s.requested === id;
      const m = halos[i].material as THREE.MeshStandardMaterial; m.emissiveIntensity = reduced.matches ? .7 : .7 + Math.sin(t * 2) * .2;
    });
    if (s.delivery) {
      parcel.visible = true;
      const p = Math.max(0, Math.min(1, ((s.now ?? 0) - s.delivery.orderedAt) / (s.delivery.completesAt - s.delivery.orderedAt)));
      parcel.position.set(-7 + p * 1.5, reduced.matches ? 0 : Math.sin(p * Math.PI) * .14, 1.9);
    } else parcel.visible = false;
    let entering = false;
    actors.forEach((a, i) => {
      const status = s.statuses?.[i] ?? (a.id === s.customerId ? 'active' : 'pending');
      const productId = CUSTOMERS[i].productId; const shelfX = -4.25 + PRODUCT_IDS.indexOf(productId) * 3.65;
      if (status !== a.status) {
        const previous = a.status; a.status = status; a.since = t;
        if (status === 'active') { a.root.position.set(6.65, 0, .9); a.stage = 'enter'; a.route = 0; a.root.visible = true; }
        else if (previous === 'active') { a.stage = status === 'served' ? 'checkout' : 'exit'; }
        else a.root.visible = false; // No historical transaction replays on remount.
      }
      if (!a.root.visible) return;
      a.goods.visible = a.status === 'served';
      const elapsed = t - a.since; const destination = new THREE.Vector3();
      if (a.status === 'active') {
        if (elapsed < 1.7) { destination.set(shelfX, 0, 1.0); entering = true; }
        else if (elapsed < 3.3) destination.set(shelfX, 0, 1.0);
        else {
          const route = [new THREE.Vector3(-.5, 0, 1.8), new THREE.Vector3(-.5, 0, 4.85), new THREE.Vector3(1.5, 0, 4.85)];
          destination.copy(route[Math.min(a.route, 2)]);
          if (a.root.position.distanceTo(destination) < .09 && a.route < 2) a.route++;
        }
      } else if (a.status === 'served' && a.stage === 'checkout') {
        const route = [new THREE.Vector3(-.5, 0, 1.8), new THREE.Vector3(-.5, 0, 4.85), new THREE.Vector3(1.5, 0, 4.85)];
        destination.copy(route[Math.min(a.route, 2)]);
        if (a.root.position.distanceTo(destination) < .09) {
          if (a.route < 2) a.route++;
          else { a.stage = 'pay'; a.since = t; }
        }
      } else if (a.stage === 'pay' && elapsed < 1.2) destination.set(1.5, 0, 4.85);
      else {
        a.stage = 'exit';
        if (a.root.position.z < 2) destination.set(8.7, 0, 1.2);
        else if (a.root.position.x < 0 && a.root.position.z < 4.7) destination.set(-.5, 0, 4.85);
        else destination.set(a.root.position.x < 5.5 ? 5.7 : 8.7, 0, a.root.position.x < 5.5 ? 4.85 : 1.2);
        entering = true;
      }
      const delta = destination.clone().sub(a.root.position); const distance = delta.length(); const walking = distance > .06;
      if (reduced.matches) a.root.position.copy(destination);
      else if (walking) { a.root.position.addScaledVector(delta.normalize(), Math.min(distance, dt * 3.8)); const angle = Math.atan2(delta.x, delta.z); const difference = Math.atan2(Math.sin(angle - a.root.rotation.y), Math.cos(angle - a.root.rotation.y)); a.root.rotation.y += difference * Math.min(1, dt * 10); }
      else a.root.rotation.y = Math.PI;
      const stride = !reduced.matches && walking ? Math.sin(t * 10 + i) * .45 : 0;
      a.legs[0].rotation.x = stride; a.legs[1].rotation.x = -stride;
      a.arms[0].rotation.x = -stride * .7; a.arms[1].rotation.x = stride * .3;
      const reaching = a.status === 'active' && elapsed > 1.7 && elapsed < 3.3 && !walking;
      if (reaching && !reduced.matches) a.arms[0].rotation.x = -.9 + Math.sin(t * 3) * .12;
      if (a.stage === 'pay' && !reduced.matches) a.arms[0].rotation.x = -.9;
      a.root.position.y = !reduced.matches ? (walking ? Math.abs(Math.sin(t * 10)) * .035 : Math.sin(t * 2 + i) * .012) : 0;
      const showHello = a.status === 'active' && elapsed < 1.7;
      const showOrder = a.status === 'active' && elapsed >= 1.7 && elapsed < 4.3;
      const showExit = a.status === 'expired' && elapsed < 2;
      const key = a.stage === 'pay' ? 'Thank you!' : showHello ? 'Hello!' : showOrder ? `Looking for ${PRODUCTS[productId].name.toLowerCase()}.` : showExit ? 'Time to go. Bye!' : '';
      // Limit to the currently focused customer, plus a brief departure; bubbles never stack in a queue.
      a.bubble.visible = Boolean(key) && (s.customerId === a.id || showExit || a.stage === 'pay') && t - saleAt > 2.5;
      (a.bubble.material as THREE.SpriteMaterial).opacity = reduced.matches ? 1 : Math.min(1, elapsed * 4);
      if (key && a.bubble.userData.text !== key) {
        const old = a.bubble.material as THREE.SpriteMaterial; if (old.map) { old.map.dispose(); textures.delete(old.map); } old.dispose(); materials.delete(old);
        a.bubble.material = bubble(key).material; a.bubble.userData.text = key;
      }
      if (a.status !== 'active' && a.stage === 'exit' && a.root.position.x > 8.4) { a.root.visible = false; a.bubble.visible = false; }
    });
    const doorOffset = entering ? .55 : 0;
    doors.forEach((door, i) => { const destination = (i ? 1 : -1) * (.65 + doorOffset) + .8; door.position.z = THREE.MathUtils.damp(door.position.z, destination, 8, dt); });
    const saleAge = t - saleAt;
    receipt.visible = saleAge < 2.5; cash.visible = actors.some(a => a.stage === 'pay' && a.root.visible) && !reduced.matches;
    const payer = actors.find(a => a.stage === 'pay' && a.root.visible);
    const handover = payer ? Math.min(1, (t - payer.since) / 1.2) : 0;
    cash.position.set(1.6 + handover * .4, 1.55 + Math.sin(handover * Math.PI) * .1, 4.35 - handover * 1.7);
    cashier.arms[0].rotation.x = cash.visible ? -.75 : 0;
    confirmation.scale.x = saleAge < 2 ? .25 : .2;
    if (!reduced.matches && t < 1.2) { camera.zoom = .94 + .06 * Math.min(1, t / 1.2); camera.updateProjectionMatrix(); }
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
  return () => {
    stopped = true; cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener('click', click); renderer.domElement.removeEventListener('webglcontextlost', lost);
    scene.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); }); sun.shadow.dispose();
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove(); scene.clear();
  };
}

