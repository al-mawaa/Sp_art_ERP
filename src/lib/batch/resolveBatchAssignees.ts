import mongoose from "mongoose";
import Teacher from "@/lib/models/Teacher";
import SeniorTeacher from "@/lib/models/SeniorTeacher";

export type ResolvedBatchAssignees = {
  teacherIds: mongoose.Types.ObjectId[];
  seniorTeacherIds: mongoose.Types.ObjectId[];
};

/**
 * Split batch picker IDs into Teacher vs SeniorTeacher collections.
 * The UI sends both types in `teacherIds`; only Teacher refs belong on batch.teacherIds.
 */
export async function resolveBatchAssignees(ids: string[]): Promise<ResolvedBatchAssignees> {
  const valid = [...new Set(ids.filter(id => mongoose.Types.ObjectId.isValid(id)))];
  if (!valid.length) {
    return { teacherIds: [], seniorTeacherIds: [] };
  }

  const oids = valid.map(id => new mongoose.Types.ObjectId(id));
  const [seniorRows, teacherRows] = await Promise.all([
    SeniorTeacher.find({ _id: { $in: oids } }).select("_id").lean(),
    Teacher.find({ _id: { $in: oids } }).select("_id").lean(),
  ]);

  const seniorSet = new Set(seniorRows.map(s => (s._id as mongoose.Types.ObjectId).toString()));
  const teacherSet = new Set(teacherRows.map(t => (t._id as mongoose.Types.ObjectId).toString()));

  const teacherIds: mongoose.Types.ObjectId[] = [];
  const seniorTeacherIds: mongoose.Types.ObjectId[] = [];

  for (const id of valid) {
    if (seniorSet.has(id)) {
      seniorTeacherIds.push(new mongoose.Types.ObjectId(id));
    } else if (teacherSet.has(id)) {
      teacherIds.push(new mongoose.Types.ObjectId(id));
    }
  }

  return { teacherIds, seniorTeacherIds };
}

export function applySeniorOwnership(
  batch: { createdBy?: mongoose.Types.ObjectId; seniorTeacherIds?: mongoose.Types.ObjectId[] },
  seniorTeacherIds: mongoose.Types.ObjectId[],
  access: { kind: string; seniorTeacherId?: string },
) {
  const ids = [...seniorTeacherIds];

  if (access.kind === "senior" && access.seniorTeacherId) {
    const seniorOid = new mongoose.Types.ObjectId(access.seniorTeacherId);
    if (!ids.some(id => id.equals(seniorOid))) {
      ids.unshift(seniorOid);
    }
    batch.createdBy = seniorOid;
  } else if (ids.length > 0) {
    batch.createdBy = ids[0];
  }

  batch.seniorTeacherIds = ids;
}
