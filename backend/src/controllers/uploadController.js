const multer = require("multer");
const path = require("path");

// Configurar dónde y cómo se guardan las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + "-" + file.originalname;
    cb(null, nombreUnico);
  },
});

// Filtrar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Endpoint para subir imagen de producto
exports.subirImagen = [
  upload.single("imagen"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se subió ninguna imagen" });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      res.status(500).json({ error: error.message });
    }
  },
];

// 🆕 Endpoint para subir comprobante de pago
exports.subirComprobante = [
  upload.single("comprobante"),
  (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No se subió ningún comprobante" });
      }
      const url = `/uploads/${req.file.filename}`;
      console.log("📸 Comprobante subido:", url);
      res.json({ url });
    } catch (error) {
      console.error("Error al subir comprobante:", error);
      res.status(500).json({ error: error.message });
    }
  },
];
