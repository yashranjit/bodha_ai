import { useRef, useState } from "react";
import { useRecorder } from "../hooks/useRecorder";

// Props passed from the parent component.
interface Props {
	// Called before recording starts.
	// We can use this to pause the AI tutor so its voice isn't recorded.
	onStart?: () => void;

	// Sends the converted speech text back to the parent component.
	onTranscript: (text: string, language?: string) => void;

	// Allows the parent component to disable the microphone button.
	disabled?: boolean;
}

// Stop recording after 25 seconds.
// Keep recording under 25 seconds because Gnani.ai's Prisma STT
// API has a 30-second request limit.
const MAX_RECORDING_MS = 25_000;

export function MicButton({ onStart, onTranscript, disabled }: Props) {
	// Our custom hook handles starting and stopping microphone recording.
	const { recording, start, stop } = useRecorder();

	// busy is true while we're sending audio to the backend.
	const [busy, setBusy] = useState(false);

	// Stores an error message if recording or transcription fails.
	const [error, setError] = useState<string | null>(null);

	// Store the timer ID so we can cancel it when recording stops.
	// We use useRef because changing the timer doesn't need a re-render.
	const timer = useRef<number | undefined>(undefined);

	// Stop recording and send the audio to our STT API.
	const finish = async () => {
		// Cancel the automatic stop timer if the user stops early.
		window.clearTimeout(timer.current);
		timer.current = undefined;

		// Stop the microphone and get the recorded audio as a WAV Blob.
		const wav = await stop();

		// If there is no recording, there's nothing to upload.
		if (!wav) return;

		// At 16 kHz, 16-bit mono audio uses around 32 KB per second.
		// A file smaller than 16 KB contains less than half a second
		// of audio, so we ask the user to record a little longer.
		if (wav.size < 16_000) {
			setError("Too short — say a little more");
			return;
		}

		// Show the loading state while the backend processes our audio.
		setBusy(true);

		try {
			// FormData lets us send the audio file to our backend.
			const form = new FormData();

			// Add the recorded WAV file.
			form.append("audio", wav, "question.wav");

			// Let the SST service detect the Indian language.
			form.append("language", "indic-auto");

			// Send the recording to our backend API.
			const response = await fetch("/api/stt", {
				method: "POST",
				body: form,
			});

			// Read the JSON response from the backend.
			const data = await response.json();

			// If the API request failed, show the backend error.
			if (!response.ok) {
				throw new Error(data.error ?? "Couldn't hear that");
			}

			// Remove extra spaces from the recognized speech.
			const transcript = data.transcript?.trim();

			// Sometimes the API succeeds but doesn't recognize any words.
			if (!transcript) {
				throw new Error("Didn't catch that — try again");
			}

			// Send the recognized text back to the parent component.
			// The lesson player can now use it as the student's question.
			onTranscript(transcript, data.language);
		} catch (err) {
			// Show a useful message if something goes wrong.
			setError(err instanceof Error ? err.message : "Couldn't hear that");
		} finally {
			// Whether the request succeeds or fails, stop showing loading.
			setBusy(false);
		}
	};

	// The same button starts and stops microphone recording.
	const toggle = async () => {
		// Clear the previous error when the user tries again.
		setError(null);

		// If we're already recording, clicking the button should stop it.
		if (recording) {
			await finish();
			return;
		}

		try {
			// Tell the parent component that recording is about to start.
			// For example, pause the AI tutor's voice.
			onStart?.();

			// Ask for microphone permission and start recording.
			await start();

			// Automatically stop recording after 25 seconds.
			// We save the timer ID so it can be cancelled later.
			timer.current = window.setTimeout(finish, MAX_RECORDING_MS);
		} catch {
			// This can happen if the user denies microphone permission.
			setError("Allow microphone access to ask by voice");
		}
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={toggle}
				disabled={disabled || busy}
				aria-label={recording ? "Stop recording" : "Ask by voice"}
				className={`ctrl disabled:opacity-50 ${
					recording ? "animate-pulse bg-rose-200" : ""
				}`}
			>
				{/* Show loading, stop, or microphone icon based on the state. */}
				{busy ? "…" : recording ? "⏹" : "🎤"}
			</button>

			{/* Tell the student when the microphone is listening. */}
			{recording && (
				<span className="text-sm text-rose-600">
					Listening… tap ⏹ when done
				</span>
			)}

			{/* Display an error message if recording or STT fails. */}
			{error && <span className="text-sm text-rose-600">{error}</span>}
		</div>
	);
}
