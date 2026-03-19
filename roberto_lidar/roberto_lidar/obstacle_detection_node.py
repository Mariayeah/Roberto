import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan

class ObstacleDetectionNode(Node):

    def __init__(self):
        super().__init__('obstacle_detection_node')

        self.subscription = self.create_subscription(
            LaserScan,
            '/scan',
            self.scan_callback,
            10
        )

        self.threshold = 0.5  # distancia en metros

        self.get_logger().info('Obstacle Detection Node started')

    def scan_callback(self, msg):
        # Filtrar valores infinitos
        valid_ranges = [r for r in msg.ranges if r != float('inf')]

        if not valid_ranges:
            return

        min_distance = min(valid_ranges)

        if min_distance < self.threshold:
            self.get_logger().warn(
                f'⚠️ Obstacle detected at {min_distance:.2f} meters'
            )
        else:
            self.get_logger().info(
                f'Clear path, nearest object at {min_distance:.2f} meters'
            )


def main(args=None):
    rclpy.init(args=args)
    node = ObstacleDetectionNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()