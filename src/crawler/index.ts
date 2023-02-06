import { Crawler } from './crawler'

const main = async () => {
  const puppeteer = new Crawler({
    launchOptions: {
      headless: process.env.PUPPETEER_HEADLESS === 'true',
      args: [
        '--start-maximized'
      ],
    }
  });

  puppeteer.crawl();
}

main().catch(err => console.error(err));