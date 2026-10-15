const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════
const BACKUP_DIR = path.join(__dirname, "../../backups");
const DB_NAME = "mi_imperio_db";
const DB_USER = "postgres";
const DB_HOST = "localhost";
const DB_PORT = 5432;
const DB_PASSWORD = process.env.DB_PASSWORD || "Isma";
const DIAS_RETENCION = 30;

// 🔧 RUTAS COMPLETAS A LAS HERRAMIENTAS DE POSTGRESQL
const PG_DUMP_PATH =
  "C:\\Users\\Ismael\\Desktop\\Ismael\\Posgre\\bin\\pg_dump.exe";
const PSQL_PATH = "C:\\Users\\Ismael\\Desktop\\Ismael\\Posgre\\bin\\psql.exe";

// ═══════════════════════════════════════════════════════════
// CREAR CARPETA DE BACKUPS SI NO EXISTE
// ═══════════════════════════════════════════════════════════
function asegurarCarpetaBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log("📁 Carpeta de backups creada:", BACKUP_DIR);
  }
}

// ═══════════════════════════════════════════════════════════
// CREAR UN BACKUP
// ═══════════════════════════════════════════════════════════
async function crearBackup() {
  asegurarCarpetaBackups();

  const fecha = new Date();
  const fechaStr = fecha
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const nombreArchivo = `backup_${fechaStr}.sql`;
  const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("💾 INICIANDO BACKUP");
  console.log("═══════════════════════════════════════");
  console.log("📅 Fecha:", fecha.toLocaleString("es-ES"));
  console.log("📁 Archivo:", nombreArchivo);
  console.log("");

  return new Promise((resolve, reject) => {
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    // Usar la ruta completa entre comillas dobles
    const comando = `"${PG_DUMP_PATH}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${rutaArchivo}"`;

    console.log("🔧 Ejecutando:", comando);
    console.log("");

    exec(
      comando,
      { env, maxBuffer: 100 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error al crear backup:", error.message);
          if (stderr) console.error("Detalles:", stderr);
          return reject(error);
        }

        if (!fs.existsSync(rutaArchivo)) {
          const err = new Error("El archivo de backup no se creó");
          console.error("❌", err.message);
          return reject(err);
        }

        const stats = fs.statSync(rutaArchivo);
        const tamañoMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log("✅ BACKUP COMPLETADO");
        console.log("📊 Tamaño:", tamañoMB, "MB");
        console.log("═══════════════════════════════════════");
        console.log("");

        resolve({
          archivo: nombreArchivo,
          ruta: rutaArchivo,
          tamaño: `${tamañoMB} MB`,
          fecha: fecha.toISOString(),
        });
      },
    );
  });
}

// ═══════════════════════════════════════════════════════════
// ELIMINAR BACKUPS ANTIGUOS
// ═══════════════════════════════════════════════════════════
function limpiarBackupsAntiguos() {
  asegurarCarpetaBackups();

  const ahora = new Date();
  const archivos = fs.readdirSync(BACKUP_DIR);
  let eliminados = 0;

  archivos.forEach((archivo) => {
    if (!archivo.startsWith("backup_") || !archivo.endsWith(".sql")) return;

    const rutaCompleta = path.join(BACKUP_DIR, archivo);
    const stats = fs.statSync(rutaCompleta);
    const diasAntiguedad = (ahora - stats.mtime) / (1000 * 60 * 60 * 24);

    if (diasAntiguedad > DIAS_RETENCION) {
      fs.unlinkSync(rutaCompleta);
      eliminados++;
      console.log(`🗑️ Backup antiguo eliminado: ${archivo}`);
    }
  });

  if (eliminados > 0) {
    console.log(`✅ ${eliminados} backup(s) antiguo(s) eliminado(s)`);
  }

  return eliminados;
}

// ═══════════════════════════════════════════════════════════
// LISTAR TODOS LOS BACKUPS
// ═══════════════════════════════════════════════════════════
function listarBackups() {
  asegurarCarpetaBackups();

  const archivos = fs
    .readdirSync(BACKUP_DIR)
    .filter((a) => a.startsWith("backup_") && a.endsWith(".sql"))
    .map((a) => {
      const rutaCompleta = path.join(BACKUP_DIR, a);
      const stats = fs.statSync(rutaCompleta);
      return {
        archivo: a,
        tamaño: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        fecha: stats.mtime.toISOString(),
        ruta: rutaCompleta,
      };
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return archivos;
}

// ═══════════════════════════════════════════════════════════
// RESTAURAR UN BACKUP
// ═══════════════════════════════════════════════════════════
async function restaurarBackup(nombreArchivo) {
  const rutaArchivo = path.join(BACKUP_DIR, nombreArchivo);

  if (!fs.existsSync(rutaArchivo)) {
    throw new Error(`No existe el archivo: ${nombreArchivo}`);
  }

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("⚠️ RESTAURANDO BACKUP");
  console.log("═══════════════════════════════════════");
  console.log("📁 Archivo:", nombreArchivo);
  console.log("");

  return new Promise((resolve, reject) => {
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    const comando = `"${PSQL_PATH}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${rutaArchivo}"`;

    exec(
      comando,
      { env, maxBuffer: 100 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error al restaurar:", error.message);
          return reject(error);
        }

        console.log("✅ BACKUP RESTAURADO EXITOSAMENTE");
        console.log("═══════════════════════════════════════");
        console.log("");

        resolve({ mensaje: "Backup restaurado exitosamente" });
      },
    );
  });
}

// ═══════════════════════════════════════════════════════════
// PROGRAMAR BACKUPS AUTOMÁTICOS
// ═══════════════════════════════════════════════════════════
function programarBackups() {
  cron.schedule("0 3 * * *", async () => {
    console.log("");
    console.log("⏰ EJECUTANDO BACKUP PROGRAMADO (3:00 AM)");
    try {
      await crearBackup();
      limpiarBackupsAntiguos();
    } catch (error) {
      console.error("❌ Error en backup programado:", error.message);
    }
  });

  cron.schedule("0 4 * * 0", () => {
    console.log("");
    console.log("🧹 EJECUTANDO LIMPIEZA SEMANAL");
    limpiarBackupsAntiguos();
  });

  console.log("⏰ Backups automáticos programados:");
  console.log("   - Backup diario: 3:00 AM");
  console.log("   - Limpieza semanal: Domingos 4:00 AM");
  console.log("");
}

module.exports = {
  crearBackup,
  limpiarBackupsAntiguos,
  listarBackups,
  restaurarBackup,
  programarBackups,
};
