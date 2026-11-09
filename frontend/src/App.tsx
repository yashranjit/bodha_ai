import { type FormEvent, useEffect, useState } from "react";
import { LessonPlayer } from "./components/LessonPlayer";
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

	const EXAMPLES = [
		{ text: "arrays nerpinchu", lang: "te" },
		{ text: "stack kya hota hai samjhao", lang: "hi" },
		{ text: "linked list பற்றி சொல்லுங்க", lang: "ta" },
		{ text: "teach me recursion", lang: "en" },
	];

	const busy = status === "loading" || status === "streaming";

	const active = status !== "idle";

	const teach = (t: string) => {
		setTopic(t);
		start(t, language === "auto" ? undefined : language);
	};

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (topic.trim().length >= 2) teach(topic.trim());
	};

	const form = (
		<form onSubmit={onSubmit} className="flex gap-2">
			<input
				value={topic}
				onChange={(e) => setTopic(e.target.value)}
				placeholder="arrays nerpinchu · stack kya hai samjhao · teach me recursion"
				className="flex-1 rounded-lg border-2 border-stone-800 bg-white/70 px-4 py-2 text-xl outline-none"
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
				type="submit"
				disabled={busy}
				className="rounded-lg border-2 border-stone-800 bg-amber-300 px-5 text-xl disabled:opacity-50"
			>
				Teach me
			</button>
		</form>
	);

	return (
		<main
			className={`mx-auto p-6 font-hand ${active ? "max-w-7xl" : "max-w-3xl pt-24"}`}
		>
			{active ? (
				<header className="mb-6 flex flex-wrap items-center gap-4">
					<h1 className="text-4xl">Bodha</h1>
					<div className="min-w-[320px] flex-1">{form}</div>
				</header>
			) : (
				<div className="text-center">
					<h1 className="text-7xl">Bodha</h1>
					<p className="mt-2 text-2xl text-stone-500">
						Learn anything, in your own language
					</p>
					<div className="mt-10">{form}</div>
					<div className="mt-6 flex flex-wrap justify-center gap-2">
						{EXAMPLES.map((ex) => (
							<button
								type="button"
								key={ex.text}
								lang={ex.lang}
								onClick={() => teach(ex.text)}
								className="rounded-full border-2 border-dashed border-stone-400 px-4 py-1 text-lg hover:border-stone-800 hover:bg-white"
							>
								{ex.text}
							</button>
						))}
					</div>
				</div>
			)}

			{status === "loading" && (
				<p className="mt-8 text-xl text-stone-500">Preparing your lesson…</p>
			)}
			{error && <p className="mt-8 text-xl text-rose-600">{error}</p>}
			{meta && (
				<h2 className="mb-4 text-3xl" lang={meta.language}>
					{meta.title}
				</h2>
			)}

			{meta && scenes.length > 0 && (
				<LessonPlayer
					key={meta.title}
					topic={meta.title}
					scenes={scenes}
					language={meta.language}
					done={status === "done" || status === "error"}
				/>
			)}
		</main>
	);
}
