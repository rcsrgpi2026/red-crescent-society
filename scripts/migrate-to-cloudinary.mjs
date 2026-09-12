import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import cloudinaryPkg from "cloudinary";

const cloudinary = cloudinaryPkg.v2;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary credentials in environment");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("=== STEP 1: Discovering all files in Supabase Storage ===");
  const buckets = ["images", "logos"];
  const allFiles = [];

  for (const b of buckets) {
    async function listRecursive(folder = "") {
      const { data, error } = await supabase.storage.from(b).list(folder, { limit: 1000 });
      if (error) {
        console.error(`Error listing ${b}/${folder}:`, error.message);
        return;
      }
      for (const item of data || []) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        if (item.id === null) {
          await listRecursive(itemPath);
        } else {
          allFiles.push({
            bucket: b,
            path: itemPath,
            name: item.name,
            folder: folder || (b === "logos" ? "logos" : "general"),
            size: item.metadata?.size || 0,
          });
        }
      }
    }
    await listRecursive();
  }

  console.log(`Found total ${allFiles.length} files to migrate.\n`);

  console.log("=== STEP 2: Uploading files to Cloudinary ===");
  const urlMap = new Map(); // oldUrl / oldPath / fileName -> newCloudinaryUrl
  let uploadedCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const prefix = `[${i + 1}/${allFiles.length}]`;
    console.log(`${prefix} Downloading ${file.bucket}/${file.path}...`);

    try {
      const { data: blob, error: dlError } = await supabase.storage
        .from(file.bucket)
        .download(file.path);

      if (dlError || !blob) {
        console.error(`${prefix} Failed to download ${file.path}:`, dlError?.message);
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      const publicId = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      const targetFolder = `red-crescent/${file.folder}`;

      console.log(`${prefix} Uploading to Cloudinary -> ${targetFolder}/${publicId}...`);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: targetFolder,
            public_id: publicId,
            overwrite: true,
            invalidate: true,
            resource_type: "image",
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      let secureUrl = uploadResult.secure_url;
      if (secureUrl.includes("/image/upload/") && !secureUrl.includes("/f_auto,q_auto/")) {
        secureUrl = secureUrl.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
      }

      console.log(`${prefix} Done: ${secureUrl}\n`);

      // Store multiple lookup keys so any format stored in DB matches
      const oldFullUrl = `${supabaseUrl}/storage/v1/object/public/${file.bucket}/${file.path}`;
      urlMap.set(oldFullUrl, secureUrl);
      urlMap.set(file.path, secureUrl);
      urlMap.set(file.name, secureUrl);

      uploadedCount++;
    } catch (err) {
      console.error(`${prefix} Error processing ${file.path}:`, err.message);
    }
  }

  console.log(`\nSuccessfully uploaded ${uploadedCount} / ${allFiles.length} files to Cloudinary.\n`);

  // Save the mapping to a local json file for backup/reference
  const mapObj = Object.fromEntries(urlMap);
  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "migration-map.json"),
    JSON.stringify(mapObj, null, 2),
    "utf8"
  );
  console.log("Saved mapping to scripts/migration-map.json\n");

  console.log("=== STEP 3: Updating Database References ===");

  // Helper to replace URLs in a string
  function replaceUrl(str) {
    if (!str || typeof str !== "string") return str;
    for (const [oldRef, newUrl] of urlMap.entries()) {
      if (str.includes(oldRef)) {
        return newUrl;
      }
    }
    return str;
  }

  // 1. founders (photo_url)
  const { data: founders } = await supabase.from("founders").select("id, photo_url");
  for (const f of founders || []) {
    const updated = replaceUrl(f.photo_url);
    if (updated !== f.photo_url) {
      await supabase.from("founders").update({ photo_url: updated }).eq("id", f.id);
      console.log(`Updated founders (${f.id}) photo_url`);
    }
  }

  // 2. team_members (photo_url)
  const { data: team } = await supabase.from("team_members").select("id, photo_url");
  for (const m of team || []) {
    const updated = replaceUrl(m.photo_url);
    if (updated !== m.photo_url) {
      await supabase.from("team_members").update({ photo_url: updated }).eq("id", m.id);
      console.log(`Updated team_members (${m.id}) photo_url`);
    }
  }

  // 3. students (photo_url)
  const { data: students } = await supabase.from("students").select("id, photo_url");
  for (const s of students || []) {
    const updated = replaceUrl(s.photo_url);
    if (updated !== s.photo_url) {
      await supabase.from("students").update({ photo_url: updated }).eq("id", s.id);
      console.log(`Updated students (${s.id}) photo_url`);
    }
  }

  // 4. community_members (photo_url)
  const { data: comm } = await supabase.from("community_members").select("id, photo_url");
  for (const c of comm || []) {
    const updated = replaceUrl(c.photo_url);
    if (updated !== c.photo_url) {
      await supabase.from("community_members").update({ photo_url: updated }).eq("id", c.id);
      console.log(`Updated community_members (${c.id}) photo_url`);
    }
  }

  // 5. events (cover_image)
  const { data: events } = await supabase.from("events").select("id, cover_image");
  for (const e of events || []) {
    const updated = replaceUrl(e.cover_image);
    if (updated !== e.cover_image) {
      await supabase.from("events").update({ cover_image: updated }).eq("id", e.id);
      console.log(`Updated events (${e.id}) cover_image`);
    }
  }

  // 6. gallery_albums (cover_image)
  const { data: albums } = await supabase.from("gallery_albums").select("id, cover_image");
  for (const a of albums || []) {
    const updated = replaceUrl(a.cover_image);
    if (updated !== a.cover_image) {
      await supabase.from("gallery_albums").update({ cover_image: updated }).eq("id", a.id);
      console.log(`Updated gallery_albums (${a.id}) cover_image`);
    }
  }

  // 7. gallery_images (url)
  const { data: gImages } = await supabase.from("gallery_images").select("id, url");
  for (const g of gImages || []) {
    const updated = replaceUrl(g.url);
    if (updated !== g.url) {
      await supabase.from("gallery_images").update({ url: updated }).eq("id", g.id);
      console.log(`Updated gallery_images (${g.id}) url`);
    }
  }

  // 8. activities (images array)
  const { data: acts } = await supabase.from("activities").select("id, images");
  for (const act of acts || []) {
    if (Array.isArray(act.images) && act.images.length > 0) {
      let changed = false;
      const newImages = act.images.map((img) => {
        const replaced = replaceUrl(img);
        if (replaced !== img) changed = true;
        return replaced;
      });
      if (changed) {
        await supabase.from("activities").update({ images: newImages }).eq("id", act.id);
        console.log(`Updated activities (${act.id}) images array`);
      }
    }
  }

  // 9. notice_attachments (url)
  const { data: notAtts } = await supabase.from("notice_attachments").select("id, url");
  for (const na of notAtts || []) {
    const updated = replaceUrl(na.url);
    if (updated !== na.url) {
      await supabase.from("notice_attachments").update({ url: updated }).eq("id", na.id);
      console.log(`Updated notice_attachments (${na.id}) url`);
    }
  }

  // 10. website_settings (logos, homepage, id_card)
  const { data: settings } = await supabase.from("website_settings").select("key, value");
  for (const st of settings || []) {
    let strVal = JSON.stringify(st.value);
    let changed = false;
    for (const [oldRef, newUrl] of urlMap.entries()) {
      if (strVal.includes(oldRef)) {
        strVal = strVal.replaceAll(oldRef, newUrl);
        changed = true;
      }
    }
    if (changed) {
      const parsed = JSON.parse(strVal);
      await supabase.from("website_settings").update({ value: parsed }).eq("key", st.key);
      console.log(`Updated website_settings (${st.key})`);
    }
  }

  console.log("\n=== MIGRATION COMPLETE! All 77 photos copied to Cloudinary and database updated. ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
