// ros.js
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
        const url = input.value;
        if (!url) {
            alert("Por favor, introduce una URL de Rosbridge (ws://...)");
            return;
        }
        
        status.textContent = "Conectando...";
        status.className = "text-primary"; // Azul mientras intenta
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
        status.className = "text-success fw-bold";
        
        btnConnect.disabled = true;
        btnDisconnect.disabled = false;
        input.disabled = true; // Bloqueamos la URL mientras estamos conectados
    });

    ros.on('close', () => {
        console.log("Conexión cerrada.");
        status.textContent = "Offline";
        status.className = "text-danger fw-bold";
        
        btnConnect.disabled = false;
        btnDisconnect.disabled = true;
        input.disabled = false;

        // Añade esto para "apagar" la pantalla de la cámara
        const img = document.getElementById('camera_stream'); // Usa el ID real de tu HTML
        if (img) img.src = ''; // Borra la imagen en vivo
    });

    ros.on('error', (error) => {
        console.error("Error en ROS:", error);
        status.textContent = "Error de conexión";
        status.className = "text-warning fw-bold";
        
        btnConnect.disabled = false;
        btnDisconnect.disabled = true;
        input.disabled = false;
    });

    return ros;
}