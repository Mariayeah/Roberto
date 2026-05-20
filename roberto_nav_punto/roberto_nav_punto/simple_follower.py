#!/usr/bin/env python3

"""
Autor: Mery
Descripción: Nodo de seguimiento de objetivos (Goal Follower). 
Calcula la velocidad necesaria para que el robot se desplace desde su 
posición actual (AMCL) hasta el destino marcado en la web de forma suave,
e incluye un freno de emergencia reactivo mediante el LiDAR.
"""
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
from geometry_msgs.msg import TwistStamped, PoseWithCovarianceStamped, PoseStamped
from sensor_msgs.msg import LaserScan # <-- NUEVO: Importación para leer el LiDAR real
import math

class WebGoalFollower(Node):
    """
    Nodo encargado de la navegación reactiva y segura.
    
    Escucha la posición del robot, los datos del LiDAR y el objetivo deseado, 
    calculando errores para publicar comandos de velocidad fluidos (TwistStamped).
    """
    def __init__(self):
        """
        Inicializa el nodo, configura QoS para compatibilidad con Jazzy 
        y define suscriptores, publicadores y el bucle de control.
        """
        super().__init__('web_goal_follower')

        # --- QoS Profile for AMCL & LiDAR Compatibility ---
        # AMCL y los drivers de los sensores en hardware real suelen usar Best Effort.
        qos_real = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
            durability=DurabilityPolicy.VOLATILE
        )

        # Publishers
        # Gazebo Harmonic/Jazzy y el TurtleBot3 actualizado requieren TwistStamped
        self.cmd_pub = self.create_publisher(TwistStamped, '/cmd_vel', 10)
        
        # Subscribers
        self.create_subscription(
            PoseWithCovarianceStamped, 
            '/amcl_pose', 
            self.pose_callback, 
            qos_real)
        
        self.create_subscription(
            PoseStamped, 
            '/goal_pose', 
            self.goal_callback, 
            10)

        # --- NUEVO: Suscriptor al LiDAR físico ---
        self.create_subscription(
            LaserScan,
            '/scan',
            self.laser_callback,
            qos_real)
        
        # State Variables
        self.current_pos = None
        self.current_yaw = 0.0
        self.goal_pos = None
        self.obstacle_detected = False # <-- NUEVO: Estado del freno de mano
        
        # Timer for the control loop (10Hz)
        self.create_timer(0.1, self.control_loop)
        
        self.get_logger().info('🚀 Web Goal Follower (Suave + Antichoque LiDAR) Started')

    def pose_callback(self, msg):
        """ 
        Recibe la posición y orientación actual desde AMCL.
        Convierte los cuaterniones a ángulo Euler (Yaw) para facilitar los cálculos.
        """
        if self.current_pos is None:
            self.get_logger().info('✅ First position received! Robot is now localized.')
        
        self.current_pos = msg.pose.pose.position
        
        # Convert Quaternion to Euler Yaw (Rotation around Z axis)
        q = msg.pose.pose.orientation
        siny_cosp = 2 * (q.w * q.z + q.x * q.y)
        cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        self.current_yaw = math.atan2(siny_cosp, cosy_cosp)

    def goal_callback(self, msg):
        """ 
        Recibe el destino seleccionado desde la interfaz Web de Roberto.
        """
        self.goal_pos = msg.pose.position
        self.get_logger().info(f'🎯 New Web Goal: x={self.goal_pos.x:.2f}, y={self.goal_pos.y:.2f}')

    def laser_callback(self, msg):
        """
        NUEVO: Analiza las lecturas del LiDAR en el rango frontal.
        Si detecta un obstáculo a menos de 35cm, activa la parada de emergencia.
        """
        # El LiDAR del TurtleBot3 Burger cubre 360 grados (valores indexados de 0 a 359).
        # Revisamos un cono frontal de 40 grados en total: 0-20° (izquierda) y 340-359° (derecha).
        front_angles = list(range(0, 20)) + list(range(340, 360))
        
        safety_stop = False
        for angle in front_angles:
            if angle < len(msg.ranges):
                distance = msg.ranges[angle]
                # Filtrar lecturas infinitas o erróneas usando range_min y range_max
                if msg.range_min < distance < 0.35:
                    safety_stop = True
                    break
        
        if safety_stop and not self.obstacle_detected:
            self.get_logger().warn('⚠️ EMERGENCY: Obstacle detected ahead! Stopping motors.')
        elif not safety_stop and self.obstacle_detected:
            self.get_logger().info('🔄 Obstacle cleared. Resuming normal navigation.')

        self.obstacle_detected = safety_stop

    def control_loop(self):
        """
        Bucle de control principal (P-Controller Optimizado).
        Calcula distancias, gestiona la seguridad y suaviza el movimiento.
        """
        # 1. Check if we have both position and a destination
        if self.current_pos is None:
            self.get_logger().info('Waiting for /amcl_pose... (Check QoS or Initial Pose)', throttle_duration_sec=5.0)
            return
        
        if self.goal_pos is None:
            return

        # 2. Create the TwistStamped Message base
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'

        # 3. NUEVO: Intercepción por seguridad (Freno de mano por LiDAR)
        if self.obstacle_detected:
            msg.twist.linear.x = 0.0
            msg.twist.angular.z = 0.0
            self.cmd_pub.publish(msg)
            return

        # 4. Calculate Distance and Direction
        dx = self.goal_pos.x - self.current_pos.x
        dy = self.goal_pos.y - self.current_pos.y
        distance = math.sqrt(dx**2 + dy**2)
        
        # Angle from robot to goal
        angle_to_goal = math.atan2(dy, dx)
        # Difference between robot heading and goal direction
        angle_error = angle_to_goal - self.current_yaw
        
        # Normalize angle to keep it between [-pi, pi]
        while angle_error > math.pi: angle_error -= 2.0 * math.pi
        while angle_error < -math.pi: angle_error += 2.0 * math.pi

        # 5. Optimized Proportional Control Logic (Smooth Movement)
        if distance > 0.15: # Stop within 15cm of target
            
            # Ajuste de velocidad angular proporcional suave
            msg.twist.angular.z = angle_error * 1.4
            
            # NUEVO FACTOR DE ALINEACIÓN: Si el error de ángulo es grande, 
            # reduce la velocidad lineal para corregir trayectoria de forma fluida.
            # Si está perfectamente alineado, el factor es 1.0 (máxima velocidad).
            alignment_factor = max(0.0, 1.0 - (abs(angle_error) / (math.pi / 2.5)))
            
            # Velocidad lineal máxima prudente para hardware real (0.18 m/s)
            msg.twist.linear.x = min(0.18, distance * 0.4) * alignment_factor
            
            self.cmd_pub.publish(msg)
        else:
            # Arrival: Send 0 velocity and clear goal
            self.cmd_pub.publish(msg) 
            self.get_logger().info('✅ Destination reached smoothly. Stopping.')
            self.goal_pos = None

def main(args=None):
    """
    Punto de entrada para ejecutar el seguidor de objetivos.
    """
    rclpy.init(args=args)
    node = WebGoalFollower()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()