import styles from './docs.module.css';
import { renderPlayground, updatePlaygroundContext } from './playground.js';
import { renderStats } from './stats.js';

let DOCS_DATA = [];
export const API_BASE = import.meta.env.VITE_ECHOPOINT_URL || 'https://echopoint.ujjwalvivek.com';

export function initDocsData(ICONS) {
    DOCS_DATA = [
        {
            id: 'overview',
            title: 'Overview',
            content: `
            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.ws}">API</span>
                    <span class="${styles.path}">Echopoint</span>
                </div>
                <p>Echopoint is a Cloudflare Worker providing ultra-fast, cached telemetry data for GitHub, npm, crates.io, and Docker Hub, plus <strong>dynamic SVG generation</strong>.</p>
                <pre class="${styles.codeBlock}"><strong>BASE_URL</strong> = https://echopoint.ujjwalvivek.com</pre>
                <p>Data fetch jobs run via cron every 2 hours. The API endpoints act purely as extremely fast KV store lookups.</p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>Endpoints</th><th>MAX_AGE</th></tr></thead>
                        <tbody>
                            <tr><td><code>REST</code></td><td>120s</td></tr>
                            <tr><td><code>SVG</code></td><td>300s</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `
        },
        {
            id: 'rest',
            title: 'REST Endpoints',
            content: `
            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/health</span>
                </div>
                <p>Check service health, source count, and last updated time.</p>
                <pre class="${styles.codeBlock}">{"ok":true,"sources":32,"timestamp":"..."}</pre>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/store</span>
                </div>
                <p>Fetch the entire KV store in one hit (120s cache). Used by the dashboard.</p>
                <pre class="${styles.codeBlock}">{"github:portfolio:repo": {...}, "_meta:last_updated": "..."}</pre>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/store/:key</span>
                </div>
                <p>Fetch a single KV key directly.</p>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/langs</span>
                </div>
                <p>Fetch aggregated GitHub language bytes mapped across all tracked repositories.</p>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.post}">POST</span>
                    <span class="${styles.path}">/v1/refresh</span>
                </div>
                <p>Manually trigger the cron data fetch jobs. Requires <code>Authorization: Bearer</code> header.</p>
                <pre class="${styles.codeBlock}">curl -X POST -H "Authorization: Bearer $TOKEN" https://echopoint.ujjwalvivek.com/v1/refresh</pre>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/icons</span>
                </div>
                <p>Returns a dictionary of all supported SVG icons and their path data for dynamic frontend rendering.</p>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.ws}">WS</span>
                    <span class="${styles.path}">/v1/click</span>
                </div>
                <p>WebSocket endpoint for real-time global click sync via Durable Objects. (GET returns current count, POST increments count manually).</p>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">/v1/github/contents</span>
                </div>
                <p>Authenticated GitHub proxy. Requires <code>?repo=</code> and <code>?path=</code>. Restricted to portfolio, journey, synclippy. Echopoint fetches multiple endpoints per repository and caches them in the KV store.</p>
                <p style="margin-bottom:1rem;color:var(--text-muted);font-size:0.8rem;"><strong>Tracked Repos:</strong> portfolio, journey, synclippy</p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>KV Key</th><th>Description (Shape)</th></tr></thead>
                        <tbody>
                            <tr><td><code>github:{repo}:repo</code></td><td>GitHub REST repo object (name, description, stars, forks, issues, size, pushed_at, default_branch…).</td></tr>
                            <tr><td><code>github:{repo}:release</code></td><td>Latest GitHub release object (tag_name, name, published_at, assets[]).</td></tr>
                            <tr><td><code>github:{repo}:releases</code></td><td>Array[5] release objects.</td></tr>
                            <tr><td><code>github:{repo}:commits</code></td><td>Array[5] enriched commits (sha, message, url, author, date, additions, deletions).</td></tr>
                            <tr><td><code>github:{repo}:contributors</code></td><td>Array[10] (login, contributions, avatar_url…).</td></tr>
                            <tr><td><code>github:{repo}:tags</code></td><td>Array[5] (name, commit.sha).</td></tr>
                            <tr><td><code>github:{repo}:deployments</code></td><td>Array[5] (environment, ref, sha, created_at).</td></tr>
                            <tr><td><code>github:{repo}:langs</code></td><td><code>{Language: bytes}</code> map.</td></tr>
                            <tr><td><code>github:{repo}:user</code></td><td>Repository owner snapshot.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">pkgs metadata</span>
                </div>
                <p>Cached registry data for open-source packages.</p>
                <p style="margin-bottom:1rem;color:var(--text-muted);font-size:0.8rem;"><strong>NPM:</strong> @ujjwalvivek/journey-engine, @ujjwalvivek/dino-blink <br><strong>Crates:</strong> journey-engine<br><strong>Docker:</strong> synclippy</p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>KV Key</th><th>Description (Shape)</th></tr></thead>
                        <tbody>
                            <tr><td><code>npm:{package}</code></td><td>Latest version metadata from npmjs (name, version, description, dist.shasum, files).</td></tr>
                            <tr><td><code>crates:{crate}</code></td><td><code>{ crate: { id, max_version, downloads } }</code></td></tr>
                            <tr><td><code>docker:{image}:tags</code></td><td><code>{ results: [{ name, last_updated }] }</code></td></tr>
                            <tr><td><code>_meta:last_updated</code></td><td>ISO timestamp string of worker cron.</td></tr>
                            <tr><td><code>_meta:last_run</code></td><td><code>{ success, failed, total }</code> of worker cron.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.get}">GET</span>
                    <span class="${styles.path}">user summary</span>
                </div>
                <p>GraphQL aggregated snapshot of user activity.</p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>KV Key</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>github:ujjwalvivek:summary</code></td><td>GraphQL result — current-year <code>contributionsCollection</code> + per-year <code>y2016…y{now}</code> contribution totals.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>   
        `
        },
        {
            id: 'svg-generator',
            title: 'SVG Generator',
            isPlayground: true,
            defaultPath: '/svg/badges/contributions',
            content: `
            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.ws}">SVG</span>
                    <span class="${styles.path}">Badges</span>
                </div>
                <p>Live playground to create standard stat badges.</p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>Route</th><th>Required Query</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>/svg/badges/contributions</code></td><td>—</td><td>Total GH contributions (all years)</td></tr>
                            <tr><td><code>/svg/badges/commits</code></td><td>—</td><td>Total commit contributions</td></tr>
                            <tr><td><code>/svg/badges/prs</code></td><td>—</td><td>Total PRs</td></tr>
                            <tr><td><code>/svg/badges/issues</code></td><td>—</td><td>Total repos with contributed issues</td></tr>
                            <tr><td><code>/svg/badges/stars</code></td><td><code>?repo=</code></td><td>Repo stars</td></tr>
                            <tr><td><code>/svg/badges/release</code></td><td><code>?repo=</code></td><td>Latest release tag for a repo</td></tr>
                            <tr><td><code>/svg/badges/npm</code></td><td><code>?package=</code></td><td>Latest npm version for a package</td></tr>
                            <tr><td><code>/svg/badges/cargo</code></td><td><code>?crate=</code></td><td>Latest crates.io version for a crate</td></tr>
                            <tr><td><code>/svg/badges/docker</code></td><td><code>?image=</code></td><td>Latest non-latest Docker tag</td></tr>
                            <tr><td><code>/svg/badges/ghcr</code></td><td><code>?repo=</code></td><td>Latest release (GHCR proxy)</td></tr>
                            <tr><td><code>/svg/badges/updated</code></td><td><code>?repo=</code></td><td>Last push relative time</td></tr>
                            <tr><td><code>/svg/badges/docs</code></td><td>—</td><td>Static "Docs" badge</td></tr>
                            <tr><td><code>/svg/badges/custom</code></td><td><code>?leftText=&rightText=</code></td><td>Fully custom label/value</td></tr>
                            <tr><td><code>/svg/badges/health</code></td><td><code>?repo=</code></td><td>Repo health probe badge</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.ws}">SVG</span>
                    <span class="${styles.path}">Data Cards</span>
                </div>
                <p>Live playground to create complex data cards.</p>
                <p>Shared layout params for all SVGs: <code>bg, border, borderWidth, rx, cellRx, px, py, accentColor, lineColor</code></p>
                <div class="${styles.tableWrapper}">
                    <table>
                        <thead><tr><th>Route</th><th>Required Query</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>/svg/streak</code></td><td>—</td><td>Current streak, total contributions, longest streak.</td></tr>
                            <tr><td><code>/svg/calendar</code></td><td>—</td><td>GitHub-style heatmap. Customize palette with <code>level0</code> through <code>level4</code>.</td></tr>
                            <tr><td><code>/svg/langs</code></td><td>—</td><td>Language composition bar across repos.</td></tr>
                            <tr><td><code>/svg/commits</code></td><td><code>?repo=</code></td><td>Recent 5 commits timeline.</td></tr>
                            <tr><td><code>/svg/releases</code></td><td><code>?repo=</code></td><td>Recent releases list.</td></tr>
                        </tbody>
                    </table>
                </div>               
            </div> 

            <div class="${styles.endpoint}">
                <div class="${styles.endpointHeader}">
                    <span class="${styles.method} ${styles.ws}">SVG</span>
                    <span class="${styles.path}">Icons</span>
                </div>
                <p>Supported <code>?logo=</code> values. Case-insensitive.</p>
                <div class="${styles.iconGrid}">
                    ${Object.entries(ICONS).map(([name, icon]) => `
                        <div class="${styles.iconCard}">
                            <svg viewBox="0 0 ${icon.vb}"><path d="${icon.d}"/></svg>
                            <span>${name}</span>
                        </div>
                    `).join('')}
                </div>
            </div> 
        `
        },
        {
            id: 'user-stats',
            title: 'User Stats Dashboard',
            isStats: true,
            content: ``
        }
    ];

    return DOCS_DATA;
}

