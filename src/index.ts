// src/index.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import RAPIER from "@dimforge/rapier3d-compat";

const container = document.getElementById('container') as HTMLDivElement;
const width = 800, height = 500;
const keys: any = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

const wheels: any[] = [];
let world: RAPIER.World,
    groundBody,
    carBody: any

let scene: THREE.Scene,
    car: THREE.Mesh,
    plane: any,
    controls: OrbitControls,
    stats: Stats,
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera

const addWheel = (pos: [number, number, number], carMesh: THREE.Mesh, steerable: boolean) => {
    const wheelRadius = 0.35, wheelWidth = 0.25;

    // 1) Mesh hiển thị — xoay hình học để bánh nằm ngang (trục quay X)
    const geo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20);
    geo.rotateZ(Math.PI * 0.5); // xoay geometry, KHÔNG xoay mesh
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const localPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    mesh.position.copy(localPos);
    carMesh.add(mesh);

    // 2) Tính vị trí world chuẩn (ổn định khi thân xe đã xoay)
    const worldPos = carMesh.localToWorld(localPos.clone());
    const lift = 0.02; // nhích lên 2cm khỏi nền để tránh xuyên lúc khởi tạo

    // 3) steerBody: body trung gian cho đánh lái (quanh Y)
    const steerDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldPos.x, worldPos.y + lift, worldPos.z)
        .setLinearDamping(0.5)
        .setAngularDamping(0.5)
        .setCcdEnabled(true)
        .setCanSleep(false);
    const steerBody = world.createRigidBody(steerDesc);

    // collider nhỏ để có khối lượng, không ảnh hưởng va chạm chính
    world.createCollider(
        RAPIER.ColliderDesc.ball(0.05)
            .setDensity(50)
            .setRestitution(0.0),
        steerBody
    );

    // 4) wheelBody: thân bánh thật
    const wheelDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(worldPos.x, worldPos.y + lift, worldPos.z)
        .setLinearDamping(0.6)
        .setAngularDamping(1.0)
        .setCcdEnabled(true)
        .setCanSleep(false);
    const wheelBody = world.createRigidBody(wheelDesc);

    // QUAN TRỌNG: Rapier cylinder mặc định trục là Y → xoay collider -90° quanh Z để trục nằm theo X
    const s = Math.sin(-Math.PI / 4);
    const c = Math.cos(-Math.PI / 4);
    const wheelCol = RAPIER.ColliderDesc
        .cylinder(wheelWidth * 0.5, wheelRadius)
        .setRotation({ x: 0, y: 0, z: s, w: c })   // xoay collider về trục X
        .setFriction(1.4)
        .setRestitution(0.0)
        .setDensity(120);
    world.createCollider(wheelCol, wheelBody);

    // 5) JOINTS
    // 5a) carBody ↔ steerBody : REVOLUTE quanh Y (đánh lái)
    const steerJD = RAPIER.JointData.revolute(
        // anchor ở carBody là vị trí local của bánh trong không gian "car"
        { x: localPos.x, y: localPos.y, z: localPos.z },
        // anchor ở steerBody là gốc local
        { x: 0, y: 0, z: 0 },
        // trục joint: Y
        { x: 0, y: 1, z: 0 }
    );
    const steerJoint = world.createImpulseJoint(steerJD, carBody, steerBody, true);

    // 5b) steerBody ↔ wheelBody : REVOLUTE quanh X (quay bánh)
    const axleJD = RAPIER.JointData.revolute(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        // trục joint: X
        { x: 1, y: 0, z: 0 }
    );
    const axleJoint = world.createImpulseJoint(axleJD, steerBody, wheelBody, true);

    // 6) Lưu để update/điều khiển
    wheels.push({
        mesh,
        wheelBody,
        steerBody,
        steerJoint,
        axleJoint,
        steerable,
        steerAngle: 0
    });
};


