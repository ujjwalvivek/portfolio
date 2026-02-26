import { useBackground } from '../../Background/BackgroundContext';
import React, { useContext } from 'react';
import styles from './IntroText.module.css';
import { IoIosGitBranch } from "react-icons/io";
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';

const BIRTH_DATE = new Date('1997-09-21T00:00:00Z');

function computeAge(birthDate, now = new Date()) {
  // compute Y/M/D/H/M/S components
  let y = now.getFullYear() - birthDate.getFullYear();
  let m = now.getMonth() - birthDate.getMonth();
  let d = now.getDate() - birthDate.getDate();
  let hh = now.getHours() - birthDate.getHours();
  let mm = now.getMinutes() - birthDate.getMinutes();
  let ss = now.getSeconds() - birthDate.getSeconds();

  if (ss < 0) { ss += 60; mm -= 1; }
  if (mm < 0) { mm += 60; hh -= 1; }
  if (hh < 0) { hh += 24; d -= 1; }
  if (d < 0) {
    // borrow days from previous month
    const prev = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    d += prev.getDate();
    m -= 1;
  }
  if (m < 0) { m += 12; y -= 1; }

  const daysInYear = 365.2425;
  const totalMs = now - birthDate;
  const decimalYears = totalMs / (1000 * 60 * 60 * 24 * daysInYear);

  return {
    years: y,
    months: m,
    days: d,
    decimalYears,
  };
}

function AgeVersion({ birthDate = BIRTH_DATE }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const { years, months, days } = computeAge(birthDate, now);
  const mm = String(months).padStart(2, "0");
  const dd = String(days).padStart(2, "0");
  const title = `${years}y ${months}m ${days}d`;
  return (
    <span className={styles.version} title={title} aria-label={`age: ${title}`}>
      {`v${years}.${mm}.${dd}`}
    </span>
  );
}

const InteractiveIntroText = () => {
  const { darkMode } = useContext(ThemeContext);
  const { backgroundConfig } = useBackground();

  const [dominantColor, setDominantColor] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.documentElement;
      const hex = getComputedStyle(el).getPropertyValue('--dynamic-dominant-color')?.trim();
      const rgb = getComputedStyle(el).getPropertyValue('--dynamic-dominant-color-rgb')?.trim();
      const newValue = hex || (rgb ? rgb : '');
      setDominantColor(newValue);
    }, 0);
    return () => clearTimeout(timer);
  }, [backgroundConfig, darkMode]);

  const generateShades = (baseColor, count) => {
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

    const rgb = parseToRgb(baseColor);
    const [hue, saturation] = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const shades = [];
    for (let i = 1; i <= count; i++) {
      const lightness = 20 + ((i - 1) / (count - 1)) * 60;
      shades.push(`hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`);
    }
    return shades;
  };

  const shades = React.useMemo(() => generateShades(dominantColor, 11), [dominantColor]);
  const [useSpanize] = React.useState(() => backgroundConfig.type !== 'none');
  const [isCompactStarship, setIsCompactStarship] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setIsCompactStarship(media.matches);
    update();

    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const renderGlow = (text, { delay = 0.08 } = {}) => {
    if (!useSpanize) return text;

    if (typeof text === 'string') {
      const parts = text.split(/( +)/);
      return parts.map((part, i) => {
        if (part === '' || /^ +$/.test(part)) {
          return part;
        }
        const style = {
          animationDelay: `${(i * delay).toFixed(2)}s`,
          display: 'inline-block'
        };
        return (
          <span key={`w-${i}`} className={styles.letter} style={style}>
            {part}
          </span>
        );
      });
    }
    return (
      <span className={styles.shimmerText}>
        {text}
      </span>
    );
  };

  const StarshipPrompt = () => {
    const pathText = `../dreams`;
    const segments = [
      {
        key: 'logo',
        content: (
          <span className={styles.colorGroup}>
            <span className={styles.color1} style={{ backgroundColor: shades[1] }}></span>
            <span className={styles.color2} style={{ backgroundColor: shades[2] }}></span>
            <span className={styles.color3} style={{ backgroundColor: shades[3] }}></span>
            <span className={styles.colorLogo} style={{ backgroundColor: shades[4] }}>UV</span>
          </span>
        ),
        color: shades[4]
      },
      {
        key: 'path',
        content: (<span className={styles.path}>{pathText}</span>),
        color: shades[6]
      },
      {
        key: 'git',
        content: (
          <span className={styles.gitBranch}><IoIosGitBranch />{` giting(gud)`}</span>
        ),
        color: shades[8]
      },
      {
        key: 'ver',
        content: (
          <span className={styles.version}>{<AgeVersion birthDate={BIRTH_DATE} />}</span>
        ),
        color: shades[10]
      }
    ];
    const visibleSegments = isCompactStarship
      ? segments.filter((seg) => seg.key === 'logo' || seg.key === 'git')
      : segments;
    return (
      <span className={styles.starship} aria-hidden="true" style={{ overflow: 'visible' }}>
        {visibleSegments.map((seg, idx) => {
          const segZ = 100 - idx;
          return (
            <span
              key={seg.key}
              className={styles.segment}
              style={{ '--seg-color': seg.color ?? 'transparent', '--seg-z': segZ }}
            >
              <span className={styles.segmentText}>{seg.content}</span>
            </span>
          );
        })}
      </span>
    );
  };

  const commands = [
    <span><span className={styles.command}>{`whoami`}</span><span className={styles.commandParam}>{` --verbose`}</span></span>
  ];

  return (
    <>
      <div className={styles.terminalContainer}>
        <div className={styles.commandBlock}>
          <StarshipPrompt />{commands[0]}
          <div className={styles.output}>
            <div className={styles.outputLine}>{renderGlow("Hi, I'm Vivek.")}</div>
            <div className={styles.outputLine}>{renderGlow("Based out of Bengaluru, India")}</div>
            <div className={styles.outputLine}>{renderGlow("Currently building a high-performance graphics engine in Rust.")}</div>
            <div className={styles.outputLine}>{renderGlow(" ")}</div>
            <div className={styles.outputLine}>{renderGlow("My title says Technical Product Manager, but my commit history says Systems Engineer.")}</div>
            <div className={styles.outputLine}>{renderGlow("I’ve been programming for over a decade. I don't just manage roadmaps; I validate architecture.")}</div>
            <div className={styles.outputLine}>{renderGlow("I've been bridging the gap between \"Business Requirements\" and \"Technical Constraints\" for 3+ years.")}</div>
            <div className={styles.outputLine}>{renderGlow(" ")}</div>
            <div className={styles.outputLine}>{renderGlow("Welcome to my corner where I build performant systems and break them just to see how they work.")}</div>
            <div className={styles.outputLine}>{renderGlow(" ")}</div>
            <div className={styles.outputLine}>{renderGlow("^C")}</div>
            <div className={styles.outputLine}>{renderGlow("Before you move on, do check out my recent logs below.")}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default InteractiveIntroText;