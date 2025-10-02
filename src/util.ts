// src/util.ts
import * as THREE from 'three';

export const addWheel = (index: number, pos: [number, number, number], mesh: THREE.Mesh) => {
    const wheelRadius = 0.3;
    const wheelWidth = 0.4;

    const geometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    geometry.rotateZ(Math.PI * 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const wheel = new THREE.Mesh(geometry, material);

    const carHeight = 1; // Chiều cao thân xe
    wheel.position.set(
        pos[0],
        pos[1] - wheelRadius - carHeight / 2, // Đặt bánh xe dưới đáy xe
        pos[2]
    );

    wheel.castShadow = true;
    mesh.add(wheel);

    return wheel;
}