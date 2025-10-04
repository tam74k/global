
import { supabase } from './auth.js';

export function firstDayOfMonthISO(d = new Date()){ const x = new Date(d.getFullYear(), d.getMonth(), 1); return x.toISOString().slice(0,10); }
export function todayISO(d = new Date()){ return d.toISOString().slice(0,10); }

export async function findUserByJobID(jobID){
  const { data, error } = await supabase.from('users').select('id,"jobID","Name","En_Name"').eq('jobID', jobID).maybeSingle();
  if(error) throw error; return data;
}

export async function listEmployeesForSupervisor(){
  const { data: me } = await supabase.from('users').select('id, jobID').eq('id', (await supabase.auth.getUser()).data.user.id).maybeSingle();
  if(!me) return [];
  const { data, error } = await supabase.from('users').select('id,"jobID","Name","En_Name",email,mobile').eq('SupervisorCode', me.jobID).order('Name', { ascending: true });
  if(error) throw error; return data||[];
}

export async function getMySupervisor(){
  const { data: me } = await supabase.from('users').select('SupervisorCode').eq('id', (await supabase.auth.getUser()).data.user.id).maybeSingle();
  if(!me || !me.SupervisorCode) return null;
  const { data } = await supabase.from('users').select('id,"jobID","Name","En_Name"').eq('jobID', me.SupervisorCode).maybeSingle();
  return data;
}

export async function upsertAttendance({ employee_id, mode, location }){
  const today = new Date(); const shift_date = today.toISOString().slice(0,10);
  const payload = { employee_id, shift_date, method:'qr', location: location||null, recorded_by:(await supabase.auth.getUser()).data.user.id };
  if(mode==='check_in') payload.check_in = new Date().toISOString();
  if(mode==='check_out') payload.check_out = new Date().toISOString();
  const ins = await supabase.from('attendance_records').insert(payload).select('id').maybeSingle();
  if(ins.error){
    const { data: row, error: selErr } = await supabase.from('attendance_records').select('id').eq('employee_id', employee_id).eq('shift_date', shift_date).maybeSingle();
    if(selErr) throw ins.error;
    if(row){
      const update = (mode==='check_in')?{ check_in: new Date().toISOString() }:{ check_out: new Date().toISOString() };
      const { error: updErr } = await supabase.from('attendance_records').update(update).eq('id', row.id);
      if(updErr) throw updErr;
    }else{ throw ins.error; }
  }
  return true;
}

export async function listMyAttendanceRange({from, to}){
  const q = supabase.from('attendance_records').select('shift_date,check_in,check_out,location,method').order('shift_date',{ascending:false});
  if(from) q.gte('shift_date', from);
  if(to) q.lte('shift_date', to);
  const { data, error } = await q;
  if(error) throw error; return data||[];
}

export async function listMyViolationsRange({from, to}){
  const q = supabase.from('violations').select('issue_datetime,item_code,category,reason,location,remarks,issued_by,issue_no,revision').order('issue_datetime',{ascending:false});
  if(from) q.gte('issue_datetime', from+'T00:00:00Z');
  if(to) q.lte('issue_datetime', to+'T23:59:59Z');
  const { data, error } = await q;
  if(error) throw error; return data||[];
}

export async function createViolation({ employee_id, item_code, reason, location, remarks }){
  const { error } = await supabase.from('violations').insert({ issue_datetime: new Date().toISOString(), employee_id, item_code: item_code||null, reason: reason||null, location: location||null, remarks: remarks||null, issued_by: (await supabase.auth.getUser()).data.user.id });
  if(error) throw error;
}

export async function submitLeaveRequest(payload){ payload.employee_id=(await supabase.auth.getUser()).data.user.id; const { error } = await supabase.from('leave_requests').insert(payload); if(error) throw error; }
export async function submitPermissionRequest(payload){ payload.employee_id=(await supabase.auth.getUser()).data.user.id; const { error } = await supabase.from('permission_requests').insert(payload); if(error) throw error; }
export async function submitHRRequest(payload){ payload.employee_id=(await supabase.auth.getUser()).data.user.id; const { error } = await supabase.from('hr_requests').insert(payload); if(error) throw error; }
export async function submitSupervisorEval({ employee_id, score, notes }){ const payload={ period:firstDayOfMonthISO(), supervisor_id:(await supabase.auth.getUser()).data.user.id, employee_id, score, notes:notes||null }; const { error } = await supabase.from('eval_supervisor_to_employee').insert(payload); if(error) throw error; }
export async function submitEmployeeEval({ supervisor_id, score, notes }){ const payload={ period:firstDayOfMonthISO(), employee_id:(await supabase.auth.getUser()).data.user.id, supervisor_id, score, notes:notes||null }; const { error } = await supabase.from('eval_employee_to_supervisor').insert(payload); if(error) throw error; }
