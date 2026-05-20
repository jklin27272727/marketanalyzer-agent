import { runAgentLoop } from '@/lib/agents/orchestrator'
import type { AgentStep } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'A valid "url" field is required' }, { status: 400 })
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return Response.json({ error: 'Please enter a valid URL starting with http:// or https://' }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return Response.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const { result, agentSteps } = await runAgentLoop(url)

    return Response.json({ ...result, agentSteps })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    const agentSteps: AgentStep[] =
      (error as unknown as Record<string, unknown>).agentSteps as AgentStep[] | undefined || []

    if (message.includes('No content could be extracted')) {
      return Response.json({ error: message, agentSteps }, { status: 422 })
    }

    return Response.json({ error: message, agentSteps }, { status: 500 })
  }
}