// ros.js

function notifyStatus(statusStr) {
    fetch('/api/robot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robotId: 1, status: statusStr })
    }).catch(e => console.error('Error enviando estado al backend:', e));
}

export function initROS() {
    const ros = new ROSLIB.Ros();

    // Referencias al DOM
    const btnConnect = document.getElementById("btn_connect");
    const btnDisconnect = document.getElementById("btn_disconnect");
    const status = document.getElementById("status");
    const input = document.getElementById("ws_url");

    // Estado inicial: solo Conectar habilitado
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;

    btnConnect.onclick = () => {
        let url = input.value.trim();
        if (!url) {
            alert("Por favor, introduce una URL (ej. 127.0.0.1:9090)");
            return;
        }
        
        // Purga de túneles: asegurando conexión localhost o local nativa (ws://). Eliminamos wss si es ajeno.
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
            url = 'ws://' + url;
        }

        status.textContent = "Conectando...";
        status.style.color = "#3498db"; // var(--primary) aprox
        btnConnect.disabled = true; // Evita clics duplicados
        
        ros.connect(url);
    };

    btnDisconnect.onclick = () => {
        status.textContent = "Desconectando...";
        ros.close();
    };

    // --- Manejadores de Eventos ---

    ros.on('connection', () => {
        console.log("Conexión establecida con éxito.");
        status.textContent = "Online";
        status.style.color = "#27ae60"; // verde
        
        btnConnect.disabled = true;
        btnDisconnect.disabled = false;
        input.disabled = true; // Bloqueamos la URL mientras estamos conectados

        notifyStatus('connected');
    });

    ros.on('close', () => {
        console.log("Conexión cerrada.");
        status.textContent = "Offline";
        status.style.color = "#e74c3c"; // rojo
        
        btnConnect.disabled = false;
        btnDisconnect.disabled = true;
        input.disabled = false;

        // Añade esto para "apagar" la pantalla de la cámara
        const img = document.getElementById('cameraFeed'); // ID nativo en dashboard.html
        if (img) img.src = ''; // Borra la imagen en vivo

        notifyStatus('disconnected');
    });

    ros.on('error', (error) => {
        console.error("Error en ROS:", error);
        status.textContent = "Error de conexión";
        status.style.color = "#f39c12"; // naranja
        
        btnConnect.disabled = false;
        btnDisconnect.disabled = true;
        input.disabled = false;
        
        notifyStatus('disconnected');
    });

    return ros;
}