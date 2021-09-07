import "./style.css";
import * as THREE from "three";

import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

// Variables
let camera, scene, renderer, controls;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let jump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();

init();
animate();

// Init
function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  controls = new PointerLockControls(camera, document.body);

  // play
  const play = document.getElementById("button");
  play.addEventListener("click", () => {
    controls.lock();
  });

  // hide the play button
  controls.addEventListener("lock", () => {
    play.style.display = "none";
  });

  // show the play button
  controls.addEventListener("unlock", () => {
    play.style.display = "flex";
  });

  scene.add(controls.getObject());

  // Controls
  // key down
  const onKeyDown = (event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (jump === true) velocity.y += 250;
        jump = false;
        break;
    }
  };

  // key up
  const onKeyUp = (event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -2, 1),
    0,
    10
  );

  // Floor
  let floorGeometry = new THREE.PlaneGeometry(1500, 1500, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  // vertex displacemente
  let position = floorGeometry.attributes.position;

  for (let i = 0, length = position.count; i < length; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 30 - 10;
    vertex.y += Math.random() * 3;
    vertex.z += Math.random() * 30 - 10;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  // ensure each face has unique vertices
  floorGeometry = floorGeometry.toNonIndexed();

  position = floorGeometry.attributes.position;

  const floorMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}

// On Window Resize

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animate
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    // this ensures consistent movements in all directions
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      jump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // new behavior
    controls.getObject().position.y += velocity.y * delta;

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      jump = true;
    }
  }

  prevTime = time;
  renderer.render(scene, camera);
}
