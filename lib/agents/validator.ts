import type { AgentStep, AnalysisResult, ValidationResult } from '../types'

const VALIDATOR_MODEL = 'google/gemini-2.0-flash-001'

const VALIDATOR_PROMPT = `You are a quality assurance reviewer for marketing analysis. Your job is to review a marketing analysis JSON output and determine if it meets quality standards.

Check for these criteria:
1. All required fields are present and non-empty: summary, targetAudience, valueProposition, mainClaims, ctaAnalysis, strengths, weaknesses (each with issue + suggestion), competitorComparison, rewrittenHero (headline + subheadline + cta), scores (all 5: clarity, differentiation, credibility, conversionPotential, emotionalAppeal), scoreReasons (all 5).
2. Scores are numbers between 0.0 and 10.0 with one decimal place.
3. Main claims are specific and factual, not generic.
4. Weakness suggestions are concrete and actionable, not vague.
5. The rewritten hero is genuinely improved and benefit-driven, not just slightly reworded.
6. Score reasons are specific bullet points that actually explain the score, not generic statements.
7. Competitor comparison names real inferred competitors, not just generic categories.
8. The analysis appears to actually match the source content, not be generic or hallucinated.

Return ONLY a valid JSON object (no markdown, no code fences):

{
  "pass": boolean,
  "feedback": "string - if pass is false, provide specific, constructive feedback on what needs improvement so the analyzer can regenerate. Keep feedback concise but actionable."
}`

function parseValidationResponse(aiContent: string): ValidationResult {
  const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { pass: true }
  }
  return JSON.parse(jsonMatch[0]) as ValidationResult
}

export interface ValidatorResult {
  validation: ValidationResult
  step: AgentStep
}

export async function validateAnalysis(
  analysisResult: AnalysisResult,
  cleanedText: string
): Promise<ValidatorResult> {
  const startTime = Date.now()

  try {
    const analysisSummary = JSON.stringify({
      summary: analysisResult.summary,
      targetAudience: analysisResult.targetAudience,
      valueProposition: analysisResult.valueProposition,
      mainClaims: analysisResult.mainClaims,
      ctaAnalysis: analysisResult.ctaAnalysis,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      competitorComparison: analysisResult.competitorComparison,
      rewrittenHero: analysisResult.rewrittenHero,
      scores: analysisResult.scores,
      scoreReasons: analysisResult.scoreReasons,
    })

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VALIDATOR_MODEL,
        messages: [
          { role: 'system', content: VALIDATOR_PROMPT },
          {
            role: 'user',
            content: `Source page content:\n${cleanedText.slice(0, 3000)}\n\nAnalysis to validate:\n${analysisSummary}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    })

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text()
      throw new Error(`OpenRouter API error (validator): ${openRouterRes.status} - ${errText}`)
    }

    const aiData = await openRouterRes.json()
    const aiContent = aiData.choices?.[0]?.message?.content

    if (!aiContent) {
      const step: AgentStep = {
        agent: 'validator',
        status: 'completed',
        durationMs: Date.now() - startTime,
        message: 'Validator returned empty response, defaulting to pass',
      }
      return { validation: { pass: true }, step }
    }

    const validation = parseValidationResponse(aiContent)

    const step: AgentStep = {
      agent: 'validator',
      status: 'completed',
      durationMs: Date.now() - startTime,
      message: validation.pass ? 'Validation passed' : `Validation failed: ${validation.feedback?.slice(0, 100)}`,
    }

    return { validation, step }
  } catch (error) {
    const step: AgentStep = {
      agent: 'validator',
      status: 'failed',
      durationMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error during validation',
    }
    return { validation: { pass: true }, step }
  }
}