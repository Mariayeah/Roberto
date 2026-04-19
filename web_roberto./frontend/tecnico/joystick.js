// ============================================
// CONTROL.JS - CON IDs CORRECTOS DEL HTML
// ============================================

let controlRos = null;
let controlConnected = false;
let currentLinear = 0;
let currentAngular = 0;
let publishInterval = null;

// Variables para UI
let lastOdomData = { x: '---', y: '---', orient: '---', timestamp: null };
let lastJointData = { names: [], positions: [], velocities: [], efforts: [] };
let lastBatteryData = { percentage: 87, voltage: 0, current: 0, temperature: 0, isCharging: false };
let lastDiagnosticData = { systemStatus: "OK", warnings: [], errors: [] };

// ============================================
// FUNCIÓN DE CONEXIÓN
// ============================================

function connectControlROS() {
    const wsUrlInput = document.getElementById('ws_url');
    let address = wsUrlInput ? `ws://${wsUrlInput.value.trim()}` : 'ws://127.0.0.1:9090';
    
    if (!address) address = 'ws://127.0.0.1:9090';
    
    // Si ya está conectado, desconectar primero
    if (controlRos && controlConnected) {
        disconnectControlROS();
        setTimeout(() => connectControlROS(), 500);
        return;
    }
    
    const statusElement = document.getElementById('status');
    const btnConnect = document.getElementById('btn_connect');
    const btnDisconnect = document.getElementById('btn_disconnect');
    
    if (statusElement) {
        statusElement.textContent = 'Conectando...';
        statusElement.style.color = '#f39c12';
    }
    if (btnConnect) btnConnect.disabled = true;
    
    console.log('🔌 Intentando conectar a:', address);
    
    try {
        controlRos = new ROSLIB.Ros({ url: address });
        
        controlRos.on('connection', () => {
            console.log('✅ Conectado a ROS Bridge');
            if (statusElement) {
                statusElement.textContent = 'Conectado';
                statusElement.style.color = '#27ae60';
            }
            if (btnConnect) btnConnect.disabled = false;
            if (btnDisconnect) {
                btnDisconnect.disabled = false;
                btnDisconnect.style.opacity = '1';
            }
            
            controlConnected = true;
            
            // Iniciar publicaciones y suscripciones
            startPublishing();
            subscribeToOdom();
            subscribeToJointStates();
            subscribeToBatteryState();
            subscribeToDiagnostics();
        });
        
        controlRos.on('error', (error) => {
            console.error('❌ Error ROS:', error);
            if (statusElement) {
                statusElement.textContent = 'Error de conexión';
                statusElement.style.color = '#e74c3c';
            }
            if (btnConnect) btnConnect.disabled = false;
            controlConnected = false;
            stopPublishing();
        });
        
        controlRos.on('close', () => {
            console.log('🔌 Desconectado de ROS');
            if (statusElement) {
                statusElement.textContent = 'Desconectado';
                statusElement.style.color = '#e74c3c';
            }
            if (btnConnect) btnConnect.disabled = false;
            if (btnDisconnect) {
                btnDisconnect.disabled = true;
                btnDisconnect.style.opacity = '0.5';
            }
            controlConnected = false;
            stopPublishing();
        });
        
    } catch(e) {
        console.error('❌ Error al crear conexión:', e);
        if (statusElement) {
            statusElement.textContent = 'Error';
            statusElement.style.color = '#e74c3c';
        }
        if (btnConnect) btnConnect.disabled = false;
        controlConnected = false;
    }
}

function disconnectControlROS() {
    if (controlRos && controlConnected) {
        console.log('🔌 Desconectando...');
        setMovement("parar");
        
        setTimeout(() => {
            stopPublishing();
            controlRos.close();
        }, 100);
    }
    
    controlConnected = false;
    
    const btnDisconnect = document.getElementById('btn_disconnect');
    if (btnDisconnect) {
        btnDisconnect.disabled = true;
        btnDisconnect.style.opacity = '0.5';
    }
}

// ============================================
// PUBLICACIÓN DE VELOCIDAD
// ============================================

