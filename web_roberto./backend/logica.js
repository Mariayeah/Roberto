const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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
        console.log('Conexión a DB Roberto (MySQL) exitosa.');
        connection.release();
    } catch (err) {
        console.error('Error de conexión DB Roberto:', err.message);
    }
}
testConnection();

/**
 * Obtiene todas las zonas.
 * @returns {Promise<Array>}
 */
async function getZonas() {
    const [rows] = await pool.query('SELECT * FROM Zona');
    return rows;
}


/**
 * Obtiene una zona por su ID.
 * @param {number} id ID de la zona
 * @returns {Promise<object|undefined>}
 */
async function getZonaById(id) {
    const [rows] = await pool.query('SELECT * FROM Zona WHERE ZonaID = ?', [id]);
    return rows[0];
}

/**
 * Obtiene todas las zonas con coordenadas (para mapa).
 * @returns {Promise<Array>}
 */
async function getAllZonas() {
    // Agregamos PosX y PosY a la consulta para que el mapa pueda dibujar el punto rojo
    const [rows] = await pool.query('SELECT ZonaID, Nombre, PosX, PosY FROM Zona');
    return rows;
}

/**
 * Obtiene todos los robots.
 * @returns {Promise<Array>}
 */
async function getRobots() {
    const [rows] = await pool.query('SELECT * FROM Robot');
    return rows;
}

/**
 * Obtiene eventos del sistema.
 * Si se pasa robotId, filtra por ese robot.
 * @param {number} [robotId] ID opcional del robot
 * @returns {Promise<Array>}
 */
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

/**
 * Registra un evento de conexión/desconexión del robot.
 * @param {number} robotId ID del robot
 * @param {string} status Estado ("connected" | "disconnected")
 * @returns {Promise<void>}
 */
async function logConnectionEvent(robotId, status) {
    const tipoEvento = status === 'connected' ? 'Inicio Sistema' : 'Error de Comunicación';
    const desc = status === 'connected' ? 'Robot conectado a interfaz' : 'Robot desconectado de interfaz';

    await pool.query(
        'INSERT INTO Evento (RobotID, TipoEvento, Descripcion, Gravedad) VALUES (?, ?, ?, ?)',
        [robotId, tipoEvento, desc, status === 'connected' ? 'Notificación' : 'Advertencia']
    );

    if (status === 'connected') {
        await pool.query('UPDATE Robot SET UltimaComunicacion = NOW(), EstadoID = 1 WHERE RobotID = ?', [robotId]);
    } else {
        await pool.query('UPDATE Robot SET UltimaComunicacion = NOW(), EstadoID = 3 WHERE RobotID = ?', [robotId]);
    }
}

/**
 * Inserta una posición del robot en la base de datos.
 * @param {number} robotId ID del robot
 * @param {number} x Posición X
 * @param {number} y Posición Y
 * @returns {Promise<void>}
 */
async function insertPosition(robotId, x, y) {
    try {
        const [result] = await pool.query(
            'INSERT INTO PosicionRobot (RobotID, PosX, PosY, FechaHora) VALUES (?, ?, ?, NOW())',
            [robotId, x, y]
        );
        console.log(`DB Saved: ID ${result.insertId} | x: ${x.toFixed(3)}, y: ${y.toFixed(3)}`);
    } catch (err) {
        // This will tell us if the table name is wrong or a column is missing
        console.error('DATABASE ERROR:', err.message);
    }
}

/**
 * Valida credenciales de un técnico.
 * Si la contraseña está en texto plano, la migra automáticamente a bcrypt.
 * @author Maria Algora
 * @param {string} email Email del técnico
 * @param {string} password Contraseña proporcionada
 * @returns {Promise<{success: boolean, message?: string, usuario?: object}>}
 */
async function validarCredenciales(email, password) {
    try {
        const query = 'SELECT TecnicoID, Nombre, Email, Contrasena FROM Tecnico WHERE Email = ?';
        const [rows] = await pool.query(query, [email]);

        if (!rows || rows.length === 0) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const tecnico = rows[0];
        let passwordMatch = false;

        if (tecnico.Contrasena.startsWith('$2')) {
            // Contraseña hasheada
            passwordMatch = await bcrypt.compare(password, tecnico.Contrasena);
        } else {
            // Texto plano (migración)
            passwordMatch = tecnico.Contrasena === password;

            if (passwordMatch) {
                const saltRounds = 10;
                const hashed = await bcrypt.hash(password, saltRounds);

                const updateQuery = 'UPDATE Tecnico SET Contrasena = ? WHERE TecnicoID = ?';
                await pool.query(updateQuery, [hashed, tecnico.TecnicoID]);

                console.log(`Contraseña del usuario ${tecnico.Email} migrada a hash.`);
            }
        }

        if (!passwordMatch) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        return {
            success: true,
            usuario: {
                id: tecnico.TecnicoID,
                nombre: tecnico.Nombre,
                email: tecnico.Email
            }
        };

    } catch (error) {
        console.error('Error en validarCredenciales:', error);
        return { success: false, message: 'Error interno del servidor' };
    }
}

module.exports = {
    pool,
    getZonas,
    getRobots,
    getEventos,
    logConnectionEvent,
    insertPosition,
    getZonaById,
    getAllZonas,
    validarCredenciales
};
