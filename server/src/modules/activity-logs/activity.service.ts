import * as repository from "./activity.repository.js";
import type { ActivityTransaction } from "./activity.repository.js";
import type { ActivityListInput, LogActivityInput } from "./activity.types.js";

export function logActivity(tx: ActivityTransaction, input: LogActivityInput) {
  return repository.insertActivity(tx, input);
}

export function getActivities(input: ActivityListInput) {
  return repository.listActivities(input);
}
