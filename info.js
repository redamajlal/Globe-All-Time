const infoPopup = document.createElement('div');
infoPopup.id = 'country-info';
Object.assign(infoPopup.style, {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) scale(0.95)',
  backgroundColor: 'rgba(10, 15, 25, 0.95)',
  color: '#fff',
  padding: '0',
  borderRadius: '12px',
  maxWidth: '480px',
  minWidth: '320px',
  maxHeight: '80vh',
  display: 'none',
  zIndex: 1000,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  opacity: '0',
  transition: 'all 0.2s ease',
  overflow: 'hidden'
});
document.body.appendChild(infoPopup);

const style = document.createElement('style');
style.textContent = `
  .country-popup-show {
    opacity: 1 !important;
    transform: translate(-50%, -50%) scale(1) !important;
  }
  
  .popup-header {
    background: rgba(20, 30, 45, 0.9);
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 12px 12px 0 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .popup-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }
  
  .popup-close {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    font-size: 20px;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  
  .popup-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .popup-content {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
    line-height: 1.6;
  }
  
  .popup-image {
    float: right;
    margin: 0 0 16px 20px;
    max-width: 180px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .popup-text {
    font-size: 15px;
    color: #e0e0e0;
    margin-bottom: 20px;
    text-align: justify;
    line-height: 1.6;
  }
  
  .popup-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #64b5f6;
    text-decoration: none;
    padding: 12px 20px;
    background: rgba(100, 181, 246, 0.1);
    border: 1px solid rgba(100, 181, 246, 0.3);
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 500;
    font-size: 14px;
    margin-top: 16px;
  }
  
  .popup-link:hover {
    background: rgba(100, 181, 246, 0.2);
    border-color: rgba(100, 181, 246, 0.5);
  }
  
  .loading-container {
    text-align: center;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    border-top-color: #64b5f6;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading-text {
    font-size: 16px;
    color: #b0b0b0;
  }
  
  .error-container {
    text-align: center;
    padding: 40px 20px;
    color: #ff8a80;
  }
  
  .error-title {
    font-size: 18px;
    margin-bottom: 12px;
    font-weight: 600;
  }
  
  .error-message {
    font-size: 14px;
    margin-bottom: 20px;
    color: #ffcdd2;
    line-height: 1.5;
  }

  /* Simple scrollbar */
  .popup-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .popup-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .popup-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    #country-info {
      max-width: 90vw !important;
      min-width: 90vw !important;
      margin: 20px;
    }
    
    .popup-header {
      padding: 16px 20px;
    }
    
    .popup-title {
      font-size: 18px;
    }
    
    .popup-content {
      padding: 20px;
    }
    
    .popup-image {
      float: none;
      display: block;
      margin: 0 auto 16px auto;
      max-width: 100%;
    }
  }
`;
document.head.appendChild(style);

function showCountryInfo(countryName) {
  infoPopup.style.display = 'block';
  setTimeout(() => infoPopup.classList.add('country-popup-show'), 10);

  infoPopup.innerHTML = `
    <div class="popup-header">
      <h3 class="popup-title">${countryName}</h3>
      <button class="popup-close" onclick="hideCountryInfo()">&times;</button>
    </div>
    <div class="popup-content">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </div>
  `;

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`)
    .then(r => r.json())
    .then(data => {
      const img = data.thumbnail
        ? `<img src="${data.thumbnail.source}" class="popup-image" alt="${countryName}">` 
        : '';
      infoPopup.innerHTML = `
        <div class="popup-header">
          <h3 class="popup-title">${countryName}</h3>
          <button class="popup-close" onclick="hideCountryInfo()">&times;</button>
        </div>
        <div class="popup-content">
          ${img}
          <div class="popup-text">${data.extract || 'No description available.'}</div>
          <div style="clear: both;">
            <a href="${(data.content_urls?.desktop?.page) || `https://en.wikipedia.org/wiki/${encodeURIComponent(countryName)}`}"
               target="_blank" 
               rel="noopener noreferrer"
               class="popup-link">
              📖 Read more
            </a>
          </div>
        </div>
      `;
    })
    .catch(() => {
      infoPopup.innerHTML = `
        <div class="popup-header">
          <h3 class="popup-title">${countryName}</h3>
          <button class="popup-close" onclick="hideCountryInfo()">&times;</button>
        </div>
        <div class="popup-content">
          <div class="error-container">
            <div class="error-title">Information unavailable</div>
            <div class="error-message">Could not load data for this country.</div>
            <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(countryName)}"
               target="_blank" 
               rel="noopener noreferrer"
               class="popup-link">
              🔗 Try Wikipedia
            </a>
          </div>
        </div>
      `;
    });
}

function hideCountryInfo() {
  infoPopup.classList.remove('country-popup-show');
  setTimeout(() => infoPopup.style.display = 'none', 200);
}

// Add keyboard and outside click handlers
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && infoPopup.classList.contains('country-popup-show')) {
    hideCountryInfo();
  }
});

document.addEventListener('click', (e) => {
  if (infoPopup.classList.contains('country-popup-show') && 
      !infoPopup.contains(e.target)) {
    if (!e.target.closest('canvas')) {
      hideCountryInfo();
    }
  }
});

window.showCountryInfo = showCountryInfo;
window.hideCountryInfo = hideCountryInfo;
