import type { AgentStep, AnalysisResult } from '../types'

const SYSTEM_PROMPT = `You are a professional marketing analyst. Analyze the following marketing landing page content. Return ONLY a valid JSON object (no markdown, no code fences) with exactly these fields:

{
  "summary": "string - a 2-3 sentence concise summary of what the page offers",
  "targetAudience": "string - be very specific and detailed: include likely demographics, job roles, company size, industry, pain points they are trying to solve, and their likely technical sophistication level",
  "valueProposition": "string - the core value proposition distilled into a single clear statement",
  "mainClaims": ["string - key factual or implied claims the page makes"],
  "ctaAnalysis": "string - critical analysis of the calls to action: are they clear, compelling, well-placed? What could be improved?",
  "strengths": ["string - what this page does well from a marketing perspective"],
  "weaknesses": [
    {
      "issue": "string - the specific problem or weakness",
      "suggestion": "string - a concrete, actionable suggestion to fix it"
    }
  ],
  "competitorComparison": "string - infer 2-3 likely competitors based on the page content and briefly explain how this offering is positioned relative to them",
  "rewrittenHero": {
    "headline": "string - improved hero headline that is more compelling and benefit-driven",
    "subheadline": "string - improved hero subheadline that adds supporting detail",
    "cta": "string - improved CTA button text that is action-oriented and specific"
  },
  "scores": {
    "clarity": number with one decimal (0.0-10.0) - how clearly the page communicates its purpose,
    "differentiation": number with one decimal (0.0-10.0) - how well it stands out from alternatives,
    "credibility": number with one decimal (0.0-10.0) - how trustworthy and authoritative it feels,
    "conversionPotential": number with one decimal (0.0-10.0) - how likely to convert visitors,
    "emotionalAppeal": number with one decimal (0.0-10.0) - how well it connects with user pain points and desires
  },
  "scoreReasons": {
    "clarity": ["string - 2-3 short bullet points explaining the clarity score"],
    "differentiation": ["string - 2-3 short bullet points explaining the differentiation score"],
    "credibility": ["string - 2-3 short bullet points explaining the credibility score"],
    "conversionPotential": ["string - 2-3 short bullet points explaining the conversion score"],
    "emotionalAppeal": ["string - 2-3 short bullet points explaining the emotional appeal score"]
  }
}

Be honest and critical in your analysis. Use specific, actionable language. Each score must have one decimal place.`

const MODEL = 'openrouter/free'
const MAX_TOKENS = 10000
const TEMPERATURE = 0

function buildUserMessage(cleanedText: string, feedback?: string): string {
  if (feedback) {
    return `Your previous analysis had issues. Please regenerate it addressing this feedback:\n\n${feedback}\n\nOriginal page content:\n\n${cleanedText}`
  }
  return `Analyze this marketing page content:\n\n${cleanedText}`
}

function parseAiResponse(aiContent: string): AnalysisResult {
  const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON')
  }
  return JSON.parse(jsonMatch[0]) as AnalysisResult
}

export interface AnalyzerResult {
  result: AnalysisResult
  step: AgentStep
}

export async function analyzeContent(
  cleanedText: string,
  attempt: number,
  feedback?: string
): Promise<AnalyzerResult> {
  const startTime = Date.now()

  try {
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(cleanedText, feedback) },
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      }),
    })

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text()
      throw new Error(`OpenRouter API error: ${openRouterRes.status} - ${errText}`)
    }

    const aiData = await openRouterRes.json()
    const aiContent = aiData.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('Empty response from OpenRouter API')
    }

    const result = parseAiResponse(aiContent)

    const step: AgentStep = {
      agent: 'analyzer',
      status: 'completed',
      durationMs: Date.now() - startTime,
      attempt,
    }

    return { result, step }
  } catch (error) {
    const step: AgentStep = {
      agent: 'analyzer',
      status: 'failed',
      durationMs: Date.now() - startTime,
      attempt,
      message: error instanceof Error ? error.message : 'Unknown error during analysis',
    }
    throw Object.assign(error instanceof Error ? error : new Error('Unknown error during analysis'), { step })
  }
}