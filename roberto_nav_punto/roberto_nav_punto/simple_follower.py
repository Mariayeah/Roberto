#!/usr/bin/env python3

"""
Autor: Mery
Descripción: Nodo de seguimiento de objetivos (Goal Follower) con esquiva 
autónoma de obstáculos mediante el método de Fuerzas de Repulsión (VFF).
"""
import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
from geometry_msgs.msg import TwistStamped, PoseWithCovarianceStamped, PoseStamped
from sensor_msgs.msg import LaserScan
import math

class WebGoalFollower(Node):
    def __init__(self):
        super().__init__('web_goal_follower')

        qos_real = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=5,
            durability=DurabilityPolicy.VOLATILE
        )

        # Publicador de velocidad
        self.cmd_pub = self.create_publisher(TwistStamped, '/cmd_vel', 10)
        
        # Suscriptores
        self.create_subscription(PoseWithCovarianceStamped, '/amcl_pose', self.pose_callback, qos_real)
        self.create_subscription(PoseStamped, '/goal_pose', self.goal_callback, 10)
        self.create_subscription(LaserScan, '/scan', self.laser_callback, qos_real)
        
        # Variables de estado
        self.current_pos = None
        self.current_yaw = 0.0
        self.goal_pos = None
        
        # Vector de repulsión del obstáculo (X, Y) relativo al robot
        self.repulsion_x = 0.0
        self.repulsion_y = 0.0
        
        self.create_timer(0.1, self.control_loop)
        self.get_logger().info('🚀 Roberto con Esquiva Autónoma Inteligente (Sin Nav2) Listo')

    def pose_callback(self, msg):
        self.current_pos = msg.pose.pose.position
        q = msg.pose.pose.orientation
        siny_cosp = 2 * (q.w * q.z + q.x * q.y)
        cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        self.current_yaw = math.atan2(siny_cosp, cosy_cosp)

    def goal_callback(self, msg):
        self.goal_pos = msg.pose.position
        self.get_logger().info(f'🎯 Nueva Meta: x={self.goal_pos.x:.2f}, y={self.goal_pos.y:.2f}')

    def laser_callback(self, msg):
        """
        Calcula un vector de fuerza repulsiva basado en dónde están los obstáculos.
        """
        self.repulsion_x = 0.0
        self.repulsion_y = 0.0
        
        # Miramos un cono amplio de 90 grados frontales: de 0 a 45° y de 315 a 359°
        scan_angles = list(range(0, 45)) + list(range(315, 360))
        
        for angle in scan_angles:
            if angle < len(msg.ranges):
                dist = msg.ranges[angle]
                
                # Filtrar ruidos
                if math.isnan(dist) or math.isinf(dist) or dist <= 0.02:
                    continue
                
                # Zona de peligro de esquiva: menos de 0.45 metros
                if dist < 0.45:
                    # Convertir el ángulo del LiDAR a radianes relativos al robot
                    rad = math.radians(angle if angle < 180 else angle - 360)
                    
                    # La fuerza es inversamente proporcional a la distancia (más cerca = más fuerza)
                    fuerza = (0.45 - dist) / dist
                    
                    # Sumamos el vector de empuje contrario al obstáculo
                    self.repulsion_x -= fuerza * math.cos(rad)
                    self.repulsion_y -= fuerza * math.sin(rad)

    def control_loop(self):
        if self.current_pos is None or self.goal_pos is None:
            return

        # 1. Calcular Vector de Atracción hacia la Meta
        dx = self.goal_pos.x - self.current_pos.x
        dy = self.goal_pos.y - self.current_pos.y
        distance = math.sqrt(dx**2 + dy**2)
        
        # Ángulo directo a la meta en el mapa global
        angle_to_goal = math.atan2(dy, dx)
        # Convertirlo a relativo respecto al robot
        goal_rel_angle = angle_to_goal - self.current_yaw
        
        # Vector unitario de atracción (relativo al robot)
        attraction_x = math.cos(goal_rel_angle)
        attraction_y = math.sin(goal_rel_angle)

        # 2. SUMA DE FUERZAS: Combinar atracción y repulsión
        # Peso de la repulsión (ganancia = 1.2). Súbelo si quieres que se aleje más de las cosas.
        peso_esquiva = 1.2 
        
        total_x = attraction_x + (self.repulsion_x * peso_esquiva)
        total_y = attraction_y + (self.repulsion_y * peso_esquiva)
        
        # Ángulo final corregido para esquivar el obstáculo e ir a la meta
        target_heading = math.atan2(total_y, total_x)

        # 3. Preparar mensaje
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'

        # Condición de llegada (15cm)
        if distance <= 0.15:
            self.cmd_pub.publish(msg)
            self.get_logger().info('✅ Meta alcanzada esquivando obstáculos.')
            self.goal_pos = None
            return

        # 4. Asignar velocidades basadas en el vector resultante
        # Control angular sobre la dirección corregida
        msg.twist.angular.z = target_heading * 1.4
        
        # Velocidad lineal: si el giro es muy pronunciado (porque está esquivando),
        # frena un poco para no derrapar; si está despejado, acelera.
        alignment_factor = max(0.0, 1.0 - (abs(target_heading) / (math.pi / 2)))
        
        # Si el obstáculo está pegadísimo en frente, bloqueamos avance para seguridad absoluta
        if self.repulsion_x < -2.0 and abs(target_heading) > 1.0:
            msg.twist.linear.x = 0.0  # Giro puro de emergencia para salvarse
        else:
            msg.twist.linear.x = min(0.18, distance * 0.4) * alignment_factor

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