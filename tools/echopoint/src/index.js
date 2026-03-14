import { generateBadge } from './svg/badges.js';
import { generateCalendar } from './svg/calendar.js';
import { generateStreakBadge } from './svg/streak.js';
import { generateLangsBar } from './svg/langs.js';
import { generateCommitsList } from './svg/commits.js';
import { generateReleasesList } from './svg/releases.js';
import { parseParams, ALLOWED_REPOS, ICONS } from './svg/params.js';
import { SOURCES, githubHeaders } from './sources.js';
export { ClickerDO } from './clicker.js';


//? Deduplicates reads when multiple SVG badges hit the same key in one page load.
let kvCache;

function resetKvCache() {
    kvCache = new Map();
}

function cachedKvGet(kv, key, type = 'json') {
    const cacheKey = `${key}:${type}`;
    if (kvCache.has(cacheKey)) return kvCache.get(cacheKey);
    const p = kv.get(key, type);
    kvCache.set(cacheKey, p);
    return p;
}

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS },
    });
}

function svgResponse(svgStr) {
    return new Response(svgStr, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            ...CORS
        }
    });
}

//? GET /v1/store
async function handleGetAll(env) {
    const keys = await env.echopoint_kv.list();
    const result = {};

    await Promise.all(
        keys.keys
            .filter((key) => !key.name.startsWith('_meta:'))
            .map(async ({ name }) => {
                const val = await cachedKvGet(env.echopoint_kv, name, 'json');
                result[name] = val;
            })
    );

    //? Include meta for dashboard status bar
    const lastUpdated = await env.echopoint_kv.get('_meta:last_updated');
    const lastRun = await env.echopoint_kv.get('_meta:last_run', 'json');
    if (lastUpdated) result['_meta:last_updated'] = lastUpdated;
    if (lastRun) result['_meta:last_run'] = lastRun;

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=120',
            ...CORS
        }
    });
}

//? GET /v1/store/:key
async function handleGetKey(key, env) {
    const val = await env.echopoint_kv.get(key, 'json');
    if (val === null) {
        return jsonResponse({ error: 'Key not found', key }, 404);
    }
    return jsonResponse(val);
}

//? GET /v1/health
async function handleHealth(env) {
    const lastUpdated = await env.echopoint_kv.get('_meta:last_updated');
    const sourceCount = SOURCES.length;
    return new Response(JSON.stringify({
        ok: true,
        service: 'echopoint',
        sources: sourceCount,
        last_updated: lastUpdated || null,
        timestamp: new Date().toISOString(),
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=120',
            ...CORS
        }
    });
}

