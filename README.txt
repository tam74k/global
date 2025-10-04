# GSSG Multi‑Page Web App
Pages:
- index.html — Login
- register.html — Register
- dashboard.html — Employee profile + attendance list
- attendance_scan.html — Supervisor QR batch scan (choose IN or OUT once, then scan sequentially)
- violations.html — Issue violations (supervisors) + My violations list

All pages use Tailwind + supabase-js v2 + html5-qrcode.

Setup:
1) Upload all files to a static host (or open locally with Live Server).
2) Ensure you executed the SQL (gssg_tables_fix.sql) on Supabase.
3) In js/config.js set COMPANY_LOGO_URL if you have a logo.

Notes:
- Scanner expects QR content = employee jobID.
- RLS requires users.POS2 = 'supervisor' to insert attendance/violations for others.
