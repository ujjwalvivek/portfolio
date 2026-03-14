import { FONT_FACE_MONO, FONT_STACK, THEME, ICONS, errorSvg } from './params.js';

export function generateStreakBadge(calendarGrid, opts = {}) {
    if (!calendarGrid || !calendarGrid.weeks) return errorSvg('No streak data');

    const bgRaw = opts.bg;
    const bg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bg);
    const text = opts.textColor || THEME.text;
    const muted = THEME.textMuted;
    const borderColor = opts.border || THEME.border;
    const borderW = opts.borderWidth ?? 1;
    const rx = opts.rx ?? 0;
    const px = opts.px ?? 0;
    const py = opts.py ?? 0;
    const accent = opts.accentColor || THEME.accent;

    const days = [];
    calendarGrid.weeks.forEach(w => w.contributionDays.forEach(d => days.push(d)));
    days.reverse();

    const today = new Date().toISOString().split('T')[0];
    let todayIndex = days.findIndex(d => d.date === today);
    if (todayIndex === -1) todayIndex = 0;

    let currentStreak = 0;
    let streakStart = '';
    for (let i = todayIndex; i < days.length; i++) {
        if (days[i].contributionCount > 0) {
            currentStreak++;
            streakStart = days[i].date;
        } else if (i === todayIndex) {
            continue; //* today might not be over
        } else {
            break;
        }
    }

    const chronoDays = [...days].reverse();
    let longest = 0;
    let run = 0;
    for (const d of chronoDays) {
        if (d.contributionCount > 0) {
            run++;
            if (run > longest) longest = run;
        } else {
            run = 0;
        }
    }

    const totalContributions = calendarGrid.totalContributions || chronoDays.reduce((s, d) => s + d.contributionCount, 0);

    const streakColor = currentStreak === 0 ? THEME.error : accent;
    const fireIcon = currentStreak >= 7
        ? `<g transform="translate(${px + 152}, ${py + 12})"><svg width="16" height="16" viewBox="0 0 ${ICONS.FaFire.vb}" fill="${THEME.orange}"><path d="${ICONS.FaFire.d}"/></svg></g>`
        : '';

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const innerW = 320;
    const innerH = 130;
    const width = innerW + px * 2;
    const height = innerH + py * 2;
    const colW = innerW / 3;

    const bgRect = bg === 'transparent'
        ? `<rect width="${width}" height="${height}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderW}"/>`
        : `<rect width="${width}" height="${height}" rx="${rx}" fill="${bg}" stroke="${borderColor}" stroke-width="${borderW}"/>`;

    return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${FONT_FACE_MONO}
    .num  { font-family: ${FONT_STACK}; font-weight: 700; font-size: 26px; }
    .lbl  { font-family: ${FONT_STACK}; font-weight: 500; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; fill: ${muted}; }
    .sub  { font-family: ${FONT_STACK}; font-weight: 400; font-size: 9px; fill: ${muted}; }
    .snum { font-family: ${FONT_STACK}; font-weight: 700; font-size: 16px; }
    .sep  { stroke: ${borderColor}; stroke-width: 1; }
  </style>
  ${bgRect}

  <!-- Center: Current Streak -->
  ${fireIcon}
  <text x="${px + innerW / 2}" y="${py + 52}" text-anchor="middle" class="num" fill="${streakColor}">${currentStreak}</text>
  <text x="${px + innerW / 2}" y="${py + 68}" text-anchor="middle" class="lbl">Current Streak</text>
  <text x="${px + innerW / 2}" y="${py + 84}" text-anchor="middle" class="sub">${currentStreak > 0 ? formatDate(streakStart) + ' — today' : 'No active streak'}</text>

  <!-- Vertical separators -->
  <line x1="${px + colW}" y1="${py + 16}" x2="${px + colW}" y2="${py + innerH - 16}" class="sep"/>
  <line x1="${px + colW * 2}" y1="${py + 16}" x2="${px + colW * 2}" y2="${py + innerH - 16}" class="sep"/>

  <!-- Left: Total Contributions -->
  <text x="${px + colW / 2}" y="${py + 55}" text-anchor="middle" class="snum" fill="${text}">${totalContributions.toLocaleString()}</text>
  <text x="${px + colW / 2}" y="${py + 72}" text-anchor="middle" class="lbl">Total</text>
  <text x="${px + colW / 2}" y="${py + 86}" text-anchor="middle" class="sub">(365 days)</text>

  <!-- Right: Longest Streak -->
  <text x="${px + colW * 2 + colW / 2}" y="${py + 55}" text-anchor="middle" class="snum" fill="${text}">${longest}</text>
  <text x="${px + colW * 2 + colW / 2}" y="${py + 72}" text-anchor="middle" class="lbl">Longest</text>
  <text x="${px + colW * 2 + colW / 2}" y="${py + 86}" text-anchor="middle" class="sub">${longest} day${longest !== 1 ? 's' : ''}</text>
</svg>`.trim();
}
