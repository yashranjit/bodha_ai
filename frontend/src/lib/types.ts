export type Visual =
  | { type: "title"; heading: string; subheading?: string }
  | { type: "points"; heading?: string; items: string[] }
  | {
      type: "array";
      values: string[];
      highlight?: number[];
      pointers?: { index: number; label: string }[];
    }
  | { type: "stack"; items: string[]; action?: "push" | "pop" }
  | { type: "queue"; items: string[]; action?: "enqueue" | "dequeue" }
  | { type: "linkedlist"; nodes: string[]; highlight?: number[] }
  | {
      type: "tree";
      nodes: { id: string; label: string; parent: string | null }[];
    }
  | { type: "code"; language: string; code: string; highlightLines?: number[] }
  | { type: "flow"; steps: string[]; active?: number }
  | {
      type: "compare";
      left: { title: string; items: string[] };
      right: { title: string; items: string[] };
    };

export interface Quiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Scene {
  id: number;
  kind: "teach" | "quiz";
  narration: string;
  onScreen?: string;
  visual: Visual;
  quiz?: Quiz;
}

export interface LessonMeta {
  language: string;
  title: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}
