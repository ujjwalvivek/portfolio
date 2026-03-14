import { escapeXml, FONT_FACE_MONO, FONT_STACK, THEME, errorSvg } from './params.js';

export function generateCommitsList(commits, opts = {}) {
  if (!commits || commits.length === 0) return errorSvg('No commits data');

  const bgRaw = opts.bg;
  const bg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bg);
  const text = opts.textColor || THEME.text;
  const accent = opts.accentColor || THEME.purple;
  const muted = THEME.textMuted;
  const borderColor = opts.border || THEME.border;
  const lineColor = opts.lineColor || borderColor;
  const borderW = opts.borderWidth ?? 1;
  const rx = opts.rx ?? 0;
  const px = opts.px ?? 0;
  const py = opts.py ?? 0;
  const green = THEME.green;
  const red = THEME.error;

  const innerW = 380;
  const itemHeight = 45;
  const contentH = commits.length * itemHeight;
  const width = innerW + px * 2;
  const totalHeight = contentH + py * 2;

  let itemsHtml = '';
  let currentY = py;

  commits.forEach((commit, idx) => {
    let msg = escapeXml(commit.message || 'Updated code');
    if (msg.length > 52) msg = msg.substring(0, 50) + '…';

    const dateObj = new Date(commit.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sha = commit.sha ? commit.sha.substring(0, 7) : '-';
    const isLast = idx === commits.length - 1;

    itemsHtml += `
    <g transform="translate(${px}, ${currentY})">
      <rect x="6" y="11" width="8" height="8" rx="1" fill="${accent}"/>
      ${!isLast ? `<line x1="10" y1="19" x2="10" y2="${itemHeight + 11}" stroke="${lineColor}" stroke-width="1.5"/>` : ''}
      <text x="25" y="16" class="t">${msg}</text>
      <text x="25" y="32" class="m">${escapeXml(dateStr)} · ${escapeXml(sha)} · <tspan fill="${green}">+${commit.additions || 0}</tspan> <tspan fill="${red}">-${commit.deletions || 0}</tspan></text>
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
    .t  { font-family: ${FONT_STACK}; font-size: 12px; fill: ${text}; font-weight: 500; }
    .m  { font-family: ${FONT_STACK}; font-size: 10px; fill: ${muted}; }
  </style>
  ${bgRect}
  ${itemsHtml}
</svg>`.trim();
}
