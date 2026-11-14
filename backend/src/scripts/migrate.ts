// MongoDB doesn't require migrations in the same way as SQL databases
// This script ensures the database connection and can be used to run any setup tasks
import { connectDb, disconnectDb } from "../db/pool.js";
import { Migration } from "../db/models.js";

async function run() {
  await connectDb();

  // MongoDB migrations are typically handled by Mongoose schemas
  // This script can be used to track migration history if needed
  // For now, we'll just ensure the connection works

  // eslint-disable-next-line no-console
  console.log("[db:migrate] MongoDB connection established");
  // eslint-disable-next-line no-console
  console.log("[db:migrate] MongoDB schemas are automatically created on first use");

  await disconnectDb();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[db:migrate] failed", err);
  process.exit(1);
});
