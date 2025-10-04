// js/scanner.js
import { requireAuth } from './auth.js';
import { findUserByJobID, upsertAttendance } from './api.js';
import { toast } from './ui.js';

let scanMode = null; // 'check_in' | 'check_out'
let html5QrCode = null;
let successCount = 0;
let failCount = 0;
let scanning = false;

function setMode(mode){
  if(scanning) return;
  scanMode = mode;
  document.getElementById('modeCheckIn').disabled = true;
  document.getElementById('modeCheckOut').disabled = true;
  document.getElementById('resetMode').classList.remove('hidden');
  startScanner();
}

async function startScanner(){
  if(scanning) return;
  scanning = true;
  const readerDiv = document.getElementById('qr-reader');
  html5QrCode = new Html5Qrcode('qr-reader');
  try{
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      onScanSuccess,
      (err)=>{ /* ignore */ }
    );
  }catch(e){
    toast('تعذر تشغيل الكاميرا: ' + e.message, 'error');
    scanning = false;
  }
}

async function onScanSuccess(decodedText){
  // Expect decodedText to be employee jobID
  const jobID = (decodedText || '').trim();
  if(!jobID) return;
  html5QrCode.pause(true);
  try{
    const user = await findUserByJobID(jobID);
    if(!user){ throw new Error('كود موظف غير صحيح'); }
    await upsertAttendance({ employee_id: user.id, mode: scanMode, location: null });
    successCount += 1;
    addRow(jobID, 'تم تسجيل ' + (scanMode==='check_in'?'حضور':'انصراف'));
  }catch(e){
    failCount += 1;
    addRow(jobID || '-', 'فشل: ' + e.message, true);
  }finally{
    updateCounters();
    // resume immediately for next employee
    setTimeout(()=> html5QrCode.resume(), 200);
  }
}

function addRow(code, msg, isError=false){
  const list = document.getElementById('scanLog');
  const row = document.createElement('div');
  row.className = `flex items-center justify-between p-2 border rounded-lg ${isError?'border-red-300 bg-red-50':'border-green-300 bg-green-50'}`;
  row.innerHTML = `<span class="font-mono text-sm">${code}</span><span class="text-sm">${msg}</span>`;
  list.prepend(row);
}

function updateCounters(){
  document.getElementById('succCount').textContent = successCount;
  document.getElementById('failCount').textContent = failCount;
}

async function stopScanner(){
  if(html5QrCode){
    try{ await html5QrCode.stop(); }catch{};
    html5QrCode.clear();
  }
  scanning = false;
}

async function resetMode(){
  await stopScanner();
  scanMode = null;
  successCount = 0; failCount = 0; updateCounters();
  document.getElementById('scanLog').innerHTML = '';
  document.getElementById('modeCheckIn').disabled = false;
  document.getElementById('modeCheckOut').disabled = false;
  document.getElementById('resetMode').classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', async ()=>{
  const ctx = await requireAuth(['supervisor']);
  if(!ctx) return;
  document.getElementById('modeCheckIn').addEventListener('click', ()=> setMode('check_in'));
  document.getElementById('modeCheckOut').addEventListener('click', ()=> setMode('check_out'));
  document.getElementById('resetMode').addEventListener('click', resetMode);
});

export { resetMode };
