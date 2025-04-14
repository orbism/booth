// src/components/ui/OptimizedImage.tsx
import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 33vw"
}: OptimizedImageProps) {
  // Check if src is a data URL or relative path
  const isDataUrl = src.startsWith('data:');
  const isRelativePath = src.startsWith('/');
  
  // For data URLs or relative paths that might not be compatible with Next.js Image optimization
  if (isDataUrl || isRelativePath) {
    if (fill) {
      return (
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={`absolute inset-0 ${className || 'object-cover'}`}
          />
        </div>
      );
    }
    
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} width={width} height={height} />;
  }
  
  // Use Next.js Image for optimizable sources
  if (fill) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className={className || 'object-cover'}
          sizes={sizes}
        />
      </div>
    );
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 300}
      height={height || 200}
      className={className}
      sizes={sizes}
    />
  );
}