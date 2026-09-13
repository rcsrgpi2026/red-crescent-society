import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const { data: activeReqs, error: reqErr } = await admin
    .from("blood_requests")
    .select(
      "id, patient_name, blood_group, units, hospital, location, required_date, emergency_level, contact, requester_name, additional_info, email, status"
    )
    .eq("blood_group", "B+")
    .not("status", "in", '("COMPLETED","CANCELLED")')
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("Query result activeReqs:", activeReqs);
  console.log("Query error:", reqErr);
}

testQuery();
