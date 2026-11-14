// MongoDB query helpers - simplified interface for compatibility
// Note: Most queries should use Mongoose models directly, but these helpers
// provide a convenient interface for common query patterns

import type { Model, Document } from "mongoose";

export async function queryRows<T = any>(
  model: Model<any>,
  filter: any = {},
  options: { sort?: any; limit?: number; skip?: number } = {}
): Promise<T[]> {
  let query = model.find(filter);
  if (options.sort) query = query.sort(options.sort);
  if (options.skip) query = query.skip(options.skip);
  if (options.limit) query = query.limit(options.limit);
  return (await query.lean().exec()) as T[];
}

export async function queryFirst<T = any>(
  model: Model<any>,
  filter: any = {}
): Promise<T | undefined> {
  const doc = await model.findOne(filter).lean().exec();
  return (doc as T) || undefined;
}

export async function queryCount(model: Model<any>, filter: any = {}): Promise<number> {
  return await model.countDocuments(filter).exec();
}