export function renderDocs(container, activeId) {
    const navHtml = DOCS_DATA.map((d) => {
        const activeCls = d.id === activeId ? styles.active : '';
        return '<span class="' + styles.navItem + ' ' + activeCls + '" data-id="' + d.id + '">' + d.title + '</span>';
    }).join('');

    const contentHtml = DOCS_DATA.map((d) => {
        const activeCls = d.id === activeId ? styles.active : '';
        return '<div class="' + styles.section + ' ' + activeCls + '" id="section-' + d.id + '">' + d.content + '</div>';
    }).join('');

    container.innerHTML = `
        <div class="${styles.container}">
            <aside class="${styles.sidebar}">
                <div class="${styles.sidebarTitle}">Content</div>
                <nav class="${styles.nav}" id="docsNav">
                    ${navHtml}
                </nav>
                <div id="sidebarClickerMount"></div>
            </aside>
            <div class="${styles.contentWrapper}">
                <main class="${styles.docsContent}">
                    ${contentHtml}
                </main>
            </div>
            <div id="playgroundMount"></div>
        </div>
    `;

    const playgroundMount = container.querySelector('#playgroundMount');
    const docData = DOCS_DATA.find(d => d.id === activeId);

    renderPlayground(playgroundMount, API_BASE);

    if (docData?.isPlayground) {
        updatePlaygroundContext(docData.defaultPath);
    } else {
        updatePlaygroundContext(null);
    }

    if (docData?.isStats) {
        const sec = container.querySelector('#section-' + activeId);
        if (sec && !sec.innerHTML.trim()) {
            renderStats(sec);
        }
    }

    const docsNav = container.querySelector('#docsNav');
    if (docsNav) {
        docsNav.addEventListener('click', (e) => {
            if (e.target.classList.contains(styles.navItem)) {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                history.pushState(null, null, '#' + e.target.dataset.id);
                window.dispatchEvent(new Event('hashchange')); 
            }
        });
        
        setTimeout(() => {
            const activeItem = docsNav.querySelector('.' + styles.active);
            if (activeItem) activeItem.scrollIntoView({ block: 'nearest', inline: 'center' });
        }, 50);
    }
}
