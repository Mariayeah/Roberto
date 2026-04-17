// main.js
import { initROS } from './ros.js';
import { initCamera } from './camera.js';
import { initControls } from './controls.js';
import { initCage } from './cage.js';
import { initOdom } from './odom.js';

// 1. Inicializamos la conexión (Gestión T06)
const ros = initROS();

// 2. Inicializamos los componentes
// Pasamos el objeto 'ros' a todos. 
// roslibjs es inteligente: si creas un Topic antes de conectar, 
// se pondrá en cola y se activará en cuanto 'ros' emita 'connection'.
initCamera(ros);
initControls(ros);
initCage(ros);
initOdom(ros);

console.log("Ecosistema modular cargado. Esperando conexión...");