function startPublishing() {
    if (publishInterval) clearInterval(publishInterval);
    
    console.log('📡 Iniciando publicación en /cmd_vel');
    
    publishInterval = setInterval(() => {
        if (!controlRos || !controlConnected) return;
        
        // TwistStamped CORRECTAMENTE FORMADO
        const twistStamped = new ROSLIB.Message({
            header: {
                stamp: {
                    sec: Math.floor(Date.now() / 1000),
                    nanosec: (Date.now() % 1000) * 1000000
                },
                frame_id: "base_link"
            },
            twist: {
                linear: {
                    x: currentLinear,
                    y: 0.0,
                    z: 0.0
                },
                angular: {
                    x: 0.0,
                    y: 0.0,
                    z: currentAngular
                }
            }
        });
        
        let cmdVelPub = new ROSLIB.Topic({
            ros: controlRos,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/msg/TwistStamped'
        });
        
        cmdVelPub.publish(twistStamped);
        
        // Actualizar UI
        const speedValueSpan = document.getElementById('speed-value');
        const speedFill = document.getElementById('speed-fill');
        const speedAbs = Math.abs(currentLinear);
        if (speedValueSpan) speedValueSpan.textContent = speedAbs.toFixed(2) + ' m/s';
        if (speedFill) speedFill.style.width = Math.min(100, speedAbs * 100) + '%';
        
    }, 100);
}

function stopPublishing() {
    if (publishInterval) {
        clearInterval(publishInterval);
        publishInterval = null;
        console.log('⏹️ Publicación detenida');
    }
}

// ============================================
// CONTROL DE MOVIMIENTO
// ============================================

function setMovement(moveCommand) {
    if (!controlRos || !controlConnected) {
        const statusElement = document.getElementById('status');
        if (statusElement) statusElement.textContent = 'Conecta primero';
        console.warn('⚠️ No hay conexión ROS');
        return;
    }
    
    switch(moveCommand) {
        case "delante":
            currentLinear = 0.1;
            currentAngular = 0.0;
            break;
        case "atras":
            currentLinear = -0.1;
            currentAngular = 0.0;
            break;
        case "izquierda":
            currentLinear = 0.1;
            currentAngular = 0.2;
            break;
        case "derecha":
            currentLinear = 0.1;
            currentAngular = -0.2;
            break;
        case "parar":
            currentLinear = 0.0;
            currentAngular = 0.0;
            break;
        default:
            return;
    }
    
    console.log(`🚗 Movimiento: ${moveCommand} | Linear: ${currentLinear} | Angular: ${currentAngular}`);
    
    // Animar el joystick
    animateJoystick(moveCommand);
}

// ============================================
// ANIMACIÓN DEL JOYSTICK
// ============================================

function animateJoystick(direction) {
    const centerDot = document.querySelector('.center-dot');
    if (!centerDot) return;
    
    // Resetear clases
    centerDot.classList.remove('up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right', 'idle');
    
    // Aplicar clase según dirección
    switch(direction) {
        case "delante":
            centerDot.classList.add('up');
            break;
        case "atras":
            centerDot.classList.add('down');
            break;
        case "izquierda":
            centerDot.classList.add('up-left');
            break;
        case "derecha":
            centerDot.classList.add('up-right');
            break;
        case "parar":
            centerDot.classList.add('idle');
            break;
    }
}

// ============================================
// SUSCRIPCIONES
// ============================================

function subscribeToOdom() {
    if (!controlRos || !controlConnected) return;
    
    let odomSub = new ROSLIB.Topic({
        ros: controlRos,
        name: '/odom',
        messageType: 'nav_msgs/msg/Odometry'
    });
    
    odomSub.subscribe((message) => {
        lastOdomData = {
            x: message.pose.pose.position.x.toFixed(3),
            y: message.pose.pose.position.y.toFixed(3),
            orient: message.pose.pose.orientation.z.toFixed(3),
            timestamp: new Date().toLocaleTimeString()
        };
    });
    
    console.log('📡 Suscrito a /odom');
}

