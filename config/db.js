const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306, // INSTRUCCIÓN CRÍTICA FALTANTE
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Prueba de conexión inmediata
pool
  .getConnection()
  .then((connection) => {
    console.log("Conexión a la base de datos MySQL establecida con éxito.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error fatal al conectar con la base de datos:", err.message);
  });

module.exports = pool;
