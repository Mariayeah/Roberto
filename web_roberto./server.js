const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======== CONEXIÓN A BASE DE DATOS LOCAL ========
// Configuración de MySQL local (XAMPP / Docker)
const dbConfig = {
    host: 'localhost',
    user: 'root',      // Usuario por defecto
    password: '',      // Contraseña por defecto (vacía o la tuya)
    database: 'roberto_db', // Cambia por el nombre de tu base de datos
    port: 3306
};

let dbConnection;

async function connectDB() {
    try {
        dbConnection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a la base de datos MySQL local establecida.');
    } catch (error) {
        console.error('❌ Error conectando a la base de datos local:', error.message);
        console.log('⚠️ El servidor continuará ejecutándose sin base de datos local. Asegúrate de tener XAMPP/Docker levantado.');
    }
}
// Inicializar conexión
connectDB();
// ================================================

// ======== SERVIR ARCHIVOS ESTÁTICOS FRONTEND ========
// Servimos TODAS las carpetas desde la raíz de este proyecto.
// Al usar __dirname, '/tecnico', '/camara' y '/seleccion_destino' y el pasajero estarán accesibles.
app.use(express.static(__dirname));
// ====================================================

// ======== ENDPOINTS DE LA API LOCAL ========
// Estos endpoints conectan a la BD local sin romper el mock de ROS2
// ya que el código del frontend que conecta a los websockets se mantiene intacto.

// Endpoint 1: Obtener la posición del robot
app.get('/api/position', async (req, res) => {
    // Si necesitas usar la BD en el futuro, podrías hacer esto:
    /*
    if (dbConnection) {
        const [rows] = await dbConnection.execute('SELECT * FROM robot_position ORDER BY id DESC LIMIT 1');
        return res.json({ connected: true, x: rows[0].x, y: rows[0].y });
    }
    */
    
    // Devolvemos datos mockeados iniciales (No rompe ROS2 client-side)
    res.json({ connected: true, x: 0, y: 0 });
});

// Endpoint 2: Enviar comando de navegación
app.post('/api/navigate', async (req, res) => {
    const { destination_id } = req.body;
    
    console.log(`[API Navigation] Solicitud de navegación recibida para el destino: ${destination_id}`);
    
    if (dbConnection && destination_id) {
        try {
            // Ejemplo: Guardar localmente qué destino pidió el usuario en BD
            await dbConnection.execute(
                'INSERT INTO navigation_logs (destination_id, timestamp) VALUES (?, NOW())', 
                [destination_id]
            );
            console.log('✅ Registro de navegación guardado en local.');
        } catch (error) {
            console.error('❌ Error al insertar en DB:', error.message);
        }
    }

    res.json({ success: true, message: "Comando recibido. Simulando navegación localmente." });
});

// Endpoint 3: Login Dashboard Técnico (Visto en dashboard.html viejo)
app.post('/api/auth/login', async (req, res) => {
    // Ejemplo de endpoint si lo necesitas.
    res.json({ success: true, message: "Login mock" });
});

// ======== ARRANQUE DEL SERVIDOR ========
app.listen(PORT, () => {
    console.log(`🚀 Servidor Local activo en http://localhost:${PORT}`);
    console.log(`📂 Sirviendo estáticos desde: ${__dirname}`);
});
