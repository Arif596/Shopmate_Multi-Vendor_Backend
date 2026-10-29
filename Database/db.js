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

const isLiveEnv = process.env.DB_MODE === "live";

const livePool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

const localPool = new Pool({
  user: process.env.LOCAL_DB_USER,
  host: process.env.LOCAL_DB_HOST,
  database: process.env.LOCAL_DB_NAME,
  password: process.env.LOCAL_DB_PASSWORD,
  port: process.env.LOCAL_DB_PORT,
});

livePool.on("error", (e) => console.log("Live pool error:", e.message));
localPool.on("error", (e) => console.log("Local pool error:", e.message));

let mode = isLiveEnv ? "live" : "local";
const current = () => (mode === "live" ? livePool : localPool);

const database = {
  query: (...args) => current().query(...args),
  connect: (...args) => current().connect(...args),
  getMode: () => mode,
  setMode: (m) => {
    mode = m === "live" ? "live" : "local";
    console.log("DB mode:", mode);
  },
  runOn: async (m, fn) => {
    const prev = mode;
    mode = m;
    try { await fn(); } finally { mode = prev; }
  },
};

(async () => {
  const pools = isLiveEnv
    ? [["Live (Neon)", livePool]]
    : [["Local", localPool], ["Live (Neon)", livePool]];

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