// Captures real mobile (430x932 @2x) screenshots of the live site for the promo video.
// Usage: node scripts/capture-promo-screenshots.mjs [outDir]
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const BASE = "https://rgpircy.vercel.app";
const OUT = process.argv[2] || "promo-screenshots";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/brave-browser",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function go(route) {
  await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(1500);
  await dismissPopup();
}

async function dismissPopup() {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /Got it|Close/.test(b.textContent || "") && b.closest('[role="dialog"]'));
    btn?.click();
  });
  await sleep(600);
}

async function shot(name, { full = false } = {}) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: full });
  console.log("saved", name);
}

async function scrollToSelector(sel, offset = 0) {
  await page.evaluate((s, o) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o);
  }, sel, offset);
  await sleep(1200);
}

async function firstLink(prefix) {
  return page.evaluate((p) => {
    const a = [...document.querySelectorAll("a[href]")].find((x) => {
      const h = x.getAttribute("href");
      return h.startsWith(p) && h.length > p.length;
    });
    return a?.getAttribute("href") || null;
  }, prefix);
}

const run = async (label, fn) => {
  try { await fn(); } catch (e) { console.warn("FAILED", label, e.message); }
};

// 1. Home: hero, stats/about, founders, community tree
await run("home", async () => {
  await go("/");
  await shot("01_home_hero.png");
  await page.evaluate(() => window.scrollBy(0, 900)); await sleep(1200);
  await shot("02_home_stats_about.png");
  await scrollToSelector("#founders", 70);
  await shot("03_home_founders.png");
  await scrollToSelector("#community", 70);
  await shot("04_community_tree_top.png");
  await page.evaluate(() => window.scrollBy(0, 850)); await sleep(1200);
  await shot("05_community_tree_levels.png");
});

// 2. Activity detail + founder profile (links found on home page)
await run("activity+founder", async () => {
  await go("/");
  const act = await firstLink("/activities/");
  const founder = await firstLink("/founders/");
  if (act) { await go(act); await shot("06_activity_detail.png"); }
  if (founder) { await go(founder); await shot("07_founder_profile.png"); }
});

// 3. AI assistant actually open with a live answer
await run("ai", async () => {
  await go("/");
  await page.evaluate(() => {
    document.querySelector('[aria-label^="RCY AI Assistant"]')?.click();
  });
  await sleep(1200);
  await shot("08_ai_assistant_open.png");
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll("#rcy-ai-assistant-modal button")];
    chips.find((b) => (b.textContent || "").includes("Volunteer"))?.click();
  });
  await sleep(12000);
  await shot("09_ai_assistant_answer.png");
});

// 4. Blood support
await run("blood", async () => {
  await go("/blood-support");
  await shot("10_blood_support_top.png");
  await page.evaluate(() => window.scrollBy(0, 700)); await sleep(1000);
  await shot("11_blood_requests_and_donors.png");
  await go("/blood-support/request");
  await shot("12_blood_request_form.png");
});

// 5. Gallery, events, notices, training, legacy, team
await run("gallery", async () => {
  await go("/gallery");
  await shot("13_gallery.png");
  const album = await firstLink("/gallery/");
  if (album) { await go(album); await shot("14_gallery_album.png"); }
});
await run("events", async () => { await go("/events"); await shot("15_events.png"); });
await run("notices", async () => { await go("/notices"); await shot("16_notices.png"); });
await run("training", async () => { await go("/training"); await shot("17_training.png"); });
await run("legacy", async () => {
  await go("/legacy-members");
  await shot("18_legacy_members.png");
  await page.evaluate(() => window.scrollBy(0, 800)); await sleep(1000);
  await shot("19_legacy_members_cards.png");
});
await run("team", async () => { await go("/team"); await shot("20_team.png"); });

// 6. Join / auth / emergency / contact
await run("apply", async () => { await go("/apply-volunteer"); await shot("21_apply_volunteer.png"); });
await run("login", async () => { await go("/volunteer/login"); await shot("22_volunteer_login.png"); });
await run("student", async () => { await go("/student/login"); await shot("23_student_login.png"); });
await run("forgot", async () => { await go("/forgot-password"); await shot("24_forgot_password.png"); });
await run("emergency", async () => { await go("/emergency"); await shot("25_emergency.png"); });
await run("contact", async () => { await go("/contact"); await shot("26_contact.png"); });

await browser.close();
console.log("done");
