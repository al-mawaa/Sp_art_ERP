import mongoose from "mongoose";
import Query, { type QueryDocument, type QueryRole } from "@/lib/models/Query";
import type { QueryCategory } from "@/lib/queries/queryCategories";

export type { QueryRole };
export type QueryRoleType = QueryRole;

export type QueryCategoryFieldsDto = {
  requestedChanges?: string;
  currentBatchId?: string;
  requestedBatchId?: string;
  currentBatchName?: string;
  requestedBatchName?: string;
  currentCourseId?: string;
  requestedCourseId?: string;
  currentCourseName?: string;
  requestedCourseName?: string;
  attendanceDate?: string;
  currentAttendanceStatus?: string;
  requestedAttendanceStatus?: string;
};

export type NormalizedQuery = {
  id: string;
  role: QueryRole;
  userId: string;
  personName: string;
  personEmail: string;
  category: QueryCategory;
  remarks: string;
  status: string;
  adminRemark: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actionType?: string;
  createdAt: string;
  updatedAt: string;
} & QueryCategoryFieldsDto;

export type UnifiedAdminQuery = NormalizedQuery & {
  roleType: QueryRole;
};

export type QueryStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byCategory: Record<QueryCategory, number>;
};

type RawQuery = Record<string, unknown> & {
  _id: mongoose.Types.ObjectId | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toRawQuery(doc: QueryDocument | RawQuery | Record<string, unknown>): RawQuery {
  if (doc && typeof (doc as QueryDocument).toObject === "function") {
    return (doc as QueryDocument).toObject() as RawQuery;
  }
  return doc as RawQuery;
}

function pickCategoryFields(d: RawQuery): QueryCategoryFieldsDto {
  return {
    requestedChanges: d.requestedChanges ? String(d.requestedChanges) : undefined,
    currentBatchId: d.currentBatchId ? String(d.currentBatchId) : undefined,
    requestedBatchId: d.requestedBatchId ? String(d.requestedBatchId) : undefined,
    currentBatchName: d.currentBatchName ? String(d.currentBatchName) : undefined,
    requestedBatchName: d.requestedBatchName ? String(d.requestedBatchName) : undefined,
    currentCourseId: d.currentCourseId ? String(d.currentCourseId) : undefined,
    requestedCourseId: d.requestedCourseId ? String(d.requestedCourseId) : undefined,
    currentCourseName: d.currentCourseName ? String(d.currentCourseName) : undefined,
    requestedCourseName: d.requestedCourseName ? String(d.requestedCourseName) : undefined,
    attendanceDate: d.attendanceDate ? String(d.attendanceDate) : undefined,
    currentAttendanceStatus: d.currentAttendanceStatus
      ? String(d.currentAttendanceStatus)
      : undefined,
    requestedAttendanceStatus: d.requestedAttendanceStatus
      ? String(d.requestedAttendanceStatus)
      : undefined,
  };
}

function baseNormalized(
  id: string,
  role: QueryRole,
  userId: string,
  personName: string,
  personEmail: string,
  d: RawQuery,
): NormalizedQuery {
  return {
    id,
    role,
    userId,
    personName,
    personEmail,
    category: (d.category as QueryCategory) || "profile_correction",
    remarks: String(d.remarks ?? ""),
    status: String(d.status ?? "pending"),
    adminRemark: String(d.adminRemark ?? ""),
    reviewedAt: d.reviewedAt ? new Date(d.reviewedAt as Date).toISOString() : undefined,
    reviewedBy: d.reviewedBy ? String(d.reviewedBy) : undefined,
    actionType: d.actionType ? String(d.actionType) : undefined,
    createdAt: new Date(d.createdAt as Date).toISOString(),
    updatedAt: new Date(d.updatedAt as Date).toISOString(),
    ...pickCategoryFields(d),
  };
}

/** Resolve unified fields from new or legacy document shape. */
export function normalizeQueryFields(doc: QueryDocument | RawQuery | Record<string, unknown>): NormalizedQuery {
  const d = toRawQuery(doc);
  const id = d._id.toString();

  if (d.role && d.userId) {
    return baseNormalized(
      id,
      d.role as QueryRole,
      String(d.userId),
      String(d.personName ?? ""),
      String(d.personEmail ?? ""),
      d,
    );
  }

  if (d.studentId || d.studentName) {
    return baseNormalized(
      id,
      "student",
      String(d.userId ?? d.studentId),
      String(d.personName ?? d.studentName ?? ""),
      String(d.personEmail ?? d.studentEmail ?? ""),
      d,
    );
  }

  if (d.teacherId || d.teacherName) {
    return baseNormalized(
      id,
      "teacher",
      String(d.userId ?? d.teacherId),
      String(d.personName ?? d.teacherName ?? ""),
      String(d.personEmail ?? d.teacherEmail ?? ""),
      d,
    );
  }

  return baseNormalized(
    id,
    "senior_teacher",
    String(d.userId ?? d.seniorTeacherId),
    String(d.personName ?? d.seniorTeacherName ?? ""),
    String(d.personEmail ?? d.seniorTeacherEmail ?? ""),
    d,
  );
}

export function toUnifiedAdminQuery(
  doc: QueryDocument | RawQuery | Record<string, unknown>,
): UnifiedAdminQuery {
  const n = normalizeQueryFields(doc);
  return { ...n, roleType: n.role };
}

/** Copy legacy `student_queries` into `queries` if needed. */
export async function migrateLegacyStudentQueriesCollection(): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const queriesCount = await db.collection("queries").countDocuments();
  if (queriesCount > 0) return 0;

  const legacy = await db.collection("student_queries").find({}).toArray();
  if (!legacy.length) return 0;

  await db.collection("queries").insertMany(
    legacy.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, _id, category: rest.category ?? "profile_correction" };
    }),
  );
  return legacy.length;
}

