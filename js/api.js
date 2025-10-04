import { supabase } from './auth.js';
export async function findUserByJobID(jobID){
  const { data, error } = await supabase.from('users').select('id, "jobID", "Name", "En_Name"').eq('jobID', jobID).maybeSingle();
  if(error) throw error;
  return data;
}
export async function upsertAttendance({ employee_id, mode, location }){
  const today = new Date(); const shift_date = today.toISOString().slice(0,10);
  const payload = { employee_id, shift_date, method:'qr', location: location||null, recorded_by:(await supabase.auth.getUser()).data.user.id };
  if(mode==='check_in') payload.check_in = new Date().toISOString();
  if(mode==='check_out') payload.check_out = new Date().toISOString();
  const { data, error } = await supabase.from('attendance_records').insert(payload, { upsert: true }).select('*').single();
  if(error){
    const { data: row } = await supabase.from('attendance_records').select('id').eq('employee_id', employee_id).eq('shift_date', shift_date).maybeSingle();
    if(row){
      const update = (mode==='check_in')?{ check_in: new Date().toISOString() }:{ check_out: new Date().toISOString() };
      const { error: updErr } = await supabase.from('attendance_records').update(update).eq('id', row.id);
      if(updErr) throw updErr;
    }else{ throw error; }
  }
  return true;
}
export async function createViolation({ employee_id, item_code, reason, location, remarks }){
  const { data, error } = await supabase.from('violations').insert({
    issue_datetime: new Date().toISOString(),
    employee_id, item_code: item_code||null, reason: reason||null, location: location||null, remarks: remarks||null,
    issued_by: (await supabase.auth.getUser()).data.user.id
  }).select('id').single();
  if(error) throw error; return data;
}
export async function listMyAttendance(){
  const { data, error } = await supabase.from('attendance_records').select('shift_date, check_in, check_out, location, method').order('shift_date', { ascending:false }).limit(60);
  if(error) throw error; return data;
}
export async function listMyViolations(){
  const { data, error } = await supabase.from('violations').select('issue_datetime, item_code, reason, location, remarks').order('issue_datetime', { ascending:false }).limit(60);
  if(error) throw error; return data;
}