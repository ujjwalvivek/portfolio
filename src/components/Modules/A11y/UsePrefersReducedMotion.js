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
 */

import { useEffect, useState } from 'react';

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    //? Create the media query list for the reduced-motion preference.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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