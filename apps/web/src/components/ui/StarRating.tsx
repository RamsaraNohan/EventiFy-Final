import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number | null | undefined;
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, count, size = 'md' }: StarRatingProps) {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 22;
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
  
  if (rating === null || rating === undefined || count === 0) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${textSize}`}>
        <div className="flex text-slate-300">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={iconSize} className="text-slate-200 fill-slate-200" />
          ))}
        </div>
        <span>No reviews yet</span>
      </div>
    );
  }

  const numRating = Number(rating);
  const fullStars = Math.floor(numRating);
  const decimalPart = numRating % 1;
  const hasHalfStar = decimalPart >= 0.25 && decimalPart < 0.75;
  const emptyStarsCount = 5 - fullStars - (hasHalfStar ? 1 : (decimalPart >= 0.75 ? 0 : 0));
  
  // Adjust if decimal >= 0.75 it rounds up to a full star visually for the loop
  const displayFullStars = decimalPart >= 0.75 ? fullStars + 1 : fullStars;
  const displayEmptyStars = 5 - displayFullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${textSize}`}>
      <div className="flex text-amber-500">
        {[...Array(displayFullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={iconSize} className="fill-amber-500" />
        ))}
        
        {hasHalfStar && (
          <div className="relative" style={{ width: iconSize, height: iconSize }}>
            <Star size={iconSize} className="absolute text-amber-500 fill-amber-500" style={{ clipPath: 'inset(0 50% 0 0)' }} />
            <Star size={iconSize} className="absolute text-slate-200 fill-slate-200" style={{ clipPath: 'inset(0 0 0 50%)' }} />
          </div>
        )}
        
        {[...Array(displayEmptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={iconSize} className="text-slate-200 fill-slate-200" />
        ))}
      </div>
      
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-slate-900">{numRating.toFixed(1)}</span>
        <span className="text-slate-500 font-normal">({count} {count === 1 ? 'review' : 'reviews'})</span>
      </div>
    </div>
  );
}
