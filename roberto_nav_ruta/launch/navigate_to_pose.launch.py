from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument('goal_x', default_value='2.0'),
        DeclareLaunchArgument('goal_y', default_value='1.0'),
        DeclareLaunchArgument('goal_theta', default_value='0.0'),
        DeclareLaunchArgument('initial_x', default_value='0.0'),
        DeclareLaunchArgument('initial_y', default_value='0.0'),
        DeclareLaunchArgument('initial_theta', default_value='0.0'),
        
        Node(
            package='roberto_nav_ruta',
            executable='navigate_to_pose',
            name='navigate_to_pose',
            parameters=[{
                'goal_x': LaunchConfiguration('goal_x'),
                'goal_y': LaunchConfiguration('goal_y'),
                'goal_theta': LaunchConfiguration('goal_theta'),
                'initial_x': LaunchConfiguration('initial_x'),
                'initial_y': LaunchConfiguration('initial_y'),
                'initial_theta': LaunchConfiguration('initial_theta'),
            }],
            output='screen'
        ),
    ])
