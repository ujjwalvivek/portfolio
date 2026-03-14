import styles from './playground.module.css';

let currentEndpoint = null;
let currentParams = {};
let debounceTimer = null;
let apiBaseUrl = '';

const sharedLayoutBase = {
    bg: 'color', border: 'color', borderWidth: 'number',
    rx: 'number', px: 'number', py: 'number'
};
const sharedColorBase = {
    accentColor: 'color', lineColor: 'color'
};
const allLogos = { logo: 'select' };

const sharedBadgeLayout = {
    badgeColor: 'color', textColor: 'color', bg: 'color', rx: 'number', px: 'number', py: 'number'
}

const endpointSchemas = {
    '/svg/badges/contributions': { ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/commits': { ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/prs': { ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/stars': { repo: 'text', ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/npm': { package: 'text', ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/cargo': { crate: 'text', ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/docker': { image: 'text', ...sharedBadgeLayout, ...allLogos },
    '/svg/badges/custom': { leftText: 'text', rightText: 'text', ...sharedBadgeLayout, ...allLogos },

    '/svg/streak': { textColor: 'color', ...sharedLayoutBase },
    '/svg/calendar': {
        level0: 'color', level1: 'color', level2: 'color', level3: 'color', level4: 'color',
        zeroColor: 'color', ytd: 'boolean', responsive: 'boolean', tight: 'boolean', window: 'number',
        textColor: 'color', ...sharedLayoutBase
    },
    '/svg/langs': {
        repo: 'text', limit: 'number', width: 'number', height: 'number',
        bar: 'boolean', table: 'boolean',
        color1: 'color', color2: 'color', color3: 'color', color4: 'color', color5: 'color',
        textColor: 'color', ...sharedLayoutBase
    },
    '/svg/commits': { repo: 'text', textColor: 'color', ...sharedLayoutBase, ...sharedColorBase }
};

let LOGOS = ['None'];

export function setPlaygroundLogos(iconKeys) {
    LOGOS = ['None', ...iconKeys];
}

function renderControls(schema, container) {
    if (!schema) {
        container.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.8rem; text-align: center;">No configurable parameters for this endpoint.</div>`;
        return;
    }

    let html = '';
    for (const [key, type] of Object.entries(schema)) {
        html += `<div class="${styles.controlGroup}"><label>${key}</label>`;
        if (type === 'color') {
            const val = currentParams[key] || '#000000';
            html += `
                <div class="${styles.colorInput}">
                    <input type="color" data-key="${key}" value="${val}" />
                    <input type="text" data-key="${key}" value="${val}" />
                </div>
            `;
        } else if (type === 'text' || type === 'number') {
            html += `<input type="${type}" class="${styles.input}" data-key="${key}" value="${currentParams[key] || ''}" placeholder="e.g. value" />`;
        } else if (type === 'boolean') {
            html += `<select class="${styles.input}" data-key="${key}">
                <option value="">Default</option>
                <option value="true" ${currentParams[key] === 'true' ? 'selected' : ''}>True</option>
                <option value="false" ${currentParams[key] === 'false' ? 'selected' : ''}>False</option>
            </select>`;
        } else if (type === 'select') {
            html += `<select class="${styles.input}" data-key="${key}">
                ${LOGOS.map(l => `<option value="${l === 'None' ? '' : l}" ${currentParams[key] === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            let val = e.target.value;

            if (e.target.type === 'color') {
                container.querySelector(`input[type="text"][data-key="${key}"]`).value = val;
            } else if (e.target.type === 'text' && e.target.parentElement.classList.contains(styles.colorInput)) {
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    container.querySelector(`input[type="color"][data-key="${key}"]`).value = val;
                }
            }

            currentParams[key] = val;
            triggerUpdate();
        });
    });
}

function getQueryUrl() {
    if (!currentEndpoint) return '';
    const url = new URL(apiBaseUrl + currentEndpoint);
    for (const k in currentParams) {
        if (currentParams[k]) {
            url.searchParams.set(k, currentParams[k].replace('#', ''));
        }
    }
    return url.toString();
}

function triggerUpdate() {
    const overlay = document.getElementById('pgLoading');
    if (overlay) overlay.classList.add(styles.active);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const img = document.getElementById('pgPreviewImg');
        const url = getQueryUrl();
        if (img && url) {
            img.onload = () => overlay?.classList.remove(styles.active);
            img.onerror = () => overlay?.classList.remove(styles.active);
            img.src = url;
        } else {
            overlay?.classList.remove(styles.active);
        }
    }, 400);
}

