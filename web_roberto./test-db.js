const logica = require('./backend/logica');

(async () => {
    try {
        const usuarios = await logica.getRobots(); // o cualquier query simple
        console.log("✅ BD conectada correctamente");
        console.log(usuarios);
    } catch (err) {
        console.error("❌ Error en BD:", err);
    }
})();