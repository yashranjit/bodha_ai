const cache = new Map<string, Promise<string>>();

export function getSpeechUrl(text: string, language: string): Promise<string> {
  const key = `${language}|${text}`;
  let url = cache.get(key);
  if (!url) {
    url = fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`TTS failed (${res.status})`);
      return URL.createObjectURL(await res.blob());
    });
    url.catch(() => cache.delete(key));
    cache.set(key, url);
  }
  return url;
}
