import * as cheerio from 'cheerio'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'A valid "url" field is required' }, { status: 400 })
    }

    const html = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketingAnalyzer/1.0)',
      },
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`)
      }
      return res.text()
    })

    const $ = cheerio.load(html)

    const title = $('title').text().trim()
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || ''

    const h1Texts: string[] = []
    $('h1').each((_, el) => h1Texts.push($(el).text().trim()))

    const h2Texts: string[] = []
    $('h2').each((_, el) => h2Texts.push($(el).text().trim()))

    const h3Texts: string[] = []
    $('h3').each((_, el) => h3Texts.push($(el).text().trim()))

    const paragraphTexts: string[] = []
    $('p').each((_, el) => paragraphTexts.push($(el).text().trim()))

    const ctaTexts: string[] = []
    $('button, a[role="button"], .btn, .cta, [class*="button"], [class*="cta"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text) ctaTexts.push(text)
    })

    const allText = [
      `Title: ${title}`,
      `Meta Description: ${metaDescription}`,
      h1Texts.length ? `H1 Headings:\n${h1Texts.join('\n')}` : null,
      h2Texts.length ? `H2 Headings:\n${h2Texts.join('\n')}` : null,
      h3Texts.length ? `H3 Headings:\n${h3Texts.join('\n')}` : null,
      paragraphTexts.length ? `Paragraphs:\n${paragraphTexts.join('\n')}` : null,
      ctaTexts.length ? `Buttons/CTAs:\n${ctaTexts.join('\n')}` : null,
    ]
      .filter(Boolean)
      .join('\n\n')

    const cleanedText = allText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

    if (!cleanedText) {
      return Response.json({ error: 'No content could be extracted from the provided URL' }, { status: 422 })
    }

    const systemPrompt = `You are a marketing analyst expert. Analyze the following extracted content from a marketing landing page. Return ONLY a valid JSON object (no markdown, no code fences) with exactly these fields:

{
  "summary": "string - a 2-3 sentence summary of the marketing page",
  "targetAudience": "string - who this page is targeting",
  "valueProposition": "string - the core value proposition",
  "mainClaims": ["string - key claims made"],
  "ctaAnalysis": "string - analysis of the calls to action",
  "strengths": ["string - marketing strengths"],
  "weaknesses": ["string - marketing weaknesses"],
  "rewrittenHero": {
    "headline": "string - improved hero headline",
    "subheadline": "string - improved hero subheadline",
    "cta": "string - improved CTA button text"
  },
  "scores": {
    "clarity": number 1-10,
    "differentiation": number 1-10,
    "credibility": number 1-10,
    "conversionPotential": number 1-10
  }
}`

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this marketing page content:\n\n${cleanedText}` },
        ],
        max_tokens: 2000,
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

    const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const result = JSON.parse(jsonMatch[0])

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return Response.json({ error: message }, { status: 500 })
  }
}