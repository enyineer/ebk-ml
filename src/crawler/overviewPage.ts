import { Page } from 'puppeteer';
import { Logger } from '../logger/logger';
import { Robots } from '../robots/robots';
import { AdId, AdPage } from './adPage';
import { sleep } from '../utils/utils';

type PageId = {
  name: string;
  category: string;
}

type Params = {
  baseUrl: string;
  pageId: PageId;
  page: Page;
}

export class OverviewPage {
  private readonly baseUrl: string;
  private readonly pageId: PageId;
  private readonly page: Page;
  private readonly robots: Robots;

  constructor(params: Params) {
    this.baseUrl = params.baseUrl;
    this.pageId = params.pageId;
    this.page = params.page;
    this.robots = new Robots(this.baseUrl);
  }

  async crawlOverview() {
    for (let i = 1; i <= 50; i++) {
      try {
        await this.crawlAdsForPage(i);
      } catch (err) {
        Logger.logger.error(`Failed crawling page #${i}.`);
        Logger.logger.error(err);
        // Wait before recrawling, website might be down
        await sleep(30000);
      }
      if (i === 50) {
        // Will be 1 on next loop because update condition is called on continue
        i = 0;
        continue;
      }
    }
  }

  async crawlAdsForPage(page: number) {
    const url = this.getOverviewUrl(this.pageId, page);

    const isAllowed = await this.robots.isAllowed(url);

    if (!isAllowed) {
      throw new Error(`Not allowed to crawl ${url}`);
    }

    await this.page.goto(url, {
      waitUntil: 'networkidle0',
    });

    const adHrefs = await this.page.$$eval('article[class="aditem"]', (elements) => {
      const adItemHrefs: string[] = [];
      for (const element of elements) {
        const adItemHref = element.getAttribute('data-href');
        if (adItemHref !== null) {
          if (element.innerHTML.includes('Gesuch')) {
            // Exclude element because it's a search ad
            continue;
          }
          adItemHrefs.push(adItemHref);
        }
      }
      return adItemHrefs;
    });

    const adIds: AdId[] = [];
    const hrefRegex = /\/s-anzeige\/([\w\d-]+)\/([\d-]+)/;
    for (const adHref of adHrefs) {
      const matches = hrefRegex.exec(adHref);
      if (!matches) {
        Logger.logger.error(`Found invalid href: ${adHref}`);
        continue;
      }

      const adId: AdId = {
        slug: matches[1],
        id: matches[2],
      }
      adIds.push(adId);
    }
    
    Logger.logger.info(`Found ${adIds.length} ads on page #${page}.`);

    for (const adId of adIds) {
      const adPage = new AdPage({
        adId,
        baseUrl: this.baseUrl,
        page: this.page,
      });

      Logger.logger.info(`Crawling ad ${adId.slug}/${adId.id} from page #${page}`);

      try {
        await adPage.crawlAd();
      } catch (err) {
        Logger.logger.error(`Failed crawling ${adId.slug}/${adId.id} from page #${page}. URL: ${this.baseUrl}/s-anzeige/${adId.slug}/${adId.id}`);
        Logger.logger.error(err);
      }
    }
  }

  private getOverviewUrl = (pageId: PageId, page?: number) => {
    let url = this.baseUrl;
    url = url.concat(`/${pageId.name}`);
    if (page && page > 1) {
      url = url.concat(`/seite:${page}`);
    }
    url = url.concat(`/${pageId.category}`);

    return url;
  }
}
