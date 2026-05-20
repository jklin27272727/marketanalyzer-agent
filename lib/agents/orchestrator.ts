import type { AgentStep, OrchestratorResult } from '../types'
import { scrapeUrl } from './scraper'
import { analyzeContent } from './analyzer'
import { validateAnalysis } from './validator'

const MAX_RETRIES = 2

interface ErrorWithSteps extends Error {
  agentSteps: AgentStep[]
}

function attachSteps(error: Error, steps: AgentStep[]): ErrorWithSteps {
  return Object.assign(error, { agentSteps: steps }) as ErrorWithSteps
}

function getSteps(error: unknown): AgentStep[] {
  return ((error as ErrorWithSteps).agentSteps) || []
}

export async function runAgentLoop(url: string): Promise<OrchestratorResult> {
  const agentSteps: AgentStep[] = []

  try {
    let scraperResult
    try {
      scraperResult = await scrapeUrl(url)
      agentSteps.push(scraperResult.step)
    } catch (error) {
      const scraperStep: AgentStep = (error as Record<string, AgentStep>).step
      if (scraperStep) {
        agentSteps.push(scraperStep)
      }
      throw attachSteps(new Error(error instanceof Error ? error.message : 'Scraping failed'), agentSteps)
    }

    if (!scraperResult.cleanedText) {
      throw attachSteps(new Error('No content could be extracted from the provided URL'), agentSteps)
    }

    const { cleanedText } = scraperResult

    let analyzerResult
    try {
      analyzerResult = await analyzeContent(cleanedText, 1)
      agentSteps.push(analyzerResult.step)
    } catch (error) {
      const analyzerStep: AgentStep = (error as Record<string, AgentStep>).step
      if (analyzerStep) {
        agentSteps.push(analyzerStep)
      }
      throw attachSteps(new Error(error instanceof Error ? error.message : 'Analysis failed'), agentSteps)
    }

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      const validatorResult = await validateAnalysis(analyzerResult.result, cleanedText)
      agentSteps.push(validatorResult.step)

      if (validatorResult.validation.pass) {
        return { result: analyzerResult.result, agentSteps }
      }

      const retryAttempt = retry + 2
      try {
        analyzerResult = await analyzeContent(cleanedText, retryAttempt, validatorResult.validation.feedback)
        agentSteps.push(analyzerResult.step)
      } catch (error) {
        const analyzerStep: AgentStep = (error as Record<string, AgentStep>).step
        if (analyzerStep) {
          agentSteps.push(analyzerStep)
        }
        throw attachSteps(new Error(error instanceof Error ? error.message : 'Analysis retry failed'), agentSteps)
      }
    }

    const finalValidationResult = await validateAnalysis(analyzerResult.result, cleanedText)
    agentSteps.push(finalValidationResult.step)

    return { result: analyzerResult.result, agentSteps }
  } catch (error) {
    if (error instanceof Error && getSteps(error).length > 0) {
      throw error
    }
    throw attachSteps(new Error(error instanceof Error ? error.message : 'Agent loop failed'), agentSteps)
  }
}