function subscribeToJointStates() {
    if (!controlRos || !controlConnected) return;
    
    let jointSub = new ROSLIB.Topic({
        ros: controlRos,
        name: '/joint_states',
        messageType: 'sensor_msgs/msg/JointState'
    });
    
    jointSub.subscribe((message) => {
        lastJointData.names = message.name || [];
        lastJointData.positions = message.position || [];
        lastJointData.velocities = message.velocity || [];
        lastJointData.efforts = message.effort || [];
        
        // Actualizar estado de motores
        const motorStatus = document.getElementById('motor-status');
        if (motorStatus && message.velocity && message.velocity.length > 0) {
            let maxSpeed = Math.max(...message.velocity.map(v => Math.abs(v)));
            if (maxSpeed > 0.01) {
                motorStatus.innerHTML = 'Activo';
                motorStatus.style.color = '#2b7fff';
            } else {
                motorStatus.innerHTML = 'OK';
                motorStatus.style.color = '#10b981';
            }
        }
    });
    
    console.log('📡 Suscrito a /joint_states');
}

function subscribeToBatteryState() {
    if (!controlRos || !controlConnected) return;
    
    let batterySub = new ROSLIB.Topic({
        ros: controlRos,
        name: '/battery_state',
        messageType: 'sensor_msgs/msg/BatteryState'
    });
    
    batterySub.subscribe((message) => {
        lastBatteryData.percentage = message.percentage ? (message.percentage * 100).toFixed(0) : 87;
        lastBatteryData.voltage = message.voltage || 0;
        lastBatteryData.current = message.current || 0;
        
        const batterySpan = document.getElementById('battery-percent');
        if (batterySpan) {
            batterySpan.textContent = lastBatteryData.percentage + '%';
        }
    });
    
    console.log('📡 Suscrito a /battery_state');
}

function subscribeToDiagnostics() {
    if (!controlRos || !controlConnected) return;
    
    let diagSub = new ROSLIB.Topic({
        ros: controlRos,
        name: '/diagnostics',
        messageType: 'diagnostic_msgs/msg/DiagnosticArray'
    });
    
    diagSub.subscribe((message) => {
        let hasError = false;
        if (message.status) {
            for (let i = 0; i < message.status.length; i++) {
                if (message.status[i].level === 2) {
                    hasError = true;
                    break;
                }
            }
        }
        
        const sensorStatus = document.getElementById('sensor-status');
        if (sensorStatus) {
            sensorStatus.innerHTML = hasError ? 'Atencion' : 'OK';
            sensorStatus.style.color = hasError ? '#ef4444' : '#10b981';
        }
    });
    
    console.log('📡 Suscrito a /diagnostics');
}

// ============================================
// FUNCIONES DE INFO CARDS
// ============================================

function showMotoresInfo() {
    const cardTitle = document.getElementById('infoCardTitle');
    const cardBody = document.getElementById('infoCardBody');
    
    let motorDetails = '';
    if (lastJointData.names && lastJointData.names.length > 0) {
        motorDetails = '<div class="info-topic"><strong>Datos de los motores:</strong><br>';
        for (let i = 0; i < lastJointData.names.length; i++) {
            motorDetails += `<div class="info-data">${lastJointData.names[i]}: Vel ${(lastJointData.velocities[i] || 0).toFixed(2)} rad/s</div>`;
        }
        motorDetails += '</div>';
    } else {
        motorDetails = '<div class="info-topic">Esperando datos de /joint_states...</div>';
    }
    
    if (cardTitle) cardTitle.innerHTML = 'Motores';
    if (cardBody) {
        cardBody.innerHTML = `
            <p><strong>Sistema de propulsores y actuadores</strong></p>
            <div class="info-topic">Robot equipado con motores DC controlados electrónicamente.</div>
            ${motorDetails}
        `;
    }
    
    document.getElementById('infoCard').style.display = 'flex';
}

function showSensoresInfo() {
    const cardTitle = document.getElementById('infoCardTitle');
    const cardBody = document.getElementById('infoCardBody');
    
    if (cardTitle) cardTitle.innerHTML = 'Sensores';
    if (cardBody) {
        cardBody.innerHTML = `
            <p><strong>Sistema de localización (Odometría)</strong></p>
            <div class="info-topic">
                Coordenada X: <strong>${lastOdomData.x}</strong> m<br>
                Coordenada Y: <strong>${lastOdomData.y}</strong> m<br>
                Orientación: <strong>${lastOdomData.orient}</strong> rad<br>
                Última actualización: ${lastOdomData.timestamp || '---'}
            </div>
        `;
    }
    
    document.getElementById('infoCard').style.display = 'flex';
}

