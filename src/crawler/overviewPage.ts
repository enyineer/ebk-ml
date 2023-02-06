import { Page } from 'puppeteer';
import { Logger } from '../logger/logger';
import { AdId, AdPage } from './adPage';

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

  constructor(params: Params) {
    this.baseUrl = params.baseUrl;
    this.pageId = params.pageId;
    this.page = params.page;
  }

  async crawlOverview() {
    for (let i = 1; i <= 50; i++) {
      try {
        await this.crawlAdsForPage(i);
      } catch (err) {
        console.error(`Failed crawling page #${i}. ${err}`);
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
    await this.page.goto(url);

    const adHrefs = await this.page.$$eval('article[class="aditem"]', (elements) => {
      const adItemHrefs: string[] = [];
      for (const element of elements) {
        const adItemHref = element.getAttribute('data-href');
        if (adItemHref !== null) {
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
        Logger.logger.error(`Failed crawling ${adId.slug}/${adId.id} from page #${page}. ${err}`);
      }
    }
  }

  private getOverviewUrl = (pageId: PageId, page?: number) => {
    let url = this.baseUrl;
    url = url.concat(`${pageId.name}/`);
    if (page && page > 1) {
      url = url.concat(`seite:${page}/`);
    }
    url = url.concat(`${pageId.category}`);

    return url;
  }
}