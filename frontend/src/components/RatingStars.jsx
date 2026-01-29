import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 0, count = 0, showCount = true, size = 14, className = '' }) => {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const filledStars = Math.round(safeRating * 2) / 2;
  const fullStars = Math.floor(filledStars);
  const hasHalf = filledStars - fullStars >= 0.5;

  return (
    <div className={`flex items-center gap-1 text-zinc-300 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const isFull = index < fullStars;
          const isHalf = index === fullStars && hasHalf;
          return (
            <Star
              key={index}
              size={size}
              fill={(isFull || isHalf) ? 'currentColor' : 'none'}
              className={(isFull || isHalf) ? 'text-yellow-400' : 'text-zinc-600'}
              style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
            />
          );
        })}
      </div>
      <span className="text-sm text-zinc-400">
        {safeRating.toFixed(1)}
      </span>
      {showCount && (
        <span className="text-sm text-zinc-500">
          ({count || 0})
        </span>
      )}
    </div>
  );
};

