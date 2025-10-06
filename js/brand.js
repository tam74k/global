// يطبّق اسم الشركة والشعار على أي صفحة فيها عناصر تحمل data-company-*
export function applyBranding() {
  try {
    const ar = window.COMPANY_NAME_AR || 'المجموعة العالمية للخدمات الأمنية';
    const en = window.COMPANY_NAME_EN || 'Global Security Services Group';

    // تعيين الأسماء
    document.querySelectorAll('[data-company-ar]').forEach(el => (el.textContent = ar));
    document.querySelectorAll('[data-company-en]').forEach(el => (el.textContent = en));

    // معالجة الشعار
    const url = (window.COMPANY_LOGO_URL || '').trim();
    const img = document.getElementById('companyLogo');
    const fb  = document.getElementById('logoFallback'); // أيقونة بديلة

    if (img) {
      if (url) {
        img.src = url;
        // لمنع مشاكل CORS
        img.referrerPolicy = 'no-referrer';
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          img.classList.remove('hidden');
          if (fb) fb.classList.add('hidden');
        };
        img.onerror = () => {
          // فشل تحميل الشعار: نخفي الصورة ونُظهر البديل
          img.classList.add('hidden');
          if (fb) fb.classList.remove('hidden');
          console.warn('Logo failed to load:', url);
        };
      } else {
        // لا يوجد رابط شعار: إظهار الأيقونة البديلة
        img.classList.add('hidden');
        if (fb) fb.classList.remove('hidden');
      }
    }
  } catch (e) {
    console.error('Branding error:', e);
  }
}

// تفعيل تلقائي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', applyBranding);
