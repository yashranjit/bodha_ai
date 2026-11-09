const GNANI_BASE = "https://api.vachana.ai";

export class GnaniError extends Error {
  name = "GnaniError";
  constructor(
    public status: number,
    detail: string,
  ) {
    super(`Gnani ${status}: ${detail.slice(0, 300)}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// text to WAV audio using Gnani Timbre
export async function synthesize(
  env: Env,
  opts: { text: string; language: string; voice: string },
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${GNANI_BASE}/api/v1/tts/inference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key-ID": env.GNANI_API_KEY,
      },
      body: JSON.stringify({
        text: opts.text,
        voice: opts.voice,
        model: env.TTS_MODEL,
        language: opts.language,
        speed: 1.0,
        audio_config: {
          sample_rate: 48000,
          num_channels: 1,
          sample_width: 2,
          encoding: "linear_pcm",
          container: "wav",
        },
      }),
    });

    if (res.status === 429 && attempt < 3) {
      await res.body?.cancel();
      await sleep(400 * 2 ** attempt);
      continue;
    }

    if (!res.ok) throw new GnaniError(res.status, await res.text());
    return res;
  }
}

// speech to text (transcript) using Gnani Prisma.
export async function transcribe(
  env: Env,
  opts: { audio: File; language: string },
): Promise<{ transcript: string; detectedLanguage?: string }> {
  const form = new FormData();
  form.append("audio_file", opts.audio, opts.audio.name || "question.wav");
  form.append("model", env.STT_MODEL);
  form.append("language_code", opts.language);

  const res = await fetch(`${GNANI_BASE}/stt/v3`, {
    method: "POST",
    headers: { "X-API-Key-ID": env.GNANI_API_KEY },
    body: form,
  });

  if (!res.ok) throw new GnaniError(res.status, await res.text());

  const data = (await res.json()) as {
    success?: boolean;
    transcript?: string;
    detected_language_code?: string;
  };
  if (data.success === false) throw new GnaniError(502, JSON.stringify(data));
  return {
    transcript: data.transcript ?? "",
    detectedLanguage: data.detected_language_code,
  };
}
