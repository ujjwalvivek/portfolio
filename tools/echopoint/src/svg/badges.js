import { escapeXml, FONT_FACE_MONO, FONT_STACK, THEME, ICONS } from './params.js';

export function generateBadge(label, value, opts = {}, defaultColor = '#ffffff00') {
  const textFill = opts.textColor || THEME.text;
  const rightRaw = opts.badgeColor;
  const rightFill = rightRaw === 'none' ? 'transparent' : (rightRaw || defaultColor);
  const bgRaw = opts.bg;
  const leftBg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bgCard);
  const rx = opts.rx ?? 0;
  const px = opts.px ?? 0;
  const py = opts.py ?? 0;

  const displayLabel = escapeXml(opts.leftText || label);
  const rawValue = opts.rightText || (value != null && value !== '' ? String(value) : null);
  const displayValue = rawValue ? escapeXml(rawValue) : null;

  const icon = opts.logo && ICONS[opts.logo] ? ICONS[opts.logo] : null;
  const iconWidth = icon ? 20 : 0;
  const iconPad = icon ? 4 : 0;

  const charWidth = 6.8;
  const hPad = 6;
  const innerH = 20;
  const innerW = (() => {
    if (!displayValue) {
      return Math.ceil(displayLabel.length * charWidth + hPad * 2 + iconWidth);
    }
    const lw = Math.ceil(displayLabel.length * charWidth + hPad * 2 + iconWidth);
    const vw = Math.ceil(displayValue.length * charWidth + hPad * 2);
    return lw + vw;
  })();

  const totalWidth = innerW + px * 2;
  const totalHeight = innerH + py * 2;

  //? only label, no value
  if (!displayValue) {
    const labelX = px + (iconWidth + innerW) / 2;
    const iconSvg = icon
      ? `<g transform="translate(${px + hPad + iconPad}, ${py + (innerH - 14) / 2})"><svg width="14" height="14" viewBox="0 0 ${icon.vb}" fill="${textFill}"><path d="${icon.d}"/></svg></g>`
      : '';
    return `
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>${FONT_FACE_MONO}</style>
  <rect width="${totalWidth}" height="${totalHeight}" rx="${rx}" fill="${rightFill}"/>
  ${iconSvg}
  <text x="${labelX}" y="${py + innerH / 2 + 4}" fill="${textFill}" text-anchor="middle" font-family="${FONT_STACK}" font-size="11" font-weight="500">${displayLabel}</text>
</svg>`.trim();
  }

  //? label and value
  const labelWidth = Math.ceil(displayLabel.length * charWidth + hPad * 2 + iconWidth);
  const valueWidth = Math.ceil(displayValue.length * charWidth + hPad * 2);

  const iconSvg = icon
    ? `<g transform="translate(${px + hPad + iconPad}, ${py + (innerH - 14) / 2})"><svg width="14" height="14" viewBox="0 0 ${icon.vb}" fill="${textFill}"><path d="${icon.d}"/></svg></g>`
    : '';

  const labelX = px + (iconWidth + labelWidth) / 2;
  const valueX = px + labelWidth + valueWidth / 2;

  return `
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>${FONT_FACE_MONO}</style>
  <mask id="m"><rect width="${totalWidth}" height="${totalHeight}" rx="${rx}" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect x="${px}" y="${py}" width="${labelWidth}" height="${innerH}" fill="${leftBg}"/>
    <rect x="${px + labelWidth}" y="${py}" width="${valueWidth}" height="${innerH}" fill="${rightFill}"/>
    ${px > 0 || py > 0 ? `<rect width="${totalWidth}" height="${totalHeight}" fill="none"/>` : ''}
  </g>
  ${iconSvg}
  <g fill="${textFill}" text-anchor="middle" font-family="${FONT_STACK}" font-size="11" font-weight="500">
    <text x="${labelX}" y="${py + innerH / 2 + 4}">${displayLabel}</text>
    <text x="${valueX}" y="${py + innerH / 2 + 4}">${displayValue}</text>
  </g>
</svg>`.trim();
}
