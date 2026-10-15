// generar-iconos.js - Script para crear los íconos PWA
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Configuración
const IMAGEN_ORIGINAL = path.join(__dirname, "logo-original.jpg");
const CARPETA_PUBLIC = path.join(__dirname, "public");

async function generarIconos() {
  try {
    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("🎨 GENERANDO ÍCONOS DE LA APP");
    console.log("═══════════════════════════════════════");
    console.log("");

    // 1. Verificar que la imagen original existe
    if (!fs.existsSync(IMAGEN_ORIGINAL)) {
      console.error("❌ No se encuentra el archivo:", IMAGEN_ORIGINAL);
      console.log('💡 Asegúrate de guardar la imagen como "logo-original.jpg"');
      console.log("   en la carpeta:", __dirname);
      process.exit();
    }

    console.log("✅ Imagen original encontrada");

    // 2. Verificar que la carpeta public existe
    if (!fs.existsSync(CARPETA_PUBLIC)) {
      fs.mkdirSync(CARPETA_PUBLIC, { recursive: true });
      console.log('📁 Carpeta "public" creada');
    }

    // 3. Generar icon-192.png
    console.log("");
    console.log("🎨 Generando icon-192.png...");
    await sharp(IMAGEN_ORIGINAL)
      .resize(192, 192, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toFile(path.join(CARPETA_PUBLIC, "icon-192.png"));
    console.log("   ✅ Guardado: public/icon-192.png");

    // 4. Generar icon-512.png
    console.log("");
    console.log("🎨 Generando icon-512.png...");
    await sharp(IMAGEN_ORIGINAL)
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toFile(path.join(CARPETA_PUBLIC, "icon-512.png"));
    console.log("   ✅ Guardado: public/icon-512.png");

    // 5. Generar favicon
    console.log("");
    console.log("🎨 Generando favicon.png...");
    await sharp(IMAGEN_ORIGINAL)
      .resize(32, 32, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toFile(path.join(CARPETA_PUBLIC, "favicon.png"));
    console.log("   ✅ Guardado: public/favicon.png");

    // 6. Generar apple-touch-icon
    console.log("");
    console.log("🍎 Generando apple-touch-icon.png...");
    await sharp(IMAGEN_ORIGINAL)
      .resize(180, 180, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toFile(path.join(CARPETA_PUBLIC, "apple-touch-icon.png"));
    console.log("   ✅ Guardado: public/apple-touch-icon.png");

    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("🎉 ÍCONOS GENERADOS EXITOSAMENTE");
    console.log("═══════════════════════════════════════");
    console.log("");
    console.log('📂 Archivos creados en la carpeta "public":');
    console.log("   - icon-192.png");
    console.log("   - icon-512.png");
    console.log("   - favicon.png");
    console.log("   - apple-touch-icon.png");
    console.log("");
  } catch (error) {
    console.error("❌ Error al generar íconos:", error.message);
  }
  process.exit();
}

generarIconos();
