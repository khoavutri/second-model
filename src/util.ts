// src/util.ts
import * as THREE from 'three';

export const addWheel = (
    index: number,
    pos: [number, number, number],
    carMesh: THREE.Mesh
) => {
    const wheelList = []
    const wheelRadius = 0.3;
    const wheelWidth = 0.4;
    const geometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    geometry.rotateZ(Math.PI * 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const wheel = new THREE.Mesh(geometry, material);
    wheel.castShadow = true;
    const inputPos = new THREE.Vector3(...pos)
    wheel.position.copy(inputPos);
    wheelList.push(wheel);
    carMesh.add(wheel);
    return { wheels: wheelList, car: carMesh }
};
