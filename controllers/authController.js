const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

exports.registro = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    // Generar el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar usuario en la base de datos. El rol 'guest' se asigna por defecto según nuestro esquema SQL.
    const [result] = await pool.query(
      "INSERT INTO usuarios (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash],
    );

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      usuario_id: result.insertId,
    });
  } catch (error) {
    // Manejar el error de campos únicos (username o email duplicado)
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "El nombre de usuario o correo ya está en uso" });
    }
    console.error(error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al registrar usuario" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    // 1. Buscar al usuario por correo
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const usuario = rows[0];

    // 2. Comparar la contraseña ingresada con el hash de la base de datos
    const isMatch = await bcrypt.compare(password, usuario.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 3. Generar el JWT con el ID y el ROL del usuario
    const payload = {
      id: usuario.id,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({
      mensaje: "Autenticación exitosa",
      token: token,
      rol: usuario.rol,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error interno del servidor durante el login" });
  }
};
