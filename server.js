const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Inicializamos la aplicación
const app = express();

// Middlewares globales
app.use(cors()); // Habilita peticiones cruzadas
app.use(express.json()); // Permite a la API entender formato JSON en las peticiones

// Importamos la conexión a la base de datos (solo para que se ejecute la prueba)
require("./config/db");

// --- Rutas de la API ---
const authRoutes = require("./routes/authRoutes");
const productoRoutes = require("./routes/productoRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/productos", productoRoutes);

// Ruta de prueba (Health Check)
app.get("/", (req, res) => {
  res.json({
    mensaje: "API del Gestor de Productos funcionando correctamente",
  });
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});