//? Main fetch handler (router)
async function handleFetch(request, env) {
    resetKvCache();
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS });
    }

    const path = url.pathname;

    if (path === '/v1/health') {
        return handleHealth(env);
    }

    if (path === '/v1/store') {
        return handleGetAll(env);
    }

    if (path === '/v1/refresh') {
        //* Auth gate
        if (env.REFRESH_TOKEN) {
            const auth = request.headers.get('Authorization');
            if (auth !== `Bearer ${env.REFRESH_TOKEN}`) {
                return jsonResponse({ error: 'Unauthorized' }, 401);
            }
        }
        await handleScheduled(env);
        return jsonResponse({ ok: true, msg: 'Refresh triggered' });
    }

    if (path === '/v1/langs') {
        const agg = {};
        for (const repo of ALLOWED_REPOS) {
            const r = await cachedKvGet(env.echopoint_kv, `github:${repo}:langs`, 'json');
            if (!r || r.message) continue;
            for (const [l, b] of Object.entries(r)) {
                agg[l] = (agg[l] || 0) + b;
            }
        }
        return jsonResponse(agg);
    }

    if (path === '/v1/icons') {
        return jsonResponse(ICONS, 200, { 'Cache-Control': 'public, max-age=86400' });
    }

    //? Router for SVG rendering
    if (path.startsWith('/svg/')) {
        const route = path.slice('/svg/'.length);
        const opts = parseParams(url);
        const kv = env.echopoint_kv;

        if (route === 'badges/contributions') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const user = summary?.data?.user;
            let total = 0;
            if (user) {
                const currentYear = new Date().getFullYear();
                for (let year = 2016; year <= currentYear; year++) {
                    const y = user[`y${year}`];
                    if (y) {
                        total += (y.contributionCalendar?.totalContributions || 0) + (y.restrictedContributionsCount || 0);
                    }
                }
            }
            return svgResponse(generateBadge('contributions', total, opts, '#4c1'));
        }

        if (route === 'badges/commits') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const user = summary?.data?.user;
            let total = 0;
            if (user) {
                const currentYear = new Date().getFullYear();
                for (let year = 2016; year <= currentYear; year++) {
                    const y = user[`y${year}`];
                    if (y && y.totalCommitContributions) {
                        total += y.totalCommitContributions;
                    }
                }
                if (total === 0) total = user.contributionsCollection?.totalCommitContributions || 0;
            }
            return svgResponse(generateBadge('total commits', total, opts, '#4c1'));
        }

        if (route === 'badges/prs') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const total = summary?.data?.user?.contributionsCollection?.totalPullRequestContributions || 0;
            return svgResponse(generateBadge('pull requests', total, opts, '#007ec6'));
        }

        if (route === 'badges/issues') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const total = summary?.data?.user?.contributionsCollection?.totalRepositoriesWithContributedIssues || 0;
            return svgResponse(generateBadge('issues', total, opts, '#e24329'));
        }

        if (route === 'badges/stars') {
            if (!opts.repo) return svgResponse(generateBadge('stars', '?repo= required', opts, '#494949'));
            const repo = await cachedKvGet(kv, `github:${opts.repo}:repo`, 'json');
            const count = repo?.stargazers_count ?? 0;
            return svgResponse(generateBadge('stars', `${count}`, opts, '#494949'));
        }

        if (route === 'badges/release') {
            if (!opts.repo) return svgResponse(generateBadge('release', '?repo= required', opts, '#a855f7'));
            const rel = await cachedKvGet(kv, `github:${opts.repo}:release`, 'json');
            const tag = rel?.tag_name || '—';
            return svgResponse(generateBadge('release', tag, opts, '#a855f7'));
        }

        if (route === 'badges/npm') {
            const pkg = opts.package;
            if (!pkg) return svgResponse(generateBadge('npm', '?package= required', opts, '#cb3837'));
            const data = await cachedKvGet(kv, `npm:${pkg}`, 'json');
            const ver = data?.version ? `v${data.version}` : '—';
            return svgResponse(generateBadge('npm', ver, opts, '#cb3837'));
        }

        if (route === 'badges/cargo') {
            const crate = opts.crate;
            if (!crate) return svgResponse(generateBadge('cargo', '?crate= required', opts, '#dea584'));
            const data = await cachedKvGet(kv, `crates:${crate}`, 'json');
            const ver = data?.crate?.max_version ? `v${data.crate.max_version}` : '—';
            return svgResponse(generateBadge('cargo', ver, opts, '#dea584'));
        }

        if (route === 'badges/docker') {
            const img = opts.image;
            if (!img) return svgResponse(generateBadge('docker', '?image= required', opts, '#2496ed'));
            const data = await cachedKvGet(kv, `docker:${img}:tags`, 'json');
            let ver = '—';
            if (data?.results?.length > 0) {
                const nonLatest = data.results.find(t => t.name !== 'latest');
                if (nonLatest) ver = `v${nonLatest.name}`;
            }
            return svgResponse(generateBadge('docker', ver, opts, '#2496ed'));
        }

        if (route === 'badges/ghcr') {
            if (!opts.repo) return svgResponse(generateBadge('ghcr', '?repo= required', opts, '#2da44e'));
            const rel = await cachedKvGet(kv, `github:${opts.repo}:release`, 'json');
            const tag = rel?.tag_name || '—';
            return svgResponse(generateBadge('ghcr', tag, opts, '#2da44e'));
        }

        if (route === 'badges/updated') {
            if (!opts.repo) return svgResponse(generateBadge('updated', '?repo= required', opts, '#6cc644'));
            const repo = await cachedKvGet(kv, `github:${opts.repo}:repo`, 'json');
            let text = '—';
            if (repo?.pushed_at) {
                const diff = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24));
                if (diff === 0) text = 'today';
                else if (diff === 1) text = 'yesterday';
                else text = `${diff}d ago`;
            }
            return svgResponse(generateBadge('updated', text, opts, '#6cc644'));
        }

        if (route === 'badges/docs') {
            return svgResponse(generateBadge('Docs', null, opts, '#3b82f6'));
        }

        if (route === 'badges/custom') {
            const left = opts.leftText || 'label';
            const right = opts.rightText || null;
            return svgResponse(generateBadge(left, right, opts, opts.badgeColor || '#555'));
        }

        if (route === 'badges/health') {
            if (!opts.repo) return svgResponse(generateBadge('health', '?repo= required', opts, '#4ade80'));
            return svgResponse(generateBadge('health', 'probe', opts, '#4ade80'));
        }

        if (route === 'calendar') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const calendarGrid = summary?.data?.user?.contributionsCollection?.contributionCalendar;
            return svgResponse(generateCalendar(calendarGrid, opts));
        }

        if (route === 'streak') {
            const summary = await cachedKvGet(kv, 'github:ujjwalvivek:summary', 'json');
            const calendarGrid = summary?.data?.user?.contributionsCollection?.contributionCalendar;
            return svgResponse(generateStreakBadge(calendarGrid, opts));
        }

        if (route === 'langs') {
            const repos = opts.repo ? [opts.repo] : ALLOWED_REPOS;
            const agg = {};
            for (const repo of repos) {
                const r = await cachedKvGet(kv, `github:${repo}:langs`, 'json');
                if (!r || r.message) continue;
                for (const [l, b] of Object.entries(r)) {
                    agg[l] = (agg[l] || 0) + b;
                }
            }
            return svgResponse(generateLangsBar(agg, opts));
        }

        if (route === 'commits') {
            const repos = opts.repo ? [opts.repo] : ALLOWED_REPOS;
            const all = [];
            for (const repo of repos) {
                const r = await cachedKvGet(kv, `github:${repo}:commits`, 'json');
                if (Array.isArray(r)) all.push(...r);
            }
            all.sort((a, b) => new Date(b.date) - new Date(a.date));
            const top3 = all.slice(0, opts.limit ?? 3);
            return svgResponse(generateCommitsList(top3, opts));
        }

        if (route === 'releases') {
            const repos = opts.repo ? [opts.repo] : ALLOWED_REPOS;
            const all = [];
            for (const repo of repos) {
                const r = await cachedKvGet(kv, `github:${repo}:releases`, 'json');
                if (Array.isArray(r)) all.push(...r);
            }
            all.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
            const top5 = all.slice(0, opts.limit ?? 5);
            return svgResponse(generateReleasesList(top5, opts));
        }

        return jsonResponse({ error: 'SVG route not found' }, 404);
    }

    if (path.startsWith('/v1/store/')) {
        const key = decodeURIComponent(path.slice('/v1/store/'.length));
        return handleGetKey(key, env);
    }

    //? delegated to ClickerDO
    if (path === '/v1/click') {
        const id = env.CLICKER.idFromName('global');
        const stub = env.CLICKER.get(id);
        return stub.fetch(request);
    }

    //? Authenticated proxy for GitHub Contents API
    if (path === '/v1/github/contents') {
        const repo = url.searchParams.get('repo');
        const ghPath = url.searchParams.get('path') || '';
        if (!repo || !ALLOWED_REPOS.includes(repo)) {
            return jsonResponse({ error: 'Invalid or missing repo param' }, 400);
        }
        const ghUrl = `https://api.github.com/repos/ujjwalvivek/${encodeURIComponent(repo)}/contents/${ghPath}`;
        try {
            const res = await fetch(ghUrl, { headers: githubHeaders(env) });
            const data = await res.json();
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
            });
        } catch (err) {
            return jsonResponse({ error: 'GitHub API proxy failed', message: err.message }, 502);
        }
    }

    return env.ASSETS.fetch(request);
}

