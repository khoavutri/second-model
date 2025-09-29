// src/index.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const animate = () => { }

const container = document.getElementById('container') as HTMLDivElement;
const width = 800, height = 500;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
camera.position.set(0, 4, 10);

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

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 2, 0);
controls.update();


