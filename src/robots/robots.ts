import robotsParser, { Robot } from 'robots-parser';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Logger } from '../logger/logger';

export class Robots {
  private url: string;
  private static parser: Robot | undefined;

  constructor(baseUrl: string) {
    this.url = `${baseUrl}/robots.txt`;
  }

  async isAllowed(url: string, userAgent = '*') {
    if (Robots.parser === undefined) {
      let robotsTxt: string;
      const res = await fetch(this.url);
      if (res.ok) {
        robotsTxt = await res.text();
      } else {
        Logger.logger.warn(`Falling back to local robots.txt because status from server was: ${res.status}`);
        robotsTxt = (await readFile(resolve('./robots.txt'))).toString();
      }
      Robots.parser = robotsParser(this.url, robotsTxt);
    }

    const isAllowedRes = Robots.parser.isAllowed(url, userAgent);

    if (isAllowedRes === undefined) {
      throw new Error(`${url} is not valid for robots.txt from ${this.url}`);
    }

    return isAllowedRes;
  }
}