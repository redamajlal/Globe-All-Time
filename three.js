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

const canvas = renderer.domElement;
canvas.style.touchAction = 'none'; 

canvas.addEventListener('touchstart', e => {
    e.preventDefault();

    if (e.touches.length === 2) {
        initialTouchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        initialCameraZ = camera.position.z;
        isDragging = false;
        console.log('Pinch start:', initialTouchDistance);
    } else if (e.touches.length === 1) {
        isDragging = true;
        prevPos = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
        };
        console.log('Touch start at:', prevPos);
    }
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();

    if (e.touches.length === 2) {
        const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        
        if (currentDistance > 0 && initialTouchDistance > 0) {
            const zoomFactor = initialTouchDistance / currentDistance;
            const newZ = initialCameraZ * zoomFactor;
            
            const safeZ = Math.min(MAX_Z, Math.max(MIN_Z, newZ));
            camera.position.z = safeZ;
            clouds.visible = camera.position.z > 3;
            console.log('Zoom to:', safeZ);
        }
    } else if (e.touches.length === 1 && isDragging) {
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create info popup element
const infoPopup = document.createElement('div');
infoPopup.id = 'country-info';
Object.assign(infoPopup.style, {
  position: 'absolute',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(0,0,0,0.8)',
  color: 'white',
  padding: '15px',
  borderRadius: '8px',
  maxWidth: '400px',
  maxHeight: '70vh',
  overflowY: 'auto',
  display: 'none',
  zIndex: 1000,
  fontFamily: 'Arial, sans-serif',
  boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
  transition: 'opacity 0.3s'
});
document.body.appendChild(infoPopup);

// GeoJSON layer for country borders
const bordersGroup = new THREE.Group();
earth.add(bordersGroup);

// Raycaster for detecting clicks on countries
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load world borders GeoJSON
fetch('assets/world_2010.geojson')
  .then(response => response.json())
  .then(geoJson => {
    // Convert GeoJSON to 3D lines
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3399ff,
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    });
    
    // Scale factor - slightly above Earth's surface
    const radius = 2.01;
    
    geoJson.features.forEach(feature => {
      const countryName = feature.properties.NAME || feature.properties.name || 'Unknown';
      const countryCode = feature.properties.ISO_A2 || feature.properties.iso_a2 || '';
      
      // Process each polygon in the feature
      if (feature.geometry.type === 'Polygon') {
        processPolygon(feature.geometry.coordinates, radius, lineMaterial, countryName, countryCode);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          processPolygon(polygon, radius, lineMaterial, countryName, countryCode);
        });
      }
    });
    
    console.log("Country borders loaded");
  })
  .catch(error => {
    console.error('Error loading GeoJSON:', error);
  });

