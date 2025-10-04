
import { COMPANY_NAME_AR, COMPANY_NAME_EN, COMPANY_LOGO_URL } from './config.js';
export function toast(msg, type='success'){
  const holder=document.getElementById('toast-holder'); const el=document.createElement('div');
  el.className=`px-4 py-3 rounded-xl shadow text-white mb-2 ${type==='success'?'bg-green-600':'bg-red-600'}`; el.textContent=msg;
  holder?holder.appendChild(el):alert(msg); setTimeout(()=> el.remove(), 3500);
}
export function setCompanyBranding(){
  const ar=document.querySelectorAll('[data-company-ar]'); const en=document.querySelectorAll('[data-company-en]');
  const logo=document.getElementById('companyLogo'); const logoFallback=document.getElementById('logoFallback');
  ar.forEach(el=> el.textContent=COMPANY_NAME_AR); en.forEach(el=> el.textContent=COMPANY_NAME_EN);
  if(logo){ logo.onerror=()=>{ logo.classList.add('hidden'); if(logoFallback) logoFallback.classList.remove('hidden'); };
    if(COMPANY_LOGO_URL){ logo.src=COMPANY_LOGO_URL; logo.classList.remove('hidden'); if(logoFallback) logoFallback.classList.add('hidden'); }
    else { if(logoFallback) logoFallback.classList.remove('hidden'); } }
}
export function defaultMonthRange(){
  const d=new Date(); const from=new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); const to=new Date().toISOString().slice(0,10);
  return {from,to};
}
