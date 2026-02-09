import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "../../Pages/Projects/Projects.module.css";

function PortalTooltip({ show, mousePos, children }) {
  if (!show || !mousePos) return null;

  // Tooltip width estimate (px)
  const tooltipWidth = 250;
  const padding = 12;
  let left = mousePos.x;
  const isMobile = window.innerWidth <= 800;

  if (isMobile) {
    // Clamp to screen edge on mobile
    const min = padding + tooltipWidth / 2 + 44;
    const max = window.innerWidth - padding - tooltipWidth / 2;
    left = Math.max(min, Math.min(mousePos.x, max));
  } else {
    // Desktop: use previous logic
    const maxLeft = window.innerWidth - tooltipWidth / 2 - padding - 72;
    const minLeft = tooltipWidth / 2 + padding + 46;
    left = Math.max(minLeft, Math.min(mousePos.x, maxLeft));
  }

  return createPortal(
    <div
      className={styles.portalTooltip}
      style={{ top: mousePos.y + 12, left: left, transform: "translateX(-50%)" }}
    >
      {children}
    </div>,
    document.body
  );
}

export function TagCell({ tags }) {
  const [show, setShow] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const ref = useRef();
  const visibleTags = tags.slice(0, 2);
  const hiddenTags = tags.slice(2);

  const handleMouseMove = e => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <span
      className={styles.tagContainer}
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={handleMouseMove}
      style={{ cursor: hiddenTags.length ? "help" : "default" }}
    >
      {visibleTags.map((tag, i) => (
        <span className={styles.tag} key={i}>{tag}</span>
      ))}
      {hiddenTags.length > 0 && (
        <span className={styles.tag} style={{ opacity: 0.7 }}>+{hiddenTags.length}</span>
      )}
      <PortalTooltip show={show && hiddenTags.length > 0} mousePos={mousePos}>
        {hiddenTags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", flexDirection: "row" }}>
            {hiddenTags.map((tag, i) => (
              <span className={styles.tag} key={i}>{tag}</span>
            ))}
          </div>
        ) : null}
      </PortalTooltip>
    </span>
  );
}