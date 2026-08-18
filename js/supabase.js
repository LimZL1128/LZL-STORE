import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xigeuavbjqnbinzptynv.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_n-6nxM8_4R8BcsazBZyFeA_1SKNqWEU";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);