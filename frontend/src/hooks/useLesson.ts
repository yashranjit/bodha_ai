import { useCallback, useEffect, useRef, useState } from "react";
import { readSSE } from "../lib/sse";
import type { LessonMeta, Scene } from "../lib/types";

type Status = "idle" | "loading" | "streaming" | "done" | "error";

export function useLesson() {
	const [meta, setMeta] = useState<LessonMeta | null>(null);
	const [scenes, setScenes] = useState<Scene[]>([]);
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController>(null);

	const start = useCallback(async (topic: string, language?: string) => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setMeta(null);
		setScenes([]);
		setError(null);
		setStatus("loading");

		try {
			const res = await fetch("/api/lesson", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ topic, language }),
				signal: controller.signal,
			});
			if (!res.ok || !res.body) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? `Request failed (${res.status})`);
			}

			for await (const evt of readSSE(res.body)) {
				const data = JSON.parse(evt.data);
				if (evt.event === "meta") {
					setMeta(data);
					setStatus("streaming");
				} else if (evt.event === "scene") {
					setScenes((prev) => [...prev, data]);
				} else if (evt.event === "done") {
					setStatus("done");
				} else if (evt.event === "error") {
					throw new Error(data.message);
				}
			}
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Something went wrong");
			setStatus("error");
		}
	}, []);

	useEffect(() => () => abortRef.current?.abort(), []);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		setMeta(null);
		setScenes([]);
		setError(null);
		setStatus("idle");
	}, []);
	return { meta, scenes, status, error, start, reset };
}
