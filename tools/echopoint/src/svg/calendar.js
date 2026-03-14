import { escapeXml, FONT_FACE_MONO, FONT_STACK, THEME, errorSvg } from './params.js';

export function generateCalendar(calendarGrid, opts = {}) {
    if (!calendarGrid || !calendarGrid.weeks) return errorSvg('No calendar data');

    const bgRaw = opts.bg;
    const bg = bgRaw === 'none' ? 'transparent' : (bgRaw || THEME.bg);
    const labelFill = opts.textColor || THEME.textMuted;
    const borderColor = opts.border || THEME.border;
    const borderW = opts.borderWidth ?? 1;
    const rx = opts.rx ?? 0;
    const px = opts.px ?? 0;
    const py = opts.py ?? 0;

    //? overridable via level0–level4 params
    const levels = [
        opts.level0 || '#161b22',
        opts.level1 || '#0e4429',
        opts.level2 || '#006d32',
        opts.level3 || '#26a641',
        opts.level4 || '#39d353',
    ];

    const zeroColor = opts.zeroColor || levels[0];

    function levelColor(count) {
        if (count === 0) return zeroColor;
        if (count <= 3) return levels[1];
        if (count <= 7) return levels[2];
        if (count <= 12) return levels[3];
        return levels[4];
    }

    const cellSize = 11;
    const cellPad = 3;
    let weeks = calendarGrid.weeks;

    //? Date-window mode: show N months centred on today (default N=3 → prev, current, next)
    //? ytd mode: show Jan 1 → Dec 31 of current year at fixed full-year width
    let winStart = null;
    let winEnd = null;
    let totalColumns = weeks.length;

    if (opts.window) {
        const now = new Date();
        const half = Math.floor(opts.window / 2);
        winStart = new Date(now.getFullYear(), now.getMonth() - half, 1);
        const endMonth = now.getMonth() + (opts.window - half - 1);
        winEnd = new Date(now.getFullYear(), endMonth + 1, 0);

        weeks = weeks.filter(week =>
            week.contributionDays.some(day => {
                const d = new Date(day.date);
                return d >= winStart && d <= winEnd;
            })
        );
        //? fixed column count so future partial months still reserve space
        const startDay = winStart.getDay();
        const totalDays = (winEnd - winStart) / 86400000 + 1;
        totalColumns = Math.ceil((totalDays + startDay) / 7);

    } else if (opts.ytd) {
        const now = new Date();
        winStart = new Date(now.getFullYear(), 0, 1);
        winEnd = new Date(now.getFullYear(), 11, 31);
        weeks = weeks.filter(week =>
            week.contributionDays.some(day => {
                const d = new Date(day.date);
                return d >= winStart && d <= winEnd;
            })
        );
        const jan1Day = winStart.getDay();
        const totalDays = (winEnd - winStart) / 86400000 + 1;
        totalColumns = Math.ceil((totalDays + jan1Day) / 7);
    }

    const gridWidth = totalColumns * (cellSize + cellPad) - cellPad;
    const gridHeight = 7 * cellSize + 6 * cellPad;

    const marginLeft = opts.tight ? 0 : 5;
    const marginTop = opts.tight ? 14 : 20;
    const marginBottom = 0;

    const innerW = gridWidth + marginLeft + (opts.tight ? 0 : 15);
    const innerH = gridHeight + marginTop + marginBottom;
    const totalWidth = innerW + px * 2;
    const totalHeight = innerH + py * 2;

    let rects = '';
    let currX = marginLeft;

    let monthLabels = '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;

    weeks.forEach(week => {
        const firstDayDate = new Date(week.contributionDays[0].date);
        const currentMonth = firstDayDate.getMonth();
        if (currentMonth !== lastMonth && firstDayDate.getDate() <= 14) {
            monthLabels += `<text x="${currX}" y="${marginTop - 8}">${months[currentMonth]}</text>`;
            lastMonth = currentMonth;
        }

        week.contributionDays.forEach(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay();
            const currY = marginTop + (dayOfWeek * (cellSize + cellPad));

            const rangeStart = winStart;
            const rangeEnd = winEnd;
            const inWindow = !rangeStart || (date >= rangeStart && date <= rangeEnd);
            if (!inWindow) return;

            const isPast = date <= new Date();
            const fill = isPast ? levelColor(day.contributionCount || 0) : 'none';
            const stroke = !isPast ? `stroke="${zeroColor}" stroke-width="0.5" stroke-opacity="0.15"` : '';
            rects += `<rect x="${currX}" y="${currY}" width="${cellSize}" height="${cellSize}" rx="${opts.cellRx ?? 2}" fill="${fill}" ${stroke}><title>${escapeXml(day.date)}: ${day.contributionCount || 0} contributions</title></rect>`;
        });
        currX += cellSize + cellPad;
    });


    const bgRect = bg === 'transparent'
        ? `<rect width="${totalWidth}" height="${totalHeight}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderW}"/>`
        : `<rect width="${totalWidth}" height="${totalHeight}" rx="${rx}" fill="${escapeXml(bg)}" stroke="${borderColor}" stroke-width="${borderW}"/>`;

    const svgSizeAttrs = opts.responsive
        ? 'width="100%" height="auto"'
        : `width="${totalWidth}" height="${totalHeight}"`;

    return `
<svg ${svgSizeAttrs} viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    <style>
        ${FONT_FACE_MONO}
        .t { font-family: ${FONT_STACK}; font-size: 10px; fill: ${escapeXml(labelFill)}; }
        .total { font-family: ${FONT_STACK}; font-size: 10px; fill: ${escapeXml(opts.textColor || THEME.text)}; font-weight: 700; }
    </style>
    ${bgRect}
    <g transform="translate(${px}, ${py})">
        <g class="t">
            ${monthLabels}
        </g>
        <g>${rects}</g>
    </g>
</svg>`.trim();
}
