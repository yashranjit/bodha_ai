import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import rough from "roughjs";
import type { Visual } from "../lib/types";
import { INK } from "./RoughBox";

type TreeV = Extract<Visual, { type: "tree" }>;
const NODE = 52;
const X_GAP = 76;
const Y_GAP = 90;
const PAD = 20;

function layoutTree(nodes: TreeV["nodes"]) {
  const ids = new Set(nodes.map((n) => n.id));
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const n of nodes) {
    if (n.parent && ids.has(n.parent) && n.parent !== n.id) {
      children.set(n.parent, [...(children.get(n.parent) ?? []), n.id]);
    } else roots.push(n.id); // no (valid) parent → treat as a root
  }

  const pos = new Map<string, { x: number; depth: number }>();
  let leaf = 0;
  let maxDepth = 0;
  const visit = (id: string, depth: number) => {
    if (pos.has(id)) return;
    pos.set(id, { x: 0, depth });
    maxDepth = Math.max(maxDepth, depth);
    const kids = (children.get(id) ?? []).filter((k) => !pos.has(k));
    for (const k of kids) visit(k, depth + 1);
    const xs = kids.map((k) => pos.get(k)?.x ?? 0);
    pos.set(id, {
      x: kids.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : leaf++,
      depth,
    });
  };
  for (const r of roots) visit(r, 0);

  const center = (id: string) => {
    const p = pos.get(id) ?? { x: 0, depth: 0 };
    return {
      cx: PAD + p.x * X_GAP + NODE / 2,
      cy: PAD + p.depth * Y_GAP + NODE / 2,
      depth: p.depth,
    };
  };
  return {
    center,
    width: PAD * 2 + Math.max(leaf - 1, 0) * X_GAP + NODE,
    height: PAD * 2 + maxDepth * Y_GAP + NODE,
  };
}

export function TreeVisual({ v }: { v: TreeV }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { center, width, height } = useMemo(
    () => layoutTree(v.nodes),
    [v.nodes],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    const rc = rough.svg(svg);

    v.nodes.forEach((n, i) => {
      if (
        !n.parent ||
        n.parent === n.id ||
        !v.nodes.some((p) => p.id === n.parent)
      )
        return;
      const a = center(n.parent);
      const b = center(n.id);
      svg.appendChild(
        rc.line(a.cx, a.cy + NODE / 2, b.cx, b.cy - NODE / 2, {
          ...INK,
          seed: i + 50,
        }),
      );
    });
    v.nodes.forEach((n, i) => {
      const c = center(n.id);
      svg.appendChild(
        rc.circle(c.cx, c.cy, NODE, {
          ...INK,
          seed: i + 1,
          fill: "#fffbeb",
          fillStyle: "solid",
        }),
      );
    });
  }, [v.nodes, center]);

  return (
    <div className="flex justify-center overflow-x-auto py-4">
      <div className="relative" style={{ width, height }}>
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full overflow-visible"
        />
        {v.nodes.map((n) => {
          const c = center(n.id);
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: c.depth * 0.4 }}
              className="absolute flex items-center justify-center text-center text-lg"
              style={{
                left: c.cx - NODE / 2 - 10,
                top: c.cy - NODE / 2,
                width: NODE + 20,
                height: NODE,
              }}
            >
              {n.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