// Update the processPolygon function to correct the longitude offset
function processPolygon(polygon, radius, material, countryName, countryCode) {
  polygon.forEach(ring => {
    const points = [];
    
    ring.forEach(coord => {
      // GeoJSON format is [longitude, latitude]
      // Add longitude offset to align with texture (adjust this value as needed)
      const longitudeOffset = Math.PI; // 180 degrees offset
      
      const lon = (coord[0] * Math.PI / 180) + longitudeOffset;
      const lat = coord[1] * Math.PI / 180;
      
      // Convert to Cartesian coordinates
      const x = -radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      
      points.push(new THREE.Vector3(x, y, z));
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material.clone());
    
    line.userData = { 
      countryName: countryName, 
      countryCode: countryCode
    };
    
    bordersGroup.add(line);
  });
}

// Function to show country information
function showCountryInfo(countryName) {
  // Fetch country data from Wikipedia
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`;
  
  infoPopup.innerHTML = `<h3>${countryName}</h3><p>Loading information...</p>`;
  infoPopup.style.display = 'block';
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Create the popup content
      const content = `
        <div style="display:flex; justify-content:space-between; align-items:center">
          <h3 style="margin-top:0">${countryName}</h3>
          <button id="close-info" style="background:none; border:none; color:white; cursor:pointer; font-size:20px">&times;</button>
        </div>
        ${data.thumbnail ? `<img src="${data.thumbnail.source}" alt="${countryName}" style="float:right; margin:0 0 10px 10px; max-width:150px; border-radius:4px;">` : ''}
        <p>${data.extract}</p>
        <a href="${data.content_urls.desktop.page}" target="_blank" style="color:#6cf; text-decoration:none;">
          Read more on Wikipedia
        </a>
      `;
      
      infoPopup.innerHTML = content;
      
      // Add close button functionality
      document.getElementById('close-info').addEventListener('click', () => {
        infoPopup.style.display = 'none';
      });
    })
    .catch(error => {
      infoPopup.innerHTML = `
        <h3>${countryName}</h3>
        <p>Sorry, could not load information for this country.</p>
        <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(countryName)}" target="_blank" style="color:#6cf; text-decoration:none;">
          Try Wikipedia directly
        </a>
        <div><button id="close-info" style="margin-top:10px; padding:5px 10px; cursor:pointer;">Close</button></div>
      `;
      
      document.getElementById('close-info').addEventListener('click', () => {
        infoPopup.style.display = 'none';
      });
      
      console.error('Error fetching Wikipedia data:', error);
    });
}

// Update the click handler with better precision
renderer.domElement.addEventListener('click', (event) => {
  // Only process clicks, not drags
  if (isDragging) return;
  
  // Calculate mouse position in normalized coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Increase raycaster precision significantly
  raycaster.params.Line.threshold = 0.2;
  raycaster.setFromCamera(mouse, camera);
  
  // Get all intersections
  const allIntersects = raycaster.intersectObjects(bordersGroup.children, true);
  
  // If we hit something
  if (allIntersects.length > 0) {
    // Filter intersections to get only countries on the visible side
    // This helps with selection precision
    const frontIntersects = allIntersects.filter(hit => {
      // Get the direction to this point from the camera
      const dir = new THREE.Vector3().subVectors(hit.point, camera.position).normalize();
      
      // Get direction from camera to earth center
      const earthDir = new THREE.Vector3().subVectors(earth.position, camera.position).normalize();
      
      // If dot product is negative, the point is in front of the earth center from camera's view
      return dir.dot(earthDir) < 0;
    });
    
    // Use the first visible intersection or fall back to closest overall
    const bestHit = frontIntersects.length > 0 ? frontIntersects[0] : allIntersects[0];
    
    console.log("Selected:", bestHit.object.userData.countryName);
    showCountryInfo(bestHit.object.userData.countryName);
  } else {
    // Clicked empty space, close info popup
    infoPopup.style.display = 'none';
  }
});

// FIX 3: Add visual feedback by highlighting borders on hover
// This helps users see which country they're about to select
function highlightCountry(object, isHovered) {
  if (!object) return;
  
  const material = object.material;
  if (isHovered) {
    material.color.set(0xffff00); // Yellow for highlight
    material.opacity = 1.0;
    material.linewidth = 2; // Note: linewidth > 1 may not work on all GPUs
  } else {
    material.color.set(0x3399ff); // Blue for normal
    material.opacity = 0.8;
    material.linewidth = 1;
  }
}

// Update hover detection to provide visual feedback
let hoveredObject = null;
renderer.domElement.addEventListener('mousemove', (event) => {
  if (isDragging) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.params.Line.threshold = 0.2;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(bordersGroup.children, true);
  
  // Remove highlight from previous hover
  if (hoveredObject) {
    highlightCountry(hoveredObject, false);
    hoveredObject = null;
  }
  
  // Highlight new hover
  if (intersects.length > 0) {
    const object = intersects[0].object;
    highlightCountry(object, true);
    hoveredObject = object;
    
    const countryName = object.userData.countryName;
    if (countryName !== lastHoveredCountry) {
      console.log("Hovering over:", countryName);
      lastHoveredCountry = countryName;
    }
  }
});


// Make isDragging variable accessible to both touch and mouse events
isDragging = false;

// Add a variable to control auto-rotation
let autoRotating = false; // Set to false to disable rotation by default

function rotate() {
    requestAnimationFrame(rotate);
    
    // Only rotate if autoRotating is true
    if (autoRotating) {
        earth.rotation.y += 0.0005;
    }
    
    renderer.render(scene, camera);
}

console.log("Starting animation...");
rotate();
console.log("Animation started - Earth rotation disabled by default");