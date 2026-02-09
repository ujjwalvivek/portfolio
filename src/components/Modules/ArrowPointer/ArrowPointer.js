/**
 *  █████╗ ██████╗ ██████╗  ██████╗ ██╗    ██╗    ██████╗ 
 * ██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ╚════██╗
 * ███████║██████╔╝██████╔╝██║   ██║██║ █╗ ██║     █████╔╝
 * ██╔══██║██╔══██╗██╔══██╗██║   ██║██║███╗██║    ██╔═══╝ 
 * ██║  ██║██║  ██║██║  ██║╚██████╔╝╚███╔███╔╝    ███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝     ╚══════╝
 *                                                        
 * ████████╗ █████╗ ██████╗  ██████╗ ███████╗████████╗    
 * ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝    
 *    ██║   ███████║██████╔╝██║  ███╗█████╗     ██║       
 *    ██║   ██╔══██║██╔══██╗██║   ██║██╔══╝     ██║       
 *    ██║   ██║  ██║██║  ██║╚██████╔╝███████╗   ██║       
 *    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝       
 *                                                        
 */

import { useRef, useEffect, useState } from 'react';
import styles from './ArrowPointer.module.css';

const ArrowPointer = ({ targetRef, isActive = true }) => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef(undefined);

  /**================================
   *      Update mouse position
   *================================**/
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (isActive) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive]);

  /**========================================================================
   * Update target position when window resizes, target changes, or becomes active
   *========================================================================**/
  useEffect(() => {
    const updateTargetPosition = () => {
      if (targetRef.current && isActive) {
        const rect = targetRef.current.getBoundingClientRect();
        setTargetPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    if (isActive) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
    }

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
    };
  }, [targetRef, isActive]);

  /**============================================
   *               Drawing logic
   *=============================================**/
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d');

    /**============================================
     *   Set canvas size to full viewport
     *=============================================**/
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    /**============================================
     *   Get primary color from CSS variables
     *=============================================**/
    const getPrimaryColor = () => {
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColorRgb = rootStyles.getPropertyValue('--dynamic-hsl-average-rgb').trim();
      return primaryColorRgb || '131, 131, 131'; // fallback
    };

    const drawArrow = () => {
      /**======================
       *    Clear canvas
       *========================**/
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /**========================================================================
       *    Recalculate target position on each frame to ensure accuracy
       *========================================================================**/
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const buttonCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const dx = buttonCenter.x - mousePos.x;
        const dy = buttonCenter.y - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        /**============================================
         *  Calculate angle from mouse to button center
         *=============================================**/
        const angle = Math.atan2(dy, dx);

        /**========================================================================
         *    Calculate arrow end point at button edge (with some padding)
         *========================================================================**/
        const padding = 8; // Distance from button edge
        const buttonRadius = Math.max(rect.width, rect.height) / 2;
        const arrowEndX = buttonCenter.x - (buttonRadius + padding) * Math.cos(angle);
        const arrowEndY = buttonCenter.y - (buttonRadius + padding) * Math.sin(angle);

        const currentTargetPos = { x: arrowEndX, y: arrowEndY };

        /**========================================================================
         *   Calculate arrow opacity with smooth fade-out when very close
         *========================================================================**/
        const maxDistance = 400;
        const fadeStartDistance = 100; // Start fading when closer than this
        const minDistance = 30; // Completely fade out when closer than this

        let opacity;
        if (distance < minDistance) {
          opacity = 0; // Completely hidden
        } else if (distance < fadeStartDistance) {
          /**============================================
           *  Smooth fade between minDistance and fadeStartDistance
           *=============================================**/
          const fadeRange = fadeStartDistance - minDistance;
          const fadeProgress = (distance - minDistance) / fadeRange;
          opacity = Math.max(0.1, fadeProgress * 0.6); // Fade from 0.1 to 0.6
        } else {
          /**============================================
           *  Normal opacity calculation for farther distances
           *=============================================**/
          opacity = Math.min(1, Math.max(0.4, (maxDistance - distance) / maxDistance));
        }

        /**============================================
         *     Don't draw if completely transparent
         *=============================================**/
        if (opacity <= 0) return;

        /**============================================
         *    Control point for curved arrow
         *=============================================**/
        const midX = (mousePos.x + currentTargetPos.x) / 2;
        const midY = (mousePos.y + currentTargetPos.y) / 2;

        /**============================================
         *   Offset control point to create curve
         *=============================================**/
        const perpX = -dy / distance;
        const perpY = dx / distance;
        const curveStrength = Math.min(100, distance * 0.3);
        const controlX = midX + perpX * curveStrength;
        const controlY = midY + perpY * curveStrength;

        const primaryColorRgb = getPrimaryColor();

        /**======================
         *  Draw curved dashed line
         *========================**/
        ctx.strokeStyle = `rgba(${primaryColorRgb}, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);

        ctx.beginPath();
        ctx.moveTo(mousePos.x, mousePos.y);
        ctx.quadraticCurveTo(controlX, controlY, currentTargetPos.x, currentTargetPos.y);
        ctx.stroke();

        /**================================================================================================
         *   Calculate the tangent direction at the end of the curve for proper arrowhead alignment
         *   For a quadratic curve ending at target, the tangent direction is from control point to target
         *================================================================================================**/
        const tangentDx = currentTargetPos.x - controlX;
        const tangentDy = currentTargetPos.y - controlY;
        const tangentAngle = Math.atan2(tangentDy, tangentDx);

        /**============================================
         *  Draw arrowhead aligned with curve direction
         *=============================================**/
        const arrowSize = 12;

        ctx.fillStyle = `rgba(${primaryColorRgb}, ${opacity})`;
        ctx.setLineDash([]); // Reset dash

        ctx.beginPath();
        ctx.moveTo(currentTargetPos.x, currentTargetPos.y);
        ctx.lineTo(
          currentTargetPos.x - arrowSize * Math.cos(tangentAngle - Math.PI / 6),
          currentTargetPos.y - arrowSize * Math.sin(tangentAngle - Math.PI / 6)
        );
        ctx.lineTo(
          currentTargetPos.x - arrowSize * Math.cos(tangentAngle + Math.PI / 6),
          currentTargetPos.y - arrowSize * Math.sin(tangentAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        /**============================================
         *   Draw small circle at mouse position
         *=============================================**/
        ctx.fillStyle = `rgba(${primaryColorRgb}, ${opacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    /**============================================
     *               ANIMATION LOOP
     *=============================================**/
    const animate = () => {
      drawArrow();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, targetPos, isActive, targetRef]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.arrowCanvas}
    />
  );
};

export default ArrowPointer;

/**
 * ███████╗ ██████╗ ███████╗
 * ██╔════╝██╔═══██╗██╔════╝
 * █████╗  ██║   ██║█████╗  
 * ██╔══╝  ██║   ██║██╔══╝  
 * ███████╗╚██████╔╝██║     
 * ╚══════╝ ╚═════╝ ╚═╝     
 *                          
 */