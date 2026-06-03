// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderMap.js
//  Logic for rendering the interactive inline map and waypoint animations.
// ═══════════════════════════════════════════════════════════════════════════

import { ISLANDS } from '../../config/islands.js';
import { getState } from '../engine/playerState.js';
import { generateLogPoseDestinations } from '../engine/navigation.js';

let currentZoom = 1;
const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
let isDragging = false;
let hasDragged = false;
let startX, startY, translateX = 0, translateY = 0;

function updateTransform() {
    const inner = document.getElementById('game-map-inner');
    if (!inner) return;

    inner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;

    const mapPopup = document.getElementById('map-floating-popup');
    if (mapPopup && isDragging) {
        mapPopup.hidden = true;
        mapPopup.style.display = 'none';
    }

    const markers = inner.querySelectorAll('.map-marker');
    markers.forEach(m => {
        m.style.transform = `translate(-50%, -50%) scale(${1 / currentZoom})`;
    });

    const shipContainer = document.getElementById('player-ship-container');
    if (shipContainer) {
        shipContainer.style.transform = `scale(${1 / currentZoom})`;
    }

    const eventMarkers = inner.querySelectorAll('.map-event-marker');
    eventMarkers.forEach(m => {
        m.style.transform = `translate(-50%, -50%) scale(${1 / currentZoom})`;
    });
}

export function renderInlineMapMarkers() {
    const inner = document.getElementById('game-map-inner');
    if (!inner) return;

    const state = getState();
    const currentIslandId = state.currentIsland;
    const activeDestinations = generateLogPoseDestinations();

    inner.querySelectorAll('.map-marker').forEach(m => m.remove());

    ISLANDS.forEach(island => {
        const isCurrent = String(island.id) === String(currentIslandId);
        const isDest = activeDestinations.some(d => String(d.id) === String(island.id));
        let classes = 'map-marker';
        if (isCurrent) classes += ' is-current';
        if (isDest) classes += ' is-destination';

        const div = document.createElement('div');
        div.className = classes;
        div.style.left = `${island.x}%`;
        div.style.top = `${island.y}%`;
        div.dataset.id = island.id;
        div.title = island.name;
        div.style.pointerEvents = 'auto';
        div.innerHTML = `
      <div class="map-marker-tooltip">
        <strong>${island.name}</strong><br/>
        <small>${island.type}</small>
      </div>
    `;

        // Direct click listener bypasses the map dragging bugs
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hasDragged) return;
            openIslandPopup(island.id, div);
        });

        inner.appendChild(div);
    });

    let shipContainer = document.getElementById('player-ship-container');
    if (!shipContainer) {
        shipContainer = document.createElement('div');
        shipContainer.id = 'player-ship-container';
        shipContainer.style.cssText = 'position: absolute; z-index: 50; pointer-events: none; width: 60px; height: 60px; transform-origin: center center; margin-top: -30px; margin-left: -30px;';

        const shipImg = document.createElement('img');
        shipImg.id = 'player-ship-image';
        shipImg.src = '/src/assets/imgs/merry.png';
        shipImg.style.cssText = 'width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0px 8px 10px rgba(0,0,0,0.6));';

        shipContainer.appendChild(shipImg);
        inner.appendChild(shipContainer);
    }

    const currentIsland = ISLANDS.find(i => String(i.id) === String(currentIslandId));
    if (currentIsland) {
        shipContainer.style.transition = 'none';
        shipContainer.style.left = `${currentIsland.x}%`;
        shipContainer.style.top = `${currentIsland.y}%`;
        void shipContainer.offsetWidth;
    }

    if (shipContainer) {
        shipContainer.style.transform = `scale(${1 / currentZoom})`;
    }
}

