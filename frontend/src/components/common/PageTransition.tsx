import React, { useEffect, useState } from 'react';

export type TransitionDirection = 'top-right' | 'top-left' | 'fade' | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  direction?: TransitionDirection;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  direction = 'fade',
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  let animationClass = '';
  if (direction === 'top-right') {
    animationClass = 'animate-iris-top-right';
  } else if (direction === 'top-left') {
    animationClass = 'animate-iris-top-left';
  } else if (direction === 'fade') {
    animationClass = `transition-all duration-300 ease-out transform ${
      isMounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-[0.995]'
    }`;
  }

  return (
    <div className={`w-full min-h-screen overflow-hidden ${animationClass} ${className}`}>
      {children}
    </div>
  );
};
