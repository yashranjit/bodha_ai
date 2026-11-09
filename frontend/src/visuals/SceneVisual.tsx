import { AnimatePresence, motion } from "motion/react";
import type { Visual } from "../lib/types";
import { ArrayVisual } from "./ArrayVisual";
import { CodeVisual, PointsVisual, TitleVisual } from "./basic";
import {
  CompareVisual,
  FlowVisual,
  LinkedListVisual,
  QueueVisual,
  StackVisual,
} from "./structures";
import { TreeVisual } from "./TreeVisual";

function Draw({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case "title":
      return <TitleVisual v={visual} />;
    case "points":
      return <PointsVisual v={visual} />;
    case "array":
      return <ArrayVisual v={visual} />;
    case "code":
      return <CodeVisual v={visual} />;
    case "stack":
      return <StackVisual v={visual} />;
    case "queue":
      return <QueueVisual v={visual} />;
    case "linkedlist":
      return <LinkedListVisual v={visual} />;
    case "tree":
      return <TreeVisual v={visual} />;
    case "flow":
      return <FlowVisual v={visual} />;
    case "compare":
      return <CompareVisual v={visual} />;
  }
}

export function SceneVisual({ visual }: { visual: Visual }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={visual.type}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Draw visual={visual} />
      </motion.div>
    </AnimatePresence>
  );
}