// ── DYNAMIC ISLAND POPUP ──
function openIslandPopup(id, marker) {
    const island = ISLANDS.find(i => String(i.id) === String(id));
    if (!island) return;

    let mapPopup = document.getElementById('map-floating-popup');
    let titleEl = document.getElementById('map-info-title');
    let descEl = document.getElementById('map-info-desc');

    if (!mapPopup || !titleEl || !descEl) {
        if (mapPopup) mapPopup.remove();

        const wrapper = document.getElementById('game-map-wrapper');
        if (!wrapper) return;

        mapPopup = document.createElement('div');
        mapPopup.id = 'map-floating-popup';
        // Removed fixed centering, kept fixed width for precise coordinate placement
        mapPopup.style.cssText = 'position: absolute; width: 280px; background: rgba(15, 20, 25, 0.95); border: 2px solid var(--color-gold); border-radius: 8px; padding: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.9); z-index: 1000; backdrop-filter: blur(8px); pointer-events: auto; display: none; transition: top 0.1s, left 0.1s;';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✖';
        closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 1.2rem; padding: 0;';
        closeBtn.onclick = () => { mapPopup.style.display = 'none'; };

        titleEl = document.createElement('h3');
        titleEl.id = 'map-info-title';
        titleEl.style.cssText = 'color: var(--color-gold); margin: 0 0 10px 0; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px dashed rgba(255,255,255,0.2); padding-bottom: 5px;';

        descEl = document.createElement('div');
        descEl.id = 'map-info-desc';

        mapPopup.appendChild(closeBtn);
        mapPopup.appendChild(titleEl);
        mapPopup.appendChild(descEl);
        wrapper.appendChild(mapPopup);
    }

    titleEl.textContent = island.name;

    const destinations = generateLogPoseDestinations();
    const isDest = destinations.some(d => String(d.id) === String(island.id));

    let actionHtml = '';
    if (isDest) {
        const state = getState();
        const canSail = state.logPoseCharge >= 3;

        actionHtml = `
        <div style="margin-top: 15px;">
          <button class="btn btn--primary btn--full" id="map-sail-action-btn" data-destination="${island.id}" ${!canSail ? 'disabled' : ''}>
            ${canSail ? `🌊 Sail to ${island.name}` : `🔒 Need ${3 - state.logPoseCharge} more charge`}
          </button>
        </div>
      `;
    }

    const imgData = island.image_url || island.image;
    const imgHtml = imgData
        ? `<img src="${imgData}" alt="${island.name}" style="width:100%; height:120px; object-fit:cover; border-radius:4px; margin-bottom:10px; border:1px solid var(--color-border);" />`
        : '';

    descEl.innerHTML = `
      ${imgHtml}
      <div style="font-size: 0.85rem; color: var(--color-danger); font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em;">
        Type: ${island.type || 'Unknown'}
      </div>
      <p style="font-size: 0.9rem; margin-bottom: 10px; color: #fff; line-height: 1.4;">${island.description || 'An uncharted island.'}</p>
      ${actionHtml}
    `;

    // ── Dynamic Bounding Box Math ──
    const wrapper = document.getElementById('game-map-wrapper');
    const wrapperRect = wrapper.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();

    let leftPos = (markerRect.right - wrapperRect.left) + 15;
    let topPos = (markerRect.top - wrapperRect.top) - 20; // Slight nudge up

    // Flip to left side if it bleeds off the right edge of the wrapper
    if (leftPos + 280 > wrapperRect.width) {
        leftPos = (markerRect.left - wrapperRect.left) - 295;
    }

    // Clamp to top so it doesn't vanish off screen
    if (topPos < 10) topPos = 10;

    mapPopup.style.left = `${leftPos}px`;
    mapPopup.style.top = `${topPos}px`;
    mapPopup.style.display = 'block';

    if (isDest) {
        const mapSailBtn = document.getElementById('map-sail-action-btn');
        if (mapSailBtn) {
            mapSailBtn.addEventListener('click', () => {
                const mainSailBtn = document.getElementById('set-sail-btn');
                if (mainSailBtn) {
                    mainSailBtn.disabled = false;
                    mainSailBtn.textContent = `🌊 Set Sail to ${island.name}`;
                    mainSailBtn.dataset.destination = island.id;
                    mainSailBtn.click();
                    mapPopup.style.display = 'none';
                }
            });
        }
    }
}