function showBateriaInfo() {
    const cardTitle = document.getElementById('infoCardTitle');
    const cardBody = document.getElementById('infoCardBody');
    
    let estadoCarga = lastBatteryData.isCharging ? 'En carga' : 
                     (lastBatteryData.percentage < 20 ? 'Crítico' : 
                     (lastBatteryData.percentage < 50 ? 'Bajo' : 'Normal'));
    
    if (cardTitle) cardTitle.innerHTML = 'Batería';
    if (cardBody) {
        cardBody.innerHTML = `
            <p><strong>Sistema de alimentación</strong></p>
            <div class="info-topic">
                Carga: <strong>${lastBatteryData.percentage}%</strong><br>
                Voltaje: <strong>${lastBatteryData.voltage.toFixed(1)}</strong> V<br>
                Estado: <strong>${estadoCarga}</strong>
            </div>
        `;
    }
    
    document.getElementById('infoCard').style.display = 'flex';
}

function closeInfoCard() {
    const card = document.getElementById('infoCard');
    if (card) card.style.display = 'none';
}

// ============================================
// INICIALIZACIÓN DE BOTONES
// ============================================

function initializeControlButtons() {
    console.log('🎮 Inicializando botones de control...');
    
    // Botones de conexión
    const btnConnect = document.getElementById('btn_connect');
    const btnDisconnect = document.getElementById('btn_disconnect');
    
    // Botones de movimiento (IDs CORRECTOS del HTML)
    const btnForward = document.getElementById('btn_forward');
    const btnBack = document.getElementById('btn_back');
    const btnLeft = document.getElementById('btn_left');
    const btnRight = document.getElementById('btn_right');
    const btnStop = document.getElementById('btn_stop');
    
    // Info cards
    const motorInfo = document.getElementById('motor-info');
    const sensorInfo = document.getElementById('sensor-info');
    const batteryInfo = document.getElementById('battery-info');
    
    // Asignar eventos
    if (btnConnect) {
        btnConnect.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Botón Conectar clickeado');
            connectControlROS();
        });
    }
    
    if (btnDisconnect) {
        btnDisconnect.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Botón Desconectar clickeado');
            disconnectControlROS();
        });
    }
    
    if (btnForward) btnForward.addEventListener('click', () => setMovement('delante'));
    if (btnBack) btnBack.addEventListener('click', () => setMovement('atras'));
    if (btnLeft) btnLeft.addEventListener('click', () => setMovement('izquierda'));
    if (btnRight) btnRight.addEventListener('click', () => setMovement('derecha'));
    if (btnStop) btnStop.addEventListener('click', () => setMovement('parar'));
    
    if (motorInfo) motorInfo.addEventListener('click', showMotoresInfo);
    if (sensorInfo) sensorInfo.addEventListener('click', showSensoresInfo);
    if (batteryInfo) batteryInfo.addEventListener('click', showBateriaInfo);
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        const card = document.getElementById('infoCard');
        if (event.target === card) {
            card.style.display = 'none';
        }
    });
    
    console.log('✅ Botones inicializados correctamente');
    console.log('📋 IDs encontrados:');
    console.log('   - btn_connect:', btnConnect ? '✅' : '❌');
    console.log('   - btn_disconnect:', btnDisconnect ? '✅' : '❌');
    console.log('   - btn_forward:', btnForward ? '✅' : '❌');
    console.log('   - btn_back:', btnBack ? '✅' : '❌');
    console.log('   - btn_left:', btnLeft ? '✅' : '❌');
    console.log('   - btn_right:', btnRight ? '✅' : '❌');
    console.log('   - btn_stop:', btnStop ? '✅' : '❌');
}

// ============================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 DOM Cargado - Inicializando control');
        
        if (typeof ROSLIB === 'undefined') {
            console.error('❌ ROSLIB no está cargado');
            return;
        }
        
        initializeControlButtons();
        console.log('✅ Sistema de control listo');
    });
} else {
    // DOM ya está cargado
    console.log('🚀 DOM ya cargado - Inicializando control');
    
    if (typeof ROSLIB === 'undefined') {
        console.error('❌ ROSLIB no está cargado');
    } else {
        initializeControlButtons();
        console.log('✅ Sistema de control listo');
    }
}

// Exponer funciones globalmente
window.closeInfoCard = closeInfoCard;
window.connectControlROS = connectControlROS;
window.disconnectControlROS = disconnectControlROS;
window.setMovement = setMovement;