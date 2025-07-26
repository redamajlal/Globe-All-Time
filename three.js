console.log("Earth globe example starting...");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const message = document.createElement('div');
message.style.position = 'absolute';
message.style.top = '10px';
message.style.left = '10px';
message.style.color = 'white';
message.style.backgroundColor = 'rgba(0,0,0,0.5)';
message.style.padding = '10px';
message.style.fontFamily = 'Arial, sans-serif';
message.textContent = 'Loading textures...';
document.body.appendChild(message);

const textureLoader = new THREE.TextureLoader();

textureLoader.manager.onLoad = function() {
    message.textContent = 'Earth globe loaded successfully. Drag to rotate!';
};

textureLoader.manager.onError = function(url) {
    console.error('Error loading texture:', url);
    message.textContent += ` Error loading texture: ${url.split('/').pop()}`;
};

function createFallbackGalaxy() {
    console.log("Creating fallback starfield");
    const stars = [];
    const starGeometry = new THREE.BufferGeometry();
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        stars.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    message.textContent += " Using starfield fallback.";
}

const galaxyTexture = textureLoader.load(
    'textures/galaxy.png', 
    () => {
        console.log("Galaxy texture loaded successfully");
        message.textContent += " Galaxy loaded!";
        
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        skyGeometry.scale(-1, 1, 1);
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: galaxyTexture,
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        console.log("Galaxy skybox created");
    },
    (xhr) => {
        console.log(`Galaxy loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
    },
    (err) => {
        console.error("Failed to load galaxy texture:", err);
        message.textContent += " Failed to load galaxy!";
        createFallbackGalaxy();
    }
);

const earthTexture = textureLoader.load('textures/earthmap.jpeg', 
    () => {
        console.log("Earth texture loaded successfully");
        message.textContent += " Earth loaded!";
    },
    undefined,
    (err) => {
        console.error("Failed to load Earth texture:", err);
        message.textContent += " Failed to load Earth!";
    }
);

const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshPhongMaterial({ 
    map: earthTexture,
    specular: 0x333333,
    shininess: 5
});
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

const cloudTexture = textureLoader.load(
  'textures/earthCloud.png',
  () => { console.log('Cloud texture loaded'); },
  undefined,
  (err) => { console.error('Failed to load cloud texture:', err); }
);
const cloudGeometry = new THREE.SphereGeometry(2.03, 32, 32);
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
earth.add(clouds);

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(5, 3, 5);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x202020, 0.2);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x000000, 0x000000, 0.05);
scene.add(hemiLight);

const MIN_ZOOM = 2.2;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.3;

renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();

    const zoomOut = e.deltaY > 0;
    
    if (zoomOut) {
        camera.position.z = Math.min(MAX_ZOOM, camera.position.z + ZOOM_STEP);
    } else {
        if (camera.position.z > MIN_ZOOM + ZOOM_STEP) {
            camera.position.z -= ZOOM_STEP;
            camera.position.z = Math.max(MIN_ZOOM, camera.position.z);
        }
    }
    
    clouds.visible = camera.position.z > 3;
});

// Add rotation sensitivity control
let sensitivity = 0.002;
const slider = document.getElementById('sensitivitySlider');
const display = document.getElementById('sensitivityValue');
if (slider && display) {
  slider.addEventListener('input', (e) => {
    sensitivity = parseFloat(e.target.value);
    display.textContent = sensitivity.toFixed(3);
  });
}

function animate() {
    requestAnimationFrame(animate);
    
    earth.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };
        
        // use adjustable sensitivity
        earth.rotation.y += deltaMove.x * sensitivity;
        earth.rotation.x += deltaMove.y * sensitivity;
    }
    
    previousMousePosition = {
        x: e.offsetX,
        y: e.offsetY
    };
});

renderer.domElement.addEventListener('mouseup', (e) => {
    isDragging = false;
});

console.log("Starting animation...");
animate();
console.log("Animation started - you should see Earth rotating in space!");