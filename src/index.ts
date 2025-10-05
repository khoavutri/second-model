// src/index.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { addWheel } from './util';
import RAPIER from "@dimforge/rapier3d-compat";

console.time("khoa");
RAPIER.init()
console.timeEnd("khoa");

const container = document.getElementById('container') as HTMLDivElement;
const loader = new THREE.TextureLoader();

const width = 800, height = 500;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
camera.position.set(0, 4, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

//fps
const stats = new Stats();
container.appendChild(stats.dom);

//ánh sang
const ambient = new THREE.HemisphereLight(0x555555, 0xFFFFFF);
scene.add(ambient);

const light = new THREE.DirectionalLight(0xffffff, 4);

light.position.set(0, 12.5, 12.5);
light.castShadow = true;
light.shadow.radius = 3;
light.shadow.blurSamples = 8;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;

const size = 40;
light.shadow.camera.left = - size;
light.shadow.camera.bottom = - size;
light.shadow.camera.right = size;
light.shadow.camera.top = size;
light.shadow.camera.near = 1;
light.shadow.camera.far = 50;

scene.add(light);

//nền
const geometryPlane = new THREE.BoxGeometry(100, 0.5, 100);
const materialPlane = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
const plane = new THREE.Mesh(geometryPlane, materialPlane);
plane.position.set(0, - 0.33, - 20);
plane.receiveShadow = true;
scene.add(plane);

loader.load('/public/grid.png', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    plane.material.map = texture;
    plane.material.needsUpdate = true;
});

//xe
const geometry = new THREE.BoxGeometry(2, 1, 4);
const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
const car = new THREE.Mesh(geometry, material);
car.castShadow = true;
car.position.y = 1;
scene.add(car);

//bánh xe
addWheel(0, [- 1, 0, - 1.5], car);
addWheel(1, [1, 0, - 1.5], car);
addWheel(2, [- 1, 0, 1.5], car);
addWheel(3, [1, 0, 1.5], car);

//add điều khiển camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target = new THREE.Vector3(0, 2, 0);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}
animate();