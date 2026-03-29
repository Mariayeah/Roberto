# Proyecto Robótica – Roberto

## Índice

* [Descripción](#descripción)
* [Requisitos](#requisitos)
* [Instalación](#instalación)
* [Uso](#uso)
* [Estructura del Proyecto](#estructura-del-proyecto)
* [Política de Ramas](#política-de-ramas)

## Descripción

Este proyecto utiliza **ROS 2** (Robot Operating System 2) para crear un robot guía para aeropuertos. El proyecto implementa nodos, mensajes y servicios de ROS 2 para navegación, visión artificial, reconocimiento y control por web.

## Requisitos

* **Sistema operativo:** Ubuntu 24.04 LTS (recomendado)
* **ROS 2:** Jazzy
* **Dependencias adicionales:**
  * Python ≥ 3.12
  * GCC/G++ ≥ 11.4.0
  * CMake ≥ 3.22
  * colcon

## Instalación

**1. Clonar metapaquete en workspace existente**

    cd ~/turtlebot3_ws/src
    git clone https://github.com/Mariayeah/Roberto.git

**2. Instalar dependencias del sistema (UNA VEZ)**

    cd ~/turtlebot3_ws
    rosdep install --from-paths src --ignore-src -r -y

**3. Compilar metapaquete Roberto + dependencias**

    colcon build --packages-up-to roberto

**4. Source workspace**

    source install/setup.bash

## Uso

1. **Iniciar ROS 2:**

    ros2 launch nombre_proyecto nombre_launch_file.launch.py

2. **Ejecutar nodos manualmente:**

    ros2 run nombre_paquete nombre_nodo

3. **Herramientas de diagnóstico:**
  
* **Listar tópicos activos:**

    ros2 topic list

* **Escuchar un tópico:**

    ros2 topic echo /nombre_topico

* **Listar nodos:**

    ros2 node list

## Estructura del Proyecto

    roberto/                      <-- Carpeta raíz del repositorio (clonado en src/)
    ├── README.md
    ├── roberto/                  <-- Metapaquete
    │   ├── CMakeLists.txt        
    │   └── package.xml
    ├── roberto_lidar/            <-- Paquete de funcionalidad (Python)
    │   ├── launch/
    │   ├── resource/
    │   ├── rviz/
    │   ├── test/
    │   ├── package.xml
    │   ├── setup.cfg
    │   └── setup.py
    ├── roberto_mundo/            <-- Paquete de funcionalidad (C++/CMake)
    │   ├── include/
    │   ├── launch/
    │   ├── maps/
    │   ├── models/
    │   ├── params/
    │   ├── rviz/
    │   ├── src/
    │   ├── urdf/
    │   ├── worlds/
    │   ├── CMakeLists.txt
    │   └── package.xml
    ├── roberto_nav_punto/        <-- Paquete de funcionalidad (Python)
    │   ├── config/
    │   ├── launch/
    │   ├── resource/
    │   ├── roberto_nav_punto/
    │   ├── rviz/
    │   ├── test/
    │   ├── package.xml
    │   ├── setup.cfg
    │   └── setup.py
    └── roberto_nav_ruta/         <-- Paquete de funcionalidad (Python)
        ├── launch/
        ├── param/
        ├── resource/
        ├── roberto_nav_ruta/
        ├── rviz/
        ├── test/
        ├── package.xml
        ├── setup.cfg
        └── setup.py

**`roberto/roberto/CMakeLists.txt`:**

```cmake
cmake_minimum_required(VERSION 3.8)
project(roberto)

find_package(ament_cmake REQUIRED)
ament_package()
