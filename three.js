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

// 1) Increase globe & cloud mesh resolution for higher quality
const earthGeo = new THREE.SphereGeometry(2, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({
    map: loader.load('earthmap.jpeg'),
    specular: 0x333333,
    shininess: 5
});
const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

const cloudGeo = new THREE.SphereGeometry(2.03, 64, 64);
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

// 2) Setup OrbitControls (make sure to include OrbitControls.js in index.html)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 0.5;   // closest zoom
controls.maxDistance = 10;    // farthest zoom
controls.rotateSpeed = sensitivity;
controls.zoomSpeed = 1.2;

// 3) Remove manual wheel & pointer handlers (OrbitControls handles zoom & rotate)

function animate() {
    requestAnimationFrame(animate);

    // optional auto‐rotate
    earth.rotation.y += 0.0005;

    controls.update();
    renderer.render(scene, camera);
}

console.log("Starting animation...");
animate();
console.log("Animation started - you should see Earth rotating in space!");