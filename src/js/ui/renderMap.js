// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderMap.js
//  Logic for rendering the interactive inline map.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';
import { getState } from '../engine/playerState.js';
import { generateLogPoseDestinations } from '../engine/navigation.js';

let currentZoom = 1;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

/**
 * Renders island markers into the inline map container.
 * Call this on game start and after each sail to refresh marker states.
 */
export function renderInlineMapMarkers() {
  const inner = document.getElementById('game-map-inner');
  if (!inner) return;

  const state = getState();
  const currentIslandId = state.currentIsland;

  const activeDestinations = generateLogPoseDestinations();

  // Remove existing markers
  inner.querySelectorAll('.map-marker').forEach(m => m.remove());

  ISLANDS.forEach(island => {
    const isCurrent = island.id === currentIslandId;
    const isDest = activeDestinations.some(d => d.id === island.id);
    let classes = 'map-marker';
    if (isCurrent) classes += ' is-current';
    if (isDest) classes += ' is-destination';

    const div = document.createElement('div');
    div.className = classes;
    div.style.left = `${island.x}%`;
    div.style.top = `${island.y}%`;
    div.dataset.id = island.id;
    div.title = island.name;
    div.innerHTML = `
      <div class="map-marker-tooltip">
        <strong>${island.name}</strong><br/>
        <small>${island.type}</small>
      </div>
    `;
    inner.appendChild(div);
  });
}

/**
 * Initialises the inline map: renders markers and binds all pan/zoom events.
 * Call once when the game screen is first shown.
 */
export function initInlineMap() {
  renderInlineMapMarkers();
  bindMapEvents();
}

export function bindMapEvents() {
  const wrapper = document.getElementById('game-map-wrapper');
  const inner = document.getElementById('game-map-inner');
  const img = document.getElementById('game-map-image');
  
  const zoomInBtn = document.getElementById('map-zoom-in');
  const zoomOutBtn = document.getElementById('map-zoom-out');
  const recenterBtn = document.getElementById('map-recenter');
  
  if (!wrapper || !inner || !img) return;

  // Reset state
  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  
  function updateTransform() {
    inner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    
    // Scale markers inversely so they don't get huge
    const markers = inner.querySelectorAll('.map-marker');
    markers.forEach(m => {
       m.style.transform = `translate(-50%, -50%) scale(${1 / currentZoom})`;
    });
  }

  // Zooming
  zoomInBtn?.addEventListener('click', () => {
    currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
    updateTransform();
  });

  zoomOutBtn?.addEventListener('click', () => {
    currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
    updateTransform();
  });

  recenterBtn?.addEventListener('click', () => {
     // Try to center on current island
     const state = getState();
     const currentIsland = ISLANDS.find(i => i.id === state.currentIsland);
     if (currentIsland && img.naturalWidth) {
         // Calculate pixel position of current island
         const targetX = (currentIsland.x / 100) * inner.offsetWidth;
         const targetY = (currentIsland.y / 100) * inner.offsetHeight;
         
         // Center it in the wrapper
         translateX = (wrapper.offsetWidth / 2) - (targetX * currentZoom);
         translateY = (wrapper.offsetHeight / 2) - (targetY * currentZoom);
     } else {
         currentZoom = 1;
         translateX = 0;
         translateY = 0;
     }
     updateTransform();
  });

  // Mouse wheel zoom
  wrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? -ZOOM_STEP : ZOOM_STEP; // Inverted logic for intuitive scrolling
    
    // We want to zoom towards the mouse pointer
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new zoom
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
    if (newZoom === currentZoom) return;
    
    // Adjust translation to keep mouse pointer fixed
    const zoomRatio = newZoom / currentZoom;
    translateX = mouseX - (mouseX - translateX) * zoomRatio;
    translateY = mouseY - (mouseY - translateY) * zoomRatio;
    
    currentZoom = newZoom;
    updateTransform();
  }, { passive: false });

  // Panning (Dragging)
  wrapper.addEventListener('mousedown', (e) => {
    if (e.target.closest('.map-controls') || e.target.closest('.map-marker')) return;
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Also handle touch for mobile panning (simple implementation)
  wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX - translateX;
          startY = e.touches[0].clientY - translateY;
      }
  }, { passive: true });
  
  window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      updateTransform();
  }, { passive: true });
  
  window.addEventListener('touchend', () => {
      isDragging = false;
  });

  // Event delegated click handler for markers
  inner.addEventListener('click', (e) => {
    const marker = e.target.closest('.map-marker');
    if (!marker) return;
    
    e.stopPropagation(); // prevent drag trigger
    const id = marker.dataset.id;
    const island = ISLANDS.find(i => i.id === id);
    if (!island) return;

    const titleEl = document.getElementById('map-info-title');
    const descEl = document.getElementById('map-info-desc');
    if (titleEl && descEl) {
      titleEl.textContent = island.name;
      
      const destinations = generateLogPoseDestinations();
      const isDest = destinations.some(d => d.id === island.id);
      
      let actionHtml = '';
      if (isDest) {
        actionHtml = `
          <div style="margin-top: 10px;">
            <button class="btn btn--primary btn--sm" id="map-sail-action-btn" data-destination="${island.id}">🌊 Sail to ${island.name}</button>
          </div>
        `;
      }

      descEl.innerHTML = `
        <strong>Type:</strong> ${island.type}<br/>
        ${island.description}
        ${actionHtml}
      `;

      if (isDest) {
        const mapSailBtn = document.getElementById('map-sail-action-btn');
        if (mapSailBtn) {
          mapSailBtn.addEventListener('click', () => {
            const mainSailBtn = document.getElementById('set-sail-btn');
            if (mainSailBtn) {
               mainSailBtn.disabled = false;
               mainSailBtn.textContent = `🌊 Set Sail to ${island.name}`;
               mainSailBtn.dataset.destination = island.id;

               // Trigger the sail action
               mainSailBtn.click(); 
            }
          });
        }
      }
    }
  });
  
  // Auto-center on load
  setTimeout(() => {
     if(img.complete) recenterBtn.click();
     else img.onload = () => recenterBtn.click();
  }, 100);
}
