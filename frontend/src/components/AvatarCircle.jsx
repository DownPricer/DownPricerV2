import React from 'react';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const AvatarCircle = ({ src, name, size = 40, className = '' }) => {
  const initials = getInitials(name);
  return (
    <div
      className={`flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-semibold text-white overflow-hidden shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <span className="text-xs tracking-widest">{initials}</span>
      )}
    </div>
  );
};

