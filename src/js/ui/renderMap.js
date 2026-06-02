// ═══════════════════════════════════════════════════════════════════════════
//  GRAND LINE DISPATCH — ui/renderMap.js
//  Logic for rendering the interactive inline map and dynamic floating popups.
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

export function renderInlineMapMarkers() {
    const inner = document.getElementById('game-map-inner');
    if (!inner) return;

    const state = getState();
    const currentIslandId = state.currentIsland;
    const activeDestinations = generateLogPoseDestinations();

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

    // ── Floating Popup Setup ──
    let mapPopup = document.getElementById('map-floating-popup');
    if (!mapPopup) {
        mapPopup = document.createElement('div');
        mapPopup.id = 'map-floating-popup';
        Object.assign(mapPopup.style, {
            position: 'absolute',
            width: '280px',
            background: 'var(--color-bg-deep, #1a1a1a)',
            border: '1px solid var(--border-color, #444)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.9)',
            display: 'none',
            zIndex: '1000',
            pointerEvents: 'auto',
            color: 'white'
        });
        wrapper.appendChild(mapPopup);
    }

    currentZoom = 1;
    translateX = 0;
    translateY = 0;

    function updateTransform() {
        inner.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
        mapPopup.style.display = 'none'; // Hide popup while panning/zooming

        const markers = inner.querySelectorAll('.map-marker');
        markers.forEach(m => {
            m.style.transform = `translate(-50%, -50%) scale(${1 / currentZoom})`;
        });
    }

    zoomInBtn?.addEventListener('click', () => {
        currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
        updateTransform();
    });

    zoomOutBtn?.addEventListener('click', () => {
        currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
        updateTransform();
    });

    recenterBtn?.addEventListener('click', () => {
        const state = getState();
        const currentIsland = ISLANDS.find(i => i.id === state.currentIsland);
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
        if (e.target.closest('#map-floating-popup')) return; // Allow clicking inside popup
        if (!e.target.closest('.map-marker')) {
            mapPopup.style.display = 'none'; // Clicked outside, hide popup
        }
        if (e.target.closest('.map-controls')) return;
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

    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
            if (!e.target.closest('.map-marker') && !e.target.closest('#map-floating-popup')) {
                mapPopup.style.display = 'none';
            }
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

    // ── Marker Click & Popup Rendering ──
    inner.addEventListener('click', (e) => {
        const marker = e.target.closest('.map-marker');
        if (!marker) return;

        e.stopPropagation();
        const id = marker.dataset.id;
        const island = ISLANDS.find(i => i.id === id);
        if (!island) return;

        // Calculate dynamic popup position
        const wrapperRect = wrapper.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();

        let leftPos = (markerRect.right - wrapperRect.left) + 15;
        let topPos = (markerRect.top - wrapperRect.top);

        // Flip to left side if it bleeds off the right edge of the map container
        if (leftPos + 280 > wrapperRect.width) {
            leftPos = (markerRect.left - wrapperRect.left) - 295;
        }

        mapPopup.style.left = `${leftPos}px`;
        mapPopup.style.top = `${topPos}px`;
        mapPopup.style.display = 'block';

        const destinations = generateLogPoseDestinations();
        const isDest = destinations.some(d => d.id === island.id);
        const bossName = island.boss_quest ? island.boss_quest.name : 'None';
        const imgHtml = island.image_url ? `<img src="${island.image_url}" style="width:100%; height:120px; object-fit:cover; border-radius:4px; margin-bottom:8px; border: 1px solid var(--border-color);" />` : `<div style="width:100%; height:80px; background:rgba(0,0,0,0.5); border-radius:4px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; border: 1px dashed var(--border-color); color:var(--color-text-muted);">No Image Available</div>`;

        let actionHtml = '';
        if (isDest) {
            const state = getState();
            const currentIslandObj = ISLANDS.find(i => i.id === state.currentIsland);
            const requiredCharge = currentIslandObj?.record_time || 3;
            const canSail = state.logPoseCharge >= requiredCharge;

            actionHtml = `
        <div style="margin-top: 10px;">
          <button class="btn btn--primary btn--full" id="map-sail-action-btn" ${!canSail ? 'disabled' : ''}>
            ${canSail ? `🌊 Sail to ${island.name}` : `🔒 Need ${requiredCharge - state.logPoseCharge} Days Charge`}
          </button>
        </div>
      `;
        }

        mapPopup.innerHTML = `
        ${imgHtml}
        <h4 style="margin:0 0 4px 0; color:var(--color-gold); font-size:1.1rem;">${island.name}</h4>
        <div style="font-size:0.75rem; color:var(--color-danger); margin-bottom:8px; font-weight:bold;">${island.type} | Local Threat: ${bossName}</div>
        <p style="font-size:0.85rem; line-height:1.4; margin-bottom:12px; color:var(--color-text-secondary);">${island.description || 'An uncharted island.'}</p>
        ${actionHtml}
    `;

        // Re-bind the sail button inside the floating popup
        if (isDest) {
            const mapSailBtn = document.getElementById('map-sail-action-btn');
            if (mapSailBtn) {
                mapSailBtn.addEventListener('click', () => {
                    mapPopup.style.display = 'none';
                    const mainSailBtn = document.getElementById('set-sail-btn');
                    if (mainSailBtn) {
                        mainSailBtn.disabled = false;
                        mainSailBtn.textContent = `🌊 Set Sail to ${island.name}`;
                        mainSailBtn.dataset.destination = island.id;
                        mainSailBtn.click();
                    }
                });
            }
        }
    });

    setTimeout(() => {
        if(img.complete) recenterBtn.click();
        else img.onload = () => recenterBtn.click();
    }, 100);
}