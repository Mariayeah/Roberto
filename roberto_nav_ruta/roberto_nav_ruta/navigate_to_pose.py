#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
import sys
import time

class NavigateToPoseNode(Node):
    def __init__(self):
        super().__init__('navigate_to_pose')
        
        # Cliente de acción para navegación
        self.action_client = ActionClient(self, NavigateToPose, '/navigate_to_pose')
        
        # Publicador para establecer posición inicial automática
        self.initial_pose_pub = self.create_publisher(
            PoseWithCovarianceStamped,
            '/initialpose',
            10
        )
        
        # Parámetros configurables
        self.declare_parameter('goal_x', 2.0)
        self.declare_parameter('goal_y', 1.0)
        self.declare_parameter('goal_theta', 0.0)
        self.declare_parameter('initial_x', 0.0)
        self.declare_parameter('initial_y', 0.0)
        self.declare_parameter('initial_theta', 0.0)
        
        self.goal_x = self.get_parameter('goal_x').value
        self.goal_y = self.get_parameter('goal_y').value
        self.goal_theta = self.get_parameter('goal_theta').value
        self.initial_x = self.get_parameter('initial_x').value
        self.initial_y = self.get_parameter('initial_y').value
        self.initial_theta = self.get_parameter('initial_theta').value
        
        self.get_logger().info('Nodo NavigateToPose iniciado')
        self.get_logger().info(f'Objetivo: ({self.goal_x}, {self.goal_y}) con theta: {self.goal_theta}')
        self.get_logger().info(f'Posición inicial: ({self.initial_x}, {self.initial_y}) con theta: {self.initial_theta}')
        
        # Timer para ejecutar la secuencia automática
        self.create_timer(2.0, self.set_initial_pose)
    
    def set_initial_pose(self):
        """Establece la posición inicial del robot automáticamente"""
        initial_pose = PoseWithCovarianceStamped()
        initial_pose.header.frame_id = 'map'
        initial_pose.header.stamp = self.get_clock().now().to_msg()
        
        # Posición inicial
        initial_pose.pose.pose.position.x = self.initial_x
        initial_pose.pose.pose.position.y = self.initial_y
        initial_pose.pose.pose.position.z = 0.0
        
        # Orientación inicial (convertir theta a quaternion)
        from math import sin, cos
        initial_pose.pose.pose.orientation.x = 0.0
        initial_pose.pose.pose.orientation.y = 0.0
        initial_pose.pose.pose.orientation.z = sin(self.initial_theta / 2.0)
        initial_pose.pose.pose.orientation.w = cos(self.initial_theta / 2.0)
        
        # Covarianza (confianza en la posición inicial)
        initial_pose.pose.covariance = [0.25, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.25, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                                        0.0, 0.0, 0.0, 0.0, 0.0, 0.25]
        
        self.initial_pose_pub.publish(initial_pose)
        self.get_logger().info('✅ Posición inicial establecida automáticamente')
        
        # Esperar a que AMCL se estabilice (3 segundos)
        self.create_timer(3.0, self.send_goal)
    
    def send_goal(self):
        """Envía el objetivo de navegación"""
        goal_msg = NavigateToPose.Goal()
        goal_msg.pose = PoseStamped()
        goal_msg.pose.header.frame_id = 'map'
        goal_msg.pose.header.stamp = self.get_clock().now().to_msg()
        
        # Posición objetivo
        goal_msg.pose.pose.position.x = self.goal_x
        goal_msg.pose.pose.position.y = self.goal_y
        goal_msg.pose.pose.position.z = 0.0
        
        # Orientación objetivo
        from math import sin, cos
        goal_msg.pose.pose.orientation.x = 0.0
        goal_msg.pose.pose.orientation.y = 0.0
        goal_msg.pose.pose.orientation.z = sin(self.goal_theta / 2.0)
        goal_msg.pose.pose.orientation.w = cos(self.goal_theta / 2.0)
        
        self.get_logger().info(f'🎯 Enviando goal a ({self.goal_x}, {self.goal_y})')
        
        # Esperar que el servidor esté disponible
        if not self.action_client.wait_for_server(timeout_sec=10.0):
            self.get_logger().error('❌ Servidor /navigate_to_pose no disponible')
            return
        
        # Enviar goal
        self._send_goal_future = self.action_client.send_goal_async(
            goal_msg, 
            feedback_callback=self.feedback_callback
        )
        self._send_goal_future.add_done_callback(self.goal_response_callback)
    
    def goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().error('❌ Goal rechazado')
            return
        
        self.get_logger().info('✅ Goal aceptado, robot en movimiento...')
        self._get_result_future = goal_handle.get_result_async()
        self._get_result_future.add_done_callback(self.get_result_callback)
    
    def get_result_callback(self, future):
        result = future.result().result
        self.get_logger().info('🏁 Navegación completada exitosamente')
        
        # Esperar 3 segundos y cerrar el nodo
        self.create_timer(3.0, self.shutdown_node)
    
    def feedback_callback(self, feedback_msg):
        feedback = feedback_msg.feedback
        self.get_logger().info(f'📊 Progreso: distancia restante = {feedback.distance_remaining:.2f} m')
    
    def shutdown_node(self):
        self.get_logger().info('🔚 Nodo finalizado')
        rclpy.shutdown()

def main():
    rclpy.init()
    
    # Permitir pasar parámetros por línea de comandos
    node = NavigateToPoseNode()
    
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info('Nodo interrumpido por el usuario')
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()