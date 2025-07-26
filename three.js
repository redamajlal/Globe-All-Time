console.log("Assets loading...");

const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');
loader.setPath('textures/');

loader.load('galaxy.png', texture => {
    const geo = new THREE.SphereGeometry(500, 32, 32);
    geo.scale(-1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false });
    scene.add(new THREE.Mesh(geo, mat));
});

const earthGeo = new THREE.SphereGeometry(2, 32, 32);
const earthMat = new THREE.MeshPhongMaterial({
    map: loader.load('earthmap.jpeg'),
    specular: 0x333333,
    shininess: 5
});
const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

const cloudGeo = new THREE.SphereGeometry(2.03, 32, 32);
const cloudMat = new THREE.MeshPhongMaterial({
    map: loader.load('earthCloud.png'),
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
earth.add(clouds);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 3, 5);
scene.add(dirLight);

scene.add(new THREE.AmbientLight(0x202020, 0.2));
scene.add(new THREE.HemisphereLight(0x000000, 0x000000, 0.05));

const MIN_Z = 2.2, MAX_Z = 10, STEP_Z = 0.3;
renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    isDragging = false;
    const delta = e.deltaY > 0 ? STEP_Z : -STEP_Z;
    camera.position.z = Math.min(MAX_Z, Math.max(MIN_Z, camera.position.z + delta));
    clouds.visible = camera.position.z > 3;
});

let sensitivity = 0.002;
const slider = document.getElementById('sensitivitySlider');
slider.addEventListener('input', e => {
    sensitivity = parseFloat(e.target.value);
});

let isDragging = false;
let prevPos    = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
});

renderer.domElement.addEventListener('mousemove', (e) => {
  e.preventDefault();
  if (isDragging) {
    const dx = e.offsetX - prevPos.x;
    const dy = e.offsetY - prevPos.y;
    earth.rotation.y += dx * sensitivity;
    earth.rotation.x += dy * sensitivity;
  }
  prevPos = { x: e.offsetX, y: e.offsetY };
});

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});

renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

console.log("Starting animation...");
animate();
console.log("Animation started - you should see Earth rotating in space!");