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

const bordersGroup = new THREE.Group();
earth.add(bordersGroup);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let lastHoveredCountry = "";
let countryFeatures = [];
let countryNames = [];

fetch('assets/world_2010.geojson')
  .then(response => response.json())
  .then(geoJson => {
    // Store features for searching
    countryFeatures = geoJson.features;
    
    // Build a list of country names for autocomplete
    countryNames = geoJson.features.map(feature => {
      return feature.properties.NAME || feature.properties.name || 'Unknown';
    }).sort();
    
    // Initialize search box after data is loaded
    initializeSearchBox();
    
    // convert lines to 3d
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3399ff,
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    });

    const radius = 1.999999; // tweak this up it looks real funny

    geoJson.features.forEach(feature => {
      const countryName = feature.properties.NAME || feature.properties.name || 'Unknown';
      const countryCode = feature.properties.ISO_A2 || feature.properties.iso_a2 || '';
      
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

function processPolygon(polygon, radius, material, countryName, countryCode) {
  polygon.forEach(ring => {
    const points = [];
    
    ring.forEach(coord => {
      const longitudeOffset = Math.PI;
      
      const lon = (coord[0] * Math.PI / 180) + longitudeOffset;
      const lat = coord[1] * Math.PI / 180;
      
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

function showCountryInfo(countryName) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`;
  
  infoPopup.innerHTML = `<h3>${countryName}</h3><p>Loading information...</p>`;
  infoPopup.style.display = 'block';
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
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

renderer.domElement.addEventListener('click', (event) => {
  if (isDragging) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.params.Line.threshold = 0.2;
  raycaster.setFromCamera(mouse, camera);
  
  const allIntersects = raycaster.intersectObjects(bordersGroup.children, true);
  
  // Only consider intersections on the visible side of the globe
  const frontIntersects = allIntersects.filter(hit => {
    const hitToCamera = new THREE.Vector3().subVectors(camera.position, hit.point).normalize();
    const normal = hit.point.clone().normalize();
    return hitToCamera.dot(normal) > 0;
  });
  
  if (frontIntersects.length > 0) {
    const bestHit = frontIntersects[0];
    const countryName = bestHit.object.userData.countryName;
    console.log("Selected:", countryName);
    
    // Highlight the entire country border, not just the segment clicked
    highlightCountryByName(countryName);
    
    // Show country info
    showCountryInfo(countryName);
  } else {
    // Clear any previous highlights when clicking empty space
    bordersGroup.children.forEach(line => {
      highlightCountry(line, false);
    });
    
    infoPopup.style.display = 'none';
  }
});

// Also update your mousemove handler to highlight the entire country on hover
renderer.domElement.addEventListener('mousemove', (event) => {
  if (isDragging) return;
  
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.params.Line.threshold = 0.2;
  raycaster.setFromCamera(mouse, camera);
  
  const allIntersects = raycaster.intersectObjects(bordersGroup.children, true);
  
  // Clear previous highlight if country changes
  if (hoveredObject) {
    // Don't clear highlight here - we'll handle it below
  }
  
  // Filter to only get intersections on the front side
  const frontIntersects = allIntersects.filter(hit => {
    const hitToCamera = new THREE.Vector3().subVectors(camera.position, hit.point).normalize();
    const normal = hit.point.clone().normalize();
    return hitToCamera.dot(normal) > 0;
  });
  
  if (frontIntersects.length > 0) {
    const object = frontIntersects[0].object;
    const countryName = object.userData.countryName;
    
    if (countryName !== lastHoveredCountry) {
      // Country changed - clear all highlights and highlight the new country
      bordersGroup.children.forEach(line => {
        highlightCountry(line, false);
      });
      
      // Highlight all segments of this country
      bordersGroup.children.forEach(line => {
        if (line.userData.countryName === countryName) {
          highlightCountry(line, true);
        }
      });
      
      console.log("Hovering over:", countryName);
      lastHoveredCountry = countryName;
      hoveredObject = object; // Keep track of one segment for reference
    }
  } else {
    // No country under cursor - clear all highlights
    if (lastHoveredCountry) {
      bordersGroup.children.forEach(line => {
        highlightCountry(line, false);
      });
      lastHoveredCountry = "";
      hoveredObject = null;
    }
  }
});


isDragging = false;

function rotate() {
    requestAnimationFrame(rotate);
    renderer.render(scene, camera);
}

console.log("Starting animation...");
rotate();
console.log("Animation started");

// Create the search box UI
function initializeSearchBox() {
  // Create container
  const searchContainer = document.createElement('div');
  searchContainer.id = 'search-container';
  Object.assign(searchContainer.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    width: '250px'
  });

  const searchInput = document.createElement('input');
  searchInput.id = 'country-search';
  searchInput.type = 'text';
  searchInput.placeholder = 'Search for a country...';
  Object.assign(searchInput.style, {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: '14px',
    boxSizing: 'border-box'
  });

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.id = 'search-suggestions';
  Object.assign(suggestionsContainer.style, {
    display: 'none',
    position: 'absolute',
    width: '100%',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #444',
    borderTop: 'none',
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
    zIndex: 1001
  });

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(suggestionsContainer);
  document.body.appendChild(searchContainer);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length < 2) {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
      return;
    }

    const matches = countryNames.filter(name => 
      name.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      suggestionsContainer.innerHTML = '';
      matches.slice(0, 10).forEach(name => {
        const item = document.createElement('div');
        item.textContent = name;
        Object.assign(item.style, {
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #444'
        });
        
        item.addEventListener('mouseover', () => {
          item.style.backgroundColor = 'rgba(80,80,80,0.8)';
        });
        
        item.addEventListener('mouseout', () => {
          item.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', () => {
          searchInput.value = name;
          suggestionsContainer.style.display = 'none';
          selectCountry(name);
        });
        
        suggestionsContainer.appendChild(item);
      });
      
      suggestionsContainer.style.display = 'block';
    } else {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        selectCountry(query);
        suggestionsContainer.style.display = 'none';
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  });
}

function selectCountry(countryName) {
  // Find matching feature
  const feature = countryFeatures.find(f => {
    const name = f.properties.NAME || f.properties.name || '';
    return name.toLowerCase() === countryName.toLowerCase();
  });

  if (!feature) {
    console.log("Country not found:", countryName);
    return;
  }

  showCountryInfo(countryName);
  
  centerGlobeOnCountry(feature);
  
  highlightCountryByName(countryName);
}

function centerGlobeOnCountry(feature) {
  let lon, lat;
  
  if (feature.geometry.type === 'Polygon') {
    const coords = feature.geometry.coordinates[0];
    [lon, lat] = calculateCentroid(coords);
  } else if (feature.geometry.type === 'MultiPolygon') {
    // Use the largest polygon (typically the mainland)
    let maxArea = 0;
    let bestCoords = null;
    
    for (const polygon of feature.geometry.coordinates) {
      const area = calculatePolygonArea(polygon[0]);
      if (area > maxArea) {
        maxArea = area;
        bestCoords = polygon[0];
      }
    }
    
    [lon, lat] = calculateCentroid(bestCoords || feature.geometry.coordinates[0][0]);
  }
  
  // Convert centroid to 3D rotation
  const phi = lat * Math.PI / 180;
  const theta = -lon * Math.PI / 180;
  
  // Animate rotation to center the country
  animateEarthRotation(theta, phi, 1000);
}

// Helper to calculate centroid of a polygon
function calculateCentroid(coordinates) {
  let sumX = 0;
  let sumY = 0;
  
  for (const coord of coordinates) {
    sumX += coord[0];
    sumY += coord[1];
  }
  
  return [sumX / coordinates.length, sumY / coordinates.length];
}

// Helper to calculate polygon area (for finding largest polygon)
function calculatePolygonArea(coordinates) {
  let area = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area / 2);
}

// Animate earth rotation to center a point
function animateEarthRotation(targetLon, targetLat, duration) {
  const startRotation = {
    x: earth.rotation.x,
    y: earth.rotation.y
  };
  
  const targetRotation = {
    x: targetLat,
    y: targetLon
  };
  
  const startTime = Date.now();
  
  function updateRotation() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease function (cubic)
    const t = 1 - Math.pow(1 - progress, 3);
    
    earth.rotation.x = startRotation.x * (1 - t) + targetRotation.x * t;
    earth.rotation.y = startRotation.y * (1 - t) + targetRotation.y * t;
    
    if (progress < 1) {
      requestAnimationFrame(updateRotation);
    }
  }
  
  updateRotation();
}

// Highlight a country by name
function highlightCountryByName(countryName) {
  // Clear all previous highlights
  bordersGroup.children.forEach(line => {
    highlightCountry(line, false);
  });
  
  // Find and highlight all borders for this country
  bordersGroup.children.forEach(line => {
    if (line.userData.countryName.toLowerCase() === countryName.toLowerCase()) {
      highlightCountry(line, true);
    }
  });
}

// Add this function to handle country highlighting
function highlightCountry(object, isHovered) {
  if (!object || !object.material) return;
  
  if (isHovered) {
    // Highlight with bright yellow color
    object.material.color.set(0xffff00);  // Yellow
    object.material.opacity = 1.0;        // Full opacity
    object.material.linewidth = 2;        // Thicker line (note: may not work on all GPUs)
  } else {
    // Reset to default blue color
    object.material.color.set(0x3399ff);  // Blue
    object.material.opacity = 0.8;        // Default opacity
    object.material.linewidth = 1;        // Default width
  }
}

// Also add this variable to track the currently highlighted object
let hoveredObject = null;