import { Crawler } from './crawler'

const main = async () => {
  const puppeteer = new Crawler({
    launchOptions: {
      headless: !(process.env.PUPPETEER_HEADLESS === 'false'),
      args: [`--window-size=1920,1000`],
      defaultViewport: {
        width: 1920,
        height: 1000,
      },
    },
  });

  puppeteer.crawl();
}

main().catch(err => console.error(err));