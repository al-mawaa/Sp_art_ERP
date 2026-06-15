import type { UnifiedAdminQuery } from "@/lib/admin/unifiedQueries";
import { getCategoryLabel } from "@/lib/queries/queryCategories";

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value}
    </p>
  );
}

export function QueryAdminDetailSections({ detail }: { detail: UnifiedAdminQuery }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/40 p-3 space-y-2">
        <p className="text-muted-foreground text-xs uppercase mb-1">User information</p>
        <DetailRow label="Name" value={detail.personName} />
        <DetailRow label="Email" value={detail.personEmail} />
        <DetailRow label="Role" value={detail.roleType.replace("_", " ")} />
      </div>

      <div className="rounded-xl bg-muted/40 p-3 space-y-2">
        <p className="text-muted-foreground text-xs uppercase mb-1">Query information</p>
        <DetailRow label="Category" value={getCategoryLabel(detail.category)} />
        <DetailRow label="Created" value={new Date(detail.createdAt).toLocaleString("en-IN")} />
        <div>
          <p className="text-muted-foreground text-xs uppercase mb-1">Remarks</p>
          <p className="whitespace-pre-wrap">{detail.remarks}</p>
        </div>
      </div>

      {detail.category === "profile_correction" && detail.requestedChanges && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-sky-800">Profile correction</p>
          <DetailRow label="Requested changes" value={detail.requestedChanges} />
        </div>
      )}

      {detail.category === "switch_batch" && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-violet-800">Switch batch request</p>
          <DetailRow label="Current batch" value={detail.currentBatchName || detail.currentBatchId} />
          <DetailRow label="Requested batch" value={detail.requestedBatchName || detail.requestedBatchId} />
        </div>
      )}

      {detail.category === "course_change" && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-indigo-800">Course change request</p>
          <DetailRow label="Current course" value={detail.currentCourseName || detail.currentCourseId} />
          <DetailRow label="Requested course" value={detail.requestedCourseName || detail.requestedCourseId} />
        </div>
      )}

      {detail.category === "attendance_correction" && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase text-teal-800">Attendance correction</p>
          <DetailRow label="Date" value={detail.attendanceDate} />
          <DetailRow label="Current status" value={detail.currentAttendanceStatus} />
          <DetailRow label="Requested status" value={detail.requestedAttendanceStatus} />
        </div>
      )}

      {detail.category === "fee_related" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <p className="text-xs font-semibold uppercase text-amber-900">Fee related query</p>
          <p className="text-sm text-amber-900/80 mt-1">Review fee details in remarks above.</p>
        </div>
      )}

      {(detail.reviewedBy || detail.reviewedAt) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
          <p className="font-semibold uppercase text-slate-600">Audit trail</p>
          {detail.actionType && (
            <DetailRow label="Action" value={detail.actionType} />
          )}
          {detail.reviewedBy && <DetailRow label="Reviewed by" value={detail.reviewedBy} />}
          {detail.reviewedAt && (
            <DetailRow label="Action date" value={new Date(detail.reviewedAt).toLocaleString("en-IN")} />
          )}
        </div>
      )}
    </div>
  );
}
