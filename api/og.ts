import type { VercelApiHandler } from '@vercel/node'
import core from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import fetch from 'node-fetch'

const getUrl = (category: string, title?: string) =>
  `https://mooth.tech/og/${category}/${
    title ? encodeURIComponent(title as string) : ''
  }`

const handler: VercelApiHandler = async (req, res) => {
  const { category, title, url: _url } = req.query
  try {
    if (
      typeof category !== 'string' ||
      (Boolean(title) && typeof title !== 'string') ||
      typeof _url !== 'string'
    ) {
      throw new Error('Invalid query')
    }

    const browser = await core.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    })

    const page = await browser.newPage()

    page.setViewport({
      width: 1200,
      height: 630,
    })

    const url =
      typeof _url === 'string' && _url
        ? _url
        : getUrl(category, title as string)
    await page.goto(url, { timeout: 15 * 1000 })
    const data = await page.screenshot({
      type: 'png',
    })
    await browser.close()

    res.setHeader('Cache-Control', 's-maxage=31536000')
    res.setHeader('Content-Type', 'image/png')

    res.end(data)
  } catch (err) {
    console.log('og image -', err)
    res.setHeader('Content-Type', 'image/png')
    const response = await fetch('https://mooth.tech/og.png')
    res.end(await response.buffer())
  }
}

export default handler