//? refreshes data from upstream
async function handleScheduled(env) {
    console.log(`[echopoint] Starting scheduled refresh at ${new Date().toISOString()}`);

    let successCount = 0;
    let failCount = 0;

    for (const source of SOURCES) {
        try {
            const headers = {};

            if (source.auth === 'github') {
                Object.assign(headers, githubHeaders(env));
            } else {
                headers['User-Agent'] = 'echopoint-collector';
            }

            if (source.url.includes('crates.io')) {
                headers['Accept'] = 'application/json'; //* crates.io requires an explicit Accept header
            }

            const fetchOpts = { headers };
            if (source.method) fetchOpts.method = source.method;
            if (source.body) fetchOpts.body = typeof source.body === 'function' ? source.body(env) : source.body;

            const res = await fetch(source.url, fetchOpts);

            if (!res.ok) {
                console.warn(`[echopoint] ${source.key} → HTTP ${res.status}`);
                failCount++;
                continue;
            }

            let data = await res.json();

            if (source.transform) {
                data = await source.transform(data, env);
            }

            //? no TTL, cron overwrites
            await env.echopoint_kv.put(source.key, JSON.stringify(data));
            successCount++;
        } catch (err) {
            console.error(`[echopoint] ${source.key} failed:`, err.message);
            failCount++;
        }
    }

    await env.echopoint_kv.put(
        '_meta:last_updated',
        new Date().toISOString()
    );
    await env.echopoint_kv.put(
        '_meta:last_run',
        JSON.stringify({ success: successCount, failed: failCount, total: SOURCES.length })
    );

    console.log(`[echopoint] Refresh complete: ${successCount} ok, ${failCount} failed`);
}

const Worker = {
    fetch: handleFetch,
    scheduled(event, env, ctx) {
        ctx.waitUntil(handleScheduled(env));
    },
};

export default Worker;
