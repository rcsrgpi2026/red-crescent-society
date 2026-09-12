import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function audit() {
  console.log("=== 1. FETCHING ALL IMAGE REFERENCES IN DATABASE ===");
  const dbImages = new Map(); // token -> array of occurrences

  function addRef(url, table, id, extra = {}) {
    if (!url || typeof url !== "string") return;
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const filename = cleanUrl.split("/").pop()?.split("?")[0];
    const info = { table, id, url: cleanUrl, ...extra };

    // Register full URL, path, and filename
    if (!dbImages.has(cleanUrl)) dbImages.set(cleanUrl, []);
    dbImages.get(cleanUrl).push(info);

    if (filename) {
      if (!dbImages.has(filename)) dbImages.set(filename, []);
      dbImages.get(filename).push(info);
    }
  }

  // 1. team_members
  const { data: team } = await supabase
    .from("team_members")
    .select("id, name, photo_url, status, public_profile");
  for (const t of team || []) {
    if (t.photo_url)
      addRef(t.photo_url, "team_members", t.id, {
        name: t.name,
        status: t.status,
        public_profile: t.public_profile,
      });
  }

  // 2. students
  const { data: students } = await supabase
    .from("students")
    .select("id, name, photo_url");
  for (const s of students || []) {
    if (s.photo_url) addRef(s.photo_url, "students", s.id, { name: s.name });
  }

  // 3. founders
  const { data: founders } = await supabase
    .from("founders")
    .select("id, name, photo_url, is_active");
  for (const f of founders || []) {
    if (f.photo_url)
      addRef(f.photo_url, "founders", f.id, {
        name: f.name,
        is_active: f.is_active,
      });
  }

  // 4. community_members
  const { data: comm } = await supabase
    .from("community_members")
    .select("id, name, photo_url, is_active");
  for (const c of comm || []) {
    if (c.photo_url)
      addRef(c.photo_url, "community_members", c.id, {
        name: c.name,
        is_active: c.is_active,
      });
  }

  // 5. events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, cover_image, status");
  for (const e of events || []) {
    if (e.cover_image)
      addRef(e.cover_image, "events", e.id, {
        title: e.title,
        status: e.status,
      });
  }

  // 6. activities
  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, images");
  for (const a of activities || []) {
    for (const img of a.images || []) {
      addRef(img, "activities", a.id, { title: a.title });
    }
  }

  // 7. gallery_albums
  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("id, title, cover_image");
  for (const a of albums || []) {
    if (a.cover_image)
      addRef(a.cover_image, "gallery_albums", a.id, { title: a.title });
  }

  // 8. gallery_images
  const { data: gImages } = await supabase
    .from("gallery_images")
    .select("id, album_id, url");
  for (const g of gImages || []) {
    if (g.url) addRef(g.url, "gallery_images", g.id, { album_id: g.album_id });
  }

  // 9. notice_attachments
  const { data: notAtt } = await supabase
    .from("notice_attachments")
    .select("id, notice_id, url, name");
  for (const n of notAtt || []) {
    if (n.url)
      addRef(n.url, "notice_attachments", n.id, {
        notice_id: n.notice_id,
        name: n.name,
      });
  }

  // 10. website_settings
  const { data: settings } = await supabase
    .from("website_settings")
    .select("key, value");
  for (const s of settings || []) {
    const str = JSON.stringify(s.value);
    const urls = str.match(/https?:\/\/[^\s",]+/g) || [];
    for (const u of urls) {
      addRef(u, "website_settings", s.key);
    }
  }

  console.log("Indexed all database tables successfully.");

  console.log("\n=== 2. SCANNING ALL STORAGE / CLOUDINARY FILES ===");
  const buckets = ["images", "logos"];
  const storageFiles = [];

  for (const b of buckets) {
    async function listRecursive(folder = "") {
      const { data } = await supabase.storage.from(b).list(folder, { limit: 1000 });
      for (const item of data || []) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        if (item.id === null) {
          await listRecursive(itemPath);
        } else {
          storageFiles.push({
            bucket: b,
            path: itemPath,
            name: item.name,
            folder: folder || "root",
            size: item.metadata?.size || 0,
          });
        }
      }
    }
    await listRecursive();
  }

  console.log(`Total files found in storage: ${storageFiles.length}`);

  const unusedStorageFiles = [];
  const usedStorageFiles = [];

  for (const file of storageFiles) {
    const isUsed = dbImages.has(file.name) || dbImages.has(file.path);
    if (isUsed) {
      usedStorageFiles.push(file);
    } else {
      unusedStorageFiles.push(file);
    }
  }

  console.log("\n==========================================");
  console.log("📊 STORAGE vs DATABASE AUDIT REPORT");
  console.log("==========================================");
  console.log(`Total storage files: ${storageFiles.length}`);
  console.log(`✅ Actively linked in database: ${usedStorageFiles.length}`);
  console.log(`⚠️ Unreferenced / Orphaned files: ${unusedStorageFiles.length}`);

  if (unusedStorageFiles.length > 0) {
    console.log("\n⚠️ ORPHANED STORAGE FILES (Uploaded but not used in any table):");
    for (const f of unusedStorageFiles) {
      console.log(`  - [${f.folder}] ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
    }
  }

  console.log("\n==========================================");
  console.log("🔍 INACTIVE OR HIDDEN DATABASE ENTITIES WITH PHOTOS");
  console.log("==========================================");

  // 1. Inactive founders
  const inactiveFounders = (founders || []).filter(
    (f) => f.is_active === false && f.photo_url
  );
  console.log(`\nInactive Founders: ${inactiveFounders.length}`);
  for (const f of inactiveFounders) {
    console.log(`  - ${f.name} (is_active = false) -> ${f.photo_url}`);
  }

  // 2. Inactive community members
  const inactiveComm = (comm || []).filter(
    (c) => c.is_active === false && c.photo_url
  );
  console.log(`\nInactive Community Members: ${inactiveComm.length}`);
  for (const c of inactiveComm) {
    console.log(`  - ${c.name} (is_active = false) -> ${c.photo_url}`);
  }

  // 3. Team members not active or not public
  const nonPublicTeam = (team || []).filter(
    (t) => (t.public_profile === false || t.status !== "ACTIVE") && t.photo_url
  );
  console.log(`\nTeam Members (Hidden/Inactive): ${nonPublicTeam.length}`);
  for (const t of nonPublicTeam) {
    console.log(
      `  - ${t.name} (status = ${t.status}, public_profile = ${t.public_profile})`
    );
  }

  // 4. Orphaned gallery images (album deleted)
  const albumIds = new Set((albums || []).map((a) => a.id));
  const orphanedGImages = (gImages || []).filter((g) => !albumIds.has(g.album_id));
  console.log(`\nGallery Images whose Album was deleted: ${orphanedGImages.length}`);
  for (const g of orphanedGImages) {
    console.log(`  - Gallery image ID ${g.id} (album ${g.album_id}) -> ${g.url}`);
  }

  // 5. Orphaned notice attachments (notice deleted)
  const { data: notices } = await supabase.from("notices").select("id");
  const noticeIds = new Set((notices || []).map((n) => n.id));
  const orphanedNotAtt = (notAtt || []).filter((na) => !noticeIds.has(na.notice_id));
  console.log(`\nNotice Attachments whose Notice was deleted: ${orphanedNotAtt.length}`);
  for (const na of orphanedNotAtt) {
    console.log(`  - Notice attachment ID ${na.id} (notice ${na.notice_id}) -> ${na.url}`);
  }

  // 6. Students with photos but no volunteer profile
  console.log(`\nStudents with photos registered: ${students?.filter(s => s.photo_url).length}`);
  for (const s of students?.filter(s => s.photo_url) || []) {
    console.log(`  - Student: ${s.name} -> ${s.photo_url}`);
  }
}

audit().catch(console.error);
