import { motion } from "motion/react";
import { useRef } from "react";
import type { Visual } from "../lib/types";
import { useAnnotation } from "../hooks/useAnnotation";

type Of<T extends Visual["type"]> = Extract<Visual, { type: T }>;

export function TitleVisual({ v }: { v: Of<"title"> }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useAnnotation(
    ref,
    { type: "underline", color: "#f59e0b", strokeWidth: 3, padding: 4 },
    500,
  );
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center">
      <motion.h2
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl leading-tight"
      >
        {v.heading}
      </motion.h2>
      {v.subheading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-5 text-2xl text-stone-600"
        >
          {v.subheading}
        </motion.p>
      )}
    </div>
  );
}

export function PointsVisual({ v }: { v: Of<"points"> }) {
  return (
    <div className="py-4">
      {v.heading && <h3 className="mb-5 text-3xl">{v.heading}</h3>}
      <ul className="space-y-4">
        {v.items.map((item, i) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.7 }}
            className="flex gap-3 text-2xl"
          >
            <span className="text-amber-500">{item}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function CodeVisual({ v }: { v: Of<"code"> }) {
  const lines = v.code.split("\n");
  return (
    <pre className="overflow-x-auto rounded-xl border-2 border-stone-800 bg-stone-900 p-5 font-mono text-lg leading-relaxed text-stone-100">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.2 }}
          className={
            v.highlightLines?.includes(i + 1)
              ? "-mx-5 bg-amber-300/25 px-5"
              : ""
          }
        >
          <span className="mr-4 select-none text-stone-500">{i + 1}</span>
          {line || " "}
        </motion.div>
      ))}
    </pre>
  );
}
