const bcrypt = require("bcryptjs");

async function generar() {
  const hash = await bcrypt.hash("Isma", 10);
  console.log("");
  console.log("═══════════════════════════════════════");
  console.log('Hash para "Isma":');
  console.log("═══════════════════════════════════════");
  console.log(hash);
  console.log("═══════════════════════════════════════");
  console.log("");
  process.exit();
}

generar();