const init = async () => {
    //init rapier,world
    await RAPIER.init();
    world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    //init loader
    const loader = new THREE.TextureLoader();

    //init scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 4, 10);

    //init renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    //init stats
    stats = new Stats();
    container.appendChild(stats.dom);

    //init lighting
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

    //init ground
    {
        const geometryPlane = new THREE.BoxGeometry(100, 0.5, 100);
        const materialPlane = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        plane = new THREE.Mesh(geometryPlane, materialPlane);
        plane.position.set(0, - 0.25, -0);
        plane.receiveShadow = true;
        scene.add(plane);
        loader.load('/public/grid.png', (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(80, 80);
            if (plane) {
                plane.material.map = texture;
                plane.material.needsUpdate = true;
            }
        });

        const rbDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(plane.position.x, plane.position.y, plane.position.z)
            .setRotation({
                x: plane.quaternion.x,
                y: plane.quaternion.y,
                z: plane.quaternion.z,
                w: plane.quaternion.w
            });

        groundBody = world.createRigidBody(rbDesc);
        const colliderDesc =
            RAPIER.ColliderDesc.cuboid(50, 0.25, 50)
                .setFriction(1.0);
        world.createCollider(colliderDesc, groundBody);
    }

    //init car
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    car = new THREE.Mesh(geometry, material);
    car.castShadow = true;
    car.position.y = 1;
    scene.add(car);
    const carDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(car.position.x, car.position.y, car.position.z)
        .setRotation({
            x: car.quaternion.x,
            y: car.quaternion.y,
            z: car.quaternion.z,
            w: car.quaternion.w
        })
        .setLinearDamping(0.25)
        .setAngularDamping(0.7);

    carBody = world.createRigidBody(carDesc);
    carBody.setEnabledRotations(false, true, false, true);

    const colliderCar =
        RAPIER.ColliderDesc.cuboid(1, 0.5, 2)
            .setFriction(1.0)
            .setRestitution(0.0); // độ nảy
    world.createCollider(colliderCar, carBody);

    //add 4 wheels
    addWheel([-1, -0.5, -1.5], car, true);
    addWheel([1, -0.5, -1.5], car, true);
    addWheel([-1, -0.5, 1.5], car, false);
    addWheel([1, -0.5, 1.5], car, false);

    //init control
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target = new THREE.Vector3(0, 2, 0);


    animate();
}


// THÊM PHẦN NÀY VÀO CUỐI FILE
const handleInput = () => {
    if (!carBody) return;

    // cấu hình gọn
    const dt = 1 / 60;
    const engineForce = 10;
    const maxSteer = THREE.MathUtils.degToRad(30);
    const steerLerp = 10.0; // độ mượt đổi góc lái

    // 1) góc lái mục tiêu
    let target = 0;
    if (keys.ArrowLeft) target = maxSteer;
    if (keys.ArrowRight) target = -maxSteer;

    // 2) cập nhật góc lái (mượt) cho 2 bánh trước
    for (let i = 0; i < 2; i++) {
        const w = wheels[i];
        w.steerAngle = THREE.MathUtils.damp(w.steerAngle, target, steerLerp, dt);
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), w.steerAngle);
        w.steerBody.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
    }

    // 3) lực kéo theo hướng thật của bánh sau
    const drive = (w: any, force: number) => {
        const rq = w.wheelBody.rotation();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
            new THREE.Quaternion(rq.x, rq.y, rq.z, rq.w)
        ).normalize();
        w.wheelBody.applyImpulse({ x: forward.x * force, y: forward.y * force, z: forward.z * force }, true);
    };

    if (keys.ArrowUp) { drive(wheels[2], engineForce); drive(wheels[3], engineForce); }
    if (keys.ArrowDown) { drive(wheels[2], -engineForce); drive(wheels[3], -engineForce); }
};

//render loop
//render loop
const animate = () => {
    requestAnimationFrame(animate);
    handleInput();
    world.step();

    const carPos = carBody.translation();
    const carRot = carBody.rotation();
    car.position.set(carPos.x, carPos.y, carPos.z);
    car.quaternion.set(carRot.x, carRot.y, carRot.z, carRot.w).normalize();

    car.updateMatrixWorld(true);

    const parentInvQ = car.quaternion.clone().invert().normalize();

    for (const w of wheels) {
        const wp = w.wheelBody.translation();
        const wq = w.wheelBody.rotation();

        const worldPos = new THREE.Vector3(wp.x, wp.y, wp.z);
        const localPos = car.worldToLocal(worldPos.clone());

        const worldQuat = new THREE.Quaternion(wq.x, wq.y, wq.z, wq.w).normalize();
        const localQuat = parentInvQ.clone().multiply(worldQuat).normalize();

        w.mesh.position.copy(localPos);
        w.mesh.quaternion.copy(localQuat);
    }

    controls.update();
    stats.update();
    renderer.render(scene, camera);
};


init();

window.addEventListener("keydown", (event) => {
    if (event.key in keys) {
        keys[event.key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key in keys) {
        keys[event.key] = false;
    }
});
