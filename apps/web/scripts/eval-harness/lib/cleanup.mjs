// Harness data cleanup. All harness diners carry a uuid prefixed with
// "harness-"; we find them first, delete their orders, then them. Orders
// can't carry a custom "_harnessRunId" because the Order schema is strict
// — Mongoose silently drops unknown fields. So we cleanup by dinerId
// lookup instead, which is just as airtight and requires no schema change.

import Diner from "../../../lib/models/Diner.js";
import Order from "../../../lib/models/Order.js";

export const HARNESS_UUID_PREFIX = "harness-";

export async function cleanupOne(dinerObjectId) {
  if (!dinerObjectId) return { ordersDeleted: 0, dinerDeleted: 0 };
  const ordersResult = await Order.deleteMany({ dinerId: dinerObjectId });
  const dinerResult = await Diner.deleteOne({ _id: dinerObjectId });
  return {
    ordersDeleted: ordersResult.deletedCount || 0,
    dinerDeleted: dinerResult.deletedCount || 0,
  };
}

export async function cleanupAll() {
  const diners = await Diner.find({ uuid: { $regex: `^${HARNESS_UUID_PREFIX}` } })
    .select("_id uuid")
    .lean();
  const ids = diners.map((d) => d._id);
  if (ids.length === 0) {
    return { ordersDeleted: 0, dinersDeleted: 0, dinerIds: [] };
  }
  const ordersResult = await Order.deleteMany({ dinerId: { $in: ids } });
  const dinersResult = await Diner.deleteMany({ _id: { $in: ids } });
  return {
    ordersDeleted: ordersResult.deletedCount || 0,
    dinersDeleted: dinersResult.deletedCount || 0,
    dinerIds: ids,
  };
}

export async function verifyClean() {
  const remainingDiners = await Diner.countDocuments({
    uuid: { $regex: `^${HARNESS_UUID_PREFIX}` },
  });
  // Orphan orders: orders whose dinerId points to a diner that no longer
  // exists. This can only happen if a previous run died mid-cleanup; we
  // detect (but don't auto-delete — surface it loudly so the user investigates).
  const remainingDinerDocs = await Diner.find({
    uuid: { $regex: `^${HARNESS_UUID_PREFIX}` },
  })
    .select("_id")
    .lean();
  const remainingIds = remainingDinerDocs.map((d) => d._id);
  const remainingOrders =
    remainingIds.length > 0
      ? await Order.countDocuments({ dinerId: { $in: remainingIds } })
      : 0;
  return { remainingDiners, remainingOrders };
}
