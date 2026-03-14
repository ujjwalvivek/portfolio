import { useEffect, useCallback, useState, useContext, useRef } from 'react';
import styles from './Widgets.module.css';
import { useBackground } from '../../Background/BackgroundContext';
import CalWidget from '../../Modules/Cal/CalWidget';
import { MdLocationPin } from "react-icons/md";
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import { generateShades } from '../../Utils/Shades/generateShades';
import { FaGithubSquare } from "react-icons/fa";
import { IoGitCommitSharp } from "react-icons/io5";
import { PiCalendarDotsFill, PiMoonStarsFill } from "react-icons/pi";
import { MdOutlineLink } from "react-icons/md";
import { TbClick } from "react-icons/tb";
import { FiSun, FiSunrise, FiSunset } from "react-icons/fi";
import EchopointImg from '../../Utils/EchopointImg/EchopointImg';
import GenericCachedImg from '../../Utils/EchopointImg/GenericCachedImg';

const ECHOPOINT = 'https://echopoint.ujjwalvivek.com';
const CARTO_TILE_DARK = 'https://basemaps.cartocdn.com/dark_all/12/2931/1900@2x.png';
const CARTO_TILE_LIGHT = 'https://basemaps.cartocdn.com/light_all/12/2931/1900@2x.png';
let globalClickCache = 0;

async function fetchTotal() {
    const res = await fetch('https://echopoint.ujjwalvivek.com/v1/store/github:ujjwalvivek:summary');
    const { data } = await res.json();
    const user = data?.user;

    //? Total contributions (all years, incl. private)
    let totalContributions = 0;
    const currentYear = new Date().getFullYear();
    for (let y = 2016; y <= currentYear; y++) {
        const yr = user?.[`y${y}`];
        if (yr) totalContributions += (yr.contributionCalendar?.totalContributions || 0) + (yr.restrictedContributionsCount || 0);
    }
    return totalContributions;
}

