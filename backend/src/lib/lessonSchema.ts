import { z } from "zod"

const label = z.union([z.string(), z.number()]).transform(String);
const items = z.array(z.string())

export const VisualSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("title"), heading: z.string(), subheading: z.string().optional() }),
  z.object({ type: z.literal("points"), heading: z.string().optional(), items }),
  z.object({
    type: z.literal("array"),
    values: z.array(label).min(1),
    highlight: z.array(z.number()).optional(),
    pointers: z.array(z.object({ index: z.number(), label: z.string() })).optional(),
  }),
  z.object({ type: z.literal("stack"), items: z.array(label), action: z.enum(["push", "pop"]).optional() }),
  z.object({ type: z.literal("queue"), items: z.array(label), action: z.enum(["enqueue", "dequeue"]).optional() }),
  z.object({ type: z.literal("linkedlist"), nodes: z.array(label).min(1), highlight: z.array(z.number()).optional() }),
  z.object({
    type: z.literal("tree"),
    nodes: z.array(z.object({ id: label, label, parent: label.nullable() })).min(1),
  }),
  z.object({
    type: z.literal("code"),
    language: z.string().default("text"),
    code: z.string(),
    highlightLines: z.array(z.number()).optional(),
  }),
  z.object({ type: z.literal("flow"), steps: items.min(2), active: z.number().optional() }),
  z.object({
    type: z.literal("compare"),
    left: z.object({ title: z.string(), items }),
    right: z.object({ title: z.string(), items }),
  }),
]);

const QuizSchema = z
  .object({
    question: z.string(),
    options: items.min(2).max(4),
    answerIndex: z.number().int().min(0),
    explanation: z.string(),
  })
  .refine((q) => q.answerIndex < q.options.length, "answerIndex out of range");

export const SceneSchema = z
  .object({
    kind: z.enum(["teach", "quiz"]).catch("teach"),
    narration: z.string().min(1),
    onScreen: z.string().optional(),
    visual: VisualSchema.catch({ type: "points", items: [] }),
    quiz: QuizSchema.optional(),
  })
  .transform((s) => (s.kind === "quiz" && !s.quiz ? { ...s, kind: "teach" as const } : s));

export const MetaSchema = z.object({ language: z.string(), title: z.string() });

export type Scene = z.infer<typeof SceneSchema>;
