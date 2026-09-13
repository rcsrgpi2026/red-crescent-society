import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of env.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  }
}

const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const n = await sb.from('notices').select('*');
  console.log('Notices raw:', n.error, n.data);
  const t = await sb.from('trainings').select('*');
  console.log('Trainings count:', t.data?.length);
  const rec = await sb.from('recruitment_campaigns').select('*');
  console.log('Recruitments:', rec.data);
}
test();
