import { supabase } from './auth.js';

// أدوات مساعدة للتواريخ
export function firstDayOfMonthISO(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return x.toISOString().slice(0, 10);
}
export function periodFromMonthYear(m, y) {
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toISOString().slice(0, 10); // تُخزَّن كـ YYYY-MM-01
}

// ــــــــــــــــــــــــــــــــــــــــ
// استعلامات المستخدمين والعلاقات مشرف/موظف
// ــــــــــــــــــــــــــــــــــــــــ
export async function findUserByJobID(jobID) {
  const { data, error } = await supabase
    .from('users')
    .select('id,"jobID","Name","En_Name"')
    .eq('jobID', jobID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listEmployeesForSupervisor() {
  // جلب jobID للمشرف الحالي
  const { data: auth } = await supabase.auth.getUser();
  const meId = auth?.user?.id;
  if (!meId) return [];

  const { data: me } = await supabase
    .from('users')
    .select('jobID')
    .eq('id', meId)
    .maybeSingle();

  if (!me?.jobID) return [];

  // كل الموظفين الذين SupervisorId لديهم يساوي jobID الخاص بالمشرف
  const { data, error } = await supabase
    .from('users')
    .select('id,"jobID","Name","En_Name",email,mobile')
    .eq('SupervisorId', me.jobID)
    .order('Name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMySupervisor() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return null;

  const { data: me } = await supabase
    .from('users')
    .select('SupervisorId')
    .eq('id', uid)
    .maybeSingle();

  if (!me?.SupervisorId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id,"jobID","Name","En_Name"')
    .eq('jobID', me.SupervisorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ــــــــــــــــــــــــــــــــــــــــ
// الحضور والانصراف
// جدول attendance_records ينبغي أن يحتوي الحقول:
// id, employee_id(UUID), shift_date(date), check_in(timestamptz), check_out(timestamptz),
// status(text: P/AB/SL/AL/TR/OFF), method(text: 'manual'/'qr'), location(text), recorded_by(UUID)
// ــــــــــــــــــــــــــــــــــــــــ
export async function upsertAttendance({ employee_id, mode, location, method }) {
  const shift_date = new Date().toISOString().slice(0, 10);
  const { data: auth } = await supabase.auth.getUser();
  const recorded_by = auth?.user?.id;

  const payload = {
    employee_id,
    shift_date,
    method: method || 'qr',
    location: location || null,
    recorded_by,
  };

  if (mode === 'check_in') payload.check_in = new Date().toISOString();
  if (mode === 'check_out') payload.check_out = new Date().toISOString();

  // محاولة إدراج سجل اليوم
  const ins = await supabase
    .from('attendance_records')
    .insert(payload)
    .select('id')
    .maybeSingle();

  if (ins.error) {
    // لو موجود سجل لليوم نفسه: حدِّثه
    const { data: row } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('shift_date', shift_date)
      .maybeSingle();

    if (row) {
      const update =
        mode === 'check_in'
          ? { check_in: new Date().toISOString(), method: method || 'qr' }
          : { check_out: new Date().toISOString(), method: method || 'qr' };

      const { error: updErr } = await supabase
        .from('attendance_records')
        .update(update)
        .eq('id', row.id);

      if (updErr) throw updErr;
    } else {
      throw ins.error;
    }
  }
  return true;
}

export async function setAttendanceStatus({ employee_id, status, location }) {
  const shift_date = new Date().toISOString().slice(0, 10);
  const { data: auth } = await supabase.auth.getUser();
  const recorded_by = auth?.user?.id;

  const payload = {
    employee_id,
    shift_date,
    status,               // P/AB/SL/AL/TR/OFF
    method: 'manual',
    location: location || null,
    recorded_by,
    check_in: null,
    check_out: null,
  };

  const ins = await supabase
    .from('attendance_records')
    .insert(payload)
    .select('id')
    .maybeSingle();

  if (ins.error) {
    const { data: row } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('shift_date', shift_date)
      .maybeSingle();

    if (row) {
      const { error: updErr } = await supabase
        .from('attendance_records')
        .update({
          status,
          method: 'manual',
          location: location || null,
          check_in: null,
          check_out: null,
        })
        .eq('id', row.id);

      if (updErr) throw updErr;
    } else {
      throw ins.error;
    }
  }
  return true;
}

export async function listMyAttendanceRange({ from, to }) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  const q = supabase
    .from('attendance_records')
    .select('shift_date,check_in,check_out,location,method,status')
    .eq('employee_id', uid)
    .order('shift_date', { ascending: false });

  if (from) q.gte('shift_date', from);
  if (to) q.lte('shift_date', to);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ــــــــــــــــــــــــــــــــــــــــ
// المخالفات (violations)
// ينبغي أن يحتوي الجدول على:
// id, employee_id, issue_datetime, item_code, category, reason, location, remarks, issued_by, issue_no, revision
// ــــــــــــــــــــــــــــــــــــــــ
export async function listMyViolationsRange({ from, to }) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;

  const q = supabase
    .from('violations')
    .select(
      'issue_datetime,item_code,category,reason,location,remarks,issued_by,issue_no,revision'
    )
    .eq('employee_id', uid)
    .order('issue_datetime', { ascending: false });

  if (from) q.gte('issue_datetime', from + 'T00:00:00Z');
  if (to) q.lte('issue_datetime', to + 'T23:59:59Z');

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// تقارير المشرف (حضور ومخالفات لمرؤوسيه)
export async function listSupervisorAttendanceRange({ from, to }) {
  const { data: auth } = await supabase.auth.getUser();
  const meId = auth?.user?.id;

  const { data: myRow } = await supabase
    .from('users')
    .select('jobID')
    .eq('id', meId)
    .maybeSingle();

  if (!myRow?.jobID) return { records: [], employees: [] };

  const { data: emps } = await supabase
    .from('users')
    .select('id,jobID,Name,En_Name')
    .eq('SupervisorId', myRow.jobID);

  const ids = (emps || []).map((e) => e.id);
  if (ids.length === 0) return { records: [], employees: [] };

  const q = supabase
    .from('attendance_records')
    .select('employee_id,shift_date,check_in,check_out,status,method,location');

  if (from) q.gte('shift_date', from);
  if (to) q.lte('shift_date', to);

  const { data, error } = await q.in('employee_id', ids);
  if (error) throw error;

  return { records: data || [], employees: emps || [] };
}

export async function listSupervisorViolationsRange({ from, to }) {
  const { data: auth } = await supabase.auth.getUser();
  const meId = auth?.user?.id;

  const { data: myRow } = await supabase
    .from('users')
    .select('jobID')
    .eq('id', meId)
    .maybeSingle();

  if (!myRow?.jobID) return { records: [], employees: [] };

  const { data: emps } = await supabase
    .from('users')
    .select('id,jobID,Name,En_Name')
    .eq('SupervisorId', myRow.jobID);

  const ids = (emps || []).map((e) => e.id);
  if (ids.length === 0) return { records: [], employees: [] };

  const q = supabase
    .from('violations')
    .select(
      'employee_id,issue_datetime,item_code,category,reason,location,remarks,issued_by,issue_no,revision'
    )
    .order('issue_datetime', { ascending: false });

  if (from) q.gte('issue_datetime', from + 'T00:00:00Z');
  if (to) q.lte('issue_datetime', to + 'T23:59:59Z');

  const { data, error } = await q.in('employee_id', ids);
  if (error) throw error;

  return { records: data || [], employees: emps || [] };
}

// ــــــــــــــــــــــــــــــــــــــــ
// طلبات الموارد البشرية
// leave_requests: employee_id, from_date, to_date, reason
// permission_requests: employee_id, date, from_time, to_time, reason
// hr_requests: employee_id, request_type, details
// ــــــــــــــــــــــــــــــــــــــــ
export async function submitLeaveRequest(payload) {
  const { data: auth } = await supabase.auth.getUser();
  payload.employee_id = auth?.user?.id;
  const { error } = await supabase.from('leave_requests').insert(payload);
  if (error) throw error;
}

export async function submitPermissionRequest(payload) {
  const { data: auth } = await supabase.auth.getUser();
  payload.employee_id = auth?.user?.id;
  const { error } = await supabase.from('permission_requests').insert(payload);
  if (error) throw error;
}

export async function submitHRRequest(payload) {
  const { data: auth } = await supabase.auth.getUser();
  payload.employee_id = auth?.user?.id;
  const { error } = await supabase.from('hr_requests').insert(payload);
  if (error) throw error;
}

// ــــــــــــــــــــــــــــــــــــــــ
// التقييمات الشهرية
// eval_supervisor_to_employee: period(date-YYYY-MM-01), supervisor_id, employee_id, score(1..10), notes
// eval_employee_to_supervisor: period(date-YYYY-MM-01), employee_id, supervisor_id, score(1..10), notes
// ــــــــــــــــــــــــــــــــــــــــ
export async function existingSupervisorEvals(period) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  const { data, error } = await supabase
    .from('eval_supervisor_to_employee')
    .select('employee_id')
    .eq('supervisor_id', uid)
    .eq('period', period);

  if (error) throw error;
  return new Set((data || []).map((x) => x.employee_id));
}

export async function existingEmployeeEvalForSupervisor(period) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  const { data, error } = await supabase
    .from('eval_employee_to_supervisor')
    .select('id')
    .eq('employee_id', uid)
    .eq('period', period);

  if (error) throw error;
  return (data || []).length > 0;
}

export async function submitSupervisorEval({ employee_id, score, notes, period }) {
  const { data: auth } = await supabase.auth.getUser();
  const supervisor_id = auth?.user?.id;
  const payload = {
    period: period || firstDayOfMonthISO(),
    supervisor_id,
    employee_id,
    score,
    notes: notes || null,
  };
  const { error } = await supabase
    .from('eval_supervisor_to_employee')
    .insert(payload);
  if (error) throw error;
}

export async function submitEmployeeEval({ supervisor_id, score, notes, period }) {
  const { data: auth } = await supabase.auth.getUser();
  const employee_id = auth?.user?.id;
  const payload = {
    period: period || firstDayOfMonthISO(),
    employee_id,
    supervisor_id,
    score,
    notes: notes || null,
  };
  const { error } = await supabase
    .from('eval_employee_to_supervisor')
    .insert(payload);
  if (error) throw error;
}
