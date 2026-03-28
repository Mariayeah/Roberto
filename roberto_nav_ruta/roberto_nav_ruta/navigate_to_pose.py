#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from math import sin, cos
import sys

class NavigateToPoseNode(Node):
    def __init__(self):
        super().__init__('navigate_to_pose')
        
        self.action_client = ActionClient(self, NavigateToPose, '/navigate_to_pose')
        self.initial_pose_pub = self.create_publisher(PoseWithCovarianceStamped, '/initialpose', 10)
        
        self.declare_parameters(namespace='', parameters=[
            ('goal_x', 2.0), ('goal_y', 1.0), ('goal_theta', 0.0),
            ('initial_x', 0.0), ('initial_y', 0.0), ('initial_theta', 0.0)
        ])
        
        self.retry_count = 0
        self.max_retries = 10  # Aumentado para mayor persistencia
        
        self.get_logger().info('🚀 Nodo de Navegación Iniciado.')
        # Timer para la pose inicial
        self.init_timer = self.create_timer(3.0, self.set_initial_pose)

    def set_initial_pose(self):
        self.init_timer.cancel()
        msg = PoseWithCovarianceStamped()
        msg.header.frame_id = 'map'
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.pose.pose.position.x = self.get_parameter('initial_x').value
        msg.pose.pose.position.y = self.get_parameter('initial_y').value
        
        theta = self.get_parameter('initial_theta').value
        msg.pose.pose.orientation.z = sin(theta / 2.0)
        msg.pose.pose.orientation.w = cos(theta / 2.0)
        msg.pose.covariance = [0.25] * 36 # Covarianza genérica
        
        self.initial_pose_pub.publish(msg)
        self.get_logger().info('✅ Pose inicial enviada. Esperando sincronización de Nav2...')
        # Espera generosa de 10 segundos antes de enviar el primer goal
        self.goal_timer = self.create_timer(10.0, self.send_goal)

    def send_goal(self):
        if hasattr(self, 'goal_timer') and self.goal_timer:
            self.goal_timer.cancel()
            self.goal_timer = None

        self.get_logger().info('⏳ Verificando servidor /navigate_to_pose...')
        if not self.action_client.wait_for_server(timeout_sec=5.0):
            self.get_logger().error('❌ Servidor no disponible.')
            self.schedule_retry()
            return

        goal_msg = NavigateToPose.Goal()
        goal_msg.pose.header.frame_id = 'map'
        goal_msg.pose.header.stamp = self.get_clock().now().to_msg()
        goal_msg.pose.pose.position.x = self.get_parameter('goal_x').value
        goal_msg.pose.pose.position.y = self.get_parameter('goal_y').value
        
        theta = self.get_parameter('goal_theta').value
        goal_msg.pose.pose.orientation.z = sin(theta / 2.0)
        goal_msg.pose.pose.orientation.w = cos(theta / 2.0)

        self.get_logger().info(f'🎯 Enviando Goal a ({goal_msg.pose.pose.position.x}, {goal_msg.pose.pose.position.y})')
        self.send_goal_future = self.action_client.send_goal_async(goal_msg)
        self.send_goal_future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().warn('⚠️ Goal RECHAZADO por Nav2. Reintentando...')
            self.schedule_retry()
            return

        self.get_logger().info('🟢 Goal ACEPTADO. En camino...')
        self.result_future = goal_handle.get_result_async()
        self.result_future.add_done_callback(self.get_result_callback)

    def get_result_callback(self, future):
        status = future.result().status
        if status == 4: # SUCCEEDED
            self.get_logger().info('🏁 ¡Llegamos al destino!')
            rclpy.shutdown()
        elif status == 6: # ABORTED
            self.get_logger().error('❌ Navegación ABORTADA (Estado 6). Reintentando en 5s...')
            self.schedule_retry()
        else:
            self.get_logger().error(f'❌ Error con estado: {status}')
            self.schedule_retry()

    def schedule_retry(self):
        self.retry_count += 1
        if self.retry_count <= self.max_retries:
            self.get_logger().info(f'🔄 Intento {self.retry_count}/{self.max_retries}...')
            self.goal_timer = self.create_timer(5.0, self.send_goal)
        else:
            self.get_logger().error('💀 Máximos reintentos agotados.')
            rclpy.shutdown()

def main(args=None):
    rclpy.init(args=args)
    node = NavigateToPoseNode()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()