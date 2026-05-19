'use client'

import { useState } from 'react'

interface Scores {
  clarity: number
  differentiation: number
  credibility: number
  conversionPotential: number
  emotionalAppeal: number
}

interface ScoreReasons {
  clarity: string[]
  differentiation: string[]
  credibility: string[]
  conversionPotential: string[]
  emotionalAppeal: string[]
}

interface Weakness {
  issue: string
  suggestion: string
}

interface RewrittenHero {
  headline: string
  subheadline: string
  cta: string
}

interface AnalysisResult {
  summary: string
  targetAudience: string
  valueProposition: string
  mainClaims: string[]
  ctaAnalysis: string
  strengths: string[]
  weaknesses: Weakness[]
  competitorComparison: string
  rewrittenHero: RewrittenHero
  scores: Scores
  scoreReasons: ScoreReasons
}

function ScoreCard({ label, value, reasons }: { label: string; value: number; reasons: string[] }) {
  const pct = value * 10
  const color =
    value >= 8 ? 'bg-emerald-500' : value >= 6 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-3 h-full">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className="text-3xl font-bold text-zinc-900">{value.toFixed(1)}/10</span>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="text-xs text-zinc-400 space-y-0.5 mt-auto">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-zinc-300 mt-1 shrink-0">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-zinc-200 p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function handleAnalyze() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Something went wrong')
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
            Marketing Page Analyzer
          </h1>
          <p className="text-lg text-zinc-500">
            Paste a landing page URL and get an AI-powered marketing analysis in seconds
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://example.com/landing-page"
            className="flex-1 h-12 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-base"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="h-12 px-6 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Analyzing the page...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Scores</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <ScoreCard label="Clarity" value={result.scores.clarity} reasons={result.scoreReasons?.clarity} />
                <ScoreCard label="Differentiation" value={result.scores.differentiation} reasons={result.scoreReasons?.differentiation} />
                <ScoreCard label="Credibility" value={result.scores.credibility} reasons={result.scoreReasons?.credibility} />
                <ScoreCard label="Conversion" value={result.scores.conversionPotential} reasons={result.scoreReasons?.conversionPotential} />
                <ScoreCard label="Emotional Appeal" value={result.scores.emotionalAppeal} reasons={result.scoreReasons?.emotionalAppeal} />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Summary">
                <p className="text-zinc-700 leading-relaxed">{result.summary}</p>
              </Card>
              <Card title="Target Audience">
                <p className="text-zinc-700 leading-relaxed">{result.targetAudience}</p>
              </Card>
              <Card title="Value Proposition">
                <p className="text-zinc-700 leading-relaxed">{result.valueProposition}</p>
              </Card>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Main Claims">
                <ul className="list-disc list-inside space-y-1">
                  {result.mainClaims.map((claim, i) => (
                    <li key={i} className="text-zinc-700">{claim}</li>
                  ))}
                </ul>
              </Card>
              <Card title="CTA Analysis">
                <p className="text-zinc-700 leading-relaxed">{result.ctaAnalysis}</p>
              </Card>
            </section>

            {result.competitorComparison && (
              <section>
                <Card title="Competitor Comparison">
                  <p className="text-zinc-700 leading-relaxed">{result.competitorComparison}</p>
                </Card>
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Strengths" className="border-emerald-200 bg-emerald-50/50">
                <ul className="list-disc list-inside space-y-1">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-emerald-800">{s}</li>
                  ))}
                </ul>
              </Card>
              <Card title="Weaknesses" className="border-red-200 bg-red-50/50">
                <ul className="space-y-3">
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>
                      <p className="text-red-800 font-medium">{w.issue}</p>
                      <p className="text-red-600/70 text-sm mt-0.5">→ Fix: {w.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section>
              <Card title="Rewritten Hero Section" className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-700">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Headline</span>
                    <p className="text-xl font-bold mt-1">{result.rewrittenHero.headline}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subheadline</span>
                    <p className="text-zinc-300 mt-1">{result.rewrittenHero.subheadline}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">CTA</span>
                    <p className="mt-1 px-4 py-2 bg-white text-zinc-900 rounded-lg font-semibold text-sm w-fit">
                      {result.rewrittenHero.cta}
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}