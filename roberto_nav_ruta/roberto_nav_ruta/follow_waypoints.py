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
        
        self.action_client = ActionClient(self, FollowWaypoints, '/follow_waypoints')
        self.initial_pose_pub = self.create_publisher(PoseWithCovarianceStamped, '/initialpose', 10)
        
        # Parámetros
        self.declare_parameter('initial_x', 0.0)
        self.declare_parameter('initial_y', 0.0)
        self.declare_parameter('initial_theta', 0.0)
        self.declare_parameter('waypoints', [0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0])
        
        self.initial_x = self.get_parameter('initial_x').value
        self.initial_y = self.get_parameter('initial_y').value
        self.initial_theta = self.get_parameter('initial_theta').value
        
        waypoints_param = self.get_parameter('waypoints').value
        self.waypoints = []
        for i in range(0, len(waypoints_param), 3):
            self.waypoints.append((waypoints_param[i], waypoints_param[i+1], waypoints_param[i+2]))
        
        self.goal_sent = False
        self.initial_pose_sent = False
        self.last_waypoint_reported = -1
        self.retry_count = 0
        self.max_retries = 3
        
        # Timers iniciales como None
        self.send_timer = None
        self.retry_timer = None
        
        # Timer de inicio
        self.init_timer = self.create_timer(2.0, self.set_initial_pose)

    def set_initial_pose(self):
        if self.initial_pose_sent:
            return
        
        self.initial_pose_sent = True
        self.init_timer.cancel() # IMPORTANTE: Detener el timer
        
        initial_pose = PoseWithCovarianceStamped()
        initial_pose.header.frame_id = 'map'
        initial_pose.header.stamp = self.get_clock().now().to_msg()
        initial_pose.pose.pose.position.x = self.initial_x
        initial_pose.pose.pose.position.y = self.initial_y
        initial_pose.pose.pose.orientation.z = sin(self.initial_theta / 2.0)
        initial_pose.pose.pose.orientation.w = cos(self.initial_theta / 2.0)
        initial_pose.pose.covariance = [0.25] + [0.0]*34 + [0.25]
        
        self.initial_pose_pub.publish(initial_pose)
        self.get_logger().info('✅ Posición inicial enviada. Esperando a AMCL...')
        
        # Programar el envío de waypoints
        self.send_timer = self.create_timer(8.0, self.send_waypoints)

    def send_waypoints(self):
        if self.send_timer:
            self.send_timer.cancel() # Detener el timer de espera
        
        if not self.action_client.wait_for_server(timeout_sec=10.0):
            self.get_logger().error('❌ Servidor /follow_waypoints no disponible')
            return

        goal_msg = FollowWaypoints.Goal()
        for x, y, theta in self.waypoints:
            pose = PoseStamped()
            pose.header.frame_id = 'map'
            pose.header.stamp = self.get_clock().now().to_msg()
            pose.pose.position.x = x
            pose.pose.position.y = y
            pose.pose.orientation.z = sin(theta / 2.0)
            pose.pose.orientation.w = cos(theta / 2.0)
            goal_msg.poses.append(pose)
        
        self.get_logger().info(f'🎯 Enviando {len(self.waypoints)} waypoints')
        self._send_goal_future = self.action_client.send_goal_async(
            goal_msg, 
            feedback_callback=self.feedback_callback
        )
        self._send_goal_future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            if self.retry_count < self.max_retries:
                self.retry_count += 1
                self.get_logger().warn(f'Intento {self.retry_count} fallido. Reintentando...')
                self.retry_timer = self.create_timer(3.0, self.send_waypoints)
            else:
                self.get_logger().error('❌ Goal rechazado definitivamente.')
            return
        
        self.get_logger().info('✅ Goal aceptado')
        self._get_result_future = goal_handle.get_result_async()
        self._get_result_future.add_done_callback(self.get_result_callback)

    def get_result_callback(self, future):
        self.get_logger().info('🏁 Ruta completada exitosamente.')

    def feedback_callback(self, feedback_msg):
        current = feedback_msg.feedback.current_waypoint
        if current != self.last_waypoint_reported and current > 0:
            self.last_waypoint_reported = current
            self.get_logger().info(f'📍 Completado waypoint {current}/{len(self.waypoints)}')

def main(args=None):
    rclpy.init(args=args)
    node = FollowWaypointsNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info('Interrumpido por el usuario.')
    finally:
        # Esto asegura que los recursos de red se liberen bien
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()