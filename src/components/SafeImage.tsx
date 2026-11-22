import { useEffect, useState } from 'react';
import { Factory } from 'lucide-react';
import { resolveAssetCandidates } from '../utils/assetUrl';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: SafeImageProps) {
  const candidates = resolveAssetCandidates(src);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [src]);

  if (candidateIndex >= candidates.length) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4 text-center ${className}`}
      >
        <Factory className="w-7 h-7 text-terracotta-600 mb-2 shrink-0" />
        <span className="text-xs font-semibold text-slate-700">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIndex]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setCandidateIndex((i) => i + 1)}
      className={className}
    />
  );
}
