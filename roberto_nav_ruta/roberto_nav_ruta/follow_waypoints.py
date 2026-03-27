#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from nav2_msgs.action import FollowWaypoints
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from math import sin, cos

class FollowWaypointsNode(Node):
    def __init__(self):
        super().__init__('follow_waypoints')
        
        # Cliente de acción
        self.action_client = ActionClient(self, FollowWaypoints, '/follow_waypoints')
        
        # Publicador para posición inicial
        self.initial_pose_pub = self.create_publisher(
            PoseWithCovarianceStamped,
            '/initialpose',
            10
        )
        
        # Parámetros
        self.declare_parameter('initial_x', 0.0)
        self.declare_parameter('initial_y', 0.0)
        self.declare_parameter('initial_theta', 0.0)
        
        # Waypoints
        self.declare_parameter('waypoints', [
            0.5, 0.0, 0.0,
            1.0, 0.0, 0.0,
            0.5, 0.0, 0.0,
            0.0, 0.0, 0.0,
        ])
        
        self.initial_x = self.get_parameter('initial_x').value
        self.initial_y = self.get_parameter('initial_y').value
        self.initial_theta = self.get_parameter('initial_theta').value
        
        # Procesar waypoints
        waypoints_param = self.get_parameter('waypoints').value
        self.waypoints = []
        for i in range(0, len(waypoints_param), 3):
            self.waypoints.append((
                waypoints_param[i],
                waypoints_param[i+1],
                waypoints_param[i+2]
            ))
        
        # Control de estado
        self.goal_sent = False
        self.initial_pose_sent = False
        self.last_waypoint_reported = -1
        self.retry_count = 0
        self.max_retries = 3
        
        self.get_logger().info('=' * 50)
        self.get_logger().info('Nodo FollowWaypoints iniciado')
        self.get_logger().info(f'Posición inicial: ({self.initial_x}, {self.initial_y})')
        self.get_logger().info(f'Número de waypoints: {len(self.waypoints)}')
        for i, wp in enumerate(self.waypoints):
            self.get_logger().info(f'  Waypoint {i+1}: ({wp[0]}, {wp[1]}) theta={wp[2]}')
        self.get_logger().info('=' * 50)
        
        # Timer único para inicialización
        self.init_timer = self.create_timer(2.0, self.set_initial_pose)
    
    def set_initial_pose(self):
        """Establece la posición inicial una sola vez"""
        if self.initial_pose_sent:
            return
        
        self.initial_pose_sent = True
        initial_pose = PoseWithCovarianceStamped()
        initial_pose.header.frame_id = 'map'
        initial_pose.header.stamp = self.get_clock().now().to_msg()
        
        initial_pose.pose.pose.position.x = self.initial_x
        initial_pose.pose.pose.position.y = self.initial_y
        initial_pose.pose.pose.position.z = 0.0
        initial_pose.pose.pose.orientation.z = sin(self.initial_theta / 2.0)
        initial_pose.pose.pose.orientation.w = cos(self.initial_theta / 2.0)
        
        initial_pose.pose.covariance = [0.25, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.25, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.25]
        
        self.initial_pose_pub.publish(initial_pose)
        self.get_logger().info('✅ Posición inicial establecida')
        
        # Cancelar el timer de inicialización
        self.init_timer.cancel()
        
        # Esperar más tiempo para que AMCL se estabilice (8 segundos)
        self.send_timer = self.create_timer(8.0, self.send_waypoints)
    
    def send_waypoints(self):
        """Envía los waypoints con reintentos"""
        if self.goal_sent:
            return
        
        self.goal_sent = True
        goal_msg = FollowWaypoints.Goal()
        goal_msg.poses = []
        
        for i, (x, y, theta) in enumerate(self.waypoints):
            pose = PoseStamped()
            pose.header.frame_id = 'map'
            pose.header.stamp = self.get_clock().now().to_msg()
            pose.pose.position.x = x
            pose.pose.position.y = y
            pose.pose.position.z = 0.0
            pose.pose.orientation.z = sin(theta / 2.0)
            pose.pose.orientation.w = cos(theta / 2.0)
            goal_msg.poses.append(pose)
        
        self.get_logger().info(f'🎯 Enviando {len(self.waypoints)} waypoints')
        
        # Cancelar el timer de envío
        self.send_timer.cancel()
        
        # Esperar servidor con timeout más largo
        if not self.action_client.wait_for_server(timeout_sec=15.0):
            self.get_logger().error('❌ Servidor /follow_waypoints no disponible')
            return
        
        # Enviar goal con callback de reintento
        self._send_goal_future = self.action_client.send_goal_async(
            goal_msg,
            feedback_callback=self.feedback_callback
        )
        self._send_goal_future.add_done_callback(self.goal_response_callback)
    
    def goal_response_callback(self, future):
        try:
            goal_handle = future.result()
            if not goal_handle.accepted:
                self.retry_count += 1
                if self.retry_count <= self.max_retries:
                    self.get_logger().warn(f'⚠️ Goal rechazado (intento {self.retry_count}/{self.max_retries})')
                    self.get_logger().info('🔄 Reintentando en 3 segundos...')
                    self.goal_sent = False  # Permitir reintentar
                    self.retry_timer = self.create_timer(3.0, self.send_waypoints)
                else:
                    self.get_logger().error(f'❌ Goal rechazado después de {self.max_retries} intentos')
                    self.get_logger().info('💡 Verifica que el robot esté localizado en el mapa')
                    self.get_logger().info('💡 Puedes usar "2D Pose Estimate" en RViz para localizarlo manualmente')
                return
            
            self.get_logger().info('✅ Goal aceptado, robot en movimiento...')
            self._get_result_future = goal_handle.get_result_async()
            self._get_result_future.add_done_callback(self.get_result_callback)
            
        except Exception as e:
            self.get_logger().error(f'Error en goal_response_callback: {e}')
    
    def get_result_callback(self, future):
        try:
            result = future.result().result
            self.get_logger().info('=' * 50)
            self.get_logger().info('🏁 Ruta completada exitosamente!')
            
            try:
                if hasattr(result, 'waypoints_reached'):
                    self.get_logger().info(f'📊 Waypoints alcanzados: {result.waypoints_reached} de {len(self.waypoints)}')
            except:
                pass
            
            self.get_logger().info('=' * 50)
            self.get_logger().info('✅ Navegación finalizada. El nodo permanece activo.')
            self.get_logger().info('💡 Presiona Ctrl+C para cerrar')
            
        except Exception as e:
            self.get_logger().error(f'Error en get_result_callback: {e}')
    
    def feedback_callback(self, feedback_msg):
        try:
            feedback = feedback_msg.feedback
            current = feedback.current_waypoint
            # Solo mostrar cuando cambia el waypoint
            if current != self.last_waypoint_reported and current > 0:
                self.last_waypoint_reported = current
                total = len(self.waypoints)
                self.get_logger().info(f'📍 Waypoint {current}/{total} completado')
        except AttributeError:
            pass
        except Exception as e:
            pass

def main():
    rclpy.init()
    node = FollowWaypointsNode()
    
    try:
        node.get_logger().info('🔄 Nodo ejecutándose. Esperando eventos...')
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info('🔚 Nodo interrumpido por el usuario')
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()