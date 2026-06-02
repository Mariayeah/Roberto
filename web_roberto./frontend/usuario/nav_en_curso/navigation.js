document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
});

function initNavigation() {
    // 1. Cargar datos de sesión
    const destinationName = sessionStorage.getItem('currentDestinationName') || "Destino";
    const destId = sessionStorage.getItem('currentDestinationId') || 1; 

    // Asignar el nombre en la interfaz
    const destElement = document.getElementById('txt-destination') || document.getElementById('nav-destination-name');
    if (destElement) destElement.textContent = destinationName;

    const ui = {
        speed: document.getElementById('val-speed') || document.getElementById('nav-speed'),
        dist: document.getElementById('val-dist') || document.getElementById('nav-dist'),
        eta: document.getElementById('val-eta') || document.getElementById('nav-eta'),
        progText: document.getElementById('val-prog') || document.getElementById('nav-percentage'),
        progFill: document.getElementById('progress-fill') || document.getElementById('track-fill'),
        marker: document.getElementById('robot-marker'),
        btnToggle: document.getElementById('btn-toggle-nav') // NUEVO
    };

    const startTime = Date.now();
    let initialDistance = null;
    let localGoal = null; 
    let hasArrived = false;
    let isPaused = false; // Estado global de la sesión de navegación local

    // ============================================
    // CONTROLADOR DEL BOTÓN (STOP / RESUME)
    // ============================================
    if (ui.btnToggle) {
        ui.btnToggle.addEventListener('click', async () => {
            isPaused = !isPaused; // Invertir estado local

            if (isPaused) {
                // Cambiar UI a modo Reanudar
                ui.btnToggle.textContent = "▶️ Reanudar Marcha";
                ui.btnToggle.classList.remove('btn-stop');
                ui.btnToggle.classList.add('btn-resume');
                
                // Enviar señal de PAUSA (true) al backend
                sendNavSignal(true);
            } else {
                // Cambiar UI a modo Parar
                ui.btnToggle.textContent = "🛑 Parar Robot";
                ui.btnToggle.classList.remove('btn-resume');
                ui.btnToggle.classList.add('btn-stop');
                
                // Enviar señal de REANUDAR (false) al backend
                sendNavSignal(false);
            }
        });
    }

    /**
     * Envía la orden de pausa o reanudación al servidor Express de la aplicación.
     */
    async function sendNavSignal(pauseState) {
        try {
            // CORREGIDO: Forzamos la estructura exacta que espera tu router de api.js { pause: boolean }
            await fetch('/api/navigation/control', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ pause: !!pauseState }) 
            });
            console.log(`📡 Señal enviada al backend -> pause: ${pauseState}`);
        } catch (err) {
            console.error("❌ Error enviando señal de control:", err);
        }
    }
    // ============================================

    // Bucle de telemetría a prueba de fallos
    const pollInterval = setInterval(async () => {
        if (hasArrived) return;

        try {
            const posRes = await fetch('/api/position');
            const goalRes = await fetch('/api/goal');
            
            if (!posRes.ok || !goalRes.ok) return;

            const currentPos = await posRes.json();
            const fetchedGoal = await goalRes.json();

            // Si el backend nos da una meta, la memorizamos
            if (fetchedGoal && fetchedGoal.x !== undefined) {
                localGoal = fetchedGoal;
            }

            // Si aún no tenemos meta memorizada, esperamos
            if (!localGoal) return;

            // Calcular distancia matemática exacta
            const dx = localGoal.x - currentPos.x;
            const dy = localGoal.y - currentPos.y;
            const distanceRemaining = Math.sqrt(dx * dx + dy * dy);

            // Fijar la distancia de partida inicial de forma segura
            if (initialDistance === null && distanceRemaining > 0) {
                initialDistance = distanceRemaining;
            }

            // Calcular % de progreso
            let progress = 0;
            if (initialDistance > 0) {
                progress = 100 - ((distanceRemaining / initialDistance) * 100);
                progress = Math.max(0, Math.min(100, progress)); 
            }

            // Obtener velocidad 
            let speed = 0;
            try {
                const statusRes = await fetch('/api/navigation/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.ok ? await statusRes.json() : { speed: 0.35 };
                    if (statusData.speed !== undefined) speed = statusData.speed;
                }
            } catch(e) {}

            // Si está pausado localmente, forzamos que la interfaz muestre 0.0 m/s temporalmente
            if (isPaused) {
                speed = 0.0;
            }

            // Calcular ETA
            let etaSecs = 0;
            if (speed > 0.05) etaSecs = distanceRemaining / speed;

            // --- ACTUALIZAR INTERFAZ ---
            if (ui.speed) ui.speed.textContent = `${speed.toFixed(1)} m/s`;
            if (ui.dist) ui.dist.textContent = `${distanceRemaining.toFixed(1)} m`;
            if (ui.progText) ui.progText.textContent = `${Math.round(progress)}%`;
            
            if (ui.eta) {
                if (etaSecs > 0 && !isPaused) {
                    const mins = Math.floor(etaSecs / 60);
                    const secs = Math.floor(etaSecs % 60);
                    ui.eta.textContent = `${mins}:${secs.toString().padStart(2, '0')} min`;
                } else if (isPaused) {
                    ui.eta.textContent = "Pausado";
                } else {
                    ui.eta.textContent = "0:00 min";
                }
            }

            if (ui.progFill) ui.progFill.style.width = `${progress}%`;
            if (ui.marker) ui.marker.style.left = `${progress}%`;

            // --- TRIGGER DE LLEGADA (Garantizado) ---
            if (distanceRemaining <= 0.15 && !isPaused) { // Evitamos falsos positivos si se pausa cerca del origen
                hasArrived = true;
                clearInterval(pollInterval);
                
                // Ocultar botón de pausa al llegar por coherencia visual
                if (ui.btnToggle) ui.btnToggle.style.display = 'none';

                // Forzar UI a 100%
                if (ui.progFill) ui.progFill.style.width = `100%`;
                if (ui.marker) ui.marker.style.left = `100%`;
                if (ui.progText) ui.progText.textContent = `100%`;
                if (ui.dist) ui.dist.textContent = `0.0 m`;

                console.log("¡Llegada detectada! Guardando viaje...");

                const durationSecs = Math.floor((Date.now() - startTime) / 1000);
                
                sessionStorage.setItem('tripDuration', durationSecs);
                sessionStorage.setItem('tripDistance', initialDistance ? initialDistance.toFixed(1) : "0.0");

                try {
                    const res = await fetch('/api/interaccion/llegada', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            robotId: 1, 
                            zonaActualId: 1, 
                            zonaDestinoId: parseInt(destId) || 1,
                            duracion: durationSecs
                        })
                    });

                    const resData = await res.json();
                    if (resData.success) {
                        sessionStorage.setItem('currentInteraccionId', resData.id);
                    }
                } catch (dbError) {
                    console.error("Error BD:", dbError);
                }

                setTimeout(() => {
                    window.location.href = '../llegada_y_valoracion/arrival.html';
                }, 1500);
            }

        } catch (error) {
            console.error("Error en telemetría:", error);
        }
    }, 500);
}
