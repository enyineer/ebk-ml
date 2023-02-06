import { LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, launch } from 'puppeteer';
import { OverviewPage } from './overviewPage';
import { clickAfter, sleep } from './utils';
import { Robots } from '../robots/robots';
import { PuppeteerBlocker } from '@cliqz/adblocker-puppeteer';
import { readFile, writeFile } from 'fs/promises';

type PuppeteerOptions = LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions;

type Params = {
  launchOptions?: PuppeteerOptions;
}

export class Crawler {
  private readonly baseUrl = 'https://www.ebay-kleinanzeigen.de';
  private readonly launchOptions: PuppeteerOptions | undefined;
  private readonly robots: Robots;
  
  constructor(params?: Params) {
    this.launchOptions = params?.launchOptions;
    this.robots = new Robots(this.baseUrl);
  }

  async crawl() {
    const isAllowed = await this.robots.isAllowed(this.baseUrl);

    if (!isAllowed) {
      throw new Error(`Not allowed to crawl ${this.baseUrl}`);
    }

    const browser = await launch(this.launchOptions);
    const page = await browser.newPage();
    
    const firstPage = (await browser.pages())[0];
    await firstPage.close();

    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch, {
      path: 'adBlockerEngine.bin',
      read: readFile,
      write: writeFile,
    });

    await blocker.enableBlockingInPage(page);

    await page.goto(this.baseUrl);

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
