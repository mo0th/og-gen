import type { VercelApiHandler } from '@vercel/node'
import core from 'puppeteer-core'
import chrome from 'chrome-aws-lambda'
import fetch from 'node-fetch'

const base = 'https://soorria.com/og/'

const getUrl = (query: any): string => {
  const { subtitle, title, url } = query

  if (typeof title === 'string') {
    if (subtitle && typeof subtitle === 'string') {
      return `${base}${title}/${subtitle}`
    }
    return `${base}${title}`
  }

  if (typeof url === 'string') {
    return url
  }

  throw new Error('invalid query')
}

const handler: VercelApiHandler = async (req, res) => {
  try {
    const url = getUrl(req.query)

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

    console.log(`fetching ${url}`)

    const response = await page.goto(url, { timeout: 15 * 1000 })

    if (!response.ok) {
      const err = `Could not get ${url}`
      console.error(err)
      throw new Error(err)
    }


    const data = await page.screenshot({
      type: 'png',
    })
    await browser.close()

    res.setHeader('Cache-Control', 's-maxage=31536000')
    res.setHeader('Content-Type', 'image/png')

    res.end(data)
  } catch (err) {
    console.log('og image -', err)
    res.setHeader('Cache-Control', 's-maxage=0, must-revalidate')
    res.setHeader('Content-Type', 'image/png')
    const response = await fetch('https://soorria.com/og.png')
    res.end(await response.buffer())
  }
}

export default handler
