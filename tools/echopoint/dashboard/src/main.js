import './style.css';
import { Router } from './router.js';

function applyDynamicTheme(cssText) {
    let style = document.getElementById('ep-dynamic-theme');
    if (!style) {
        style = document.createElement('style');
        style.id = 'ep-dynamic-theme';
        document.head.appendChild(style);
    }
    style.textContent = cssText;
}

function generateRandomTheme() {
    const h = Math.floor(Math.random() * 360);
    const css = `
        :root[data-theme="random"] {
            --bg-base: hsl(${h}, 20%, 10%);
            --bg-mantle: hsl(${h}, 20%, 8%);
            --bg-crust: hsl(${h}, 20%, 6%);
            --surface0: hsl(${h}, 20%, 15%);
            --surface1: hsl(${h}, 20%, 20%);
            --surface2: hsl(${h}, 20%, 25%);
            --overlay0: hsl(${h}, 15%, 45%);
            --overlay1: hsl(${h}, 15%, 55%);
            --text: hsl(${h}, 10%, 85%);
            --text-sub: hsl(${h}, 10%, 70%);
            --text-muted: hsl(${h}, 15%, 50%);
            --border: hsl(${h}, 20%, 15%);
            ${['rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender']
            .map(n => `--accent-${n}: hsl(${Math.floor(Math.random() * 360)}, ${70 + Math.random() * 20}%, ${65 + Math.random() * 20}%);`)
            .join('\n            ')}
        }
    `;
    applyDynamicTheme(css);
    document.documentElement.setAttribute('data-theme', 'random');
    localStorage.setItem('ep_theme', 'random');
    localStorage.setItem('ep_random_css', css);

    document.querySelectorAll('.themeSquare').forEach(s => s.classList.remove('activeTheme'));
    const btn = document.getElementById('randomThemeBtn');
    if (btn) btn.classList.add('activeTheme');
}

function initTheme() {
    const saved = localStorage.getItem('ep_theme') || 'mocha';
    if (saved === 'random') {
        const css = localStorage.getItem('ep_random_css');
        if (css) applyDynamicTheme(css);
        document.documentElement.setAttribute('data-theme', 'random');
    } else {
        document.documentElement.setAttribute('data-theme', saved);
    }

    document.querySelectorAll('.themeSquare').forEach(sq => {
        if (sq.dataset.theme === saved) sq.classList.add('activeTheme');
        sq.addEventListener('click', (e) => {
            const t = e.target.dataset.theme;
            if (!t) return;
            document.documentElement.setAttribute('data-theme', t);
            localStorage.setItem('ep_theme', t);
            document.querySelectorAll('.themeSquare').forEach(s => s.classList.remove('activeTheme'));
            e.target.classList.add('activeTheme');
            const style = document.getElementById('ep-dynamic-theme');
            if (style) style.textContent = '';
        });
    });

    const rndBtn = document.getElementById('randomThemeBtn');
    if (rndBtn) {
        if (saved === 'random') rndBtn.classList.add('activeTheme');
        rndBtn.addEventListener('click', generateRandomTheme);
    }
}

