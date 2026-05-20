import type { SerializedBatch } from "@/lib/batch/types";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Opens a print-friendly tab so the user can save as PDF (no extra npm deps). */
export function openBatchPrintExport(batch: SerializedBatch): boolean {
  const w = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (!w) return false;

  const teachers = (batch.teachers || []).map(t => `${esc(t.fullName)} (${esc(t.email)})`).join("<br/>") || "—";
  const studentsRows = batch.students
    .map(
      (s, i) =>
        `<tr><td>${i + 1}</td><td>${esc(s.studentName)}</td><td>${esc(s.studentEmail)}</td><td>${esc(s.phone)}</td><td>${esc(s.course)}</td></tr>`,
    )
    .join("");

  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${esc(batch.batchName)}</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a;}
    h1{font-size:22px;margin:0 0 8px;}
    .meta{color:#64748b;font-size:13px;margin-bottom:20px;}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;}
    th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;}
    th{background:#f8fafc;}
    .section{margin-top:24px;}
  </style></head><body>
    <h1>${esc(batch.batchName)}</h1>
    <div class="meta">${esc(batch.courseName)} · ${esc(batch.batchDay)} · ${esc(batch.batchTime)} · ${esc(batch.branch)}<br/>
    ${esc(batch.startMonth)} → ${esc(batch.endMonth)} · Capacity ${batch.batchCapacity} · Students ${batch.totalStudents}</div>
    <p>${esc(batch.description || "")}</p>
    <div class="section"><strong>Teachers</strong><div style="margin-top:8px">${teachers}</div></div>
    <div class="section"><strong>Students</strong>
    <table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Course</th></tr></thead><tbody>${studentsRows}</tbody></table>
    </div>
    <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  w.document.close();
  return true;
}
