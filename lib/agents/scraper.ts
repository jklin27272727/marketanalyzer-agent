import * as cheerio from 'cheerio'
import type { AgentStep } from '../types'

export interface ScraperResult {
  cleanedText: string
  step: AgentStep
}

export async function scrapeUrl(url: string): Promise<ScraperResult> {
  const startTime = Date.now()

  try {
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

    const step: AgentStep = {
      agent: 'scraper',
      status: 'completed',
      durationMs: Date.now() - startTime,
    }

    return { cleanedText, step }
  } catch (error) {
    const step: AgentStep = {
      agent: 'scraper',
      status: 'failed',
      durationMs: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error during scraping',
    }
    throw Object.assign(error instanceof Error ? error : new Error('Unknown error during scraping'), { step })
  }
}