async function normalizeLegacyDocsInQueries(): Promise<number> {
  const cursor = Query.find({
    $or: [{ role: { $exists: false } }, { role: null }, { userId: { $exists: false } }],
  }).cursor();

  let count = 0;
  for await (const doc of cursor) {
    const n = normalizeQueryFields(doc);
    doc.role = n.role;
    doc.userId = new mongoose.Types.ObjectId(n.userId);
    doc.personName = n.personName;
    doc.personEmail = n.personEmail;
    if (!doc.category) doc.category = "profile_correction";
    await doc.save();
    count++;
  }
  return count;
}

async function importLegacyCollection(
  collectionName: string,
  role: QueryRole,
  mapDoc: (doc: Record<string, unknown>) => Record<string, unknown>,
): Promise<number> {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const legacy = await db.collection(collectionName).find({}).toArray();
  if (!legacy.length) return 0;

  let imported = 0;
  for (const raw of legacy) {
    const id = raw._id as mongoose.Types.ObjectId;
    const exists = await Query.findById(id).lean();
    if (exists) continue;

    const payload = mapDoc(raw as Record<string, unknown>);
    try {
      await Query.collection.insertOne({
        ...payload,
        _id: id,
        category: payload.category ?? "profile_correction",
      });
      imported++;
    } catch (e) {
      const code = (e as { code?: number }).code;
      if (code !== 11000) throw e;
    }
  }
  return imported;
}

