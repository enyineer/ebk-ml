import { LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, ElementHandle } from 'puppeteer';
import { PuppeteerExtra } from 'puppeteer-extra';
import Puppeteer from 'puppeteer';
import adblockPlugin from 'puppeteer-extra-plugin-adblocker';
import { OverviewPage } from './overviewPage';
import { clickAfter, sleep } from './utils';
import { Robots } from '../robots/robots';

type PuppeteerOptions = LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;

type Params = {
  launchOptions?: PuppeteerOptions;
}

export class Crawler {
  private readonly baseUrl = 'https://www.ebay-kleinanzeigen.de';
  private readonly puppeteer: PuppeteerExtra;
  private readonly launchOptions: PuppeteerOptions | undefined;
  private readonly robots: Robots;
  
  constructor(params?: Params) {
    this.puppeteer = new PuppeteerExtra(Puppeteer);
    this.puppeteer.use(adblockPlugin({
        blockTrackersAndAnnoyances: true,
    }));
    this.launchOptions = params?.launchOptions;
    this.robots = new Robots(this.baseUrl);
  }

  async crawl() {
    const browser = await this.puppeteer.launch(this.launchOptions);
    const pages = await browser.pages();
    const page = pages[0];

    const isAllowed = await this.robots.isAllowed(this.baseUrl);

    if (!isAllowed) {
      throw new Error(`Not allowed to crawl ${this.baseUrl}`);
    }

    page.goto(this.baseUrl);

    // https://css-tricks.com/almanac/selectors/a/attribute/
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
    const cookieButton = await page.waitForSelector('button[data-testid="gdpr-banner-accept"]', {
      visible: true,
    });

    if (cookieButton) {
      await clickAfter(cookieButton, 1000);
    }

    const closeLoginButton = await page.waitForSelector('a[class*="overlay-close"]');

    if (closeLoginButton) {
      await clickAfter(closeLoginButton, 1000);
      sleep(1000);
    }
  
    const overviewPage: OverviewPage = new OverviewPage({
      baseUrl: this.baseUrl,
      page,
      pageId: {
        name: 's-autos',
        category: 'c216'
      }
    });

    await overviewPage.crawlOverview();
  }
}
