const pool = require("../config/db");

exports.crearProducto = async (req, res) => {
  const { nombre, descripcion, tipo, disponibilidad, precio } = req.body;
  const usuario_id = req.usuario.id;

  try {
    if (!nombre || !tipo || !precio) {
      return res
        .status(400)
        .json({ error: "Nombre, tipo y precio son campos obligatorios." });
    }

    const [result] = await pool.query(
      "INSERT INTO productos (usuario_id, nombre, descripcion, tipo, disponibilidad, precio) VALUES (?, ?, ?, ?, ?, ?)",
      [
        usuario_id,
        nombre,
        descripcion,
        tipo,
        disponibilidad !== undefined ? disponibilidad : true,
        precio,
      ],
    );

    res.status(201).json({
      mensaje: "Solicitud de producto creada exitosamente",
      producto_id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al crear el producto" });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const { rol, id } = req.usuario;
    let query;
    let queryParams = [];

    if (rol === "admin") {
      query = "SELECT * FROM productos";
    } else {
      query = "SELECT * FROM productos WHERE usuario_id = ?";
      queryParams = [id];
    }

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al obtener productos" });
  }
};

exports.actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, tipo, disponibilidad, precio, estado } =
    req.body;

  try {
    const [existe] = await pool.query("SELECT * FROM productos WHERE id = ?", [
      id,
    ]);
    if (existe.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await pool.query(
      "UPDATE productos SET nombre = ?, descripcion = ?, tipo = ?, disponibilidad = ?, precio = ?, estado = ? WHERE id = ?",
      [
        nombre || existe[0].nombre,
        descripcion || existe[0].descripcion,
        tipo || existe[0].tipo,
        disponibilidad !== undefined
          ? disponibilidad
          : existe[0].disponibilidad,
        precio || existe[0].precio,
        estado || existe[0].estado,
        id,
      ],
    );

    res.json({ mensaje: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al actualizar el producto" });
  }
};

exports.eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM productos WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al eliminar el producto" });
  }
};

// Convertir precio (API Externa) - Accesible para cualquier usuario autenticado
exports.convertirPrecio = async (req, res) => {
  // Extraemos el ID del producto y la moneda a la que queremos convertir desde la URL
  const { id, moneda_destino } = req.params;

  // Validación estricta: Solo permitimos COP o MXN
  const monedaDestinoMayuscula = moneda_destino.toUpperCase();
  if (monedaDestinoMayuscula !== "COP" && monedaDestinoMayuscula !== "MXN") {
    return res
      .status(400)
      .json({ error: "Moneda no soportada. Use COP o MXN." });
  }

  try {
    // 1. Buscamos el precio original del producto en tu base de datos
    const [producto] = await pool.query(
      "SELECT precio, nombre FROM productos WHERE id = ?",
      [id],
    );

    if (producto.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const precioBase = parseFloat(producto[0].precio);

    // Si el usuario pide convertir a MXN y nuestra base ya es MXN, no gastamos recursos llamando a la API
    if (monedaDestinoMayuscula === "MXN") {
      return res.json({
        producto: producto[0].nombre,
        precio_original: precioBase,
        moneda_destino: "MXN",
        precio_convertido: precioBase,
      });
    }

    // 2. Consumir la API Externa.
    // fetch hace la petición HTTP. Le decimos que nuestra moneda base es MXN.
    const respuesta = await fetch("https://open.er-api.com/v6/latest/MXN");

    if (!respuesta.ok) {
      throw new Error("Fallo al comunicarse con la API de divisas externa");
    }

    // Convertimos la respuesta de la API externa a formato JSON
    const data = await respuesta.json();

    // Extraemos la tasa de cambio específica para COP (Pesos Colombianos)
    const tasaDeCambio = data.rates[monedaDestinoMayuscula];

    if (!tasaDeCambio) {
      return res
        .status(500)
        .json({ error: "Tasa de cambio no disponible en este momento" });
    }

    // 3. Matemática básica: multiplicamos el precio por la tasa de cambio
    const precioConvertido = precioBase * tasaDeCambio;

    // Devolvemos la respuesta a tu frontend
    res.json({
      producto: producto[0].nombre,
      precio_original_mxn: precioBase,
      tasa_de_cambio: tasaDeCambio,
      moneda_destino: monedaDestinoMayuscula,
      // toFixed(2) recorta los decimales a solo dos
      precio_convertido: precioConvertido.toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno al convertir la divisa" });
  }
};
