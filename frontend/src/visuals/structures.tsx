import { AnimatePresence, motion } from "motion/react";
import type { Visual } from "../lib/types";
import { RoughBox } from "./RoughBox";

type Of<T extends Visual["type"]> = Extract<Visual, { type: T }>;
const HIGHLIGHT = "#fbbf24";

function keyed(items: string[]) {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const n = seen.get(item) ?? 0;
    seen.set(item, n + 1);
    return { item, key: `${item}#${n}` };
  });
}

function ActionTag({ action }: { action?: string }) {
  if (!action) return null;
  return (
    <motion.span
      key={action}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-full bg-rose-100 px-3 py-0.5 text-lg text-rose-700"
    >
      {action}
    </motion.span>
  );
}

export function StackVisual({ v }: { v: Of<"stack"> }) {
  return (
    <div className="flex items-end justify-center gap-8 py-4">
      <RoughBox shape="cup" className="w-56 px-3 pt-10 pb-3">
        <div className="flex flex-col-reverse gap-2">
          <AnimatePresence>
            {keyed(v.items).map(({ item, key }, i) => (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <RoughBox
                  seed={i + 1}
                  fill={i === v.items.length - 1 ? HIGHLIGHT : undefined}
                  className="py-2 text-center text-2xl"
                >
                  {item}
                </RoughBox>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </RoughBox>
      <div className="flex flex-col items-start gap-2 pb-4 text-lg text-stone-500">
        <ActionTag action={v.action} />
        <span>↑ top</span>
      </div>
    </div>
  );
}

export function QueueVisual({ v }: { v: Of<"queue"> }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <ActionTag action={v.action} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-lg text-stone-500">front →</span>
        <AnimatePresence>
          {keyed(v.items).map(({ item, key }, i) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <RoughBox
                seed={i + 1}
                fill={i === 0 ? HIGHLIGHT : undefined}
                className="min-w-16 px-4 py-3 text-center text-2xl"
              >
                {item}
              </RoughBox>
            </motion.div>
          ))}
        </AnimatePresence>
        <span className="text-lg text-stone-500">← rear</span>
      </div>
    </div>
  );
}

export function LinkedListVisual({ v }: { v: Of<"linkedlist"> }) {
  const hl = new Set(v.highlight ?? []);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-8">
      <AnimatePresence>
        {keyed(v.nodes).map(({ item, key }, i) => (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            <RoughBox
              seed={i + 1}
              fill={hl.has(i) ? HIGHLIGHT : undefined}
              className="min-w-16 px-4 py-3 text-center text-2xl"
            >
              {item}
            </RoughBox>
            <span className="text-3xl text-stone-500">→</span>
          </motion.div>
        ))}
      </AnimatePresence>
      <span className="text-xl text-stone-400">null</span>
    </div>
  );
}

export function FlowVisual({ v }: { v: Of<"flow"> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-8">
      {v.steps.map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.4 }}
          className="flex items-center gap-3"
        >
          {i > 0 && <span className="text-3xl text-stone-500">→</span>}
          <RoughBox
            seed={i + 1}
            fill={i === v.active ? HIGHLIGHT : undefined}
            className="max-w-56 px-4 py-3 text-center text-xl"
          >
            {step}
          </RoughBox>
        </motion.div>
      ))}
    </div>
  );
}

export function CompareVisual({ v }: { v: Of<"compare"> }) {
  return (
    <div className="grid gap-6 py-4 sm:grid-cols-2">
      {[v.left, v.right].map((side, s) => (
        <motion.div
          key={side.title}
          initial={{ opacity: 0, x: s === 0 ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: s * 0.5 }}
        >
          <RoughBox seed={s + 7} className="p-5">
            <h3 className="mb-3 text-2xl">{side.title}</h3>
            <ul className="space-y-2 text-xl">
              {side.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </RoughBox>
        </motion.div>
      ))}
    </div>
  );
}
