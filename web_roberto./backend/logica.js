const mysql = require('mysql2/promise');

// Configuración de MySQL local apuntando a la base de datos "Roberto"
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Roberto',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a DB Roberto (MySQL) exitosa.');
        connection.release();
    } catch (err) {
        console.error('❌ Error de conexión DB Roberto:', err.message);
    }
}
testConnection();

async function getZonas() {
    const [rows] = await pool.query('SELECT * FROM Zona');
    return rows;
}

async function getRobots() {
    const [rows] = await pool.query('SELECT * FROM Robot');
    return rows;
}

async function getEventos(robotId) {
    let query = 'SELECT * FROM Evento';
    const params = [];
    if (robotId) {
        query += ' WHERE RobotID = ?';
        params.push(robotId);
    }
    query += ' ORDER BY FechaHora DESC LIMIT 10';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function logConnectionEvent(robotId, status) {
    // Registra el evento en la tabla "Evento" y actualiza Robot."UltimaComunicacion"
    // El tipo de evento puede ser 'Inicio Sistema' para conexión y 'Error de Comunicación' para desconexión
    const tipoEvento = status === 'connected' ? 'Inicio Sistema' : 'Error de Comunicación';
    const desc = status === 'connected' ? 'Robot conectado a interfaz' : 'Robot desconectado de interfaz';
    
    // Insertar Evento
    await pool.query(
        'INSERT INTO Evento (RobotID, TipoEvento, Descripcion, Gravedad) VALUES (?, ?, ?, ?)',
        [robotId, tipoEvento, desc, status === 'connected' ? 'Notificación' : 'Advertencia']
    );

    // Actualizar Robot
    if (status === 'connected') {
        await pool.query('UPDATE Robot SET UltimaComunicacion = NOW(), EstadoID = 1 WHERE RobotID = ?', [robotId]);
    } else {
        await pool.query('UPDATE Robot SET UltimaComunicacion = NOW(), EstadoID = 3 WHERE RobotID = ?', [robotId]); 
        // Suponiendo 1 = Disponible/Activo, 3 = Fuera de Servicio/Desconectado
    }
}

module.exports = {
    pool,
    getZonas,
    getRobots,
    getEventos,
    logConnectionEvent
};