export async function migrateAllQueriesCollections(): Promise<void> {
  await migrateLegacyStudentQueriesCollection();
  await normalizeLegacyDocsInQueries();

  await importLegacyCollection("teacher_queries", "teacher", doc => ({
    role: "teacher",
    userId: doc.teacherId,
    personName: doc.teacherName,
    personEmail: doc.teacherEmail,
    remarks: doc.remarks,
    status: doc.status ?? "pending",
    adminRemark: doc.adminRemark ?? "",
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  await importLegacyCollection("senior_teacher_queries", "senior_teacher", doc => ({
    role: "senior_teacher",
    userId: doc.seniorTeacherId,
    personName: doc.seniorTeacherName,
    personEmail: doc.seniorTeacherEmail,
    remarks: doc.remarks,
    status: doc.status ?? "pending",
    adminRemark: doc.adminRemark ?? "",
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  await Query.updateMany(
    { $or: [{ category: { $exists: false } }, { category: null }] },
    { $set: { category: "profile_correction" } },
  );
}

export async function getProfileEditAccess(role: QueryRole, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { canEditProfile: false, latestQuery: null as NormalizedQuery | null };
  }

  await migrateAllQueriesCollections();

  const [latest, latestProfile] = await Promise.all([
    Query.findOne({ role, userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean(),
    Query.findOne({
      role,
      userId: new mongoose.Types.ObjectId(userId),
      category: "profile_correction",
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    canEditProfile:
      latestProfile?.status === "approved" && !latestProfile?.profileEditUsedAt,
    latestQuery: latest ? normalizeQueryFields(latest) : null,
  };
}

export async function consumeProfileEditAccess(role: QueryRole, userId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  await migrateAllQueriesCollections();

  await Query.findOneAndUpdate(
    {
      role,
      userId: new mongoose.Types.ObjectId(userId),
      category: "profile_correction",
      status: "approved",
      $or: [{ profileEditUsedAt: { $exists: false } }, { profileEditUsedAt: null }],
    },
    { $set: { profileEditUsedAt: new Date() } },
    { sort: { createdAt: -1 } },
  );
}

export async function fetchAllAdminQueries(filters: {
  search: string;
  status: string;
  roleType: string;
  category: string;
}): Promise<UnifiedAdminQuery[]> {
  await migrateAllQueriesCollections();

  const dbFilter: Record<string, unknown> = {};
  if (filters.status && filters.status !== "all") {
    dbFilter.status = filters.status;
  }
  if (filters.roleType && filters.roleType !== "all") {
    dbFilter.role = filters.roleType;
  }
  if (filters.category && filters.category !== "all") {
    dbFilter.category = filters.category;
  }

  const rows = await Query.find(dbFilter).sort({ createdAt: -1 }).lean();
  let result = rows.map(r => toUnifiedAdminQuery(r));

  if (filters.search) {
    const s = filters.search;
    result = result.filter(
      q =>
        q.personName.toLowerCase().includes(s) ||
        q.personEmail.toLowerCase().includes(s) ||
        q.remarks.toLowerCase().includes(s) ||
        q.category.toLowerCase().includes(s),
    );
  }

  return result;
}

export async function getQueryStats(): Promise<QueryStats> {
  await migrateAllQueriesCollections();
  const rows = await Query.find({}).lean();
  const byCategory = {
    profile_correction: 0,
    switch_batch: 0,
    course_change: 0,
    fee_related: 0,
    attendance_correction: 0,
    other: 0,
  } as Record<QueryCategory, number>;

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (const row of rows) {
    const cat = (row.category as QueryCategory) || "profile_correction";
    if (byCategory[cat] !== undefined) byCategory[cat] += 1;
    if (row.status === "pending") pending += 1;
    else if (row.status === "approved") approved += 1;
    else if (row.status === "rejected") rejected += 1;
  }

  return {
    total: rows.length,
    pending,
    approved,
    rejected,
    byCategory,
  };
}

export async function findQueryByIdAndRole(id: string, role: QueryRole) {
  await migrateAllQueriesCollections();
  const doc = await Query.findById(id);
  if (!doc) return null;
  if (normalizeQueryFields(doc).role !== role) return null;
  return doc;
}

export function buildQueryCreatePayload(
  role: QueryRole,
  userId: mongoose.Types.ObjectId,
  personName: string,
  personEmail: string,
  remarks: string,
  category: QueryCategory,
  extra: QueryCategoryFieldsDto,
) {
  return {
    role,
    userId,
    personName,
    personEmail: personEmail.toLowerCase(),
    category,
    remarks,
    status: "pending" as const,
    adminRemark: "",
    ...extra,
  };
}
