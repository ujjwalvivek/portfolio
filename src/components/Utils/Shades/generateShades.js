const parseToRgb = (input) => {
    if (!input) return { r: 128, g: 128, b: 128 };

    const s = String(input).trim();
    if (/^\d{1,3}\s*,/.test(s)) {
        const parts = s.replace(/;$/, '').split(',').map(p => parseInt(p.trim(), 10));
        if (parts.length >= 3 && parts.slice(0, 3).every(n => !Number.isNaN(n))) {
            return { r: parts[0], g: parts[1], b: parts[2] };
        }
    }

    const hex = s.replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        };
    }

    return { r: 128, g: 128, b: 128 };
};

const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: h = 0; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
};

const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

export const generateShades = (baseColor, count = 5) => {
    const rgb = parseToRgb(baseColor);
    const [hue, saturation] = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const shades = [];
    for (let i = 1; i <= count; i++) {
        const lightness = 20 + ((i - 1) / (count - 1)) * 60;
        shades.push(hslToHex(Math.round(hue), Math.round(saturation), Math.round(lightness)));
    }
    return shades;
};

