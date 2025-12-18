import seedNews from "./seeder/newsSeed.js";
import "dotenv/config";

if (process.env.NODE_ENV !== "production") await seedNews();

process.exit(0);
