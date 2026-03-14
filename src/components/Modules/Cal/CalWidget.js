import { useState, useMemo } from 'react';
import styles from './CalWidget.module.css';
import { IoBackspaceSharp } from "react-icons/io5";
import { MdOpenInNew } from "react-icons/md";

const CAL_LINK = 'https://cal.com/ujjwalvivek/sayhi';
//? Canonical times stored as UTC. 11:00 IST = 05:30 UTC, 15:00 IST = 09:30 UTC.
//? Labels are computed at runtime in the visitor's local timezone.
const SLOTS = [
  { utcH: 5, utcM: 30, durMin: 30 },
  { utcH: 9, utcM: 30, durMin: 30 },
];
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

//? Build a Date at slot UTC time on the user's selected calendar day
function slotDate(selDay, utcH, utcM) {
  return new Date(Date.UTC(
    selDay.getFullYear(), selDay.getMonth(), selDay.getDate(),
    utcH, utcM, 0
  ));
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function tzAbbr() {
  return Intl.DateTimeFormat([], { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(p => p.type === 'timeZoneName')?.value ?? '';
}

function utcStr(utcH, utcM) {
  return `${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}`;
}

export default function CalWidget() {
  const [selected, setSelected] = useState(null);
  const now = new Date();

  const days = useMemo(() => {
    const result = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (result.length < 9) {
      if (cursor.getDay() !== 0) result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const sel = selected !== null ? days[selected] : null;
  const tz = useMemo(() => tzAbbr(), []);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {days.map((d, i) => (
          <button
            key={i}
            className={`${styles.cell} ${d.getTime() === today ? styles.today : ''} ${selected === i ? styles.active : ''}`}
            onClick={() => setSelected(i)}
          >
            <span className={styles.cellDay}>{DAY_ABBR[d.getDay()]}</span>
            <span className={styles.cellNum}>{d.getDate()}</span>
          </button>
        ))}
      </div>

      <div className={`${styles.overlay} ${selected !== null ? styles.open : ''}`}>
        {sel && (
          <>
            <button className={styles.back} onClick={() => setSelected(null)} aria-label="Back"><IoBackspaceSharp /></button>
            <div className={styles.overlayDate}>
              {DAY_ABBR[sel.getDay()]}, {MONTH_ABBR[sel.getMonth()]} {sel.getDate()}
            </div>
            <div className={styles.tzHint}>{tz}</div>
            <div className={styles.slots}>
              {SLOTS.map((s, i) => {
                const start = slotDate(sel, s.utcH, s.utcM);
                const end = new Date(start.getTime() + s.durMin * 60_000);
                const label = `${fmtTime(start)} – ${fmtTime(end)}`;
                const past = start <= now;
                return past ? (
                  <span
                    key={i}
                    className={`${styles.slot} ${styles.slotPast}`}
                    aria-disabled="true"
                  >
                    {label}
                  </span>
                ) : (
                  <a
                    key={i}
                    className={styles.slot}
                    href={`${CAL_LINK}?date=${fmtDate(sel)}&slot=${fmtDate(sel)}T${utcStr(s.utcH, s.utcM)}:00.000Z`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
            <a
              className={styles.calLink}
              href={`${CAL_LINK}?date=${fmtDate(sel)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book on cal.com {<MdOpenInNew style={{ verticalAlign: 'middle' }} />}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
