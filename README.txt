
GSSG Frontend (Vanilla HTML/JS + Tailwind + Supabase-js v2)

1) عدّل js/config.js وضع:
   - SUPABASE_URL و SUPABASE_ANON (موجودة الآن بالقيم التي زوّدتني بها)
   - COMPANY_LOGO_URL برابط صورة الشعار
   - COMPANY_NAME_AR / COMPANY_NAME_EN حسب رغبتك

2) نفّذ gssg_full_setup.sql في Supabase (جداول + سياسات RLS).

3) ارفع المجلد لأي استضافة ثابتة أو افتح index.html مباشرة محليًا.

4) التسجيل/الدخول:
   - register.html ينشئ مستخدم في Auth ويضيف صف users (Roll + SupervisorCode).
   - index.html للدخول.
   - dashboard.html تعرض أزرار مختلفة حسب الدور.

5) الموظف:
   - my_profile.html (عرض كامل لبيانات users)
   - my_attendance.html (تصفية بين تاريخين؛ افتراضيًا الشهر الحالي)
   - my_violations.html (تصفية بين تاريخين؛ افتراضيًا الشهر الحالي)
   - evaluate_supervisor.html (تقييم مشرفه شهريًا)

6) المشرف:
   - attendance_register.html (حضور/انصراف يدوي + QR + حالات P/AB/SL/AL/TR/OFF)
   - violations.html (تسجيل مخالفة)
   - evaluate_employees.html (تقييم الموظفين)
   - attendance_report.html (تقرير تجميعي + CSV)
   - violations_list.html (سجل الإنذارات + طباعة/CSV)
