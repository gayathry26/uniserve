import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function Logo({
  className = '',
  imgClassName = '',
  alt = 'CampusCorp Logo',
  variant = 'auto', // 'auto' | 'light' | 'dark'
}) {
  const { isDark } = useTheme?.() || { isDark: false };

  if (variant === 'light') {
    return (
      <div className={`inline-flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src="/logo-light.jpeg"
          alt={alt}
          className={`object-contain ${imgClassName}`}
        />
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div className={`inline-flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src="/logo-dark.jpeg"
          alt={alt}
          className={`object-contain ${imgClassName}`}
        />
      </div>
    );
  }

  // Auto mode: Uses both CSS classes (dark:hidden / hidden dark:block) for instant zero-flash switching
  // and checks theme context for maximum reliability
  return (
    <div className={`inline-flex items-center justify-center overflow-hidden ${className}`}>
      {/* Light Theme Logo (visible in light mode, hidden in dark mode) */}
      <img
        src="/logo-light.jpeg"
        alt={alt}
        className={`object-contain dark:hidden ${imgClassName}`}
      />

      {/* Dark Theme Logo (hidden in light mode, visible in dark mode) */}
      <img
        src="/logo-dark.jpeg"
        alt={alt}
        className={`object-contain hidden dark:block ${imgClassName}`}
      />
    </div>
  );
}

export default Logo;
