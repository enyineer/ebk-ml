import robotsParser, { Robot } from 'robots-parser';

export class Robots {
  private url: string;
  private static parser: Robot | null;

  constructor(baseUrl: string) {
    this.url = `${baseUrl}/robots.txt`;
    Robots.parser = null;
  }

  async isAllowed(url: string, userAgent = '*') {
    if (Robots.parser === null) {
      const res = await fetch(this.url);
      if (!res.ok) {
        throw new Error(`Could not read robots.txt from ${this.url}`);
      }
      const robotsTxt = await res.text();
      Robots.parser = robotsParser(this.url, robotsTxt);
    }

    const isAllowedRes = Robots.parser.isAllowed(url, userAgent);

    if (isAllowedRes === undefined) {
      throw new Error(`${url} is not valid for robots.txt from ${this.url}`);
    }

    return isAllowedRes;
  }
}