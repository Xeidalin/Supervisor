import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-all-providers",
  { hours: 1 },
  internal.actions.sync.syncAllProviders,
);

export default crons;
