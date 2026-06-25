import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

let browserInstance: any = null

async function getBrowser() {
  if (browserInstance) {
    return browserInstance
  }

  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } else {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome',
    })
  }

  return browserInstance
}

export async function htmlToPdf(htmlContent: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    })

    return pdf
  } finally {
    await page.close()
  }
}