import { useEffect, type RefObject } from "react";
import { annotate } from "rough-notation";

type Options = Parameters<typeof annotate>[1];

export function useAnnotation(
  ref: RefObject<HTMLElement | null>,
  options: Options,
  delayMs = 400,
  enabled = true,
) {
  const { type, color } = options;

  useEffect(() => {
    if (!ref.current || !enabled) return;
    const mark = annotate(ref.current, options);
    const timer = setTimeout(() => mark.show(), delayMs);
    return () => {
      clearTimeout(timer);
      mark.remove();
    };
  }, [ref, type, color, delayMs, enabled]);
}
