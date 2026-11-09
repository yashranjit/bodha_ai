import { type ReactNode, useEffect, useRef, useState } from "react";
import rough from "roughjs";

export const INK = { roughness: 1.4, strokeWidth: 2, stroke: "#1f2937" };

interface Props {
  children?: ReactNode;
  className?: string;
  fill?: string;
  seed?: number;
  shape?: "rect" | "cup";
}

export function RoughBox({
  children,
  className = "",
  fill,
  seed = 1,
  shape = "rect",
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ w: el.offsetWidth, h: el.offsetHeight }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || size.w === 0) return;
    svg.replaceChildren();
    const rc = rough.svg(svg);
    const { w, h } = size;
    if (shape === "cup") {
      svg.appendChild(
        rc.linearPath(
          [
            [2, 2],
            [2, h - 2],
            [w - 2, h - 2],
            [w - 2, 2],
          ],
          { ...INK, seed },
        ),
      );
    } else {
      svg.appendChild(
        rc.rectangle(2, 2, w - 4, h - 4, {
          ...INK,
          seed,
          ...(fill && { fill, fillStyle: "hachure", hachureGap: 6 }),
        }),
      );
    }
  }, [size, fill, seed, shape]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
