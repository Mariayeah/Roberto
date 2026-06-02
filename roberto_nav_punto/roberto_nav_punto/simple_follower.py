#!/usr/bin/env python3

"""
Autor: Mery
Descripción: Nodo de seguimiento de objetivos (Goal Follower) optimizado para Web/Gazebo.
Calcula velocidades fluidas e incorpora control de parada/reanudación de emergencia.
"""
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
from geometry_msgs.msg import TwistStamped, PoseWithCovarianceStamped, PoseStamped
from std_msgs.msg import Bool  # Necesario para el botón de stop web
import math

class WebGoalFollower(Node):
    """
    Nodo de navegación reactiva suave con soporte para pausa remota.
    """
    def __init__(self):
        super().__init__('web_goal_follower')

        # --- Perfil QoS para AMCL (Best Effort) ---
        qos_amcl = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
            durability=DurabilityPolicy.VOLATILE
        )

        # Publicadores
        self.cmd_pub = self.create_publisher(TwistStamped, '/cmd_vel', 10)
        
        # Suscriptores existentes
        self.create_subscription(PoseWithCovarianceStamped, '/amcl_pose', self.pose_callback, qos_amcl)
        self.create_subscription(PoseStamped, '/goal_pose', self.goal_callback, 10)
        
        # NUEVO: Suscriptor para el botón de Parada/Reanudación desde la Web
        # Recibir True = Pausar robot | Recibir False = Reanudar marcha
        self.create_subscription(Bool, '/navigation_control', self.control_status_callback, 10)
        
        # Variables de Estado
        self.current_pos = None
        self.current_yaw = 0.0
        self.goal_pos = None
        self.is_paused = False  # Bandera de control de parada
        
        # Temporizador del bucle de control (10Hz)
        self.create_timer(0.1, self.control_loop)
        
        self.get_logger().info('🚀 Web Goal Follower Fluido + Stop/Resume Listo')

    def pose_callback(self, msg):
        if self.current_pos is None:
            self.get_logger().info('✅ ¡Robot localizado en simulación!')
        
        self.current_pos = msg.pose.pose.position
        
        # Convertir Cuaternión a Euler Yaw
        q = msg.pose.pose.orientation
        siny_cosp = 2 * (q.w * q.z + q.x * q.y)
        cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        self.current_yaw = math.atan2(siny_cosp, cosy_cosp)

    def goal_callback(self, msg):
        self.goal_pos = msg.pose.position
        # Si nos mandan una meta nueva, asumimos que queremos navegar (despausamos por seguridad)
        self.is_paused = False 
        self.get_logger().info(f'🎯 Nueva Meta Web: x={self.goal_pos.x:.2f}, y={self.goal_pos.y:.2f}')

    def control_status_callback(self, msg):
        """
        Manejador del botón de stop/resume de la web.
        msg.data = True -> PAUSA | msg.data = False -> REANUDAR
        """
        self.is_paused = msg.data
        if self.is_paused:
            self.get_logger().warn('🛑 PARADA DE EMERGENCIA ACTIVADA DESDE LA WEB')
            # Enviamos ráfaga de parada inmediata de seguridad
            self.stop_robot()
        else:
            self.get_logger().info('▶️ NAVEGACIÓN REANUDADA DESDE LA WEB')

    def stop_robot(self):
        """ Publica un mensaje TwistStamped vacío para frenar al robot a 0 en seco """
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'
        self.cmd_pub.publish(msg)

    def control_loop(self):
        # 1. Comprobaciones de seguridad y estado
        if self.current_pos is None:
            self.get_logger().info('Esperando /amcl_pose...', throttle_duration_sec=5.0)
            return
        
        if self.goal_pos is None:
            return

        if self.is_paused:
            # Si está pausado, forzamos velocidad 0 de forma continua y mantenemos la meta guardada
            self.stop_robot()
            return

        # 2. Cálculo de distancias y errores angulares
        dx = self.goal_pos.x - self.current_pos.x
        dy = self.goal_pos.y - self.current_pos.y
        distance = math.sqrt(dx**2 + dy**2)
        
        angle_to_goal = math.atan2(dy, dx)
        angle_error = angle_to_goal - self.current_yaw
        
        # Normalizar ángulo entre [-pi, pi]
        while angle_error > math.pi: angle_error -= 2.0 * math.pi
        while angle_error < -math.pi: angle_error += 2.0 * math.pi

        # 3. Preparar mensaje de salida
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'

        # Condición de llegada a la meta (15cm)
        if distance <= 0.15:
            self.cmd_pub.publish(msg) # Mandamos velocidad 0
            self.get_logger().info('✅ Destino alcanzado con éxito. Deteniendo Roberto.')
            self.goal_pos = None
            return

        # 4. Lógica P-Controller CONTINUA y FLUIDA para Gazebo
        # En vez de saltos discretos, calculamos la atenuación lineal según el error de orientación
        # Si el error angular es máximo (PI), el factor es 0 (giro puro). Si está alineado, el factor es 1 (máxima velocidad).
        smoothing_factor = max(0.0, 1.0 - (abs(angle_error) / math.pi))
        
        # Ajustamos velocidades máximas más alegres para la simulación
        max_linear_speed = 0.35  # Sube de 0.22 a 0.35 m/s para que no sea tan lento
        msg.twist.linear.x = min(max_linear_speed, distance * 0.5) * (smoothing_factor ** 2)
        
        # Control angular proporcional y suave
        msg.twist.angular.z = angle_error * 1.5

        # Publicar comandos calculados
        self.cmd_pub.publish(msg)

def main(args=None):
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