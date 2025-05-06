import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-item')).map(item => ({
        title: item.querySelector('h2')?.textContent?.trim() || '',
        price: item.querySelector('.price')?.textContent?.trim() || '',
        quantity: item.querySelector('select')?.textContent?.trim() || '1',
      }));
    });

    await browser.close();

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = 'your_google_sheet_id_here';
    const sheetRange = 'Sheet1!A1';

    const values = [
      ['Item', 'Price', 'Quantity'],
      ...items.map(item => [item.title, item.price, item.quantity])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    res.status(200).json({ message: 'Data exported' });
  } catch (err) {
    res.status(500).json({ error: 'Scraping failed' });
  }
}