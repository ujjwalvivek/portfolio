import { useEffect, useState, useRef } from 'react';

const imageCache = new Map();

function imageToDataUri(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL();
}


export default function GenericCachedImg({
  src,
  alt,
  fallbackHeight = 96,
  className,
  width,
  style,
  ...props
}) {
  const cached = imageCache.get(src);
  const [dataUri, setDataUri] = useState(cached || null);
  const [loading, setLoading] = useState(!cached);
  const mountedRef = useRef(true);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    //? If src changes, clear the cache for the previous src
    if (prevSrcRef.current !== src) {
      imageCache.delete(prevSrcRef.current);
      prevSrcRef.current = src;
    }

    //? Show cached version immediately
    if (cached && !dataUri) {
      setDataUri(cached);
      setLoading(false);
    }

    if (imageCache.has(src)) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (!mountedRef.current) return;
      try {
        const uri = imageToDataUri(img);
        imageCache.set(src, uri);
        setDataUri(uri);
        setLoading(false);
      } catch (err) {
        setDataUri(src);
        setLoading(false);
      }
    };

    img.onerror = () => {
      if (!mountedRef.current) return;
      setDataUri(src);
      setLoading(false);
    };

    img.src = src;
  }, [src, cached, dataUri]);

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
        {...props}
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
      {...props}
    />
  );
}