import { SUPABASE_URL, SUPABASE_ANON } from './config.js';
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
export function goto(path){ window.location.href = path; }
export async function requireAuth(allowed=['employee','supervisor']){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){ goto('index.html'); return null; }
  const uid = session.user.id;
  const { data: userRow, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
  if(error || !userRow){ await supabase.auth.signOut(); goto('index.html'); return null; }
  const role = (userRow.POS2==='supervisor')?'supervisor':'employee';
  if(!allowed.includes(role)){ goto('dashboard.html'); return null; }
  return { session, userRow, role };
}
export async function currentUser(){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session) return null;
  const { data: userRow } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
  return { session, userRow };
}