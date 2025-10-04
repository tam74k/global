<script type="module">
  import { requireAuth } from './js/auth.js';
  import { setCompanyBranding } from './js/ui.js';
  import { setRoleBadge } from './js/ui.js';

  const cards = document.getElementById('cards');

  function render(role){
    const common = [
      { href:'my_profile.html', icon:'🧾', title:'بياناتي', sub:'عرض كامل لبياناتي' },
      { href:'my_attendance.html', icon:'📊', title:'حضوري', sub:'تصفية بين تاريخين (الشهر الحالي افتراضيًا)' },
      { href:'my_violations.html', icon:'⚠️', title:'مخالفاتي', sub:'المخالفات المسجّلة عليّ' },
      { href:'leave_request.html', icon:'🗓️', title:'طلب إجازة', sub:'إرسال طلب إجازة' },
      { href:'permission_request.html', icon:'⏱️', title:'طلب إذن', sub:'ساعات/خروج مؤقت' },
      { href:'hr_request.html', icon:'📄', title:'طلب مستندات HR', sub:'شهادات/خطابات' }
    ];
    const employeeOnly = [
      { href:'evaluate_supervisor.html', icon:'⭐', title:'تقييمي لمشرفي', sub:'مرة كل شهر' }
    ];
    const supervisorOnly = [
      { href:'attendance_register.html', icon:'🕒', title:'الحضور/الانصراف', sub:'يدوي + QR' },
      { href:'violations.html', icon:'⚠️', title:'تسجيل مخالفة', sub:'GSSG-NAT 300-004' },
      { href:'evaluate_employees.html', icon:'⭐', title:'تقييم الموظفين', sub:'شهري' },
      { href:'attendance_report.html', icon:'📈', title:'تقارير الحضور', sub:'تجميعي + CSV' },
      { href:'violations_list.html', icon:'📝', title:'سجل الإنذارات', sub:'تصفية/طباعة/CSV' }
    ];

    const list = role === 'supervisor' ? [...supervisorOnly, ...common] : [...employeeOnly, ...common];
    cards.innerHTML = list.map(i => `
      <a href="${i.href}" class="bg-white rounded-2xl shadow p-4 flex items-center gap-3 hover:ring">
        <span class="text-xl">${i.icon}</span>
        <div><p class="font-bold">${i.title}</p><p class="text-sm text-gray-500">${i.sub}</p></div>
      </a>`).join('');
  }

  async function boot(){
    setCompanyBranding();
    const ctx = await requireAuth(['employee','supervisor']);
    const role = ctx?.role || 'employee';
    setRoleBadge(role);
    render(role);

    document.getElementById('logout')?.addEventListener('click', async (e)=>{
      e.preventDefault();
      (await import('./js/auth.js')).supabase.auth.signOut();
      location.href = 'index.html';
    });
  }

  // نضمن إعادة التهيئة بعد الرجوع للخلف (bfcache)
  window.addEventListener('pageshow', boot);
  boot();
</script>
