import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import rough from "roughjs";
import type { Visual } from "../lib/types";

const BOX = 72;
const GAP = 12;
const TOP = 16;

export function ArrayVisual({ v }: { v: Extract<Visual, { type: "array" }> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = v.values.length * (BOX + GAP) + GAP;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    const rc = rough.svg(svg);
    const highlighted = new Set(v.highlight ?? []);
    v.values.forEach((_, i) => {
      svg.appendChild(
        rc.rectangle(GAP + i * (BOX + GAP), TOP, BOX, BOX, {
          seed: i + 1,
          roughness: 1.5,
          strokeWidth: 2,
          stroke: "#1f2937",
          ...(highlighted.has(i) && {
            fill: "#fbbf24",
            fillStyle: "hachure",
            hachureGap: 6,
          }),
        }),
      );
    });
  }, [v]);

  return (
    <div className="flex justify-center overflow-x-auto py-6">
      <div className="relative" style={{ width, height: BOX + TOP + 90 }}>
        <svg ref={svgRef} className="absolute inset-0 h-full w-full" />

        {v.values.map((value, i) => (
          <motion.div
            key={`${i}-${value}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="absolute flex items-center justify-center text-3xl"
            style={{
              left: GAP + i * (BOX + GAP),
              top: TOP,
              width: BOX,
              height: BOX,
            }}
          >
            {value}
          </motion.div>
        ))}
        {v.values.map((_, i) => (
          <div
            key={i}
            className="absolute text-center text-base text-stone-400"
            style={{
              left: GAP + i * (BOX + GAP),
              top: TOP + BOX + 4,
              width: BOX,
            }}
          >
            {i}
          </div>
        ))}
        {v.pointers?.map((p, k) => (
          <motion.div
            key={k}
            initial={false}
            animate={{ left: GAP + p.index * (BOX + GAP) }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="absolute text-center text-rose-600"
            style={{ top: TOP + BOX + 26, width: BOX }}
          >
            <div className="text-2xl leading-none">↑</div>
            <div className="text-lg">{p.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
