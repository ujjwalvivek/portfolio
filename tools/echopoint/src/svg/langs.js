import { escapeXml, FONT_FACE_MONO, FONT_STACK, THEME, errorSvg } from './params.js';

export function generateLangsBar(langsObject, opts = {}) {
    if (!langsObject || Object.keys(langsObject).length === 0) return errorSvg('No language data');

    const bgRaw = opts.bg;
    const bg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bg);
    const textFill = opts.textColor || THEME.text;
    const muted = opts.pctColor || THEME.textMuted;
    const borderColor = opts.border || THEME.border;
    const borderW = opts.borderWidth ?? 1;
    const rx = opts.rx ?? 0;
    const px = opts.px ?? 0;
    const py = opts.py ?? 0;
    const barH = opts.height || 10;
    const showBar = opts.bar !== false;
    const showTable = opts.table !== false;

    const LANG_COLORS = {
        Rust: '#dea584', Go: '#00ADD8', TypeScript: '#3178c6',
        JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#563d7c',
        Python: '#3572a5', Shell: '#89e051', Dockerfile: '#384d54',
        Makefile: '#427819', C: '#555555', 'C++': '#f34b7d',
        WGSL: '#4e9a06',
    };

    const OVERFLOW = ['#8b949e', '#6e7681', '#484f58', '#30363d', '#21262d'];
    const colorOverrides = [opts.color1, opts.color2, opts.color3, opts.color4, opts.color5];

    const totalBytes = Object.values(langsObject).reduce((a, b) => a + b, 0);
    const sortedLangs = Object.entries(langsObject).sort((a, b) => b[1] - a[1]);

    const maxLangs = opts.limit ?? 6;
    const topLangs = sortedLangs.slice(0, maxLangs);
    const otherBytes = sortedLangs.slice(maxLangs).reduce((a, b) => a + b[1], 0);
    if (otherBytes > 0) topLangs.push(['Other', otherBytes]);

    const items = topLangs.map(([lang, bytes], idx) => {
        let color;
        if (idx < 5 && colorOverrides[idx]) {
            color = colorOverrides[idx];
        } else if (lang === 'Other') {
            color = OVERFLOW[0];
        } else {
            color = LANG_COLORS[lang] || OVERFLOW[idx % OVERFLOW.length];
        }
        return { lang, bytes, color, pct: ((bytes / totalBytes) * 100).toFixed(1) };
    });

    const innerW = opts.width || 300;
    const rowH = 18;
    const pctW = 36;
    const halfW = innerW / 2;
    const langW = halfW - pctW;
    const numRows = showTable ? Math.ceil(items.length / 2) : 0;
    const tableH = numRows * rowH;
    const gap = showBar && showTable ? 8 : 0;
    const innerH = (showBar ? barH : 0) + gap + (showTable ? tableH : 0);
    const width = innerW + px * 2;
    const height = innerH + py * 2;

    let barSvg = '';
    if (showBar) {
        let rects = '';
        let cx = 0;
        items.forEach(i => {
            const w = (i.bytes / totalBytes) * innerW;
            rects += `<rect x="${cx.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${barH}" fill="${i.color}"/>`;
            cx += w;
        });
        barSvg = `
    <mask id="bar-mask"><rect width="${innerW}" height="${barH}" rx="0" fill="#fff"/></mask>
    <g mask="url(#bar-mask)">${rects}</g>`;
    }

    let tableSvg = '';
    if (showTable) {
        const cellPad = 5;
        const dotR = 3;
        const textY = Math.round(rowH / 2) + 4;
        let t = `<rect width="${innerW}" height="${tableH}" rx="2" fill="none" stroke="${borderColor}" stroke-width="${borderW}"/>`;

        for (let r = 1; r < numRows; r++) {
            t += `<line x1="0" y1="${r * rowH}" x2="${innerW}" y2="${r * rowH}" stroke="${borderColor}" stroke-width="${borderW}"/>`;
        }

        for (const vx of [langW, halfW, halfW + langW]) {
            t += `<line x1="${vx}" y1="0" x2="${vx}" y2="${tableH}" stroke="${borderColor}" stroke-width="${borderW}"/>`;
        }

        items.forEach((item, idx) => {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            const ox = col === 0 ? 0 : halfW;
            const oy = row * rowH;
            const name = escapeXml(item.lang);
            t += `
      <g transform="translate(${ox}, ${oy})">
        <circle cx="${cellPad + dotR}" cy="${rowH / 2}" r="${dotR}" fill="${item.color}"/>
        <text x="${cellPad + dotR * 2 + 3}" y="${textY}" class="lang">${name}</text>
        <text x="${halfW - cellPad}" y="${textY}" text-anchor="end" class="pct">${item.pct}%</text>
      </g>`;
        });

        tableSvg = `<g transform="translate(0, ${showBar ? barH + gap : 0})">${t}
    </g>`;
    }

    const bgRect = bg === 'transparent'
        ? `<rect width="${width}" height="${height}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderW}"/>`
        : `<rect width="${width}" height="${height}" rx="${rx}" fill="${bg}" stroke="${borderColor}" stroke-width="${borderW}"/>`;

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${FONT_FACE_MONO}
    .lang { font-family: ${FONT_STACK}; font-size: 10px; fill: ${escapeXml(textFill)}; font-weight: 500; }
    .pct  { font-family: ${FONT_STACK}; font-size: 10px; fill: ${escapeXml(muted)}; font-weight: 400; }
  </style>
  ${bgRect}
  <g transform="translate(${px}, ${py})">
    ${barSvg}
    ${tableSvg}
  </g>
</svg>`.trim();
}
