import { SUPABASE_URL, SUPABASE_ANON } from './config.js';

// إنشاء عميل Supabase (من سكريبت CDN المحقون في الصفحات)
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// انتقال سريع بين الصفحات
export function goto(path) {
  window.location.href = path;
}

// توحيد كتابة الدور
export function normRole(v) {
  const t = (v || '').toString().trim().toLowerCase();
  // دعم الكلمات العربية الشائعة
  if (t === 'مشرف') return 'supervisor';
  if (t === 'موظف') return 'employee';
  return t;
}

// قراءة صف المستخدم من جدول users
export async function getUserRow(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// استنتاج الدور: Roll مباشرةً… أو استدلال عبر وجود مرؤوسين يربطون SupervisorId بكود المشرف (jobID)
export async function detectRole(userRow) {
  const direct = normRole(userRow?.Roll);
  if (direct === 'supervisor' || direct === 'employee') return direct;

  // fallback: لو عنده jobID وهناك موظفون SupervisorId == jobID اعتبره مشرف
  try {
    const meId = userRow?.id;
    if (!meId) return 'employee';

    const { data: me } = await supabase
      .from('users')
      .select('jobID')
      .eq('id', meId)
      .maybeSingle();

    if (me?.jobID) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('SupervisorId', me.jobID);

      if (!error && (count || 0) > 0) return 'supervisor';
    }
  } catch {
    // تجاهل أي خطأ هنا واعتبره موظف
  }
  return 'employee';
}

// حماية الصفحات حسب الدور
export async function requireAuth(allowed = ['employee', 'supervisor']) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    goto('index.html');
    return null;
  }

  // سحب صف المستخدم من users
  const userRow = await getUserRow(session.user.id);
  if (!userRow) {
    await supabase.auth.signOut();
    goto('index.html');
    return null;
  }

  // تحديد الدور
  const role = await detectRole(userRow);

  // لو غير مسموح بالوصول لهذه الصفحة، رجّعه للداشبورد
  const ok = allowed.map(normRole).includes(role);
  if (!ok) {
    goto('dashboard.html');
    return null;
  }

  return { session, userRow, role };
}
