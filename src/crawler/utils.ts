import { ElementHandle } from 'puppeteer';

export const clickAfter = async (handle: ElementHandle, ms: number) => {
  await sleep(ms);
  await handle.click();
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      resolve(ms);
    }, ms);
  });
}