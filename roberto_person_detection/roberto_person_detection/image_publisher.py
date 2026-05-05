import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
import os
from rclpy.qos import qos_profile_sensor_data

class ImagePublisher(Node):
    def __init__(self):
        super().__init__('image_publisher')
        self.publisher = self.create_publisher(Image, '/camera/image_raw', qos_profile_sensor_data)
        self.bridge = CvBridge()

        # Path to your test image
        image_path = '/home/mery/person.jpg'
        
        if not os.path.exists(image_path):
            self.get_logger().error(f"File not found: {image_path}")
            self.image = None
        else:
            self.image = cv2.imread(image_path)

        # Publish at 10Hz
        self.timer = self.create_timer(0.1, self.publish_frame)
        
    def publish_frame(self):
        if self.image is not None:
            msg = self.bridge.cv2_to_imgmsg(self.image, encoding='bgr8')
            self.publisher.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = ImagePublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()