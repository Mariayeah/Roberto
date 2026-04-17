// controls.js

export function initControls(ros) {
    // 1. Declaración del Topic (¡Corregido el messageType!)
    const cmdVel = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist' // <- Sin el '/msg/', vital para Rosbridge
    });

    // 2. Función central de movimiento con protección de estado
    function move(linear, angular) {
        // Protección: Si no estamos conectados, no hacemos nada
        if (!ros.isConnected) {
            console.warn("⚠️ Espera a estar 'Online' para enviar comandos al robot.");
            return;
        }

        const twist = new ROSLIB.Message({
            linear: { x: linear, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: angular }
        });

        // Feedback por consola para confirmar que llega al pulsar
        console.log(`Publicando en /cmd_vel -> Lineal: ${linear} | Angular: ${angular}`);
        cmdVel.publish(twist);
    }

    // 3. Captura de elementos del DOM de forma segura
    const btnForward = document.getElementById('btn_forward');
    const btnBack = document.getElementById('btn_back');
    const btnLeft = document.getElementById('btn_left');
    const btnRight = document.getElementById('btn_right');
    const btnStop = document.getElementById('btn_stop');

    // 4. Asignación de eventos (He dejado las velocidades a 0.2 que es más realista/seguro para el Waffle Pi)
    if (btnForward) btnForward.onclick = () => move(0.2, 0);
    if (btnBack) btnBack.onclick = () => move(-0.2, 0);
    if (btnLeft) btnLeft.onclick = () => move(0, 0.5);
    if (btnRight) btnRight.onclick = () => move(0, -0.5);
    if (btnStop) btnStop.onclick = () => move(0, 0);

    console.log("🎮 Módulo Controls inicializado y esperando conexión ROS.");
}