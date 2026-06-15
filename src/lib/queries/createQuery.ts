import mongoose from "mongoose";
import Query from "@/lib/models/Query";
import {
  buildQueryCreatePayload,
  migrateAllQueriesCollections,
  type QueryRole,
} from "@/lib/queries/queryAccess";
import {
  buildCreateQuerySchema,
  extractCategoryPayload,
  type QueryCategory,
} from "@/lib/queries/queryCategories";

type CreateQueryInput = {
  role: QueryRole;
  userId: string;
  personName: string;
  personEmail: string;
  body: Record<string, unknown>;
  nameKey: string;
  emailKey: string;
};

export async function createUserQuery(input: CreateQueryInput) {
  const schema = buildCreateQuerySchema(input.nameKey, input.emailKey);
  const parsed = schema.safeParse(input.body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.errors.map(e => e.message).join("; ") };
  }

  const data = parsed.data as Record<string, string>;
  const category = data.category as QueryCategory;
  const extra = extractCategoryPayload({
    category,
    ...data,
  });

  await migrateAllQueriesCollections();

  const pending = await Query.findOne({
    role: input.role,
    userId: new mongoose.Types.ObjectId(input.userId),
    status: "pending",
  }).lean();

  if (pending) {
    return {
      ok: false as const,
      error: "You already have a pending query. Please wait for admin review.",
      status: 400,
    };
  }

  const payload = buildQueryCreatePayload(
    input.role,
    new mongoose.Types.ObjectId(input.userId),
    data[input.nameKey],
    data[input.emailKey],
    data.remarks,
    category,
    extra,
  );

  const doc = await Query.create(payload);
  return { ok: true as const, doc, category };
}
