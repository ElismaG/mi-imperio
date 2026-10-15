const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ mensaje: "✅ Backend funcionando correctamente" });
});

const authRoutes = require("./src/routes/authRoutes");
const productoRoutes = require("./src/routes/productoRoutes");
const ventaRoutes = require("./src/routes/ventaRoutes");
const categoriaRoutes = require("./src/routes/categoriaRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const reporteRoutes = require("./src/routes/reporteRoutes");
const clienteRoutes = require("./src/routes/clienteRoutes");
const pedidoRoutes = require("./src/routes/pedidoRoutes");
const configuracionRoutes = require("./src/routes/configuracionRoutes");
const empleadoRoutes = require("./src/routes/empleadoRoutes");
const backupRoutes = require("./src/routes/backupRoutes");
const backupService = require("./src/services/backupService");
const historialRoutes = require("./src/routes/historialRoutes");
const gastoRoutes = require("./src/routes/gastoRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reportes", reporteRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/empleados", empleadoRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/gastos", gastoRoutes);

// Programar backups automáticos
backupService.programarBackups();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
