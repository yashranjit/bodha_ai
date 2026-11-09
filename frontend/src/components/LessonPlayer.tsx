import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechUrl } from "../lib/tts";
import type { Scene } from "../lib/types";
import { SceneVisual } from "../visuals/SceneVisual";

type Phase = "speaking" | "quiz" | "waiting" | "blocked" | "finished";

interface Props {
  scenes: Scene[];
  language: string;
  done: boolean; // has the stream finished?
}

export function LessonPlayer({ scenes, language, done }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("speaking");
  const [choice, setChoice] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scene = scenes[index];
  const next = scenes[index + 1];

  const speak = useCallback(
    async (text: string) => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.src = await getSpeechUrl(text, language);
        await audio.play();
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotAllowedError")
          setPhase("blocked");
        else console.warn("Voice unavailable:", err);
      }
    },
    [language],
  );

  useEffect(() => {
    if (!scene) return;
    setChoice(null);
    setPhase("speaking");
    speak(scene.narration);
  }, [scene, speak]);

  useEffect(() => {
    if (next) getSpeechUrl(next.narration, language).catch(() => {});
  }, [next, language]);

  useEffect(() => {
    if (phase !== "waiting") return;
    if (index + 1 < scenes.length) setIndex(index + 1);
    else if (done) setPhase("finished");
  }, [phase, index, scenes.length, done]);

  const goNext = () => {
    if (index + 1 < scenes.length) setIndex(index + 1);
    else setPhase(done ? "finished" : "waiting");
  };

  const onEnded = () => {
    if (scene?.quiz && choice === null) setPhase("quiz");
    else goNext();
  };

  const answer = (i: number) => {
    if (!scene?.quiz || choice !== null) return;
    setChoice(i);
    setPhase("speaking");
    speak(scene.quiz.explanation);
  };

  const togglePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const replay = () => {
    if (index === 0 && scene) {
      setPhase("speaking");
      speak(scene.narration);
    } else setIndex(0);
  };

  if (!scene) return null;
  const subtitle =
    choice !== null && scene.quiz ? scene.quiz.explanation : scene.narration;

  return (
    <section lang={language} className="mt-6">
      <div className="relative min-h-[400px] rounded-2xl border-2 border-stone-800 bg-white/85 p-8 shadow-[6px_6px_0_#1f2937]">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <span className="text-2xl">{scene.onScreen}</span>
          <span className="shrink-0 text-sm text-stone-500">
            {index + 1} / {scenes.length}
            {!done && "…"}
          </span>
        </div>

        <SceneVisual visual={scene.visual} />

        {scene.quiz && (phase === "quiz" || choice !== null) && (
          <div className="mt-6">
            <p className="mb-3 text-2xl">{scene.quiz.question}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {scene.quiz.options.map((opt, i) => {
                const isAnswer = i === scene.quiz?.answerIndex;
                const color =
                  choice === null
                    ? "bg-amber-50 hover:bg-amber-100"
                    : isAnswer
                      ? "bg-emerald-200"
                      : i === choice
                        ? "bg-rose-200"
                        : "bg-white opacity-60";
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => answer(i)}
                    disabled={choice !== null}
                    className={`rounded-xl border-2 border-stone-800 px-4 py-3 text-left text-xl ${color}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {phase === "blocked" && (
          <button
            type="button"
            onClick={() => {
              setPhase("speaking");
              speak(scene.narration);
            }}
            className="absolute inset-0 m-auto h-16 w-64 rounded-xl border-2 border-stone-800 bg-amber-300 text-2xl"
          >
            ▶ Start the lesson
          </button>
        )}
      </div>

      <p className="mt-4 min-h-[4rem] text-xl leading-relaxed text-stone-700">
        {subtitle}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => index > 0 && setIndex(index - 1)}
          className="ctrl"
        >
          ⏮
        </button>
        <button type="button" onClick={togglePause} className="ctrl">
          {paused ? "▶" : "⏸"}
        </button>
        <button type="button" onClick={goNext} className="ctrl">
          ⏭
        </button>
        {phase === "waiting" && (
          <span className="text-stone-500">Preparing the next part…</span>
        )}
        {phase === "finished" && (
          <>
            <span className="text-xl">🎉 Lesson complete!</span>
            <button type="button" onClick={replay} className="ctrl">
              ↺ Replay
            </button>
          </>
        )}
      </div>

      <audio
        ref={audioRef}
        onEnded={onEnded}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />
    </section>
  );
}
