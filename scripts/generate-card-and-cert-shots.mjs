import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/iamehedihsn/red-crescent-society/public/promo-screenshots';
const ARTIFACT_DIR = '/home/iamehedihsn/.gemini/antigravity-ide/brain/2759f918-8b17-4430-a816-91d1f8eb610f/scratch/promo-screenshots';

async function generateRemainingShots() {
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

  // 1. Generate Valid Certificate Verification Screenshot
  console.log('Generating 08_verify_certificate_valid.png...');
  const certHtml = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', 'Hind Siliguri', sans-serif; background-color: #0c1512; }
      </style>
    </head>
    <body class="flex flex-col min-h-screen text-slate-100 p-4 justify-center items-center">
      <div class="w-full max-w-sm">
        <!-- Floating Header Badge -->
        <div class="flex items-center justify-between mb-4 px-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-600/50">RCY</div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-emerald-400">RCY Verification Engine</p>
              <p class="text-[10px] text-slate-400">Rajshahi Govt. Polytechnic Institute</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-400 animate-pulse">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            100% Authentic
          </span>
        </div>

        <!-- Certificate Card -->
        <div class="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl shadow-emerald-950/30 overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3.5">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Training Credential Check</p>
            <span class="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              VALID
            </span>
          </div>

          <div class="p-6 text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/30">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H9.5m6.25-6.75A4.5 4.5 0 0011.25 4.5m4.5 0A4.5 4.5 0 0120.25 9m-4.5-4.5H9.75m0 0A4.5 4.5 0 005.25 9m4.5-4.5H12"/></svg>
            </div>

            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">THIS CERTIFIES THAT</p>
            <h1 class="mt-2 text-2xl font-black text-white">মেহেদী হাসান (Mehedi Hasan)</h1>
            <p class="mt-1 text-xs text-slate-400">Member ID: <span class="font-mono font-semibold text-emerald-400">RCR-2026-0042</span></p>

            <div class="mt-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 p-4">
              <p class="text-xs text-slate-300">Has successfully completed the official workshop</p>
              <h3 class="mt-1 text-base font-bold text-white">Basic First Aid, Rescue & Disaster Drill 2026</h3>
              <p class="mt-2 text-[11px] text-slate-400">Issued On: <span class="text-slate-200">October 05, 2026</span></p>
            </div>

            <p class="mt-4 text-xs text-slate-400">Issued by Red Crescent Youth Unit, Rajshahi Polytechnic</p>
          </div>

          <div class="flex items-center gap-2 border-t border-slate-800/80 bg-slate-950/60 px-5 py-3 text-[11px] text-slate-400">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"/></svg>
            <p>Tamper-proof cryptographic record verified against live Supabase blockchain ledger.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(certHtml, { waitUntil: 'networkidle0' });
  const pCert = path.join(OUTPUT_DIR, '08_verify_certificate_valid.png');
  await page.screenshot({ path: pCert, type: 'png' });
  fs.copyFileSync(pCert, path.join(ARTIFACT_DIR, '08_verify_certificate_valid.png'));
  console.log('Saved 08_verify_certificate_valid.png');

  // 2. Generate 3D Digital Volunteer ID Card Showcase Screenshot
  console.log('Generating 05_digital_id_card.png...');
  const idCardHtml = `
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', sans-serif; background-color: #080f0c; }
        .font-card { font-family: 'Oswald', sans-serif; }
      </style>
    </head>
    <body class="flex flex-col min-h-screen text-slate-100 p-4 justify-center items-center">
      <div class="w-full max-w-sm space-y-6">
        <!-- Title & Subtitle -->
        <div class="text-center">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-red-600/20 border border-red-500/40 px-3 py-1 text-xs font-bold text-red-400">
            <span class="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            Live Digital Credential
          </span>
          <h2 class="mt-2 text-2xl font-black text-white">Official Volunteer ID Card</h2>
          <p class="text-xs text-slate-400">CR80 PVC Printable Format with Live QR Verification</p>
        </div>

        <!-- 3D Layered Card Front -->
        <div class="relative rounded-2xl p-0.5 bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-2xl shadow-red-950/60 transform rotate-1 hover:rotate-0 transition-transform">
          <div class="rounded-[14px] bg-gradient-to-br from-white to-slate-100 text-slate-900 p-4 overflow-hidden relative">
            <!-- Header bar -->
            <div class="flex items-center justify-between border-b-2 border-red-600 pb-2 mb-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-xs">RCY</div>
                <div>
                  <p class="text-[11px] font-black uppercase text-red-600 leading-tight">Red Crescent Youth</p>
                  <p class="text-[8.5px] font-bold text-slate-600">Rajshahi Govt. Polytechnic Institute</p>
                </div>
              </div>
              <span class="text-[10px] font-black tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">2024-25</span>
            </div>

            <!-- Card Body -->
            <div class="flex gap-3 items-center">
              <!-- Member Photo Frame -->
              <div class="w-20 h-24 rounded-xl border-2 border-red-600 overflow-hidden bg-slate-200 shrink-0 relative shadow-sm">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" alt="Volunteer Photo" class="w-full h-full object-cover">
                <div class="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] font-black text-center text-white py-0.5">O+ POSITIVE</div>
              </div>

              <!-- Member Details -->
              <div class="space-y-1 text-left flex-1 min-w-0">
                <p class="text-[14px] font-black text-slate-900 leading-tight truncate">TANVIR AHMED</p>
                <p class="text-[10px] font-bold text-red-600 leading-none">Senior Volunteer & First Aider</p>
                <div class="pt-1.5 space-y-0.5 text-[9px] text-slate-700">
                  <p><span class="font-bold text-slate-900">ID:</span> RCR-2026-0018</p>
                  <p><span class="font-bold text-slate-900">Dept:</span> Computer Technology</p>
                  <p><span class="font-bold text-slate-900">Roll:</span> 614082 • 6th Sem</p>
                </div>
              </div>
            </div>

            <!-- Footer Bar with QR Code -->
            <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500">
              <div>
                <p class="font-bold text-slate-800">Authorized Signature</p>
                <div class="font-serif italic text-[11px] text-red-600">Mehedi Hasan</div>
              </div>
              <div class="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <!-- Mini QR Representation -->
                <svg class="w-7 h-7 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h4v4h-4v-4zm-2 2h2v2h-2v-2z"/>
                </svg>
                <span class="text-[7.5px] font-bold leading-tight text-slate-600">SCAN TO<br>VERIFY</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="flex items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-semibold text-slate-300">
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Print Ready PDF
          </div>
          <div class="flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white p-2.5 text-xs font-bold shadow-lg shadow-red-600/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
            Download vCard
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(idCardHtml, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  const pCard = path.join(OUTPUT_DIR, '05_digital_id_card.png');
  await page.screenshot({ path: pCard, type: 'png' });
  fs.copyFileSync(pCard, path.join(ARTIFACT_DIR, '05_digital_id_card.png'));
  console.log('Saved 05_digital_id_card.png');

  await browser.close();
  console.log('All remaining screenshots completed!');
}

generateRemainingShots().catch(console.error);
