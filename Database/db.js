// const pkg = require("pg");
// require("dotenv").config();
// const { Client } = pkg;
// console.log("🔧 Database Configuration:");
// console.log("DB_HOST:", process.env.DB_HOST);
// console.log("DB_PORT:", process.env.DB_PORT);
// console.log("DB_NAME:", process.env.DB_NAME);
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASSWORD Length:", process.env.DB_PASSWORD?.length);
// const database = new Client({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });
// (async () => {
//   try {
//     await database.connect();
//     console.log("Database is Connected Successfully");
//   } catch (error) {
//     console.log("Database connection failed");
//   }
// })();
// module.exports = database;

const pkg = require("pg");
require("dotenv").config();
const { Pool } = pkg;

// Render pe NODE_ENV=production hota hai, isliye wahan hamesha live DB use hoga
const isLiveEnv =
  process.env.DB_MODE === "live" || process.env.NODE_ENV === "production";

// ---------- Live (Neon) pool ----------
const livePool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        ssl: { rejectUnauthorized: false },
      }
);

// ---------- Local pool (sirf local development mein) ----------
const localPool = isLiveEnv
  ? null
  : new Pool({
      user: process.env.LOCAL_DB_USER,
      host: process.env.LOCAL_DB_HOST,
      database: process.env.LOCAL_DB_NAME,
      password: process.env.LOCAL_DB_PASSWORD,
      port: Number(process.env.LOCAL_DB_PORT) || 5432,
    });

livePool.on("error", (e) => console.log("Live pool error:", e.message));
if (localPool) {
  localPool.on("error", (e) => console.log("Local pool error:", e.message));
}

// ---------- Mode handling ----------
let mode = isLiveEnv ? "live" : "local";

const current = () => (mode === "live" || !localPool ? livePool : localPool);

const database = {
  query: (...args) => current().query(...args),
  connect: (...args) => current().connect(...args),
  getMode: () => (!localPool ? "live" : mode),
  setMode: (m) => {
    mode = m === "live" || !localPool ? "live" : "local";
    console.log("DB mode:", mode);
  },
  runOn: async (m, fn) => {
    const prev = mode;
    mode = m === "live" || !localPool ? "live" : "local";
    try {
      await fn();
    } finally {
      mode = prev;
    }
  },
};

// ---------- Startup connection check ----------
(async () => {
  const pools = isLiveEnv
    ? [["Live (Neon)", livePool]]
    : [
        ["Local", localPool],
        ["Live (Neon)", livePool],
      ];

  for (const [name, pool] of pools) {
    try {
      await pool.query("SELECT 1");
      console.log(`${name} database connected`);
    } catch (e) {
      console.log(`${name} database connection failed:`, e.message);
    }
  }
})();

module.exports = database;