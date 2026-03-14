import { useState, useEffect, useContext } from 'react';
import styles from './LangsBar.module.css';
import { useBackground } from '../../Background/BackgroundContext';
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import { generateShades } from '../../Utils/Shades/generateShades';

const MAX_LANGS = 6;

//? Module-level cache to prevent re-fetching on navigation/remount
const langsCache = { data: null, ts: 0 };
const TTL = 15 * 60 * 1000; //? 15 min stale-while-revalidate window

function processLangsData(data) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, MAX_LANGS);
    const otherBytes = sorted.slice(MAX_LANGS).reduce((a, b) => a + b[1], 0);
    if (otherBytes > 0) top.push(['Other', otherBytes]);
    return top.map(([lang, bytes], idx) => ({
        lang,
        bytes,
        pct: (bytes / total) * 100,
        idx,
    }));
}

export default function LangsBar({ echopoint }) {
    const [items, setItems] = useState(() =>
        langsCache.data ? processLangsData(langsCache.data) : []
    );
    const [hovered, setHovered] = useState(null);
    const [error, setError] = useState(false);
    const [dominantColor, setDominantColor] = useState('');
    const { backgroundConfig } = useBackground();
    const { darkMode } = useContext(ThemeContext);

    useEffect(() => {
        const timer = setTimeout(() => {
            const el = document.documentElement;
            const hex = getComputedStyle(el).getPropertyValue('--dynamic-dominant-color')?.trim();
            const rgb = getComputedStyle(el).getPropertyValue('--dynamic-dominant-color-rgb')?.trim();
            const newValue = hex || (rgb ? rgb : '');
            setDominantColor(newValue);
        }, 0);
        return () => clearTimeout(timer);
    }, [backgroundConfig, darkMode]);

    const shades = generateShades(dominantColor, MAX_LANGS + 1).reverse();

    useEffect(() => {
        //? Skip fetch if cache is fresh
        const fresh = langsCache.data && (Date.now() - langsCache.ts < TTL);
        if (fresh) return;

        fetch(`${echopoint}/v1/langs`)
            .then(r => r.json())
            .then(data => {
                if (!data || typeof data !== 'object') { setError(true); return; }
                langsCache.data = data;
                langsCache.ts = Date.now();
                setItems(processLangsData(data));
            })
            .catch(() => setError(true));
    }, [echopoint]);

    if (error || items.length === 0) return null;

    return (
        <div className={styles.wrap}>
            <span className={styles.border}></span>
            <span className={styles.title}>Love seeing Rust and Go climbing the charts!</span>
            <div
                className={styles.bar}
                onMouseLeave={() => setHovered(null)}
            >
                {items.map((item, i) => (
                    <div
                        key={item.lang}
                        className={styles.segment}
                        style={{ width: `${item.pct}%`, background: shades[item.idx] ?? shades[shades.length - 1] }}
                        onMouseEnter={() => setHovered(i)}
                    />
                ))}
                {hovered !== null && (
                    <div className={styles.tooltip}>
                        <span className={styles.tooltipDot} style={{ background: shades[items[hovered].idx] ?? shades[shades.length - 1] }} />
                        <span className={styles.tooltipLang}>{items[hovered].lang}</span>
                        <span className={styles.tooltipPct}>{items[hovered].pct.toFixed(1)}%</span>
                    </div>
                )}
            </div>

            <div className={styles.legend}>
                {items.map((item, i) => (
                    <button
                        key={item.lang}
                        className={`${styles.legendItem} ${hovered === i ? styles.legendActive : ''}`}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <span className={styles.legendDot} style={{ background: shades[item.idx] ?? shades[shades.length - 1] }} />
                        <span className={styles.legendName}>{item.lang}</span>
                        <span className={styles.legendPct}>{item.pct.toFixed(1)}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
