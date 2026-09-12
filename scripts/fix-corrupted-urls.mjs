import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFix() {
  console.log("=== CHECKING FOR CORRUPTED NESTED URLS ===");

  // 1. website_settings
  const { data: settings } = await supabase.from("website_settings").select("*");
  for (const s of settings || []) {
    let rawStr = JSON.stringify(s.value);
    // Find any repeated https://res.cloudinary.com
    if (rawStr.includes("https://res.cloudinary.com") && rawStr.includes("https://res.cloudinary.com/qodkphsw/image/upload/f_auto,q_auto/v")) {
      console.log(`Checking website_settings: ${s.key}`);
      // Regex to extract the innermost valid Cloudinary URL or clean it
      // Matches pattern where an entire Cloudinary URL was prefixed to another
      // e.g. https://res.cloudinary.com/.../red-crescent/https://res.cloudinary.com/.../filename.webp
      let fixedStr = rawStr;
      
      // Fix nested cloudinary URLs: replace any "https://res.cloudinary.com/.../red-crescent/(https://res.cloudinary.com/.*)" with the inner one
      while (fixedStr.includes("/red-crescent/https://")) {
        fixedStr = fixedStr.replace(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^\/]+\/red-crescent\/https:\/\//g, "https://");
      }
      while (fixedStr.includes("/id-card/https://")) {
        fixedStr = fixedStr.replace(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^\/]+\/red-crescent\/id-card\/https:\/\//g, "https://");
      }
      while (fixedStr.includes("/logos/https://")) {
        fixedStr = fixedStr.replace(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^\/]+\/red-crescent\/logos\/https:\/\//g, "https://");
      }

      if (fixedStr !== rawStr) {
        console.log(`Fixing corrupted URLs in website_settings -> ${s.key}`);
        const parsed = JSON.parse(fixedStr);
        await supabase.from("website_settings").update({ value: parsed }).eq("key", s.key);
      }
    }
  }

  // Check team_members
  const { data: team } = await supabase.from("team_members").select("id, name, photo_url");
  for (const t of team || []) {
    if (t.photo_url && t.photo_url.includes("/red-crescent/https://")) {
      console.log(`Corrupted photo_url in team_members: ${t.name}`);
      let fixed = t.photo_url;
      while (fixed.includes("/red-crescent/https://")) {
        fixed = fixed.replace(/https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/[^\/]+\/red-crescent\/https:\/\//g, "https://");
      }
      await supabase.from("team_members").update({ photo_url: fixed }).eq("id", t.id);
    }
  }

  // Verify the cleaned id_card in website_settings
  const { data: cleanIdCard } = await supabase.from("website_settings").select("*").eq("key", "id_card").single();
  console.log("\nCleaned id_card config:");
  const cfg = JSON.parse(cleanIdCard.value.config);
  console.log("instituteLogo:", cfg.logos?.instituteLogo?.src);
  console.log("redCrescentLogo:", cfg.logos?.redCrescentLogo?.src);
  console.log("watermark:", cfg.watermark?.src);
}

checkAndFix().catch(console.error);
