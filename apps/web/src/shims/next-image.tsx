import React from 'react';

export default function Image({ src, alt, width, height, className, fill, style, ...props }: any) {
  if (fill) {
    return (
      <img
        src={src?.src || src}
        alt={alt}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, color: 'transparent', ...style }}
        {...props}
      />
    );
  }

  return (
    <img
      src={src?.src || src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ color: 'transparent', ...style }}
      {...props}
    />
  );
}
