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

// First upgrade sphere resolutions for better quality
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

const MIN_Z = 2.2, MAX_Z = 10, STEP_Z = 0.3;
renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    isDragging = false;
    const delta = e.deltaY > 0 ? STEP_Z : -STEP_Z;
    camera.position.z = Math.min(MAX_Z, Math.max(MIN_Z, camera.position.z + delta));
    clouds.visible = camera.position.z > 3;
});

// Improved touch handling

// Fix the canvas reference to ensure we have it defined before using it
const canvas = renderer.domElement;
canvas.style.touchAction = 'none'; 

// Replace the existing touch handlers with more reliable ones
canvas.addEventListener('touchstart', e => {
    e.preventDefault(); // Prevent default touch actions

    if (e.touches.length === 2) {
        // Two finger touch - prepare for pinch zoom
        initialTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        initialCameraZ = camera.position.z;
        isDragging = false; // Stop rotation when pinching
        console.log('Pinch start:', initialTouchDistance);
    } else if (e.touches.length === 1) {
        // Single touch - prepare for rotation
        isDragging = true;
        prevPos = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
        };
        console.log('Touch start at:', prevPos);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault(); // Prevent scrolling

    if (e.touches.length === 2) {
        // Handle pinch zoom
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        if (currentDistance > 0 && initialTouchDistance > 0) {
            // Calculate zoom factor
            const zoomFactor = initialTouchDistance / currentDistance;
            const newZ = initialCameraZ * zoomFactor;
            
            // Apply limits
            const safeZ = Math.min(MAX_Z, Math.max(MIN_Z, newZ));
            camera.position.z = safeZ;
            clouds.visible = camera.position.z > 3;
            console.log('Zoom to:', safeZ);
        }
    } else if (e.touches.length === 1 && isDragging) {
        // Handle rotation (one finger drag)
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const dx = touchX - prevPos.x;
        const dy = touchY - prevPos.y;
        
        earth.rotation.y += dx * sensitivity;
        earth.rotation.x += dy * sensitivity;
        
        prevPos = { x: touchX, y: touchY };
    }
});

canvas.addEventListener('touchend', e => {
    // If we still have one finger down and were previously pinching, 
    // start rotating from current position
    if (e.touches.length === 1) {
        prevPos = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
        };
        isDragging = true;
    } else {
        isDragging = false;
    }
});

canvas.addEventListener('touchcancel', () => {
    isDragging = false;
});

let sensitivity = 0.002;
const slider = document.getElementById('sensitivitySlider');
slider.addEventListener('input', e => {
    sensitivity = parseFloat(e.target.value);
});

let isDragging = false;
let prevPos    = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  isDragging = true;
  prevPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', e => {
  e.preventDefault();
  if (!isDragging) return;
  const dx = e.clientX - prevPos.x;
  const dy = e.clientY - prevPos.y;
  earth.rotation.y += dx * sensitivity;
  earth.rotation.x += dy * sensitivity;
  prevPos = { x: e.clientX, y: e.clientY };
});

const stopDrag = () => { isDragging = false; };
canvas.addEventListener('pointerup',   stopDrag);
canvas.addEventListener('pointerleave', stopDrag);
canvas.addEventListener('pointercancel',stopDrag);

// Handle window resize properly
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    earth.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

console.log("Starting animation...");
animate();
console.log("Animation started - you should see Earth rotating in space!");