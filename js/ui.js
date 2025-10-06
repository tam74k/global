// إشعار بسيط (توست)
export function toast(message, type = 'success') {
  const holder = document.getElementById('toast-holder');
  const el = document.createElement('div');
  el.className =
    `px-4 py-3 rounded-xl shadow text-white mb-2 ` +
    (type === 'success' ? 'bg-green-600' : 'bg-red-600');
  el.textContent = message;

  if (holder) {
    holder.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  } else {
    // كحل احتياطي لو ما فيش حاوي للـ toast
    alert(message);
  }
}

// شارة الدور (موظف/مشرف)
export function setRoleBadge(role) {
  const el = document.getElementById('roleBadge');
  if (!el) return;
  const isSup = (role || '').toLowerCase() === 'supervisor';
  el.textContent = isSup ? 'مشرف' : 'موظف';
  el.className =
    'px-2 py-1 text-xs rounded-full border ' +
    (isSup
      ? 'bg-purple-50 border-purple-200 text-purple-700'
      : 'bg-sky-50 border-sky-200 text-sky-700');
}
