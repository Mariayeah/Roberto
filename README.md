# Proyecto Robótica – Roberto

## Índice

* [Descripción](#descripción)
* [Requisitos](#requisitos)
* [Instalación](#instalación)
* [Uso](#uso)
* [Estructura del Proyecto](#estructura-del-proyecto)
* [Política de Ramas](#política-de-ramas)

## Descripción

Este proyecto utiliza **ROS 2** (Robot Operating System 2) para crear un robot guía para aeropuertos. El proyecto implementa nodos, mensajes y servicios de ROS 2 para navegación, visión artificial, reconocimiento, control por web.

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

    Roberto/
    ├── roberto/
    │   ├── CMakeLists.txt
    │   └── package.xml
    └── roberto_ejemplo/
        ├── launch/
        ├── config/
        ├── roberto_ejemplo/
        ├── setup.py
        ├── setup.cfg
        └── package.xml

**`roberto/CMakeLists.txt`:**

    cmake_minimum_required(VERSION 3.8)
    project(roberto)
    
    find_package(ament_cmake REQUIRED)
    ament_package()

**`roberto/package.xml`:**

    <?xml version="1.0"?>
    <?xml-model href="http://download.ros.org/schema/package_format3.xsd" 
                 schematypens="http://www.w3.org/2001/XMLSchema"?>
    <package format="3">
      <name>roberto</name>
      <version>0.0.0</version>
      <description>Metapaquete Roberto ROS 2</description>
      <maintainer email="tu@email.com">Tu Nombre</maintainer>
      <license>Apache 2.0</license>
    
      <buildtool_depend>ament_cmake</buildtool_depend>
      <exec_depend>roberto_ejemplo</exec_depend>
    
      <export>
        <build_type>ament_cmake</build_type>
      </export>
    </package>

* Nombres en **minúsculas**: `roberto_ejemplo`
* **Prefijo** + funcionalidad: `roberto_*`
* **Un paquete por funcionalidad**
* **Minimizar dependencias**
* `roberto/` contiene **CMakeLists.txt + package.xml** con `<exec_depend>` de todos los paquetes

## Política de Ramas

**Ramas principales:**

* **master**: Siempre contiene código definitivo y funcional
* **release**: Ramas de sprint (release01, release02, etc.) con código provisional

**Proceso:**

1. Crear `release01`, `release02`, etc. desde `master` al inicio de cada sprint
2. Crear ramas **feat**, **fix**, **docs**, etc. desde la release activa
3. **Integrar**: `rama → releaseXX → master` (solo cuando esté listo)
4. **Final sprint**: Merge `releaseXX → master`, crear tag, borrar ramas **feat/fix/etc**
5. **Nunca commits directos en master**

**Estándar de prefijos para ramas y commits:**

* `feat:` Nueva funcionalidad
* `fix:` Corrección de errores
* `docs:` Cambios en la documentación
* `style:` Formato, espaciado, estilo de código (sin cambios funcionales)
* `refactor:` Refactorización de código (sin cambiar funcionalidad)
* `perf:` Mejoras de rendimiento
* `test:` Añadir o modificar pruebas
* `chore:` Tareas de mantenimiento (scripts, dependencias, etc.)

