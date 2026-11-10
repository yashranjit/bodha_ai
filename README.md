# Bodha AI

**Learn anything in your own language.**

Bodha is an AI tutor that teaches you a topic in your mother tongue - Telugu, Hindi, Tamil, Kannada or English. You just say what you want to learn, and it teaches you like a teacher on a board: it speaks, understands your language, draws, animates and you can stop it anytime to ask a doubt.

**Live:** https://bodha-ai.svsst.workers.dev
**Demo video:**
![Bodha teaching arrays in Telugu](public/og.png)

## Why I built this

Most of the CS stuff we study is in English - textbooks, YouTube, docs, everything. But a lot of us (me included) actually _think_ in our own language. When someone explains arrays to me in Telugu with a simple example like train seats, it clicks way faster than reading a definition.

There's an idea in language learning called **comprehensible input** - you learn best when the explanation is in a language you fully understand with daily life examples. So I wanted to make a tutor that does exactly that, for any topic, in Indian languages.

## What it does

- **Speak your topic** - "arrays gurinchi nerpinchu", "stack kya hot hai samjhao" or just type it. It figures out your language automatically.
- **Teaches out loud in your language** - natural spoken Telugu/Hindi/Tamil, with technical words kept in English
- **Hand-drawn style visuals**
- **Streams live**
- **Ask doubts anytime**
- **Quizzes**

## How it works

1. **Gnani Prisma (v3.0)** turns the student's voice into text and detects which language they spoke.
2. **Gemini** writes the lesson as JSON Lines
3. The backend validates every scene with **zod** and streams it to the browser using **Server-Sent Events**.
4. **Gnani Timbre (v2.5** speaks each scene's narration in natural style. While one scene plays, the next scene's audio is already loading.
5. The fronted draws the visual with **Rough.js** (sketchy shapes), **Rough Notation** (hand-drawn underlines/circles) and **Motion** (animations).

## Tech stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Visuals**: Rough.js, Rough Notation, Motion
- **Backend**: Hono on Cloudflare Workers
- **Speech**: Gnani Prisma (STT), Gnani Timbre (TTS)
- **Lessons**: Gemini (Flash-lite, with a fallback model)
- **Cache**: Cloudflare KV (lessons + audio)
- **Validation**: zod

I picked **Cloudflare Workers** because a lot of hackathon demo links are dead after a few days (free servers go to sleep). Workers don't sleep and they free tier is more than enough.

## Run it locally

You need Node 20+ pnpm, a Gnani API key (https://app.gnani.ai/voice) and a Gemini API key (https://aistudio,google.com)

```bash
#clone this repo
git clone <thi repo>
cd bodha_ai

# backend
cd backend
pnpm install

## add GNANI API KEY and GEMINI API KEY
pnpm dev # starts server at http://localhost:8787

#frontend
cd frontend
pnpm install
pnpm dev # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so no CORS setup needed.
