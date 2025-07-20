import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "../Projects.module.css";

function PortalTooltip({ show, mousePos, children, parentRef }) {
  if (!show || !mousePos) return null;

  // Tooltip width estimate (px)
  const tooltipWidth = 250;
  const padding = 16;
  let left = mousePos.x;
  const isMobile = window.innerWidth <= 800;

  if (isMobile) {
    // Clamp to screen edge on mobile
    const min = padding + tooltipWidth / 2 + 44; // 48px for scrollbar and padding
    const max = window.innerWidth - padding - tooltipWidth / 2;
    left = Math.max(min, Math.min(mousePos.x, max));
  } else if (parentRef && parentRef.current) {
    const rect = parentRef.current.getBoundingClientRect();
    // Clamp so tooltip never visually overflows parent
    const min = rect.left + padding + tooltipWidth / 2;
    const max = rect.right - padding - tooltipWidth / 2;
    left = Math.max(min, Math.min(mousePos.x, max));
  } else {
    // fallback to window bounds
    const min = padding + tooltipWidth / 2;
    const max = window.innerWidth - padding - tooltipWidth / 2;
    left = Math.max(min, Math.min(mousePos.x, max));
  }

  return createPortal(
    <div
      className={styles.portalTooltip}
      style={{
        top: mousePos.y + 12, // 12px below cursor
        left: left,
        transform: "translateX(-50%)"
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function DescriptionCell({ description, children }) {
  const [show, setShow] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const ref = useRef();
  // Find the closest bounding ancestor (table for desktop, card for mobile)
  const boundsRef = useRef();

  React.useEffect(() => {
    if (ref.current) {
      let node = ref.current;
      // Look for table or card container
      while (node && node.tagName !== 'TABLE' && !(node.classList && node.classList.contains('projectCard'))) {
        node = node.parentElement;
      }
      boundsRef.current = node;
    }
  }, []);

  const handleMouseEnter = () => setShow(true);
  const handleMouseLeave = () => setShow(false);
  const handleMouseMove = e => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <span
      className={styles.descTooltip}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <span className={styles.descHoverText}>{children}</span>
      <PortalTooltip show={show} mousePos={mousePos} parentRef={boundsRef}>
        {Array.isArray(description)
          ? description.map((line, i) => <div key={i}>{line}</div>)
          : description}
      </PortalTooltip>
    </span>
  );
}