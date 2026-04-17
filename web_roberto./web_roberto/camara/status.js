// status.js
export function initStatus(ros) {
    // Ejemplo: Suscribirse a un tópico de batería o estado del sistema
    const batteryTopic = new ROSLIB.Topic({
        ros: ros,
        name: '/battery_state', // Cambia esto por tu tópico real de ROS2
        messageType: 'sensor_msgs/msg/BatteryState'
    });

    batteryTopic.subscribe((message) => {
        // Asumiendo que añadieras un <span id="battery_level"> en tu HTML
        const batterySpan = document.getElementById('battery_level');
        if (batterySpan) {
            // Convierte el voltaje o porcentaje a algo legible
            batterySpan.textContent = message.percentage + '%';
        }
    });

    console.log("Módulo de estado (diagnósticos) inicializado.");
}