-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 17-04-2026 a las 13:00:51
-- Versión del servidor: 10.11.14-MariaDB-0ubuntu0.24.04.1
-- Versión de PHP: 8.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Roberto`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Aeropuerto`
--

CREATE TABLE `Aeropuerto` (
  `CodigoIATA` varchar(10) NOT NULL,
  `Nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `Aeropuerto`
--

INSERT INTO `Aeropuerto` (`CodigoIATA`, `Nombre`) VALUES
('JFK', 'John F. Kennedy'),
('MAD', 'Adolfo Suárez Madrid-Barajas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Evento`
--

CREATE TABLE `Evento` (
  `EventoID` int(11) NOT NULL,
  `RobotID` int(11) NOT NULL,
  `PosicionID` int(11) DEFAULT NULL,
  `FechaHora` datetime NOT NULL,
  `TipoEvento` varchar(50) NOT NULL,
  `Severidad` varchar(20) NOT NULL,
  `Mensaje` text DEFAULT NULL,
  `Estado` varchar(20) DEFAULT NULL,
  `CerradaEn` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `Evento`
--

INSERT INTO `Evento` (`EventoID`, `RobotID`, `PosicionID`, `FechaHora`, `TipoEvento`, `Severidad`, `Mensaje`, `Estado`, `CerradaEn`) VALUES
(1, 1, 1, '2026-04-12 21:06:20', 'Inicio Sistema', 'Info', 'Sistema de navegación iniciado correctamente', 'Abierto', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Interaccion`
--

CREATE TABLE `Interaccion` (
  `InteraccionID` int(11) NOT NULL,
  `RobotID` int(11) NOT NULL,
  `ZonaActualID` int(11) NOT NULL,
  `ZonaDestinoID` int(11) NOT NULL,
  `FechaHora` datetime NOT NULL,
  `Duracion` int(11) NOT NULL,
  `Valoracion` int(11) DEFAULT NULL,
  `Comentario` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Mantenimiento`
--

CREATE TABLE `Mantenimiento` (
  `MantenimientoID` int(11) NOT NULL,
  `RobotID` int(11) NOT NULL,
  `TecnicoID` int(11) DEFAULT NULL,
  `Tipo` varchar(50) NOT NULL,
  `FechaProgramada` date NOT NULL,
  `FechaEjecutada` datetime DEFAULT NULL,
  `Estado` varchar(20) DEFAULT NULL,
  `Notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `PosicionRobot`
--

CREATE TABLE `PosicionRobot` (
  `PosicionID` int(11) NOT NULL,
  `RobotID` int(11) NOT NULL,
  `PosX` float NOT NULL,
  `PosY` float NOT NULL,
  `FechaHora` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `PosicionRobot`
--

INSERT INTO `PosicionRobot` (`PosicionID`, `RobotID`, `PosX`, `PosY`, `FechaHora`) VALUES
(1, 1, 125, 455, '2026-04-12 16:13:33'),
(2, 1, 10, 20, '2026-04-12 21:06:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Robot`
--

CREATE TABLE `Robot` (
  `RobotID` int(11) NOT NULL,
  `Nombre` varchar(50) NOT NULL,
  `Descripcion` varchar(255) DEFAULT NULL,
  `Bateria` int(11) NOT NULL,
  `CamaraActiva` tinyint(1) NOT NULL,
  `UltimaComunicacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `Robot`
--

INSERT INTO `Robot` (`RobotID`, `Nombre`, `Descripcion`, `Bateria`, `CamaraActiva`, `UltimaComunicacion`) VALUES
(1, 'Roberto1', 'GuiaPuertas', 85, 1, '2026-04-12 16:13:33'),
(2, 'Roberto2', 'GuiaOcio', 42, 1, '2026-04-12 16:13:33'),
(3, 'ROBERTO', 'Robot de transporte de equipaje (Terminal 1)', 85, 1, '2026-04-12 21:06:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Tecnico`
--

CREATE TABLE `Tecnico` (
  `TecnicoID` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Contrasena` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `Tecnico`
--

INSERT INTO `Tecnico` (`TecnicoID`, `Nombre`, `Email`, `Contrasena`) VALUES
(1, 'John Doe', 'john@airport.com', 'pass123'),
(2, 'Jane Smith', 'jane@airport.com', 'secure456'),
(3, 'Operador Principal', 'admin@aeropuerto.com', 'admin1234');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Zona`
--

CREATE TABLE `Zona` (
  `ZonaID` int(11) NOT NULL,
  `AeropuertoCodigo` varchar(10) NOT NULL,
  `Nombre` varchar(50) NOT NULL,
  `TipoZona` varchar(50) DEFAULT NULL,
  `PosX` float NOT NULL,
  `PosY` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Volcado de datos para la tabla `Zona`
--

INSERT INTO `Zona` (`ZonaID`, `AeropuertoCodigo`, `Nombre`, `TipoZona`, `PosX`, `PosY`) VALUES
(3, 'MAD', 'Puerta 12', 'Puerta', 120.5, 340.2),
(4, 'MAD', 'Puerta 4', 'Puerta', 95, 280),
(5, 'MAD', 'Puerta 8', 'Puerta', 110, 310),
(6, 'MAD', 'Puerta 21', 'Puerta', 180, 400),
(7, 'MAD', 'Restaurante VIP', 'Comida', 60, 175.5),
(8, 'MAD', 'Burger King', 'Comida', 50, 150),
(9, 'MAD', 'Cafetería Starbucks', 'Comida', 55.5, 160),
(10, 'MAD', 'Tapas Bar', 'Comida', 70, 190),
(11, 'MAD', 'Duty Free Principal', 'Ocio', 80, 200),
(12, 'MAD', 'Tienda de Electrónica', 'Ocio', 85, 210),
(13, 'MAD', 'Librería y Prensa', 'Ocio', 82.5, 205),
(14, 'MAD', 'Farmacia y Salud', 'Ocio', 90, 220),
(15, 'MAD', 'Salida Principal T1', 'Salida', 10, 20),
(16, 'MAD', 'Recogida de Equipajes', 'Salida', 15, 25),
(17, 'MAD', 'Parada de Taxis', 'Salida', 5, 10),
(18, 'MAD', 'Alquiler de Coches', 'Salida', 20, 35);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Aeropuerto`
--
ALTER TABLE `Aeropuerto`
  ADD PRIMARY KEY (`CodigoIATA`);

--
-- Indices de la tabla `Evento`
--
ALTER TABLE `Evento`
  ADD PRIMARY KEY (`EventoID`),
  ADD KEY `RobotID` (`RobotID`),
  ADD KEY `PosicionID` (`PosicionID`);

--
-- Indices de la tabla `Interaccion`
--
ALTER TABLE `Interaccion`
  ADD PRIMARY KEY (`InteraccionID`),
  ADD KEY `RobotID` (`RobotID`),
  ADD KEY `ZonaActualID` (`ZonaActualID`),
  ADD KEY `ZonaDestinoID` (`ZonaDestinoID`);

--
-- Indices de la tabla `Mantenimiento`
--
ALTER TABLE `Mantenimiento`
  ADD PRIMARY KEY (`MantenimientoID`),
  ADD KEY `RobotID` (`RobotID`),
  ADD KEY `TecnicoID` (`TecnicoID`);

--
-- Indices de la tabla `PosicionRobot`
--
ALTER TABLE `PosicionRobot`
  ADD PRIMARY KEY (`PosicionID`),
  ADD KEY `RobotID` (`RobotID`);

--
-- Indices de la tabla `Robot`
--
ALTER TABLE `Robot`
  ADD PRIMARY KEY (`RobotID`);

--
-- Indices de la tabla `Tecnico`
--
ALTER TABLE `Tecnico`
  ADD PRIMARY KEY (`TecnicoID`);

--
-- Indices de la tabla `Zona`
--
ALTER TABLE `Zona`
  ADD PRIMARY KEY (`ZonaID`),
  ADD KEY `AeropuertoCodigo` (`AeropuertoCodigo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Evento`
--
ALTER TABLE `Evento`
  MODIFY `EventoID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Interaccion`
--
ALTER TABLE `Interaccion`
  MODIFY `InteraccionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Mantenimiento`
--
ALTER TABLE `Mantenimiento`
  MODIFY `MantenimientoID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `PosicionRobot`
--
ALTER TABLE `PosicionRobot`
  MODIFY `PosicionID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `Robot`
--
ALTER TABLE `Robot`
  MODIFY `RobotID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `Tecnico`
--
ALTER TABLE `Tecnico`
  MODIFY `TecnicoID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `Zona`
--
ALTER TABLE `Zona`
  MODIFY `ZonaID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Evento`
--
ALTER TABLE `Evento`
  ADD CONSTRAINT `Evento_ibfk_1` FOREIGN KEY (`RobotID`) REFERENCES `Robot` (`RobotID`),
  ADD CONSTRAINT `Evento_ibfk_2` FOREIGN KEY (`PosicionID`) REFERENCES `PosicionRobot` (`PosicionID`);

--
-- Filtros para la tabla `Interaccion`
--
ALTER TABLE `Interaccion`
  ADD CONSTRAINT `Interaccion_ibfk_1` FOREIGN KEY (`RobotID`) REFERENCES `Robot` (`RobotID`),
  ADD CONSTRAINT `Interaccion_ibfk_2` FOREIGN KEY (`ZonaActualID`) REFERENCES `Zona` (`ZonaID`),
  ADD CONSTRAINT `Interaccion_ibfk_3` FOREIGN KEY (`ZonaDestinoID`) REFERENCES `Zona` (`ZonaID`);

--
-- Filtros para la tabla `Mantenimiento`
--
ALTER TABLE `Mantenimiento`
  ADD CONSTRAINT `Mantenimiento_ibfk_1` FOREIGN KEY (`RobotID`) REFERENCES `Robot` (`RobotID`),
  ADD CONSTRAINT `Mantenimiento_ibfk_2` FOREIGN KEY (`TecnicoID`) REFERENCES `Tecnico` (`TecnicoID`);

--
-- Filtros para la tabla `PosicionRobot`
--
ALTER TABLE `PosicionRobot`
  ADD CONSTRAINT `PosicionRobot_ibfk_1` FOREIGN KEY (`RobotID`) REFERENCES `Robot` (`RobotID`);

--
-- Filtros para la tabla `Zona`
--
ALTER TABLE `Zona`
  ADD CONSTRAINT `Zona_ibfk_1` FOREIGN KEY (`AeropuertoCodigo`) REFERENCES `Aeropuerto` (`CodigoIATA`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
