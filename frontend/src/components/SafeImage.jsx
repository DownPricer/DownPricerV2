import React, { useState } from 'react';
import { resolveImageUrl } from '../utils/images';

// Placeholder SVG encodé en base64 - image grise avec texte "Pas d'image"
const PLACEHOLDER_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGFzIGQnaW1hZ2U8L3RleHQ+PC9zdmc+";

export const SafeImage = ({ 
  src, 
  alt = "Image", 
  className = "",
  fallbackClassName = "",
  showPlaceholder = true,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Résoudre l'URL de l'image
  const resolvedUrl = resolveImageUrl(src);

  const handleError = () => {
    console.warn('Image failed to load:', src);
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Si pas d'URL valide ou erreur, afficher le placeholder
  if (!resolvedUrl || error) {
    if (!showPlaceholder) return null;
    
    return (
      <div 
        className={`flex items-center justify-center bg-slate-200 text-slate-500 text-xs ${className} ${fallbackClassName}`}
        style={{ minHeight: '60px' }}
        {...props}
      >
        <div className="flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Pas d'image</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: '60px' }}>
      {loading && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse ${className}`}
          {...props}
        />
      )}
      <img
        src={resolvedUrl}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        {...props}
      />
    </div>
  );
};

export default SafeImage;
