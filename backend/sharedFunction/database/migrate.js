import sequelize from "./connection.js";
import "dotenv/config";
try {
  if (process.env.NODE_ENV === "production") process.exit(0);
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
} catch (err) {
  console.error("Migrate Failed:", err.message);
  process.exit(1);
}
