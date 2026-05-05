import { useState, useEffect } from 'react';

interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

/**
 * Hook to detect viewport size and provide responsive breakpoints
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 */
export function useMobileView(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet:
      typeof window !== 'undefined'
        ? window.innerWidth >= 768 && window.innerWidth < 1024
        : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
    orientation:
      typeof window !== 'undefined' && window.innerWidth < window.innerHeight
        ? 'portrait'
        : 'landscape',
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width < height ? 'portrait' : 'landscape';

      setSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return size;
}

/**
 * Hook to detect touch capability
 */
export function useTouchCapable(): boolean {
  const [isTouchCapable, setIsTouchCapable] = useState(false);

  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;
    setIsTouchCapable(isTouch);
  }, []);

  return isTouchCapable;
}

/**
 * Hook to manage bottom sheet modal state (mobile-specific)
 */
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return { isOpen, open, close, toggle };
}

/**
 * Hook to handle pull-to-refresh on mobile
 */
export function usePullToRefresh(onRefresh: () => void) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let touchStartY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      scrollTop = document.documentElement.scrollTop;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only trigger pull-to-refresh at top of page
      if (scrollTop === 0) {
        const diff = e.touches[0].clientY - touchStartY;
        if (diff > 0) {
          setIsPulling(true);
          setPullDistance(diff);

          // Trigger refresh if pulled 80px
          if (diff > 80) {
            onRefresh();
            handleTouchEnd();
          }
        }
      }
    };

    const handleTouchEnd = () => {
      setIsPulling(false);
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh]);

  return { isPulling, pullDistance };
}

/**
 * Hook to manage safe area insets (for notched devices)
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const getEnvVariable = (name: string) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(
        name
      );
      return parseInt(value) || 0;
    };

    const updateInsets = () => {
      setInsets({
        top: getEnvVariable('--safe-area-inset-top'),
        bottom: getEnvVariable('--safe-area-inset-bottom'),
        left: getEnvVariable('--safe-area-inset-left'),
        right: getEnvVariable('--safe-area-inset-right'),
      });
    };

    updateInsets();
    window.addEventListener('orientationchange', updateInsets);

    return () => window.removeEventListener('orientationchange', updateInsets);
  }, []);

  return insets;
}

/**
 * Hook to manage horizontal scroll (for mobile tables/lists)
 */
export function useHorizontalScroll(
  elementRef: React.RefObject<HTMLDivElement>,
  onScroll?: (scrollLeft: number) => void
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isScrolling = true;
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isScrolling) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const walk = (x - startX) * 1; // scroll-fast
      element.scrollLeft = scrollLeft - walk;
      if (onScroll) {
        onScroll(element.scrollLeft);
      }
    };

    const handleMouseUp = () => {
      isScrolling = false;
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [elementRef, onScroll]);
}