// ── Event Markers ──
export function drawVoyageEvents(events) {
    const inner = document.getElementById('game-map-inner');
    if (!inner) return;

    clearAllWaypointMarkers();

    events.forEach((evt, i) => {
        let icon = '❓';
        const title = evt.title?.toLowerCase() || '';

        if (evt.is_devil_fruit_drop) icon = '🍎';
        else if (title.includes('debris') || title.includes('barrel')) icon = '🛢️';
        else if (title.includes('galleon') || title.includes('chest') || title.includes('treasure') || title.includes('map')) icon = '📜';
        else if (title.includes('marine') || title.includes('patrol')) icon = '⚓';
        else if (title.includes('pirate') || title.includes('ambush') || title.includes('vanguard')) icon = '🏴‍☠️';
        else if (title.includes('castaway') || title.includes('bottle')) icon = '🍾';
        else if (evt.type === 'weather') icon = '🌩️';
        else if (evt.type === 'combat') icon = '⚔️';
        else if (evt.type === 'loot') icon = '📦';
        else if (evt.type === 'story') icon = '📜';

        const marker = document.createElement('div');
        marker.className = 'map-event-marker';
        marker.id = `waypoint-marker-${i}`;
        marker.style.cssText = `
            position: absolute;
            left: ${evt.mapX}%;
            top: ${evt.mapY}%;
            transform: translate(-50%, -50%) scale(${1 / currentZoom});
            z-index: 45;
            pointer-events: none;
        `;

        marker.innerHTML = `<div class="event-icon-wrapper" style="font-size: 1.8rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); text-align: center;">${icon}</div>`;
        inner.appendChild(marker);
    });
}

export function clearWaypointMarker(index) {
    const marker = document.getElementById(`waypoint-marker-${index}`);
    if (marker) {
        marker.innerHTML = `<div style="font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">✔️</div>`;
        marker.style.opacity = '0.5';
        marker.style.filter = 'grayscale(100%)';
        marker.style.transition = 'opacity 1s ease';
        setTimeout(() => marker.remove(), 2000);
    }
}

export function clearAllWaypointMarkers() {
    document.querySelectorAll('.map-event-marker').forEach(m => m.remove());
}

export function spawnDetourMarker(x, y) {
    const inner = document.getElementById('game-map-inner');
    if (!inner) return null;
    const marker = document.createElement('div');
    marker.className = 'map-event-marker detour-marker';
    marker.style.cssText = `position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%) scale(${1 / currentZoom}); z-index: 45; pointer-events: none;`;
    marker.innerHTML = `<div class="event-icon-wrapper" style="font-size: 1.8rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));">💎</div>`;
    inner.appendChild(marker);
    return marker;
}

export function clearDetourMarker(marker) {
    if (marker) {
        marker.innerHTML = `<div style="font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">✔️</div>`;
        marker.style.opacity = '0.5';
        marker.style.transition = 'opacity 1s ease';
        setTimeout(() => marker.remove(), 2000);
    }
}

export function animateShipToWaypoint(targetX, targetY) {
    return new Promise((resolve) => {
        const shipContainer = document.getElementById('player-ship-container');
        const wrapper = document.getElementById('game-map-wrapper');
        const inner = document.getElementById('game-map-inner');

        if (!shipContainer || !wrapper || !inner) {
            resolve();
            return;
        }

        const mapPopup = document.getElementById('map-floating-popup');
        if (mapPopup) mapPopup.style.display = 'none';

        const currentX = parseFloat(shipContainer.style.left) || targetX;
        const currentY = parseFloat(shipContainer.style.top) || targetY;

        const dist = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));
        const duration = Math.max(2000, dist * 100);

        shipContainer.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        shipContainer.style.left = `${targetX}%`;
        shipContainer.style.top = `${targetY}%`;

        const pixelX = (targetX / 100) * inner.offsetWidth;
        const pixelY = (targetY / 100) * inner.offsetHeight;

        inner.style.transition = `transform ${duration}ms linear`;
        translateX = (wrapper.offsetWidth / 2) - (pixelX * currentZoom);
        translateY = (wrapper.offsetHeight / 2) - (pixelY * currentZoom);

        updateTransform();

        setTimeout(() => {
            shipContainer.style.transition = 'none';
            inner.style.transition = 'none';
            resolve();
        }, duration + 50);
    });
}

