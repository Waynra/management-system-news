import sequelize from "./connection.js";
import "dotenv/config";

if (process.env.NODE_ENV === "production") process.exit(0);

let exitCode = 0;

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Migrate: database schema synced");
} catch (err) {
  console.error("Migrate Failed:", err.message);
  exitCode = 1;
} finally {
  await sequelize.close();
  process.exit(exitCode);
}
