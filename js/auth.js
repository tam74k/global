
import { SUPABASE_URL, SUPABASE_ANON } from './config.js';
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
export function goto(path){ window.location.href = path; }
export function normRole(v){ return (v||'').toString().trim().toLowerCase(); }
export async function getUserRow(uid){
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
  if (error) throw error; return data;
}
export async function detectRole(userRow){
  const r = normRole(userRow?.Roll);
  if (r === 'supervisor') return 'supervisor';
  try{
    const { data: me } = await supabase.from('users').select('jobID').eq('id', userRow.id).maybeSingle();
    if (me?.jobID){
      const { count } = await supabase.from('users').select('id',{count:'exact',head:true}).eq('SupervisorCode', me.jobID);
      if ((count||0) > 0) return 'supervisor';
    }
  }catch{}
  return 'employee';
}
export async function requireAuth(allowed=['employee','supervisor']){
  const { data: { session } } = await supabase.auth.getSession();
  if (!session){ goto('index.html'); return null; }
  const userRow = await getUserRow(session.user.id);
  if (!userRow){ await supabase.auth.signOut(); goto('index.html'); return null; }
  const role = await detectRole(userRow);
  if (!allowed.map(normRole).includes(role)){ goto('dashboard.html'); return null; }
  return { session, userRow, role };
}