export function initInlineMap() {
    if (!document.getElementById('ship-bob-style')) {
        const style = document.createElement('style');
        style.id = 'ship-bob-style';
        style.innerHTML = `
          @keyframes bobbing {
              0% { transform: translateY(0px) rotate(-3deg); }
              50% { transform: translateY(-8px) rotate(3deg); }
              100% { transform: translateY(0px) rotate(-3deg); }
          }
          @keyframes event-pop {
              0% { transform: scale(0); opacity: 0; }
              80% { transform: scale(1.4); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
          }
          @keyframes event-bobbing {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
              100% { transform: translateY(0px); }
          }
          #player-ship-image {
              animation: bobbing 3s infinite ease-in-out;
          }
          .event-icon-wrapper {
              animation: event-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
                         event-bobbing 2.5s infinite ease-in-out 0.5s;
              display: inline-block;
          }
      `;
        document.head.appendChild(style);
    }

    renderInlineMapMarkers();
    bindMapEvents();
}

export function bindMapEvents() {
    const wrapper = document.getElementById('game-map-wrapper');
    const inner = document.getElementById('game-map-inner');
    const img = document.getElementById('game-map-image');

    if (!wrapper || !inner || !img) return;

    currentZoom = 1;
    translateX = 0;
    translateY = 0;

    document.getElementById('map-zoom-in')?.addEventListener('click', () => {
        currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
        updateTransform();
    });

    document.getElementById('map-zoom-out')?.addEventListener('click', () => {
        currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
        updateTransform();
    });

    document.getElementById('map-recenter')?.addEventListener('click', () => {
        const state = getState();
        const currentIsland = ISLANDS.find(i => String(i.id) === String(state.currentIsland));
        if (currentIsland && img.naturalWidth) {
            const targetX = (currentIsland.x / 100) * inner.offsetWidth;
            const targetY = (currentIsland.y / 100) * inner.offsetHeight;
            translateX = (wrapper.offsetWidth / 2) - (targetX * currentZoom);
            translateY = (wrapper.offsetHeight / 2) - (targetY * currentZoom);
        } else {
            currentZoom = 1;
            translateX = 0;
            translateY = 0;
        }
        updateTransform();
    });

    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? -ZOOM_STEP : ZOOM_STEP;
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
        if (newZoom === currentZoom) return;

        const zoomRatio = newZoom / currentZoom;
        translateX = mouseX - (mouseX - translateX) * zoomRatio;
        translateY = mouseY - (mouseY - translateY) * zoomRatio;
        currentZoom = newZoom;
        updateTransform();
    }, { passive: false });

    wrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.map-controls') || e.target.closest('.map-marker') || e.target.closest('#map-floating-popup')) return;
        isDragging = true;
        hasDragged = false;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hasDragged = true;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && !e.target.closest('.map-marker') && !e.target.closest('#map-floating-popup')) {
            isDragging = true;
            hasDragged = false;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        hasDragged = true;
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform();
    }, { passive: true });

    window.addEventListener('touchend', () => { isDragging = false; });

    wrapper.addEventListener('click', (e) => {
        if (hasDragged) return;
        const mapPopup = document.getElementById('map-floating-popup');
        if (mapPopup && !e.target.closest('#map-floating-popup') && !e.target.closest('.map-marker')) {
            mapPopup.style.display = 'none';
        }
    });

    setTimeout(() => {
        if(img.complete) document.getElementById('map-recenter')?.click();
        else img.onload = () => document.getElementById('map-recenter')?.click();
    }, 100);
}