const Widgets = () => {
    const { backgroundConfig } = useBackground();

    const [clickPersonal, setClickPersonal] = useState(
        () => parseInt(localStorage.getItem('echopoint_clicks') || '0', 10)
    );
    const [clickGlobal, setClickGlobal] = useState(globalClickCache);
    const [btnPressed, setBtnPressed] = useState(false);


    const wsRef = useRef(null);
    const reconnectRef = useRef(null);

    //? WebSocket connection for real-time click sync
    useEffect(() => {
        let alive = true;

        function connect() {
            if (!alive) return;
            const proto = window.location.protocol === 'https:' ? 'wss' : 'wss';
            const ws = new WebSocket(`${proto}://echopoint.ujjwalvivek.com/v1/click`);

            ws.onopen = () => {
                wsRef.current = ws;
            };

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === 'sync') {
                        globalClickCache = msg.global;
                        setClickGlobal(msg.global);
                    }
                } catch { }
            };

            ws.onclose = () => {
                wsRef.current = null;
                if (alive) reconnectRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => ws.close();
        }

        connect();

        return () => {
            alive = false;
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const [istTime, setIstTime] = useState('');

    const { darkMode } = useContext(ThemeContext);

    const [dominantColor, setDominantColor] = useState('');
    const accentHex = [];

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

    const shades = generateShades(dominantColor, 6);
    const shadesWithoutHex = shades.map(s => s.replace(/^#/, ''));
    shadesWithoutHex.forEach((shade, i) => {
        accentHex.push(shade);
    });

    const accent1 = accentHex[0] || '000000';
    const accent2 = accentHex[1] || '000000';
    const accent3 = accentHex[2] || '000000';
    const accent4 = accentHex[3] || '000000';
    const accent5 = accentHex[4] || '000000';

    useEffect(() => {
        const tick = () => {
            setIstTime(
                new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                })
            );
        };
        tick();
        const iv = setInterval(tick, 1000);
        return () => clearInterval(iv);
    }, []);

    const handleClick = useCallback(() => {
        setClickPersonal(prev => {
            const next = prev + 1;
            localStorage.setItem('echopoint_clicks', next.toString());
            return next;
        });
        //? Optimistic local bump
        setClickGlobal(prev => {
            const newVal = prev + 1;
            globalClickCache = newVal;
            return newVal;
        });

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'click', count: 1 }));
        } else {
            //? Fallback: POST if WS is disconnected
            fetch(`${ECHOPOINT}/v1/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: 1 }),
            })
                .then(r => r.json())
                .then(d => {
                    if (d.global) {
                        globalClickCache = d.global;
                        setClickGlobal(d.global);
                    }
                })
                .catch(() => { });
        }
    }, []);


    const h = new Date().getHours();

    let icon;
    if (h >= 5 && h <= 7) {
        icon = <FiSunrise size={14} />;
    } else if (h >= 8 && h <= 16) {
        icon = <FiSun size={14} />;
    } else if (h >= 17 && h <= 19) {
        icon = <FiSunset size={14} />;
    } else {
        icon = <PiMoonStarsFill size={14} />;
    }

    const [totalContributions, setTotalContributions] = useState(0);

    useEffect(() => {
        fetchTotal().then(setTotalContributions);
    }, []);

    return (
        <div className={styles.widgetContainer}>
            <div className={styles.widgetCard}>
                <span className={styles.border}></span>
                <span className={styles.widgetTitle}>{<FaGithubSquare />} Heatmap</span>
                <div className={styles.heatmapContainer}>
                    <EchopointImg src={`${ECHOPOINT}/svg/calendar?user=ujjwalvivek&bg=none&borderWidth=0&responsive=1&tight=1&cellRx=1&zeroColor=131313${dominantColor ? `&level0=${accent1}&level1=${accent2}&level2=${accent3}&level3=${accent4}&level4=${accent5}&textColor=${dominantColor.replace(/^#/, '')}` : ''}`} alt="GitHub Contributions Calendar" className={styles.calendarImg} fallbackHeight={96} />
                </div>
                <div className={styles.locationFooter}>
                    <span style={{ flex: '1' }}>Commits</span>
                    <span style={{ transform: 'translateY(1.5px)', color: 'var(--dynamic-dominant-color)', marginRight: '0.2rem' }}><IoGitCommitSharp size={14} /></span>
                    <span>{totalContributions}</span>
                </div>
            </div>

            <div className={styles.widgetCard}>
                <span className={styles.border}></span>
                <span className={styles.widgetTitle}>{<MdLocationPin />} Where am i</span>
                <div className={styles.mapContainer}>
                    <GenericCachedImg
                        src={darkMode ? CARTO_TILE_DARK : CARTO_TILE_LIGHT}
                        alt="Bengaluru map"
                        className={styles.mapImg}
                        width="100%"
                    />
                    <span className={styles.mapLabel}>BENGALURU</span>
                </div>
                <div className={styles.locationFooter}>
                    <span style={{ flex: '1' }}>BLR-IN</span>
                    <span style={{ transform: 'translateY(1.5px)', color: 'var(--dynamic-dominant-color)', marginRight: '0.2rem' }}>{icon}</span>
                    <span>{istTime}</span>
                </div>
            </div>

            <div className={styles.widgetCard}>
                <span className={styles.border}></span>
                <span className={styles.widgetTitle}>{<PiCalendarDotsFill />} Let's Talk</span>
                <div className={`${styles.mapContainer} ${styles.calCard}`}>
                    <CalWidget />
                </div>
                <div className={styles.locationFooter}>
                    <span style={{ flex: '1' }}>cal.com</span>
                    <a className={styles.link} href="https://cal.com/ujjwalvivek/sayhi" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ transform: 'translateY(1.5px)', color: 'var(--dynamic-dominant-color)', marginRight: '0.2rem' }}><MdOutlineLink size={14} /></span>
                        <span>ujjwalvivek</span>
                    </a>
                </div>
            </div>

            <div className={styles.widgetCard}>
                <span className={styles.border}></span>
                <span className={styles.widgetTitle}>{<TbClick size={14} />} Clicker</span>
                <div className={`${styles.clickerContainer} ${btnPressed ? styles.pressed : ''}`}>
                    <button
                        className={styles.cta}
                        onMouseDown={() => setBtnPressed(true)}
                        onMouseUp={() => setBtnPressed(false)}
                        onMouseLeave={() => setBtnPressed(false)}
                        onClick={handleClick}
                    >
                        <span className={styles.clickerCount}>{clickGlobal.toLocaleString()}</span>
                        <span className={styles.clickText}>CLICK ME</span>
                        <span className={styles.clickerPersonal}>you've clicked {clickPersonal} time{clickPersonal !== 1 ? 's' : ''}</span>
                    </button>
                </div>
                <div className={styles.locationFooter}>
                    <span style={{ flex: '1' }}>serverless</span>
                    <a className={styles.link} href="https://echopoint.ujjwalvivek.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ transform: 'translateY(1.5px)', color: 'var(--dynamic-dominant-color)', marginRight: '0.2rem' }}><MdOutlineLink size={14} /></span>
                        <span>echopoint</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Widgets;