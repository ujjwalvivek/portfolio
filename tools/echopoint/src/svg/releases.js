import { escapeXml, FONT_FACE_MONO, FONT_STACK, THEME, errorSvg } from './params.js';

export function generateReleasesList(releases, opts = {}) {
  if (!releases || releases.length === 0) return errorSvg('No releases data');

  const bgRaw = opts.bg;
  const bg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bg);
  const text = opts.textColor || THEME.text;
  const accent = opts.accentColor || THEME.accent;
  const muted = THEME.textMuted;
  const borderColor = opts.border || THEME.border;
  const lineColor = opts.lineColor || borderColor;
  const borderW = opts.borderWidth ?? 1;
  const rx = opts.rx ?? 0;
  const px = opts.px ?? 0;
  const py = opts.py ?? 0;
  const warn = THEME.warn;

  const innerW = 380;
  const itemHeight = 45;
  const contentH = releases.length * itemHeight;
  const width = innerW + px * 2;
  const totalHeight = contentH + py * 2;

  let itemsHtml = '';
  let currentY = py;

  releases.forEach((release, idx) => {
    const tag = escapeXml(release.tag_name || 'unknown');
    let name = escapeXml(release.name || release.tag_name || '');
    if (name.length > 38) name = name.substring(0, 36) + '…';

    const dateObj = new Date(release.published_at || release.created_at);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const author = escapeXml(release.author?.login || '');
    const isLast = idx === releases.length - 1;
    const dotColor = release.prerelease ? warn : accent;

    itemsHtml += `
    <g transform="translate(${px}, ${currentY})">
      <rect x="6" y="11" width="8" height="8" rx="1" fill="${dotColor}"/>
      ${!isLast ? `<line x1="10" y1="19" x2="10" y2="${itemHeight + 11}" stroke="${lineColor}" stroke-width="1.5"/>` : ''}
      <text x="25" y="16" class="t">${name} <tspan class="tag">${tag}</tspan></text>
      <text x="25" y="32" class="m">${escapeXml(dateStr)}${author ? ` · ${author}` : ''}${release.prerelease ? ' · pre-release' : ''}</text>
    </g>`;
    currentY += itemHeight;
  });

  const bgRect = bg === 'transparent'
    ? `<rect width="${width}" height="${totalHeight}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderW}"/>`
    : `<rect width="${width}" height="${totalHeight}" rx="${rx}" fill="${bg}" stroke="${borderColor}" stroke-width="${borderW}"/>`;

  return `
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${FONT_FACE_MONO}
    .t   { font-family: ${FONT_STACK}; font-size: 12px; fill: ${text}; font-weight: 500; }
    .tag { font-family: ${FONT_STACK}; font-size: 10px; fill: ${accent}; font-weight: 700; }
    .m   { font-family: ${FONT_STACK}; font-size: 10px; fill: ${muted}; }
  </style>
  ${bgRect}
  ${itemsHtml}
</svg>`.trim();
}
