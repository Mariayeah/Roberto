# Copyright 2019 Open Source Robotics Foundation, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Author: Darby Lim

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # 1. Forzamos use_sim_time a false para usar el reloj de hardware real de Roberto
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')
    
    # 2. Apuntamos a vuestro archivo de parámetros propio 'nav2_params.yaml'
    # dentro de vuestro paquete actual para que no busque configuraciones fantasma
    param_dir = LaunchConfiguration(
        'params_file',
        default=os.path.join(
            get_package_share_directory('roberto_nav_ruta'),
            'param',
            'parameters.yaml'))

    # Buscador nativo de la instalación de Nav2 del sistema operativo
    nav2_launch_file_dir = os.path.join(get_package_share_directory('nav2_bringup'), 'launch')

    # Apuntamos al archivo de configuración de RViz de vuestro paquete
    rviz_config_dir = os.path.join(
        get_package_share_directory('roberto_nav_ruta'),
        'rviz',
        'tb3_navigation2.rviz')

    return LaunchDescription([
        # Eliminamos el DeclareLaunchArgument de 'map' porque ya no hay mapa
        DeclareLaunchArgument(
            'params_file',
            default_value=param_dir,
            description='Full path to param file to load'),

        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation (Gazebo) clock if true'),

        # ¡EL CAMBIO CRÍTICO!: Incluimos 'navigation_launch.py' en lugar de 'bringup_launch.py'
        # Esto arranca Planner y Controller omitiendo por completo el Map Server y AMCL
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([nav2_launch_file_dir, '/navigation_launch.py']),
            launch_arguments={
                'use_sim_time': use_sim_time,
                'params_file': param_dir}.items(),
        ),

        # RViz se abre adaptado al tiempo real de las ruedas
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            arguments=['-d', rviz_config_dir],
            parameters=[{'use_sim_time': use_sim_time}],
            output='screen'),
    ])
