// This relies on the Supabase script being loaded in index.html
declare const supabase: any;

const supabaseUrl = "https://hacgzsximhtznueyokns.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhY2d6c3hpbWh0em51ZXlva25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjMxODEsImV4cCI6MjA3NjI5OTE4MX0.DCcZjBmL8YgPiGGF-XwiCfCu_YOOdW1DU3X-8dSViu4";

// The `createClient` function is available globally from the script
export const client = supabase.createClient(supabaseUrl, supabaseAnonKey);