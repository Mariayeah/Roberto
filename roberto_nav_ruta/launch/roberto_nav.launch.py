import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # 1. Rutas locales de vuestro propio ecosistema
    pkg_nav_ruta = get_package_share_directory('roberto_nav_ruta')
    pkg_mundo = get_package_share_directory('roberto_mundo')

    # Forzar el mapa del aeropuerto de roberto_mundo
    map_file = os.path.join(pkg_mundo, 'maps', 'mapadelmundo.yaml')
    
    # Apuntar al nuevo archivo de parámetros que acabamos de crear arriba
    param_file = os.path.join(pkg_nav_ruta, 'param', 'burger.yaml')
    
    # Usar el bringup oficial de Nav2 nativo del sistema operativo
    nav2_launch_dir = os.path.join(get_package_share_directory('nav2_bringup'), 'launch')

    # Intentar cargar RViz personalizado si existe, si no, el por defecto
    rviz_config_dir = os.path.join(pkg_nav_ruta, 'rviz', 'localization.rviz')
    if not os.path.exists(rviz_config_dir):
        rviz_config_dir = os.path.join(pkg_nav_ruta, 'rviz', 'tb3_navigation2.rviz')

    return LaunchDescription([
        DeclareLaunchArgument(
            'map',
            default_value=map_file,
            description='Ruta completa al archivo del mapa yaml'),

        DeclareLaunchArgument(
            'params_file',
            default_value=param_file,
            description='Ruta completa al archivo de parametros optimizados'),

        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Forzar tiempo real (false) para pruebas físicas'),

        # Lanzador oficial de Nav2 (Trae planner, controller, recoveries y servidores de acciones)
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([nav2_launch_dir, '/bringup_launch.py']),
            launch_arguments={
                'map': map_file,
                'use_sim_time': 'false',
                'params_file': param_file
            }.items(),
        ),

        # Lanzar la interfaz de visualización RViz2
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            arguments=['-d', rviz_config_dir],
            parameters=[{'use_sim_time': False}],
            output='screen'),
    ])