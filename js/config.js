
export const SUPABASE_URL = "https://pcawlyucmsdlwecsrfrb.supabase.co";
export const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYXdseXVjbXNkbHdlY3NyZnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzUyMjIsImV4cCI6MjA3MTQ1MTIyMn0.Gv5qIgsHwtESoN9ucVHKgf8W8OcXTjHSJfI7h7_aOhk";
export const COMPANY_NAME_AR = "المجموعة العالمية للخدمات الأمنية";
export const COMPANY_NAME_EN = "Global Security Services Group";
export const COMPANY_LOGO_URL = "https://tam74k.github.io/global/Logo1.png";
if (typeof window !== 'undefined') {
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON = SUPABASE_ANON;
  window.COMPANY_NAME_AR = COMPANY_NAME_AR;
  window.COMPANY_NAME_EN = COMPANY_NAME_EN;
  window.COMPANY_LOGO_URL = COMPANY_LOGO_URL;
}
