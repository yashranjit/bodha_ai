import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechUrl } from "../lib/tts";
import type { Scene, Visual } from "../lib/types";
import { SceneVisual } from "../visuals/SceneVisual";

type Phase =
	| "speaking"
	| "quiz"
	| "answering"
	| "waiting"
	| "blocked"
	| "finished";

interface Props {
	scenes: Scene[];
	language: string;
	done: boolean;
	topic?: string;
}

const THINKING: Record<string, string> = {
	"te-IN": "మంచి ప్రశ్న! ఒక్క నిమిషం.",
	"hi-IN": "अच्छा सवाल है! एक मिनट।",
	"ta-IN": "நல்ல கேள்வி! ஒரு நிமிஷம்.",
	"kn-IN": "ಒಳ್ಳೆ ಪ್ರಶ್ನೆ! ಒಂದು ನಿಮಿಷ.",
	"en-IN": "Good question! Give me a second.",
};

interface DoubtAnswer {
	question: string;
	narration?: string;
	onScreen?: string;
	visual?: Visual;
}

export function LessonPlayer({ scenes, language, done, topic }: Props) {
	const [index, setIndex] = useState(0);
	const [phase, setPhase] = useState<Phase>("speaking");
	const [choice, setChoice] = useState<number | null>(null);
	const [paused, setPaused] = useState(false);
	const [doubtAnswer, setDoubtAnswer] = useState<DoubtAnswer | null>(null);
	const [question, setQuestion] = useState("");

	const audioRef = useRef<HTMLAudioElement>(null);
	const speakIdRef = useRef(0);
	const askControllerRef = useRef<AbortController | null>(null);

	const scene = scenes[index];
	const next = scenes[index + 1];

	const speak = useCallback(
		async (text: string) => {
			const id = ++speakIdRef.current;
			const audio = audioRef.current;

			if (!audio || !text.trim()) return;

			audio.pause();

			try {
				const url = await getSpeechUrl(text, language);

				// Ignore an older request if another piece of audio was requested.
				if (id !== speakIdRef.current) return;

				audio.src = url;
				await audio.play();
			} catch (error) {
				if (id !== speakIdRef.current) return;
				if (error instanceof DOMException && error.name === "AbortError")
					return;

				console.error("Unable to play lesson audio:", error);
				setPhase("blocked");
			}
		},
		[language],
	);

	useEffect(() => {
		if (!scene) return;

		// Stop audio and any pending doubt request when the scene changes.
		speakIdRef.current += 1;
		audioRef.current?.pause();
		askControllerRef.current?.abort();
		askControllerRef.current = null;

		setChoice(null);
		setDoubtAnswer(null);
		setPhase("speaking");
		void speak(scene.narration ?? "");
	}, [scene, speak]);

	useEffect(() => {
		if (!next?.narration) return;
		// Preload the next scene's speech audio.
		void getSpeechUrl(next.narration, language).catch(() => {});
	}, [next, language]);

	useEffect(() => {
		if (phase !== "waiting") return;

		if (index + 1 < scenes.length) {
			setIndex((current) => current + 1);
		} else if (done) {
			setPhase("finished");
		}
	}, [phase, index, scenes.length, done]);

	const goNext = () => {
		if (index + 1 < scenes.length) {
			setIndex((current) => current + 1);
		} else {
			setPhase(done ? "finished" : "waiting");
		}
	};

	const onEnded = () => {
		// The short "thinking" message may finish while the API is still working.
		if (phase === "answering" && !doubtAnswer?.narration) return;

		if (doubtAnswer?.narration) {
			setDoubtAnswer(null);
			setPhase("speaking");
			void speak(scene?.narration ?? "");
			return;
		}

		if (scene?.quiz && choice === null) {
			setPhase("quiz");
		} else {
			goNext();
		}
	};

	const handleQuizAnswer = (selectedIndex: number) => {
		if (!scene?.quiz || choice !== null) return;

		setChoice(selectedIndex);
		setPhase("speaking");
		void speak(scene.quiz.explanation ?? "");
	};

	const togglePause = () => {
		const audio = audioRef.current;
		if (!audio) return;

		if (audio.paused) {
			void audio.play().catch((error) => {
				console.error("Unable to resume audio:", error);
				setPhase("blocked");
			});
		} else {
			audio.pause();
		}
	};

	const replay = () => {
		setDoubtAnswer(null);
		setChoice(null);

		if (index === 0 && scene) {
			setPhase("speaking");
			void speak(scene.narration ?? "");
		} else {
			setIndex(0);
		}
	};

	const askDoubt = async (questionText: string) => {
		if (!scene || phase === "answering") return;

		askControllerRef.current?.abort();
		const controller = new AbortController();
		askControllerRef.current = controller;

		audioRef.current?.pause();
		setPhase("answering");
		setDoubtAnswer({ question: questionText });

		void speak(THINKING[language] ?? THINKING["en-IN"]);

		try {
			const response = await fetch("/api/ask", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
				body: JSON.stringify({
					topic: topic ?? scene.onScreen,
					language,
					question: questionText,
					currentNarration: scene.narration,
				}),
			});

			if (!response.ok) {
				throw new Error(`Ask failed (${response.status})`);
			}

			const data: DoubtAnswer = await response.json();

			if (controller.signal.aborted) return;

			setDoubtAnswer({ question: questionText, ...data });
			setPhase("speaking");

			if (data.narration) {
				void speak(data.narration);
			} else {
				// No spoken answer was returned, so resume the lesson.
				setDoubtAnswer(null);
				void speak(scene.narration ?? "");
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;

			console.error("Unable to answer the question:", error);
			setDoubtAnswer(null);
			setPhase("speaking");
			void speak(scene.narration ?? "");
		} finally {
			if (askControllerRef.current === controller) {
				askControllerRef.current = null;
			}
		}
	};

	if (!scene) {
		return (
			<div className="rounded-xl border-2 border-stone-800 bg-white/85 p-6">
				{done ? "No lesson scenes available." : "Preparing the lesson…"}
			</div>
		);
	}

	const shownVisual = doubtAnswer?.visual ?? scene.visual;
	const subtitle = doubtAnswer?.narration
		? doubtAnswer.narration
		: choice !== null && scene.quiz
			? scene.quiz.explanation
			: scene.narration;

	return (
		<section
			lang={language}
			className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
		>
			<div>
				<div className="relative min-h-[460px] rounded-2xl border-2 border-stone-800 bg-white/85 p-8 shadow-[6px_6px_0_#1f2937]">
					<div className="mb-4 flex items-baseline justify-between gap-4">
						<span className="text-2xl">
							{doubtAnswer?.onScreen ?? scene.onScreen}
						</span>
						<span className="shrink-0 text-sm text-stone-500">
							{index + 1} / {scenes.length}
							{!done && "…"}
						</span>
					</div>

					{doubtAnswer && (
						<div className="mb-3 rounded-lg bg-sky-100 px-3 py-2 text-lg">
							✋ {doubtAnswer.question}
						</div>
					)}

					<SceneVisual visual={shownVisual} />

					{scene.quiz && (phase === "quiz" || choice !== null) && (
						<div className="mt-6">
							<p className="mb-3 text-2xl">{scene.quiz.question}</p>
							<div className="grid gap-3 sm:grid-cols-2">
								{scene.quiz.options.map((option, optionIndex) => {
									const isCorrect = optionIndex === scene.quiz?.answerIndex;

									const color =
										choice === null
											? "bg-amber-50 hover:bg-amber-100"
											: isCorrect
												? "bg-emerald-200"
												: optionIndex === choice
													? "bg-rose-200"
													: "bg-white opacity-60";

									return (
										<button
											type="button"
											key={`${option}-${optionIndex}`}
											onClick={() => handleQuizAnswer(optionIndex)}
											disabled={choice !== null}
											className={`rounded-xl border-2 border-stone-800 px-4 py-3 text-left text-xl ${color}`}
										>
											{option}
										</button>
									);
								})}
							</div>
						</div>
					)}

					<form
						onSubmit={(event) => {
							event.preventDefault();

							const trimmedQuestion = question.trim();
							if (!trimmedQuestion || phase === "answering") return;

							void askDoubt(trimmedQuestion);
							setQuestion("");
						}}
						className="mt-6 rounded-xl border-2 border-stone-800 bg-white/85 p-3"
					>
						<div className="mb-2 text-sm text-stone-500">
							✋ Ask a doubt, in any language
						</div>
						<div className="flex gap-2">
							<input
								value={question}
								onChange={(event) => setQuestion(event.target.value)}
								disabled={phase === "answering"}
								placeholder="index zero nundi enduku?"
								className="min-w-0 flex-1 rounded-lg border-2 border-stone-300 px-3 py-1 text-lg outline-none focus:border-stone-800"
							/>
							<button
								type="submit"
								disabled={phase === "answering" || !question.trim()}
								className="ctrl disabled:opacity-50"
							>
								Ask
							</button>
						</div>
					</form>

					{phase === "answering" && (
						<p className="mt-3 text-sm text-stone-500">
							Preparing an explanation…
						</p>
					)}

					{phase === "blocked" && (
						<button
							type="button"
							onClick={() => {
								setPhase("speaking");
								void speak(doubtAnswer?.narration ?? scene.narration ?? "");
							}}
							className="absolute inset-0 m-auto h-16 w-64 rounded-xl border-2 border-stone-800 bg-amber-300 text-2xl"
						>
							▶ Tap to continue
						</button>
					)}
				</div>

				<div className="mt-4 flex items-center gap-3">
					<button
						type="button"
						onClick={() => index > 0 && setIndex((current) => current - 1)}
						disabled={index === 0}
						className="ctrl disabled:opacity-40"
						aria-label="Previous scene"
					>
						⏮
					</button>
					<button
						type="button"
						onClick={togglePause}
						className="ctrl"
						aria-label={paused ? "Resume audio" : "Pause audio"}
					>
						{paused ? "▶" : "⏸"}
					</button>
					<button
						type="button"
						onClick={goNext}
						className="ctrl"
						aria-label="Next scene"
					>
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
			</div>

			<aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
				<div className="rounded-xl border-2 border-stone-800 bg-white/85 p-4">
					<div className="mb-1 text-sm text-stone-500">🗣 Now saying</div>
					<p className="text-lg leading-relaxed">{subtitle}</p>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto rounded-xl border-2 border-stone-800 bg-white/85 p-3">
					<div className="mb-2 px-3 text-sm text-stone-500">Lesson</div>
					<ol className="space-y-1">
						{scenes.map((item, sceneIndex) => (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => setIndex(sceneIndex)}
									aria-current={sceneIndex === index ? "step" : undefined}
									className={`w-full rounded-lg px-3 py-2 text-left text-lg ${
										sceneIndex === index
											? "bg-amber-200"
											: sceneIndex < index
												? "text-stone-400"
												: "hover:bg-stone-100"
									}`}
								>
									<span className="mr-2 text-sm">
										{sceneIndex < index ? "✓" : sceneIndex + 1}
									</span>
									{item.onScreen ?? `Scene ${sceneIndex + 1}`}
									{item.quiz && " · ❓"}
								</button>
							</li>
						))}
						{!done && (
							<li className="animate-pulse px-3 py-2 text-stone-400">
								Writing the next part…
							</li>
						)}
					</ol>
				</div>
			</aside>

			<audio
				ref={audioRef}
				onEnded={onEnded}
				onPlay={() => setPaused(false)}
				onPause={() => setPaused(true)}
			/>
		</section>
	);
}