function initClicker(mountNode) {
    if (!mountNode) return;
    mountNode.innerHTML = `
        <div class="clickerWidget">
            <div class="clickerTitle">Global Clicker</div>
            <div class="clickerCount" id="sidebarClickScore">...</div>
            <button class="clickerBtn" id="sidebarClickBtn">Click Me!</button>
        </div>
    `;

    const API_BASE = import.meta.env.VITE_ECHOPOINT_URL || 'https://echopoint.ujjwalvivek.com';
    const scoreEl = mountNode.querySelector('#sidebarClickScore');
    const btnEl = mountNode.querySelector('#sidebarClickBtn');
    let pendingClicks = 0;
    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/v1/click';

    if (!window.epClickerSocket) {
        try {
            window.epClickerSocket = new WebSocket(wsUrl);
            window.epClickerSocket.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.global !== undefined) {
                    window.epGlobalScore = data.global;
                    const curScoreEl = document.getElementById('sidebarClickScore');
                    if (curScoreEl) curScoreEl.innerText = data.global.toLocaleString();
                }
            };
        } catch (err) {
            console.error('Sidebar WS fail:', err);
        }
    } else {
        if (window.epGlobalScore !== undefined && scoreEl) {
            scoreEl.innerText = window.epGlobalScore.toLocaleString();
        }
    }

    btnEl.addEventListener('click', () => {
        pendingClicks++;
        const current = parseInt(scoreEl.innerText.replace(/,/g, ''), 10) || 0;
        scoreEl.innerText = (current + 1).toLocaleString();

        clearTimeout(btnEl.flushTimer);
        btnEl.flushTimer = setTimeout(() => {
            if (window.epClickerSocket && window.epClickerSocket.readyState === WebSocket.OPEN) {
                window.epClickerSocket.send(JSON.stringify({ type: 'click', count: pendingClicks }));
            } else {
                fetch(`${API_BASE}/v1/click`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count: pendingClicks })
                });
            }
            pendingClicks = 0;
        }, 300);
    });
}

function main() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="shell">
            <header class="topbar">
                <div class="topbarLeft">
                    <h1>Echopoint</h1>
                </div>
                <button class="hamburgerBtn" id="mobileMenuBtn" aria-label="Toggle Menu">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div class="topbarRight" id="mobileMenuContainer">
                    <div class="themeSquares">
                        <div class="themeSquare mocha" data-theme="mocha" title="Mocha"></div>
                        <div class="themeSquare macchiato" data-theme="macchiato" title="Macchiato"></div>
                        <div class="themeSquare frappe" data-theme="frappe" title="Frappé"></div>
                        <div class="themeSquare latte" data-theme="latte" title="Latte"></div>
                        <div class="themeSquare mono" data-theme="mono" title="Monochrome"></div>
                        <button id="randomThemeBtn" class="themeSquare randomBtn" title="Randomize Theme">
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                                <path d="M504.971 359.029c9.373 9.373 9.373 24.569 0 33.941l-80 79.984c-15.01 15.01-40.971 4.49-40.971-16.971V416h-58.785a12.004 12.004 0 0 1-8.773-3.812l-70.556-75.596 53.333-57.143L352 336h32v-39.981c0-21.438 25.943-31.998 40.971-16.971l80 79.981zM12 176h84l52.781 56.551 53.333-57.143-70.556-75.596A11.999 11.999 0 0 0 122.785 96H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12zm372 0v39.984c0 21.46 25.961 31.98 40.971 16.971l80-79.984c9.373-9.373 9.373-24.569 0-33.941l-80-79.981C409.943 24.021 384 34.582 384 56.019V96h-58.785a12.004 12.004 0 0 0-8.773 3.812L96 336H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h110.785c3.326 0 6.503-1.381 8.773-3.812L352 176h32z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
            <main id="mainContent" class="mainContent"></main>
        </div>
    `;

    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenuContainer').classList.toggle('open');
    });

    initTheme();

    const router = new Router();
    const contentBox = document.getElementById('mainContent');
    const API_BASE = import.meta.env.VITE_ECHOPOINT_URL || 'https://echopoint.ujjwalvivek.com';

    fetch(`${API_BASE}/v1/icons`)
        .then(res => res.json())
        .catch(err => {
            console.error('Failed to fetch icons', err);
            return {};
        })
        .then(icons => {
            Promise.all([
                import('./tabs/docs.js'),
                import('./tabs/playground.js')
            ]).then(([{ initDocsData, renderDocs }, { setPlaygroundLogos }]) => {
                setPlaygroundLogos(Object.keys(icons));
                const DOCS_DATA = initDocsData(icons);

                DOCS_DATA.forEach(doc => {
                    router.add(`#${doc.id}`, () => {
                        renderDocs(contentBox, doc.id);
                        initClicker(document.getElementById('sidebarClickerMount'));
                    });
                });

                router.start(`#${DOCS_DATA[0].id}`);
            });
        });
}

main();
