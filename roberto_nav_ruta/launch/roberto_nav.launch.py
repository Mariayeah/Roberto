from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument, ExecuteProcess
from launch.substitutions import LaunchConfiguration
import os
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    nav_ruta_dir = get_package_share_directory('roberto_nav_ruta')
    
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    map_file = LaunchConfiguration('map', default=os.path.join(nav_ruta_dir, 'map', 'mapadelmundo.yaml'))
    
    # Parámetros simplificados para evitar errores
    params_file = os.path.join(nav_ruta_dir, 'param', 'nav2_params_simple.yaml')
    
    return LaunchDescription([
        DeclareLaunchArgument('use_sim_time', default_value='true'),
        DeclareLaunchArgument('map', default_value=map_file),
        
        # Map Server
        Node(
            package='nav2_map_server',
            executable='map_server',
            name='map_server',
            parameters=[{'use_sim_time': use_sim_time, 'yaml_filename': map_file}],
            output='screen'
        ),
        
        # AMCL
        Node(
            package='nav2_amcl',
            executable='amcl',
            name='amcl',
            parameters=[{
                'use_sim_time': use_sim_time,
                'base_frame_id': 'base_footprint',
                'odom_frame_id': 'odom',
                'scan_topic': '/scan',
                'transform_tolerance': 1.0,
            }],
            output='screen'
        ),
        
        # Lifecycle Manager
        Node(
            package='nav2_lifecycle_manager',
            executable='lifecycle_manager',
            name='lifecycle_manager_navigation',
            parameters=[{
                'use_sim_time': use_sim_time,
                'autostart': True,
                'node_names': ['map_server', 'amcl']
            }],
            output='screen'
        ),
        
        # RViz
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            arguments=['-d', os.path.join(nav_ruta_dir, 'rviz', 'roberto_navigation.rviz')],
            parameters=[{'use_sim_time': use_sim_time}],
            output='screen'
        ),
    ])