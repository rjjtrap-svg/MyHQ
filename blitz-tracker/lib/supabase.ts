import { createClient } from "@supabase/supabase-js";

// Public by design: this is the Supabase anon key, safe to ship in the
// client bundle. Access control is enforced by the RLS policies on
// pay_submissions and the install-screenshots storage bucket, not by key
// secrecy.
const SUPABASE_URL = "https://ybrairokaqjoyvhqbvai.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlicmFpcm9rYXFqb3l2aHFidmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTk2MzAsImV4cCI6MjA5OTQzNTYzMH0.27WW7SvuYUX67-vHPym0ZJrT4XHU_Ba_IknAGr1HiQM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
