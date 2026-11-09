import { useEffect, useState, type FormEvent } from "react";
import { useLesson } from "./hooks/useLesson";
import type { Language } from "./lib/types";

export default function App() {
  const { meta, scenes, status, error, start } = useLesson();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("auto");
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then(setLanguages)
      .catch(() => {});
  }, []);

  const busy = status === "loading" || status === "streaming";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) return;
    start(topic.trim(), language === "auto" ? undefined : language);
  };

  return (
    <main className="mx-auto max-w-3xl p-8 font-hand">
      <h1 className="text-5xl">Bodha</h1>
      <p className="mt-1 text-lg text-stone-500">
        Learn anything in your own language
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="arrays nerpinchu · stack kya hai samjhao · teach me recursion"
          className="flex-1 rounded-lg boder-2 border-stone-800 bg-white/70 px-4 py-2 text-xl outline-none"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border-2 border-stone-800 bg-white/70 px-2 text-lg"
        >
          <option value="auto">Auto</option>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          className="rounded-lg border-2 border-stone-800 bg-amber-300 px-5 text-xl disabled:opacity-50"
        >
          Teach Me
        </button>
      </form>
      {status === "loading" && (
        <p className="mt-8 text-xl text-stone-500">Preparing your lesson...</p>
      )}
      {error && <p className="mt-8 text-xl text-rose-600">{error}</p>}
      {meta && <h2 className="mt-10 text-3xl">{meta.title}</h2>}
      <ol className="mt-4 space-y-4">
        {scenes.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border-2 border-dashed border-stone-300 bg-white/60 p-4"
          >
            <div className="text-sm text-stone-500">
              Scene {s.id} · {s.visual.type}
              {s.kind === "quiz" && " · quiz"}
            </div>
            {s.onScreen && <div className="text-2xl">{s.onScreen}</div>}
            <p className="mt-1 text-lg">{s.narration}</p>
          </li>
        ))}
      </ol>
      {status === "streaming" && (
        <p className="mt-4 text-stone-500">Writing more...</p>
      )}
    </main>
  );
}
