export interface Scores {
  clarity: number
  differentiation: number
  credibility: number
  conversionPotential: number
  emotionalAppeal: number
}

export interface ScoreReasons {
  clarity: string[]
  differentiation: string[]
  credibility: string[]
  conversionPotential: string[]
  emotionalAppeal: string[]
}

export interface Weakness {
  issue: string
  suggestion: string
}

export interface RewrittenHero {
  headline: string
  subheadline: string
  cta: string
}

export interface AnalysisResult {
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

export interface AgentStep {
  agent: 'scraper' | 'analyzer' | 'validator'
  status: 'completed' | 'failed'
  durationMs: number
  attempt?: number
  message?: string
}

export interface ValidationResult {
  pass: boolean
  feedback?: string
}

export interface OrchestratorResult {
  result: AnalysisResult
  agentSteps: AgentStep[]
}