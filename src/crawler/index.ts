import { Crawler } from './crawler'

const main = async () => {
  const puppeteer = new Crawler({
    launchOptions: {
      headless: false,
      args: [
        '--start-maximized'
      ]
    }
  });

  puppeteer.crawl();
}

main().catch(err => console.error(err));