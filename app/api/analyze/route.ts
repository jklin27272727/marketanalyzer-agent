import * as cheerio from 'cheerio'

export const maxDuration = 60

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
    $('h1').each((_, el) => { h1Texts.push($(el).text().trim()) })

    const h2Texts: string[] = []
    $('h2').each((_, el) => { h2Texts.push($(el).text().trim()) })

    const h3Texts: string[] = []
    $('h3').each((_, el) => { h3Texts.push($(el).text().trim()) })

    const paragraphTexts: string[] = []
    $('p').each((_, el) => { paragraphTexts.push($(el).text().trim()) })

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

    const systemPrompt = `You are a professional marketing analyst. Analyze the following marketing landing page content. Return ONLY a valid JSON object (no markdown, no code fences) with exactly these fields:

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
        max_tokens: 10000,
        temperature: 0,
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

    let result
    try {
      // Remove markdown fences if present
      const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      // Try extracting JSON object
      const start = aiContent.indexOf('{')
      const end = aiContent.lastIndexOf('}')
      if (start === -1 || end === -1) {
        throw new Error('Failed to parse AI response as JSON')
      }
      result = JSON.parse(aiContent.slice(start, end + 1))
    }

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return Response.json({ error: message }, { status: 500 })
  }
}