// src/index.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('container') as HTMLDivElement;
const width = 800, height = 500;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xd4b9ff, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(2, 5, 2);
dir.castShadow = true;
scene.add(dir);

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
loader.setDRACOLoader(draco);

type Axis = 'x' | 'y' | 'z';
type RotAnim = {
  mesh: THREE.Object3D;
  axis: Axis;
  speed: number;
  amplitude: number;
  phase?: number;
  base: number;
};
type MoveAnim = {
  mesh: THREE.Object3D;
  axis: Axis;
  speed: number;
  low: number;
  high: number;
  phase?: number;
  base: THREE.Vector3;
};

const rotAnims: RotAnim[] = [];
const moveAnims: MoveAnim[] = [];
const clock = new THREE.Clock();

function frameObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D) {
  const bbox = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = camera.aspect;

  const distV = (maxDim / 2) / Math.tan(fov / 2) * 1.2;
  const horizFOV = 2 * Math.atan(Math.tan(fov / 2) * aspect);
  const distH = (maxDim / 2) / Math.tan(horizFOV / 2) * 1.2;
  const dist = Math.max(distV, distH);

  const dirVec = new THREE.Vector3(1, 1, 1).normalize();
  camera.position.copy(center.clone().add(dirVec.multiplyScalar(dist)));
  camera.near = Math.max(0.01, dist / 100);
  camera.far = dist * 10;
  camera.updateProjectionMatrix();
  camera.lookAt(center);

  object.position.sub(center);

  if ((controls as any)?.target) {
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

function getRotationBase(obj: THREE.Object3D, axis: Axis) {
  if (axis === 'x') return obj.rotation.x;
  if (axis === 'y') return obj.rotation.y;
  return obj.rotation.z;
}

function pickGroupTarget(obj: THREE.Object3D) {
  const p = obj.parent as any;
  if (p && p.isGroup) return p as THREE.Object3D;
  return obj;
}

loader.load(
  'public/level-react-draco.glb',
  (gltf) => {
    const model = gltf.scene;

    model.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        switch (obj.name) {
          case "Cactus": {
            const axis: Axis = 'y';
            rotAnims.push({
              mesh: obj,
              axis,
              speed: 0.5,
              amplitude: 5,
              phase: 0,
              base: getRotationBase(obj, axis)
            });
            break;
          }
          case "SudoHead": {
            const axis: Axis = 'z';
            rotAnims.push({
              mesh: obj,
              axis,
              speed: 1,
              amplitude: 2.5,
              phase: 0,
              base: getRotationBase(obj, axis)
            });
            break;
          }
          case "React": {
            const axisX: Axis = 'x';
            rotAnims.push({
              mesh: obj,
              axis: axisX,
              speed: 0.4,
              amplitude: 0,
              phase: 0,
              base: getRotationBase(obj, axisX)
            });

            moveAnims.push({
              mesh: obj, axis: 'y', speed: 0.6,
              low: 0.05, high: 0.1, phase: 0,
              base: obj.position.clone()
            });
            break;
          }
          case "Pyramid": {
            const axisZ: Axis = 'z';
            rotAnims.push({
              mesh: obj,
              axis: axisZ,
              speed: 0.4,
              amplitude: 0,
              phase: 0,
              base: getRotationBase(obj, axisZ)
            });

            moveAnims.push({
              mesh: obj, axis: 'y', speed: 0.6,
              low: 0, high: 0.15, phase: 0,
              base: obj.position.clone()
            });
            break;
          }
          case "Camera": {
            const axis: Axis = 'z';
            const target = pickGroupTarget(obj);
            rotAnims.push({
              mesh: target,
              axis,
              speed: -0.3,
              amplitude: 20,
              phase: 0,
              base: getRotationBase(target, axis)
            });
            break;
          }
          default:
            break;
        }
      }
    });

    scene.add(model);
    frameObject(camera, model);
  },
  undefined,
  (err) => console.error('Load GLB failed:', err)
);

function onResize() {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
addEventListener('resize', onResize);

let mixer: THREE.AnimationMixer | null = null;
function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  if (mixer) mixer.update(dt);
  controls.update();

  for (const a of rotAnims) {
    if (a.amplitude > 0) {
      const radAmp = THREE.MathUtils.degToRad(a.amplitude);
      const delta = radAmp * Math.sin(2 * Math.PI * a.speed * t + (a.phase ?? 0));
      if (a.axis === 'x') a.mesh.rotation.x = a.base + delta;
      if (a.axis === 'y') a.mesh.rotation.y = a.base + delta;
      if (a.axis === 'z') a.mesh.rotation.z = a.base + delta;
    } else {
      const deltaSpin = 2 * Math.PI * a.speed * dt;
      if (a.axis === 'x') a.mesh.rotation.x += deltaSpin;
      if (a.axis === 'y') a.mesh.rotation.y += deltaSpin;
      if (a.axis === 'z') a.mesh.rotation.z += deltaSpin;
    }
  }

  for (const m of moveAnims) {
    const range = m.high - m.low;
    const wave = 0.5 * (1 - Math.cos(2 * Math.PI * m.speed * t + (m.phase ?? 0)));
    const offset = m.low + range * wave;
    if (m.axis === 'x') m.mesh.position.x = m.base.x + offset;
    if (m.axis === 'y') m.mesh.position.y = m.base.y + offset;
    if (m.axis === 'z') m.mesh.position.z = m.base.z + offset;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
