const express = require('express');
const router = express.Router();
const logica = require('./logica');
const rosClient = require('./rosClient');

// GET /api/position -> Retorna la ultima posicion en memoria (Real-Time)
router.get('/position', (req, res) => {
    res.json(rosClient.getLatestPosition());
});

// GET /api/goal -> Retorna el ultimo goal en memoria
router.get('/goal', (req, res) => {
    res.json(rosClient.getCurrentGoal());
});

// GET /api/zonas -> Lista todas las zonas (id y nombre)
router.get('/zonas', async (req, res) => {
    try {
        const zonas = await logica.getAllZonas();
        res.json(zonas);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load zonas' });
    }
});

// POST /api/sendGoal -> Envia robot a un destino
router.post('/sendGoal', async (req, res) => {
    const { zonaId } = req.body;

    try {
        const zona = await logica.getZonaById(zonaId);

        if (!zona) {
            return res.status(404).json({ error: 'Zona not found' });
        }

        rosClient.sendGoal(zona.PosX, zona.PosY);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send goal' });
    }
});


// GET /api/destinos -> Consulta la tabla Zona y organiza por categoría
router.get('/destinos', async (req, res) => {
    try {
        const zonas = await logica.getZonas();
        
        const destinationMap = {};
        
        // Mapeamos los Tipos de la BD a las IDs quemadas en el frontend que usaban los SVGs.
        // Opcional: También podríamos pasar todo de forma directa
        const typeKeys = {
            'Puerta': 'puertas',
            'Comida': 'comida',
            'Ocio': 'ocio',
            'Salida': 'salida'
        };

        for (const z of zonas) {
            const key = typeKeys[z.TipoZona] || z.TipoZona.toLowerCase();
            
            if (!destinationMap[key]) {
                destinationMap[key] = [];
            }
            
            destinationMap[key].push({
                id: z.ZonaID.toString(),
                name: z.Nombre, // Ej. "Puerta 12"
                subtitle: z.TipoZona, 
                // Usando valores fijos temporales ya que Roberto.sql no tiene distancias ni tiempo; 
                // Se podría calcular más adelante por coordenadas (PosX, PosY)
                time: 'Calculando...',
                dist: Math.round(Math.sqrt(z.PosX*z.PosX + z.PosY*z.PosY)) + 'm'
            });
        }

        res.json({ success: true, data: { destinations: destinationMap } });
    } catch (error) {
        console.error('[API] Error obteniendo destinos:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// GET /api/robots -> Retorna los robots conectados y sus estados
router.get('/robots', async (req, res) => {
    try {
        const robots = await logica.getRobots();
        res.json({ success: true, data: { robots } });
    } catch (error) {
        console.error('[API] Error obteniendo robots:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// POST /api/navigate -> Envia la orden
router.post('/navigate', async (req, res) => {
    const { destination_id } = req.body;
    console.log(`[API Navigation] Navegación iniciada hacia destino ID: ${destination_id}`);
    res.json({ success: true, message: 'Navegación simulada localmente (Robot avisado).' });
});
// POST /api/valoracion -> Guarda feedback del usuario
router.post('/valoracion', async (req, res) => {
    try {
        const {
            robotId,
            zonaActualId,
            zonaDestinoId,
            duracion,
            valoracion,
            comentario
        } = req.body;

        // Basic validation
        if (!robotId || !zonaActualId || !zonaDestinoId || !duracion) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const id = await logica.insertInteraccion({
            robotId,
            zonaActualId,
            zonaDestinoId,
            duracion,
            valoracion,
            comentario
        });

        res.json({
            success: true,
            message: 'Valoración guardada',
            id
        });

    } catch (error) {
        console.error('[API] Error guardando valoración:', error);
        res.status(500).json({
            success: false,
            message: 'Database error'
        });
    }
});

// POST /api/robot/status -> Registra la conectividad del robot
router.post('/robot/status', async (req, res) => {
    const { robotId, status } = req.body;
    try {
        await logica.logConnectionEvent(robotId || 1, status);
        res.json({ success: true, message: 'Status logged in backend DB successfully.' });
    } catch (error) {
        console.error('[API] Error saving robot status:', error);
        res.status(500).json({ success: false, message: 'Database logging error' });
    }
});
// GET /api/historial -> Retorna el historial completo con nombres
router.get('/historial', async (req, res) => {
    try {
        const historial = await logica.getInteracciones();
        res.json(historial);
    } catch (err) {
        console.error('[API] Error obteniendo historial:', err);
        res.status(500).json({ success: false, error: 'Failed to load history' });
    }
});
// --- RUTAS PARA FILTROS DEL HISTORIAL ---

// GET /api/robots/names -> Retorna solo los nombres de los robots
router.get('/robots/names', async (req, res) => {
    try {
        const robots = await logica.getRobotNames();
        // Mapeamos para enviar un array simple de strings: ["Roberto1", "Roberto2"]
        const names = robots.map(r => r.Nombre);
        res.json(names);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener nombres de robots' });
    }
});

// GET /api/zonas/names -> Retorna solo los nombres de las zonas
router.get('/zonas/names', async (req, res) => {
    try {
        const zonas = await logica.getZonaNames();
        // Enviamos ["Puerta 12", "Restaurante B", ...]
        const names = zonas.map(z => z.Nombre);
        res.json(names);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener nombres de zonas' });
    }
});
// POST /api/login -> Autenticación de técnicos
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios'
        });
    }

    try {
        const result = await logica.validarCredenciales(email, password);

        if (!result.success) {
            return res.status(401).json(result);
        }

        console.log(`Login correcto: ${email}`);

        req.session.usuario = {
            id: result.usuario.id,
            email: result.usuario.email,
            nombre: result.usuario.nombre || null
        };


        res.json({
            success: true,
            message: 'Login correcto',
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

router.get('/dashboard', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado'
        });
    }

    res.json({
        success: true,
        usuario: req.session.usuario
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }

        res.json({
            success: true,
            message: 'Sesión cerrada'
        });
    });
});

module.exports = router;
