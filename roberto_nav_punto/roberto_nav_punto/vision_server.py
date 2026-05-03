import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
from flask import Flask, Response
from flask_cors import CORS
import threading
import time

app = Flask(__name__)
CORS(app)

bridge = CvBridge()
camera_node = None

class CameraSubscriber(Node):
    def __init__(self):
        super().__init__('camera_subscriber')
        self.subscription = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.listener_callback,
            10)
        self.current_frame = None

    def listener_callback(self, data):
        # Transforma la imagen de ROS a un formato que Python/OpenCV entiende
        self.current_frame = bridge.imgmsg_to_cv2(data, "bgr8")

def generate_frames():
    global camera_node
    while True:
        if camera_node is not None and camera_node.current_frame is not None:
            ret, buffer = cv2.imencode('.jpg', camera_node.current_frame)
            if ret:
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        # Pausa de 30ms (~30 FPS) para no congelar la CPU. 
        # ¡Y ya NO usamos spin_once aquí!
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# --- NUEVA FUNCIÓN: Mantiene a ROS 2 vivo en el fondo ---
def ros2_spin_thread():
    global camera_node
    rclpy.init()
    camera_node = CameraSubscriber()
    rclpy.spin(camera_node) # Esto se queda girando infinitamente de forma segura
    camera_node.destroy_node()
    rclpy.shutdown()

def main(args=None):
    # 1. Arrancamos ROS 2 en un "hilo" invisible
    ros_thread = threading.Thread(target=ros2_spin_thread, daemon=True)
    ros_thread.start()
    
    # 2. Arrancamos Flask en el frente
    print("Iniciando Servidor de Visión en el puerto 5000...")
    app.run(host='0.0.0.0', port=5000, threaded=True)

if __name__ == '__main__':
    main()