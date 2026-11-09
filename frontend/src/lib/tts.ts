let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSpeech(
  text: string,
  language: string,
  attempt = 0,
): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (res.status === 429 && attempt < 3) {
    await sleep(500 * 2 ** attempt);
    return fetchSpeech(text, language, attempt + 1);
  }
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  return URL.createObjectURL(await res.blob());
}

const cache = new Map<string, Promise<string>>();

export function getSpeechUrl(text: string, language: string): Promise<string> {
  const key = `${language}|${text}`;
  let url = cache.get(key);
  if (!url) {
    url = enqueue(() => fetchSpeech(text, language));
    url.catch(() => cache.delete(key));
    cache.set(key, url);
  }
  return url;
}
