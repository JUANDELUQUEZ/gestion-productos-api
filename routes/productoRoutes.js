const express = require("express");
const router = express.Router();
const productoController = require("../controllers/productoController");
const {
  verificarToken,
  verificarAdmin,
} = require("../middleware/authMiddleware");

router.get("/", verificarToken, productoController.obtenerProductos);
router.post("/", verificarToken, productoController.crearProducto);
router.put(
  "/:id",
  verificarToken,
  verificarAdmin,
  productoController.actualizarProducto,
);
router.delete(
  "/:id",
  verificarToken,
  verificarAdmin,
  productoController.eliminarProducto,
);

// GET: Accesible para cualquier usuario logueado (guest o admin)
router.get(
  "/:id/convertir/:moneda_destino",
  verificarToken,
  productoController.convertirPrecio,
);

module.exports = router;
