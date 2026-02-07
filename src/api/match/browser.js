import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const isProd = process.env.NODE_ENV === "production";

export async function getBrowser() {
  if (isProd) {
    // ✅ PROD (Vercel): puppeteer-core + sparticuz
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  } else {
    // ✅ LOCAL: puppeteer brings its own Chrome
    return puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 800 },
    });
  }
}
