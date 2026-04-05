"use client";

import { useEffect, useRef, useState } from "react";

interface Dimensions {
  width: number;
  height: number;
}

export function useMeasuredDimensions() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateDimensions = () => {
      setDimensions({
        width: Math.round(element.clientWidth),
        height: Math.round(element.clientHeight),
      });
    };

    updateDimensions();

    const frame = window.requestAnimationFrame(updateDimensions);
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return { ref, ...dimensions };
}
