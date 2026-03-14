import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

const svgCache = new Map();

const VOLATILE_PARAMS = [
    'textColor', 'accentColor', 'lineColor', 'border',
    'level0', 'level1', 'level2', 'level3', 'level4',
    'zeroColor', 'color1', 'color2', 'color3', 'color4', 'color5',
];

function normalizeUrl(url) {
    try {
        const u = new URL(url);
        VOLATILE_PARAMS.forEach(p => u.searchParams.delete(p));
        return u.toString();
    } catch {
        return url;
    }
}

function svgToDataUri(svgText) {
    const clean = DOMPurify.sanitize(svgText, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['style', 'mask', 'clipPath', 'defs', 'use'],
        ADD_ATTR: ['viewBox', 'fill', 'stroke', 'xmlns', 'preserveAspectRatio'],
    });
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clean)))}`;
}

export default function EchopointImg({
    src,
    alt,
    fallbackHeight = 20,
    className,
    width,
    style,
    ...rest
}) {
    const cacheKey = normalizeUrl(src);
    const cached = svgCache.get(cacheKey);

    const [dataUri, setDataUri] = useState(cached || null);
    const [loading, setLoading] = useState(!cached);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        //? If we have a cached version, show it immediately
        if (cached && !dataUri) {
            setDataUri(cached);
            setLoading(false);
        }

        //? Always fetch the actual URL (stale-while-revalidate)
        const controller = new AbortController();

        fetch(src, { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error('SVG fetch failed');
                return res.text();
            })
            .then(svgText => {
                if (!mountedRef.current) return;
                const uri = svgToDataUri(svgText);
                svgCache.set(cacheKey, uri);
                setDataUri(uri);
                setLoading(false);
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                //? On error, keep showing cached version if available
                if (!mountedRef.current) return;
                setLoading(false);
            });

        return () => controller.abort();
    }, [src, cacheKey, cached, dataUri]);

    if (loading && !dataUri) {
        return (
            <span
                className={className}
                style={{
                    display: 'inline-block',
                    width: width || '100%',
                    height: fallbackHeight,
                    background: 'rgba(var(--dynamic-dominant-color-rgb, 128,128,128), 0.1)',
                    borderRadius: 2,
                    ...style,
                }}
                aria-label={alt}
                role="img"
                {...rest}
            />
        );
    }

    return (
        <img
            src={dataUri}
            alt={alt}
            className={className}
            width={width}
            style={style}
            {...rest}
        />
    );
}
