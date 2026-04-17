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

module.exports = {
    pool,
    getZonas,
    getRobots,
    getEventos
};
