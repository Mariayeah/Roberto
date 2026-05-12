const ROSLIB = require('roslib');
const logica = require('./logica');

let latestPosition = { x: 0, y: 0, timestamp: new Date().toISOString() };
let lastInsertedPos = { x: 0, y: 0 }; 
let lastInsertTime = 0;
let currentGoal = null;
let rosInstance = null;
let goalTopic = null;
let initialDistance = 0;
let currentSpeed = 0;

function init() {
    const ros = new ROSLIB.Ros({
        url: 'ws://127.0.0.1:9090'
    });
    rosInstance = ros;

    ros.on('connection', () => {
        console.log('✅ Conectado a ROS Bridge (Backend)');
    });

    ros.on('error', (error) => {
        console.error('❌ Error en ROS Bridge:', error);
    });

    ros.on('close', () => {
        console.log('⚠️ Conexión cerrada con ROS Bridge');
    });

    // ---------------------------------------------------------
    // AÑADIDO T09: ODOM LISTENER (Velocidad)
    // ---------------------------------------------------------
    const odomListener = new ROSLIB.Topic({
        ros: ros,
        name: '/odom',
        messageType: 'nav_msgs/Odometry'
    });

    odomListener.subscribe((message) => {
        // Guardamos la velocidad lineal absoluta
        currentSpeed = Math.abs(message.twist.twist.linear.x);
    });

    // ---------------------------------------------------------
    // 1. POSE LISTENER (Localization)
    // ---------------------------------------------------------
    const poseListener = new ROSLIB.Topic({
        ros: ros,
        name: '/amcl_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped',
        // CRITICAL FOR JAZZY: Match AMCL Best Effort QoS
        queue_length: 1,
        throttle_rate: 100 
    });

    poseListener.subscribe((message) => {
        const x = message.pose.pose.position.x;
        const y = message.pose.pose.position.y;
        
        latestPosition = {
            x: x,
            y: y,
            timestamp: new Date().toISOString()
        };

        // Calcular distancia inicial mediante teorema de Pitágoras
        const dx = x - latestPosition.x;
        const dy = y - latestPosition.y;
        initialDistance = Math.sqrt(dx * dx + dy * dy);

        const now = Date.now();
        // Euclidean distance calculation
        const distMoved = Math.sqrt(
            Math.pow(x - lastInsertedPos.x, 2) + 
            Math.pow(y - lastInsertedPos.y, 2)
        );

        /**
         * DB SAVING LOGIC:
         * 1. Check if at least 1000ms (1 second) has passed.
         * 2. Check if the robot has moved more than 0.05 meters (5cm).
         * This prevents the database from filling with thousands of identical "0,0" entries.
         */
        // 500ms (twice a second) and 2cm (0.02)
// This is fast enough to feel "live" but slow enough to stay clean.
if (now - lastInsertTime >= 500 && distMoved > 0.02) {
    logica.insertPosition(1, x, y); 
    lastInsertTime = now;
    lastInsertedPos = { x, y };
}
    });

    // ---------------------------------------------------------
    // 2. GOAL TOPIC SETUP (Navigation)
    // ---------------------------------------------------------
    goalTopic = new ROSLIB.Topic({
        ros: ros,
        name: '/goal_pose',
        messageType: 'geometry_msgs/PoseStamped'
    });
}

function getLatestPosition() {
    return latestPosition;
}

function getCurrentGoal() {
    return currentGoal;
}

function sendGoal(x, y) {
    if (!rosInstance || !goalTopic) {
        console.error("❌ Cannot send goal: ROS not connected");
        return;
    }

    currentGoal = {
        x: x,
        y: y,
        timestamp: new Date().toISOString()
    };

    const goalMessage = new ROSLIB.Message({
        header: {
            stamp: { sec: 0, nsec: 0 },
            frame_id: 'map' 
        },
        pose: {
            position: { x: x, y: y, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 1.0 }
        }
    });

    goalTopic.publish(goalMessage);
    console.log(`🎯 Goal published to ROS: x=${x}, y=${y}`);
}

function getNavigationStatus() {
    if (!currentGoal) {
        return { active: false, arrived: false };
    }

    // Calcular distancia actual al objetivo
    const dx = currentGoal.x - latestPosition.x;
    const dy = currentGoal.y - latestPosition.y;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    // Calcular progreso (0 a 100)
    let progress = 0;
    if (initialDistance > 0) {
        progress = 100 - ((currentDistance / initialDistance) * 100);
        progress = Math.max(0, Math.min(100, progress)); // Limitar entre 0 y 100
    }

    // Calcular ETA (Tiempo estimado) - Evita dividir por 0
    let eta = 0;
    if (currentSpeed > 0.05) { 
        eta = currentDistance / currentSpeed;
    }

    // TRIGGER DE LLEGADA (Margen de 0.15m exacto al de simple_follower.py)
    const isArrived = currentDistance <= 0.15;
    
    if (isArrived) {
        currentGoal = null; // Reseteamos la misión al llegar
    }

    return {
        active: true,
        arrived: isArrived,
        progress: Math.round(progress),
        speed: currentSpeed,
        eta_seconds: eta,
        distance_remaining: currentDistance
    };
}

module.exports = {
    init,
    getLatestPosition,
    getCurrentGoal,
    sendGoal,
    getNavigationStatus
};
