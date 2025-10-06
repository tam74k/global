// js/api.js
import { supabase } from './auth.js';

/** احضر صف المستخدم الحالي من جدول users (لازم عشان نعرف jobID بتاع المشرف) */
export async function getMe() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('لم يتم تسجيل الدخول');
  const { data, error } = await supabase
    .from('users')
    .select('id, jobID, Name, En_Name, Roll')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data;
}

/** صياغة فترة التقييم كأول يوم في الشهر (YYYY-MM-01) */
export function periodFromMonthYear(m, y) {
  const mm = String(parseInt(m, 10)).padStart(2, '0');
  const yy = String(parseInt(y, 10));
  return `${yy}-${mm}-01`; // النوع في قاعدة البيانات "date"
}

/**
 * جلب مرؤوسي المشرف الحالي فقط:
 * users.SupervisorId == (jobID) للمستخدم الحالي
 * مع استبعاد صف المشرف نفسه من النتائج.
 */
export async function listEmployeesForSupervisor() {
  const me = await getMe();
  const supJob = me?.jobID;
  if (!supJob) return [];

  const { data, error } = await supabase
    .from('users')
    .select('id, Name, En_Name, jobID, SupervisorId, Active')
    .eq('SupervisorId', supJob)
    // لو في سجلات Active=null ما نحرمها (OR)
    .or('Active.is.null,Active.eq.true')
    .order('Name', { ascending: true, nulls: 'last' })
    .order('En_Name', { ascending: true, nulls: 'last' });

  if (error) throw error;

  // استبعد نفسك لو ظهر صفك (بسبب سياسات RLS تسمح بقراءة صفك)
  return (data || []).filter(r => r.id !== me.id);
}

/** مجموعة الموظفين الذين تم تقييمهم بالفعل في هذه الفترة بواسطة هذا المشرف */
export async function existingSupervisorEvals(period) {
  const { data, error } = await supabase
    .from('eval_supervisor_to_employee')
    .select('employee_id')
    .eq('period', period);
  if (error) throw error;
  return new Set((data || []).map(r => r.employee_id));
}

/** حفظ تقييم مشرف -> موظف */
export async function submitSupervisorEval({ employee_id, score, notes, period }) {
  const payload = { employee_id, score, notes: notes || null, period };
  const { error } = await supabase
    .from('eval_supervisor_to_employee')
    .insert(payload);
  if (error) throw error;
  return true;
}
