// src/util.ts
import * as THREE from 'three';

export const addWheel = (
    index: number,
    pos: [number, number, number],
    carMesh: THREE.Mesh
) => {
    const wheelRadius = 0.3;
    const wheelWidth = 0.4;
    const carHeight = 1;

    const pivot = new THREE.Object3D();
    pivot.position.set(pos[0], pos[1] - wheelRadius - carHeight / 2, pos[2]);
    carMesh.add(pivot);

    const geo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    geo.rotateZ(Math.PI * 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const wheelMesh = new THREE.Mesh(geo, mat);
    wheelMesh.castShadow = true;
    wheelMesh.receiveShadow = true;

    pivot.add(wheelMesh);

    return { pivot, mesh: wheelMesh };
};
