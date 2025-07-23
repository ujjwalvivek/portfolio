import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import styles from './Mermaid.module.css';
import { ThemeContext } from '../ThemeSwitcher/ThemeContext';

const Mermaid = ({ chart }) => {
    const ref = useRef(null);
    const [mermaid, setMermaid] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const { darkMode } = useContext(ThemeContext);
    
    // Stable instance ID that doesn't change on re-renders
    const instanceIdRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
    const renderCountRef = useRef(0);

    useEffect(() => {
        setIsClient(typeof window !== 'undefined');
    }, []);

    // Initialize Mermaid ONLY when client loads or theme changes
    useEffect(() => {
        if (isClient) {
            import('mermaid').then((mermaidModule) => {
                const mermaidInstance = mermaidModule.default;
                
                mermaidInstance.initialize({
                    startOnLoad: false,
                    theme: darkMode ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '16px',
                    flowchart: {
                        curve: 'basis',
                        padding: 20,
                    },
                    sequence: {
                        diagramMarginX: 50,
                        diagramMarginY: 10,
                        actorMargin: 50,
                        width: 150,
                        height: 65,
                        boxMargin: 10,
                        boxTextMargin: 5,
                        noteMargin: 10,
                        messageMargin: 35,
                        mirrorActors: true,
                    },
                });
                
                setMermaid(mermaidInstance);
            });
        }
    }, [isClient, darkMode]); // Only these dependencies

    // Memoized render function to prevent recreation on every render
    const renderDiagram = useCallback(async () => {
        if (!mermaid || !ref.current || !chart) return;
        
        try {
            // Increment render count for unique ID
            renderCountRef.current += 1;
            const diagramId = `${instanceIdRef.current}-${renderCountRef.current}`;
            
            // Clear and render
            ref.current.innerHTML = '';
            const { svg } = await mermaid.render(diagramId, chart.trim());
            
            if (ref.current) {
                ref.current.innerHTML = svg;
                
                // Simple post-render styling
                const svgElement = ref.current.querySelector('svg');
                if (svgElement) {
                    svgElement.style.maxWidth = '100%';
                    svgElement.style.height = 'auto';
                    svgElement.style.display = 'block';
                    svgElement.style.margin = '0 auto';
                }
            }
        } catch (err) {
            console.error('Mermaid render error:', err);
            if (ref.current) {
                ref.current.innerHTML = `<div class="${styles.error}"><strong>Mermaid Error:</strong><br/>${err.message}</div>`;
            }
        }
    }, [mermaid, chart]); // Only these dependencies

    // Render diagram when mermaid or chart changes
    useEffect(() => {
        renderDiagram();
    }, [renderDiagram]);

    if (!isClient) return null;

    return <div ref={ref} className={styles.mermaid} />;
};

export default Mermaid;