export function updatePlaygroundContext(endpoint) {
    const pg = document.getElementById('playgroundRoot');
    if (!pg) return;

    if (!endpoint) {
        pg.style.display = 'none';
        return;
    }

    pg.style.display = 'flex';
    if (currentEndpoint !== endpoint) {
        currentEndpoint = endpoint;
        currentParams = {};
    }

    const sel = document.getElementById('pgEndpointSelector');
    if (sel) sel.value = endpoint;

    const schema = endpointSchemas[endpoint] || null;
    renderControls(schema, document.getElementById('pgControlsBox'));
    triggerUpdate();
}

export function renderPlayground(mountPoint, baseUrl) {
    apiBaseUrl = baseUrl;
    mountPoint.innerHTML = `
        <aside class="${styles.playground}" id="playgroundRoot" style="display: none;">
            <div class="${styles.header}" id="pgHeader">
                <div class="${styles.peekHandle}"></div>
                <div class="${styles.pgTitle}">SVG Playground <small>(Tap to open)</small></div>
                <select class="${styles.input}" id="pgEndpointSelector" style="font-size: 0.8rem;">
                    <option value="/svg/badges/contributions">Contributions Badge</option>
                    <option value="/svg/badges/commits">Commits Badge</option>
                    <option value="/svg/badges/prs">PRs Badge</option>
                    <option value="/svg/badges/stars">Stars Badge</option>
                    <option value="/svg/badges/npm">npm Badge</option>
                    <option value="/svg/badges/cargo">Crate Badge</option>
                    <option value="/svg/badges/docker">Docker Badge</option>
                    <option value="/svg/badges/custom">Custom Text Badge</option>
                    <option value="/svg/streak">Streak Card</option>
                    <option value="/svg/calendar">Calendar Heatmap</option>
                    <option value="/svg/langs">Top Languages Bar</option>
                    <option value="/svg/commits">Recent Commits</option>
                </select>
            </div>
            
            <div class="${styles.previewArea}">
                <img id="pgPreviewImg" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Live Preview" />
                <div class="${styles.loadingOverlay}" id="pgLoading">
                    <div class="${styles.spinner}"></div>
                </div>
            </div>
            
            <div class="${styles.controls}" id="pgControlsBox">
                <!-- Controls injected here -->
            </div>
            
            <div class="${styles.actions}">
                <button class="${styles.btn} copy-md">Copy MD</button>
                <button class="${styles.btn} ${styles.primary} copy-url">Copy URL</button>
            </div>
        </aside>
    `;

    document.getElementById('pgEndpointSelector').addEventListener('change', (e) => {
        updatePlaygroundContext(e.target.value);
    });

    const btnUrl = mountPoint.querySelector('.copy-url');
    btnUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(getQueryUrl());
        const orig = btnUrl.innerText;
        btnUrl.innerText = 'Copied!';
        setTimeout(() => btnUrl.innerText = orig, 1500);
    });

    const btnMd = mountPoint.querySelector('.copy-md');
    btnMd.addEventListener('click', () => {
        const md = `![Echopoint SVG](${getQueryUrl()})`;
        navigator.clipboard.writeText(md);
        const orig = btnMd.innerText;
        btnMd.innerText = 'Copied!';
        setTimeout(() => btnMd.innerText = orig, 1500);
    });

    const pgHeader = mountPoint.querySelector('#pgHeader');
    pgHeader.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'select') return;
        document.getElementById('playgroundRoot').classList.toggle(styles.open);
    });
}
