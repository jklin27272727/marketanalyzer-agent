# Marketing Page Analyzer

An AI-powered tool that analyzes marketing landing pages and gives you actionable insights. Paste any URL, and within seconds you'll get a detailed breakdown of what the page does well, where it falls short, and how to improve it.

## Live Demo

**[https://marketing-analyzer-three.vercel.app](https://marketing-analyzer-three.vercel.app)**

## Features

Enter a landing page URL and get a complete analysis including:

- **Summary** — A 2-3 sentence overview of what the page offers
- **Target Audience** — Detailed breakdown including demographics, job roles, company size, pain points, and technical level
- **Value Proposition** — The core promise distilled into one clear statement
- **Main Claims** — Every key factual or implied claim the page makes
- **CTA Analysis** — Critical assessment of calls to action: clarity, placement, and effectiveness
- **Strengths & Weaknesses** — What works well and what needs fixing, with actionable suggestions for every weakness
- **Competitor Comparison** — Likely competitors inferred from page content and how this offering stacks up
- **Rewritten Hero Section** — An improved headline, subheadline, and CTA you can use right away
- **Scores** — Five dimensions rated on a 0-10 scale with bullet-point explanations for each:
  - Clarity, Differentiation, Credibility, Conversion Potential, Emotional Appeal

## Tech Stack

| Technology | Why |
|---|---|
| **Next.js** | Full-stack framework — handles both the React frontend and the API route in a single project. No separate backend needed. |
| **Tailwind CSS** | Utility-first CSS for building a polished, responsive UI without writing custom stylesheets. |
| **Cheerio** | Fast, jQuery-like HTML parsing on the server. Extracts title, headings, paragraphs, meta tags, and CTAs from raw HTML. |
| **OpenRouter API** | Unified API that gives access to multiple LLM models. Uses free models during development to keep costs at zero. |
| **Vercel** | Zero-config deployment for Next.js apps. Just push to GitHub and it's live. |

## How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/jklin27272727/marketing-analyzer.git
cd marketing-analyzer

# 2. Install dependencies
npm install

# 3. Create your environment file
echo 'OPENROUTER_API_KEY=your-key-here' > .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To get an OpenRouter API key:
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to the [Keys page](https://openrouter.ai/keys)
3. Create a new key and copy it into your `.env.local` file

## Deploy to Vercel

```bash
# 1. Push your repo to GitHub
git push origin main

# 2. Import the repo on Vercel
# Go to https://vercel.com/new and select your repository

# 3. Add the environment variable
# In the Vercel dashboard, go to Settings → Environment Variables
# Add: OPENROUTER_API_KEY = your-key-here

# 4. Deploy
# Vercel automatically builds and deploys on every push
```

That's it. Your analyzer will be live at your Vercel domain.

## Architecture

```
User enters URL
      ↓
POST /api/analyze  (app/api/analyze/route.ts)
      ↓
fetch() the target page HTML
      ↓
Cheerio extracts: title, meta description, h1/h2/h3,
  paragraphs, buttons/CTAs
      ↓
Text is cleaned (whitespace normalized, empty lines removed)
      ↓
Cleaned text + analysis prompt → OpenRouter API
                     ↓
            AI returns structured JSON
                     ↓
          Response sent to frontend
                     ↓
       React renders the analysis UI
```

Everything happens in a single API call from the browser. The backend handles scraping, extraction, and AI analysis server-side, so no API keys are exposed to the client.

## Design Decisions

### Structured JSON output instead of chat

The AI is prompted to return a strict JSON schema rather than freeform text. This makes the analysis predictable, machine-readable, and easy to render in a structured UI. Every field has a defined type and shape.

### OpenRouter free models

During development, the tool uses free models available through OpenRouter (no cost per token). This lets you iterate quickly without worrying about API bills. When you're ready for production, you can swap in a higher-quality paid model by changing a single model name in `route.ts`.

### Single API route pattern

Rather than splitting scraping and analysis into separate endpoints, the tool uses one POST endpoint that does everything. This simplifies the frontend to a single fetch call and keeps the request/response lifetime short.