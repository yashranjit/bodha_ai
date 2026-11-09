// Converts microphone audio samples into a WAV audio file.
//
// Float32Array stores audio values between -1 and 1.
// WAV (16-bit PCM) needs integer values instead, so we convert them.

export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
	// Each audio sample takes 2 bytes (16 bits).
	// WAV also needs a 44-byte header containing audio information.
	const bytesPerSample = 2;
	const headerSize = 44;
	const dataSize = samples.length * bytesPerSample;

	const buffer = new ArrayBuffer(headerSize + dataSize);
	const view = new DataView(buffer);

	// Helper function to write text into the WAV header.
	// For example: RIFF, WAVE, fmt and data.
	const writeText = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) {
			view.setUint8(offset + i, text.charCodeAt(i));
		}
	};

	// Every WAV file starts with a header.
	// This header tells the audio player how to read the audio data.

	writeText(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);

	writeText(8, "WAVE");
	writeText(12, "fmt ");

	// Describe the audio format.
	view.setUint32(16, 16, true); // Size of the format information
	view.setUint16(20, 1, true); // 1 means uncompressed PCM audio
	view.setUint16(22, 1, true); // 1 audio channel = mono
	view.setUint32(24, sampleRate, true); // Samples recorded per second
	view.setUint32(28, sampleRate * bytesPerSample, true); // Bytes per second
	view.setUint16(32, bytesPerSample, true); // Bytes per sample
	view.setUint16(34, 16, true); // 16 bits per sample

	// Tell the player where the actual audio data starts.
	writeText(36, "data");
	view.setUint32(40, dataSize, true);

	// Now convert every audio sample from float to 16-bit integer.
	// We use the remaining space after the 44-byte header.
	let offset = headerSize;

	for (const sample of samples) {
		// Audio values must stay between -1 and 1.
		// Clamping prevents values outside this range from causing problems.
		const clampedSample = Math.max(-1, Math.min(1, sample));

		// Convert the float into a signed 16-bit integer.
		// Negative and positive values have slightly different limits.
		const pcmSample =
			clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7fff;

		// Write the sample into the buffer.
		// true means we store the bytes in little-endian order.
		view.setInt16(offset, pcmSample, true);

		// Move forward by 2 bytes for the next sample.
		offset += bytesPerSample;
	}

	// Wrap the completed WAV data inside a Blob.
	// We can now upload it or use it as an audio file.
	return new Blob([buffer], { type: "audio/wav" });
}

// Converts audio from one sample rate to another.
//
// Example:
// 48,000 Hz → 16,000 Hz
//
// This reduces the amount of audio data we upload.
// 16 kHz is generally enough for speech recognition.

export function downsample(
	input: Float32Array,
	from: number,
	to: number,
): Float32Array {
	// If the target sample rate is already higher or equal,
	// we don't need to downsample.
	if (to >= from) return input;

	// Find how many original samples should become one output sample.
	// Example: 48,000 / 16,000 = 3.
	// So every 3 input samples become 1 output sample.
	const ratio = from / to;

	// Calculate how many samples the new audio will contain.
	const outputLength = Math.floor(input.length / ratio);
	const output = new Float32Array(outputLength);

	for (let i = 0; i < output.length; i++) {
		// Find the group of original samples for this output sample.
		const start = Math.floor(i * ratio);
		const end = Math.min(Math.floor((i + 1) * ratio), input.length);

		// Add all samples in this group.
		let sum = 0;

		for (let j = start; j < end; j++) {
			sum += input[j];
		}

		// Take the average of the group.
		// This gives us one sample at the lower sample rate.
		output[i] = sum / (end - start || 1);
	}

	return output;
}
