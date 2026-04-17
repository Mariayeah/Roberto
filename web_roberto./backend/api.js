const express = require('express');
const router = express.Router();
const logica = require('./logica');

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

module.exports = router;
