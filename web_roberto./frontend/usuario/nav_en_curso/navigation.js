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
        marker: document.getElementById('robot-marker')
    };

    const startTime = Date.now();
    let initialDistance = null;
    let localGoal = null; // Guardamos la meta localmente para que no se congele
    let hasArrived = false;

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

            // Fijar la distancia de partida
            if (initialDistance === null && distanceRemaining > 0) {
                initialDistance = distanceRemaining;
            }

            // Calcular % de progreso
            let progress = 0;
            if (initialDistance > 0) {
                progress = 100 - ((distanceRemaining / initialDistance) * 100);
                progress = Math.max(0, Math.min(100, progress)); // Limitar entre 0 y 100
            }

            // Obtener velocidad (Si falla, usamos un estimado visual)
            let speed = 0;
            try {
                const statusRes = await fetch('/api/navigation/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.speed !== undefined) speed = statusData.speed;
                }
            } catch(e) {}

            // Calcular ETA
            let etaSecs = 0;
            if (speed > 0.05) etaSecs = distanceRemaining / speed;

            // --- ACTUALIZAR INTERFAZ ---
            if (ui.speed) ui.speed.textContent = `${speed.toFixed(1)} m/s`;
            if (ui.dist) ui.dist.textContent = `${distanceRemaining.toFixed(1)} m`;
            if (ui.progText) ui.progText.textContent = `${Math.round(progress)}%`;
            
            if (ui.eta) {
                if (etaSecs > 0) {
                    const mins = Math.floor(etaSecs / 60);
                    const secs = Math.floor(etaSecs % 60);
                    ui.eta.textContent = `${mins}:${secs.toString().padStart(2, '0')} min`;
                } else {
                    ui.eta.textContent = "0:00 min";
                }
            }

            if (ui.progFill) ui.progFill.style.width = `${progress}%`;
            if (ui.marker) ui.marker.style.left = `${progress}%`;

            // --- TRIGGER DE LLEGADA (Garantizado) ---
            if (distanceRemaining <= 0.15) {
                hasArrived = true;
                clearInterval(pollInterval);
                
                // Forzar UI a 100%
                if (ui.progFill) ui.progFill.style.width = `100%`;
                if (ui.marker) ui.marker.style.left = `100%`;
                if (ui.progText) ui.progText.textContent = `100%`;
                if (ui.dist) ui.dist.textContent = `0.0 m`;

                console.log("¡Llegada detectada! Guardando viaje...");

                // 1. Calcular duración real
                const durationSecs = Math.floor((Date.now() - startTime) / 1000);
                
                // 2. Guardar datos en memoria para arrival.html
                sessionStorage.setItem('tripDuration', durationSecs);
                sessionStorage.setItem('tripDistance', initialDistance ? initialDistance.toFixed(1) : "0.0");

                // 3. Guardar el viaje en Base de Datos (Parte 1: Sin valoración)
                try {
                    const res = await fetch('/api/interaccion/llegada', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            robotId: 1, 
                            zonaActualId: 1, // Simulando origen fijo
                            zonaDestinoId: parseInt(destId) || 1,
                            duracion: durationSecs
                        })
                    });

                    const resData = await res.json();
                    if (resData.success) {
                        // Guardamos el ID de esta fila para actualizarla luego con las estrellas
                        sessionStorage.setItem('currentInteraccionId', resData.id);
                    }
                } catch (dbError) {
                    console.error("Error BD:", dbError);
                }

                // 4. Saltar a la pantalla de valoración
                setTimeout(() => {
                    window.location.href = '../llegada_y_valoracion/arrival.html';
                }, 1500);
            }

        } catch (error) {
            console.error("Error en telemetría:", error);
        }
    }, 500);
}

//
// ===============================
// ROS2 NAV2 PAUSE / RESUME (ADD-ON)
// TwistStamped version
// ===============================
//

const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

// Publica velocidad (STOP REAL)
const cmdVelTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/TwistStamped'
});

// TU goal propio (no Nav2 directo)
const goalTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/destination_zone',
    messageType: 'std_msgs/Int32'
});

let navigationPaused = false;
let savedGoal = null;

// Captura goal desde sessionStorage SIN tocar tu lógica original
function loadSavedGoal() {

    const destinationName =
        sessionStorage.getItem('currentDestinationName') || "Destino";

    const destId =
        sessionStorage.getItem('currentDestinationId') || 1;

    savedGoal = {
        id: destId,
        name: destinationName
    };
}

// STOP REAL con TwistStamped
function pauseRobot() {

    const stopMsg = new ROSLIB.Message({
        header: {
            frame_id: "base_link",
            stamp: { secs: 0, nsecs: 0 }
        },
        twist: {
            linear: { x: 0, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: 0 }
        }
    });

    cmdVelTopic.publish(stopMsg);

    console.log("[ROS] Robot detenido (TwistStamped)");
}

// RESUME (republica goal)
function resumeRobot() {

    if (!savedGoal) loadSavedGoal();

    const msg = new ROSLIB.Message({
        data: parseInt(savedGoal.id)
    });

    goalTopic.publish(msg);

    console.log("[ROS] Robot reanudado con goal:", savedGoal);
}

// Hook del botón (NO toca tu HTML original)
document.addEventListener('DOMContentLoaded', () => {

    const btn = document.getElementById('toggle-nav-btn');

    if (!btn) return;

    loadSavedGoal();

    btn.addEventListener('click', () => {

        if (!navigationPaused) {

            navigationPaused = true;

            pauseRobot();

            btn.classList.add('resumed');
            btn.querySelector('.stop-icon').textContent = '▶';
            btn.querySelector('.btn-text').textContent = 'Reanudar trayecto';

        } else {

            navigationPaused = false;

            resumeRobot();

            btn.classList.remove('resumed');
            btn.querySelector('.stop-icon').textContent = '⏸';
            btn.querySelector('.btn-text').textContent = 'Pausar trayecto';
        }
    });
});