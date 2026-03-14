import { useBackground } from '../../Background/BackgroundContext';
import React, { useContext } from 'react';
import styles from './IntroText.module.css';
import { IoIosGitBranch } from "react-icons/io";
import { ThemeContext } from '../../Utils/ThemeSwitcher/ThemeContext';
import trooperStyles from './Stormtrooper.module.css';


const BIRTH_DATE = new Date('1997-09-21T00:00:00Z');

function computeAge(birthDate, now = new Date()) {
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
    //? borrow days from previous month
    const prev = new Date(now.getFullYear(), now.getMonth(), 0); //? last day of prev month
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

function UptimeCounter({ startDate }) {
  const [uptime, setUptime] = React.useState("");

  React.useEffect(() => {
    function update() {
      const now = new Date();
      const diff = now - startDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setUptime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return <span>{uptime}</span>;
}

const InteractiveIntroText = () => {
  const { darkMode } = useContext(ThemeContext);
  const { backgroundConfig } = useBackground();
  const noAnim = backgroundConfig.type !== 'none' ? '' : styles.noanimated || trooperStyles.noanimated;

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
  const flicker = backgroundConfig.type !== 'none' ? styles.flicker : '';
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
        content: (<span className={styles.path}>{`../dreams`}</span>),
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
    <span><span className={styles.command}>{`boot`}</span><span className={styles.commandParam}>{` --system`}</span></span>,
    <span><span className={styles.command}>{`tail`}</span> <span className={styles.commandParam}>{`--lines 4 /var/syslog`}</span></span>,
    <span><span className={styles.command}>{`summarize`}</span> <span className={styles.commandParam}>{`--experience`}</span></span>,
    <span><span className={styles.command}>{`lsd`}</span> <span className={styles.commandParam}>{`--skills /var/random`}</span></span>,
    <span><span className={styles.command}>{`cat`}</span> <span className={styles.commandParam}>{`--whats-next --exit`}</span></span>,
  ];

  return (
    <>
      <div className={`${trooperStyles.stormtrooperContainer} ${noAnim}`} title='Codepen by Yusuf Bakir'>
        <div className={trooperStyles.soldier}></div>
        <div className={`${trooperStyles.soldier} ${trooperStyles.mini}`}></div>
      </div>
      <div className={styles.terminalContainer}>
        <span className={styles.border}></span>
        <div className={styles.commandBlock}>
          <StarshipPrompt />{commands[0]}
          <div className={styles.output}>
            <div className={styles.outputLine}>
              {renderGlow("core.modules ")}
              <span className={`${styles.statusOk} ${flicker} ${styles.refBadge}`}>{renderGlow("active", { delay: 0.02 })}</span>
            </div>
            <div className={styles.outputLine}>
              {renderGlow("logs.pipeline ")}
              <span className={`${styles.statusOk} ${flicker} ${styles.refBadge}`}>{renderGlow("operational", { delay: 0.02 })}</span>
            </div>
            <div className={styles.outputLine}>
              {renderGlow("memory.usage ")}
              <span className={`${styles.statusRam} ${flicker} ${styles.refBadge}`}>{renderGlow("high", { delay: 0.02 })}</span>
            </div>
            <div className={styles.outputLine}>
              <span className={`${styles.statusRam} ${styles.refBadge}`}>{renderGlow("2%_reserved_for_physics_simulations", { delay: 0.02 })}</span>
            </div>
            <div className={styles.outputLine}>
              {renderGlow("uptime ")}
              <span className={`${styles.statusInfo} ${styles.refBadge}`}>{renderGlow(<UptimeCounter startDate={new Date('2023-02-04T00:00:00Z')} />, { delay: 0.02 })}</span>
            </div>
          </div>
        </div>

        <div className={styles.commandBlock}>
          <StarshipPrompt />{commands[2]}
          <div className={styles.output}>
            <div className={styles.outputLine}><span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} style={{ marginLeft: '0' }}>{renderGlow("TPM", { delay: 0.02 })}</span>{renderGlow("speaks fluent Engineer")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`}>{renderGlow("(and Translate-to-Executive)", { delay: 0.02 })}</span></div>
            <div className={styles.outputLine}>
              {renderGlow("built")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`}>{renderGlow("VR training sims", { delay: 0.02 })}</span>{renderGlow("for like a lot of people!")}
              <a
                className={`${styles.refBadge} ${styles.statusWarn} ${styles.statusBold}`}
                href="https://www.autovrse.com/case-study-ultratech"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.refBadgeText}>{renderGlow("(65k+ users)", { delay: 0.02 })}</span>
              </a>
            </div>
            <div className={styles.outputLine}>
              {renderGlow("can understand")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("chromium source", { delay: 0.02 })}</span>{renderGlow("without crying")}
            </div>
            <div className={styles.outputLine}>
              {renderGlow("currently writing a")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("cross-platform game-engine", { delay: 0.02 })}</span>{renderGlow("in")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} style={{ marginRight: '0' }} >{renderGlow("Rust and WASM", { delay: 0.02 })}</span>
            </div>
          </div>
        </div>

        <div className={styles.commandBlock}>
          <StarshipPrompt />{commands[3]}
          <div className={styles.output}>
            <div className={styles.outputLine}>{renderGlow("i've")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("segfaulted", { delay: 0.02 })}</span>{renderGlow("a browser tab before (for science).")}</div>
            <div className={styles.outputLine}>{renderGlow("avid enjoyer of ")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("Infra as Code", { delay: 0.02 })}</span>{renderGlow("(Docker/Tailscale).")}</div>
            <div className={styles.outputLine}>{renderGlow("allocates")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("0% CPU", { delay: 0.02 })}</span>{renderGlow("to office politics.")}</div>
            <div className={styles.outputLine}>{renderGlow("still believe if the ")}<span className={`${styles.refBadgeText} ${styles.statusWarn} ${styles.statusBold}`} >{renderGlow("meeting=state_machine,", { delay: 0.02 })}</span>{renderGlow("let it.")}</div>
          </div>
        </div>

        <div className={styles.commandBlock}>
          <StarshipPrompt />{commands[4]}
          <div className={styles.output}>
            <div className={styles.outputLine}>{renderGlow("feel free to check out some of my projects below")}</div>
            <div className={styles.outputLine}>{renderGlow("could also navigate back to check out my blogs")}</div>
          </div>
        </div>

      </div >
    </>
  );
}

export default InteractiveIntroText;