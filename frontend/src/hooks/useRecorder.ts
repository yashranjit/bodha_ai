import { useRef, useState } from "react";
import { downsample, encodeWav } from "../lib/wav";

// A recording session contains everything we need while recording.
// We keep these objects together so we can clean them up when recording stops.
interface Session {
	stream: MediaStream;
	ctx: AudioContext;
	node: ScriptProcessorNode;
	chunks: Float32Array[];
}

export function useRecorder() {
	// This state tells our component whether the microphone is recording.
	// We use state because the UI needs to update when recording starts or stops.
	const [recording, setRecording] = useState(false);

	// We use useRef to store the recording session.
	// Unlike state, changing a ref doesn't cause the component to re-render.
	// We don't need React to re-render every time we receive an audio chunk.
	const session = useRef<Session | null>(null);

	// Starts microphone recording.
	const start = async () => {
		// Ask the browser for microphone access.
		// We only need one audio channel (mono).
		// Echo cancellation and noise suppression help improve speech quality.
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				channelCount: 1,
				echoCancellation: true,
				noiseSuppression: true,
			},
		});

		// AudioContext lets us work with audio inside the browser.
		const ctx = new AudioContext();

		// Connect the microphone stream to the audio processing system.
		const source = ctx.createMediaStreamSource(stream);

		// ScriptProcessorNode gives us microphone audio in small chunks.
		// 4096 samples at 48 kHz takes roughly 85 milliseconds per chunk.
		const node = ctx.createScriptProcessor(4096, 1, 1);

		// We'll store all the audio chunks here until recording stops.
		const chunks: Float32Array[] = [];

		// This event runs whenever a new audio chunk is available.
		// We copy the samples because the browser can reuse its audio buffer.
		node.onaudioprocess = (event) => {
			const samples = event.inputBuffer.getChannelData(0);
			chunks.push(new Float32Array(samples));
		};

		// Connect microphone → audio processor.
		source.connect(node);

		// Some browsers only process audio when the node is connected
		// to the destination. The processor outputs silence here.
		node.connect(ctx.destination);

		// Save everything in our ref so the stop function can access it.
		session.current = {
			stream,
			ctx,
			node,
			chunks,
		};

		// Update the UI to show that recording has started.
		setRecording(true);
	};

	// Stops recording and returns the audio as a 16 kHz WAV file.
	const stop = async (): Promise<Blob | null> => {
		// Get the current recording session.
		const currentSession = session.current;

		// If there is no active session, there is nothing to stop.
		if (!currentSession) return null;

		// Clear the ref so we don't accidentally reuse this session.
		session.current = null;

		// Stop audio processing.
		currentSession.node.disconnect();

		// Stop all microphone tracks.
		// This releases the microphone and turns off its indicator light.
		for (const track of currentSession.stream.getTracks()) {
			track.stop();
		}

		// Close the AudioContext to release browser audio resources.
		await currentSession.ctx.close();

		// Update the UI because recording has stopped.
		setRecording(false);

		// All audio is currently stored in separate chunks.
		// We need to combine them into one Float32Array before encoding.
		const totalSamples = currentSession.chunks.reduce(
			(total, chunk) => total + chunk.length,
			0,
		);

		// Create one large array to hold the complete recording.
		const allSamples = new Float32Array(totalSamples);

		// Copy each chunk into the correct position in the new array.
		let offset = 0;

		for (const chunk of currentSession.chunks) {
			allSamples.set(chunk, offset);
			offset += chunk.length;
		}

		// Microphone audio is usually recorded at 48 kHz.
		// We convert it to 16 kHz to reduce upload size.
		const samples16kHz = downsample(
			allSamples,
			currentSession.ctx.sampleRate,
			16000,
		);

		// Convert the samples into a WAV Blob.
		// This Blob can now be uploaded to our backend.
		return encodeWav(samples16kHz, 16000);
	};

	// Expose the recording state and functions to the component.
	return {
		recording,
		start,
		stop,
	};
}
