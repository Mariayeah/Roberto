export class CameraStream {
    constructor(wssUrl, imageElementId) {
        this.wssUrl = wssUrl;
        this.cameraFeed = document.getElementById(imageElementId);
        this.socket = null;
        this.reconnectTimeout = null;
        this.isConnected = false;
        
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.wssUrl);

        this.socket.onopen = () => {
            console.log('Conexión WSS establecida con la cámara');
            this.isConnected = true;
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        };

        this.socket.onmessage = (event) => {
            // ROS sensor_msgs/CompressedImage envía los datos en base64
            this.cameraFeed.src = "data:image/jpeg;base64," + event.data;
        };

        this.socket.onclose = () => {
            console.warn('Conexión WSS de cámara cerrada. Intentando reconectar...');
            this.handleDisconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Error en WebSocket de cámara:', error);
            this.socket.close(); // Forzar cierre para reconectar
        };
    }

    handleDisconnect() {
        this.isConnected = false;
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, 3000);
    }
}

// AQUÍ ESTÁ LA FUNCIÓN QUE MAIN.JS ESTABA BUSCANDO
export function initCamera() {
    // ⚠️ IMPORTANTE: Pon aquí la URL del túnel de tu cámara (el del puerto 8080)
    // Asegúrate de que empiece por wss://
    const WSS_CAMERA_URL = "wss://9c12e144502869.lhr.life/";
    
    console.log("Inicializando módulo de cámara...");
    const camera = new CameraStream(WSS_CAMERA_URL, 'cameraFeed');
    return camera;
}