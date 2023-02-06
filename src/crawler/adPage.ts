import { AdDetailValue, Extra } from '@prisma/client';
import { Page } from 'puppeteer';
import { Database } from '../database/database';
import { Logger } from '../logger/logger';
import { sleep } from './utils';

export type AdId = {
  slug: string;
  id: string;
}

type Params = {
  baseUrl: string;
  page: Page;
  adId: AdId;
}

export class AdPage {
  private readonly baseUrl: string;
  private readonly page: Page;
  private readonly adId: AdId;
  private readonly client;

  constructor(params: Params) {
    this.baseUrl = params.baseUrl;
    this.page = params.page;
    this.adId = params.adId;
    this.client = Database.client;
  }

  async crawlAd() {
    const url = this.getAdUrl(this.adId);

    await this.page.goto(url);

    const priceElement = await this.page.waitForSelector('h2[id="viewad-price"]');
    let price: string;
    if (priceElement !== null) {
      price = await priceElement.evaluate((element) => {
        const text = element.textContent?.trim();

        if (!text) {
          throw new Error(`Price Element contained no text.`);
        }

        return text;
      });
    } else {
      throw new Error(`Price Element was null.`);
    }

    const priceMatcher = /([\d.]+).*/;
    let matchedPrice = priceMatcher.exec(price);
    if (!matchedPrice) {
      throw new Error('Price contains no numeric value (VB only?).');
    }
    const numericPrice = parseInt(matchedPrice[1].replace('.', ''));

    const viewsElement = await this.page.waitForSelector('span[id="viewad-cntr-num"]');
    let views: number;
    if (viewsElement !== null) {
      views = await viewsElement.evaluate((element) => {
        const text = element.textContent?.trim();
  
        if (!text) {
          throw new Error('Views Element did not contain any text.');
        }
  
        const counter = parseInt(text);
  
        if (Number.isNaN(counter)) {
          throw new Error('Views Element contained non numeric data.');
        }
  
        return counter;
      });
    } else {
      throw new Error(`Views Element was null.`);
    }

    const localityElement = await this.page.waitForSelector('span[id="viewad-locality"]');
    let locality: number;
    if (localityElement !== null) {
      locality = await localityElement.evaluate((element) => {
        const text = element.textContent?.trim();
  
        if (!text) {
          throw new Error('Locality Element did not contain any text.');
        }
  
        const localityMatcher = /(\d+).*/;
        const matches = localityMatcher.exec(text);
  
        if (!matches) {
          throw new Error(`Locality Element text did not match RegExp.`);
        }
  
        return parseInt(matches[1]);
      });
    } else {
      throw new Error('Locality Element was null.');
    }

    const ebkId = await this.page.$$eval('li', (elements) => {
      let foundIdElement: Element | null = null;
      for (const element of elements) {
        const text = element.textContent;
        if (text !== null && text === 'Anzeigen-ID') {
          foundIdElement = element;
        }
      }

      if (!foundIdElement) {
        throw new Error('Did not find any <li> containing "Anzeigen-ID".');
      }

      const sisterElement = foundIdElement.nextElementSibling;

      if (!sisterElement) {
        throw new Error('Did not find any sister Element for <li> "Anzeigen-ID".');
      }

      const sisterElementText = sisterElement.textContent;

      if (!sisterElementText) {
        throw new Error('Sister Element of <li> "Anzeigen-ID" did not contain any text.');
      }

      return sisterElementText;
    });

    // Some sellers don't have dbk ids, we ignore these ads
    let seller: {
      id: string;
      name: string;
    };
    const sellerElement = await this.page.waitForSelector('span > a[href*="/s-bestandsliste.html?userId="]', { timeout: 1000 });
    if (sellerElement !== null) {
      seller = await sellerElement.evaluate((element) => {
        const text = element.textContent?.trim();
        const hrefText = element.getAttribute('href');
  
        if (!text || !hrefText) {
          throw new Error('Seller Element did not contain id or Username.');
        }
  
        const userIdMatcher = /\/s-bestandsliste\.html\?userId=(\d+)/;
        const userIdMatch = userIdMatcher.exec(hrefText);
  
        if (!userIdMatch) {
          throw new Error('Seller Element href did not match User-ID RegEx.');
        }
  
        return {
          id: userIdMatch[1],
          name: text,
        };
      });
    } else {
      throw new Error('Seller Element was null.');
    }

    let sellerRating: number | null = null;
    try {
      const sellerRatingElement = await this.page.waitForSelector('i[class*="userbadge-rating-inline"]', {
        timeout: 1000,
      });

      if (sellerRatingElement !== null) {
        sellerRating = await sellerRatingElement.evaluate((element) => {
          const badgeLevelText = element.getAttribute('badge-level');
    
          if (!badgeLevelText) {
            throw new Error('Badge level attribute was null.');
          }
    
          const badgeLevel = parseInt(badgeLevelText);
    
          if (Number.isNaN(badgeLevel)) {
            throw new Error('Badge level attribute was non numeric.');
          }
    
          return badgeLevel;
        });
      } else {
        throw new Error('Seller Rating Element was null.');
      }
    } catch (err) {
      Logger.logger.debug(`Could not determine seller rating. ${err}`);
    }

    const viewAdContactElement = await this.page.waitForSelector('div[id="viewad-contact"]');
    let isPrivateSeller: boolean;
    if (viewAdContactElement !== null) {
      isPrivateSeller = await viewAdContactElement.evaluate((element) => {
        return element.innerHTML.includes('Privater Nutzer');
      });
    } else {
      throw new Error('Ad Contact Element was null.');
    }

    const detailsListElement = await this.page.waitForSelector('ul[class="addetailslist"]');
    let detailListItems: {
      name: string;
      value: string;
    }[] = [];
    if (detailsListElement) {
      detailListItems = await detailsListElement.$$eval('li', (elements) => {
        const adDetails: {
          name: string;
          value: string;
        }[] = [];
        
        for (const liElement of elements) {
          const firstChildRawValue = liElement.childNodes[0]?.textContent;
          const secondChildRawValue = liElement.childNodes[1]?.textContent;

          if (firstChildRawValue && secondChildRawValue) {
            adDetails.push({
              name: firstChildRawValue.trim(),
              value: secondChildRawValue.trim(),
            });
          }
        }

        return adDetails;
      });
    }

    // The checktaglist is optional, so this could throw an error
    let extraConfigurations: string[] | null = null;
    try {
      const configurationList = await this.page.waitForSelector('ul[class="checktaglist"]', {
        timeout: 1000,
      });

      if (configurationList) {
        extraConfigurations = await configurationList.$$eval('li', (elements) => {
          const extraConfigurations: string[] = [];
          
          for (const liElement of elements) {
            const firstChildRawValue = liElement.childNodes[0]?.textContent;
           
            if (firstChildRawValue) {
              extraConfigurations.push(firstChildRawValue.trim());
            }
          }
  
          return extraConfigurations;
        });
      }
    } catch (err) {
      Logger.logger.debug('No extra configuration found.');
    }

    const sellerData = await this.client.seller.upsert({
      create: {
        ebkId: seller.id,
        isPrivateSeller,
        name: seller.name,
        rating: sellerRating || -1,
      },
      update: {
        name: seller.name,
        isPrivateSeller,
        rating: sellerRating || -1,
      },
      where: {
        ebkId: seller.id,
      }
    });

    const adDatabaseData = {
      ebkId,
      isVB: price.includes('VB'),
      price: numericPrice,
      locationZip: locality,
      slug: this.adId.slug,
      urlId: this.adId.id,
      views,
    }

    const adData = await this.client.ad.upsert({
      create: {
        ...adDatabaseData,
        seller: {
          connect: {
            id: sellerData.id,
          }
        }
      },
      update: adDatabaseData,
      where: {
        ebkId,
      }
    });

    // Remove any old details from ad
    await this.client.adDetailValueEntries.deleteMany({
      where: {
        adId: adData.id,
      }
    });

    const adDetailValues: AdDetailValue[] = [];
    for (const detail of detailListItems) {
      const adDetail = await this.client.adDetail.upsert({
        create: {
          name: detail.name,
        },
        update: {},
        where: {
          name: detail.name,
        }
      });

      const adDetailValue = await this.client.adDetailValue.upsert({
        create: {
          value: detail.value,
          adDetail: {
            connect: {
              id: adDetail.id,
            }
          }
        },
        update: {},
        where: {
          adDetailId_value: {
            adDetailId: adDetail.id,
            value: detail.value,
          }
        }
      });

      adDetailValues.push(adDetailValue);
    }

    await this.client.adDetailValueEntries.createMany({
      data: adDetailValues.map(adDetailValue => {
        return {
          adDetailValueId: adDetailValue.id,
          adId: adData.id,
        }
      }),
    });

    // Remove any old extra configurations from ad
    await this.client.extraEntries.deleteMany({
      where: {
        adId: adData.id,
      }
    });

    if (extraConfigurations !== null) {
      const extras: Extra[] = [];
      for (const extra of extraConfigurations) {
        const extraData = await this.client.extra.upsert({
          create: {
            value: extra
          },
          update: {},
          where: {
            value: extra
          }
        });

        extras.push(extraData);
      }

      await this.client.extraEntries.createMany({
        data: extras.map(extra => {
          return {
            adId: adData.id,
            extraId: extra.id,
          }
        })
      });
    }

    Logger.logger.info(`Finished upserting ad to database.`);

    await sleep(2000);
  }

  private getAdUrl = (adId: AdId) => {
    let url = this.baseUrl;
    url = url.concat('s-anzeige/');
    url = url.concat(`${adId.slug}/`);
    url = url.concat(`${adId.id}`);

    return url;
  }
}