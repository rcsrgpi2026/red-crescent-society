import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/iamehedihsn/red-crescent-society/public/promo-screenshots';
const ARTIFACT_DIR = '/home/iamehedihsn/.gemini/antigravity-ide/brain/2759f918-8b17-4430-a816-91d1f8eb610f/scratch/promo-screenshots';

async function captureSpecial() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/brave-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 430,
    height: 932,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const BASE_URL = 'https://rgpircy.vercel.app';

  // 1. Capture AI Assistant Open & Active
  console.log('Testing AI Assistant Trigger...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Click floating AI bubble
  const clicked = await page.evaluate(() => {
    const bubble = document.querySelector('div[aria-label*="RCY AI Assistant"]') ||
                   document.querySelector('div[title*="RCY AI Assistant"]') ||
                   document.querySelector('button[aria-label*="RCY AI Assistant"]');
    if (bubble) {
      bubble.click();
      return true;
    }
    return false;
  });
  console.log('AI Bubble clicked:', clicked);

  if (clicked) {
    await new Promise((r) => setTimeout(r, 1000));

    // Click a suggestion button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#rcy-ai-assistant-modal button'));
      const bloodBtn = btns.find(b => b.textContent && (b.textContent.includes('active') || b.textContent.includes('রক্ত')));
      if (bloodBtn) {
        bloodBtn.click();
      }
    });

    // Wait for AI response or at least 3 seconds
    await new Promise((r) => setTimeout(r, 4000));

    const p1 = path.join(OUTPUT_DIR, '02_ai_assistant_live.png');
    await page.screenshot({ path: p1, type: 'png' });
    fs.copyFileSync(p1, path.join(ARTIFACT_DIR, '02_ai_assistant_live.png'));
    console.log('Saved 02_ai_assistant_live.png');
  }

  // 2. Capture Blood Request Modal / Form
  console.log('Capturing Emergency Blood Request Form...');
  await page.goto(`${BASE_URL}/blood-support/request`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const pBloodReq = path.join(OUTPUT_DIR, '03_blood_request_form.png');
  await page.screenshot({ path: pBloodReq, type: 'png' });
  fs.copyFileSync(pBloodReq, path.join(ARTIFACT_DIR, '03_blood_request_form.png'));
  console.log('Saved 03_blood_request_form.png');

  // 3. Capture Cinematic 3D Promo Page
  console.log('Capturing 3D Promo Page...');
  await page.goto(`${BASE_URL}/promo`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));
  const pPromo = path.join(OUTPUT_DIR, '00_cinematic_3d_promo.png');
  await page.screenshot({ path: pPromo, type: 'png' });
  fs.copyFileSync(pPromo, path.join(ARTIFACT_DIR, '00_cinematic_3d_promo.png'));
  console.log('Saved 00_cinematic_3d_promo.png');

  // 4. Capture Emergency Page
  console.log('Capturing Emergency Hotlines...');
  await page.goto(`${BASE_URL}/emergency`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const pEmerg = path.join(OUTPUT_DIR, '11_emergency_hotlines.png');
  await page.screenshot({ path: pEmerg, type: 'png' });
  fs.copyFileSync(pEmerg, path.join(ARTIFACT_DIR, '11_emergency_hotlines.png'));
  console.log('Saved 11_emergency_hotlines.png');

  await browser.close();
  console.log('Finished capturing special screens!');
}

captureSpecial().catch(console.error);
