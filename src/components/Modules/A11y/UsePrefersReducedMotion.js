/**
 * ██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗███████╗  
 * ██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝██╔════╝  
 * ██████╔╝█████╗  ██║  ██║██║   ██║██║     █████╗    
 * ██╔══██╗██╔══╝  ██║  ██║██║   ██║██║     ██╔══╝    
 * ██║  ██║███████╗██████╔╝╚██████╔╝╚██████╗███████╗  
 * ╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝  ╚═════╝╚══════╝  
 *                                                    
 * ███╗   ███╗ ██████╗ ████████╗██╗ ██████╗ ███╗   ██╗
 * ████╗ ████║██╔═══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
 * ██╔████╔██║██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║
 * ██║╚██╔╝██║██║   ██║   ██║   ██║██║   ██║██║╚██╗██║
 * ██║ ╚═╝ ██║╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║
 * ╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
 * 
 *
 * Browser APIs: window.matchMedia('(prefers-reduced-motion: reduce)')
 *
 * Usage
 *   import { usePrefersReducedMotion } from './A11y/UsePrefersReducedMotion';
 *   const prefersReduced = usePrefersReducedMotion();
 *
 * Notes
 *   - Returns a boolean (false by default until the media query is evaluated).
 *   - The hook subscribes to changes and cleans up the listener on unmount.
 *   - Consider using this value to disable or shorten animations/transitions.
 */

import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  // Local state holds the preference: true === user prefers reduced motion.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Create the media query list for the reduced-motion preference.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Initialize state from the current match value.
    setPrefersReducedMotion(mq.matches);

    // Handler updates state when the media query's evaluated value changes.
    const handler = () => setPrefersReducedMotion(mq.matches);

    // Subscribe to changes. Modern browsers support 'change' via addEventListener.
    // Note: older browsers use mq.addListener / mq.removeListener
    mq.addEventListener('change', handler);

    // Cleanup: remove the event listener on unmount.
    return () => mq.removeEventListener('change', handler);
  }, []); // Empty dependency array — only run on mount/unmount.

  // Return the current preference boolean.
  return prefersReducedMotion;
}

/**
 * ███████╗ ██████╗ ███████╗
 * ██╔════╝██╔═══██╗██╔════╝
 * █████╗  ██║   ██║█████╗  
 * ██╔══╝  ██║   ██║██╔══╝  
 * ███████╗╚██████╔╝██║     
 * ╚══════╝ ╚═════╝ ╚═╝     
 *                          
 */