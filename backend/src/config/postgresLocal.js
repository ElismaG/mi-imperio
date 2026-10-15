const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "mi_imperio_db",
  user: "postgres",
  password: process.env.DB_PASSWORD || "admin123",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar conexión
pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL Local");
});

pool.on("error", (err) => {
  console.error("❌ Error en PostgreSQL Local:", err);
});

module.exports = pool;
