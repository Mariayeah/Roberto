// -----------------------------
// GLOBAL STATE
// -----------------------------
let allZonas = [];
let currentGoal = null;
let currentPos = { x: 0, y: 0 };
let targetPos = null; // This now represents the REAL ROS position

// Marker references for global access
let robotMarker, goalMarker, robotLayer;

window.onload = () => {
    // -----------------------------
    // ROS CONNECTION
    // -----------------------------
    const ros = new ROSLIB.Ros({
        url: `ws://${window.location.hostname}:9090`
    });

    ros.on('connection', () => console.log('Connected to ROS Bridge'));
    ros.on('error', (error) => console.error('ROS error:', error));

    // -----------------------------
    // VIEWER SETUP
    // -----------------------------
    const mapDiv = document.getElementById('map-canvas');
    const viewer = new ROS2D.Viewer({
        divID: 'map-canvas',
        width: mapDiv.clientWidth || 600,
        height: mapDiv.clientHeight || 400
    });

    // -----------------------------
    // MAP CLIENT
    // -----------------------------
    const gridClient = new ROS2D.OccupancyGridClient({
        ros: ros,
        rootObject: viewer.scene
    });

    // -----------------------------
    // UNIFIED ROBOT LAYER
    // -----------------------------
    robotLayer = new createjs.Container();
    viewer.scene.addChild(robotLayer);

    // Blue Robot Marker
    robotMarker = new createjs.Shape();
    robotMarker.graphics.beginFill("blue").drawCircle(0, 0, 5);
    robotMarker.scaleX = robotMarker.scaleY = 0.03;
    robotLayer.addChild(robotMarker);

    // Red Goal Marker
    goalMarker = new createjs.Shape();
    goalMarker.graphics.beginFill("red").drawCircle(0, 0, 5);
    goalMarker.scaleX = goalMarker.scaleY = 0.03; 
    goalMarker.visible = false;
    robotLayer.addChild(goalMarker);

    // -----------------------------
    // MAP EVENT
    // -----------------------------
    gridClient.on('change', () => {
        console.log("Map Grid Received");
        viewer.scaleToDimensions(
            gridClient.currentGrid.width,
            gridClient.currentGrid.height
        );
        viewer.shift(
            gridClient.currentGrid.pose.position.x,
            gridClient.currentGrid.pose.position.y
        );
        // Start position tracking once map is ready
        initRobotPosition();
    });

    // -----------------------------
    // TELEMETRY LOGIC (REAL-TIME POS)
    // -----------------------------
    async function fetchTelemetry() {
        try {
            const res = await fetch('/api/position');
            const data = await res.json();
            
            // If the backend has a real AMCL pose, set it as the target
            if (data && data.x !== undefined && !isNaN(data.x)) {
                targetPos = { 
                    x: parseFloat(data.x), 
                    y: parseFloat(data.y) 
                };
            }
        } catch (err) {
            console.warn("Telemetry fetch error:", err);
        }
    }

    // Poll the backend for the real /amcl_pose every 100ms
    setInterval(fetchTelemetry, 100);

    // -----------------------------
    // VISUAL UPDATE LOGIC
    // -----------------------------
    function updateVisuals() {
        if (!isNaN(currentPos.x) && !isNaN(currentPos.y)) {
            robotMarker.x = currentPos.x;
            robotMarker.y = -currentPos.y; // ROS Y-flip
        }

        if (currentGoal && !isNaN(currentGoal.x) && !isNaN(currentGoal.y)) {
            goalMarker.visible = true;
            goalMarker.x = currentGoal.x;
            goalMarker.y = -currentGoal.y; // ROS Y-flip
        } else {
            goalMarker.visible = false;
        }
    }

    // Initial position fetch
    async function initRobotPosition() {
        try {
            const res = await fetch('/api/position');
            const data = await res.json();
            if (data && data.x !== undefined) {
                currentPos.x = parseFloat(data.x);
                currentPos.y = parseFloat(data.y);
                targetPos = { x: currentPos.x, y: currentPos.y };
                updateVisuals();
            }
        } catch (err) {
            console.error("Init pos error:", err);
        }
    }

    // -----------------------------
    // SMOOTH MOVEMENT ENGINE (LERP)
    // -----------------------------
    setInterval(() => {
        if (!targetPos) return;

        // Calculate distance to the REAL robot position
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;

        // Smoothly slide the dot toward the actual telemetry coordinates
        // Using 0.1 (10%) for a balanced smoothness
        if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
            currentPos.x += dx * 0.1;
            currentPos.y += dy * 0.1;
            updateVisuals();
        }
    }, 50);

    // -----------------------------
    // BATTERY UPDATE
    // -----------------------------
    setInterval(() => {
        fetch('/api/robots')
            .then(res => res.json())
            .then(resData => {
                if (resData.success && resData.data.robots.length) {
                    const batteryStat = document.querySelector('.battery-status span');
                    if (batteryStat) {
                        batteryStat.textContent = `${resData.data.robots[0].Bateria}%`;
                    }
                }
            })
            .catch(() => {});
    }, 1000);
};

// -----------------------------
// SEND GOAL (Button Action)
// -----------------------------
window.sendGoal = async function () {
    const zonaSelect = document.getElementById('zonaSelect');
    const zonaId = zonaSelect.value;
    const selectedZona = allZonas.find(z => z.ZonaID == zonaId);

    if (!selectedZona) return;

    const valX = parseFloat(selectedZona.PosX);
    const valY = parseFloat(selectedZona.PosY);

    if (isNaN(valX) || isNaN(valY)) {
        console.error("Zone coordinates are invalid (NaN):", selectedZona);
        return;
    }

    // Set destination marker visually
    currentGoal = { x: valX, y: valY };

    console.log(`Goal set to: ${selectedZona.Nombre} at (${valX}, ${valY})`);

    // Immediate UI Update for the Red Dot
    if (goalMarker) {
        goalMarker.visible = true;
        goalMarker.x = valX;
        goalMarker.y = -valY;
    }

    // Inform Backend (which publishes to /goal_pose)
    await fetch('/api/sendGoal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zonaId })
    });
};

// -----------------------------
// LOAD DESTINATIONS
// -----------------------------
async function loadZonas() {
    try {
        const res = await fetch('/api/zonas');
        allZonas = await res.json();
        
        const select = document.getElementById('zonaSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar destino...</option>';
        allZonas.forEach(z => {
            const option = document.createElement('option');
            option.value = z.ZonaID;
            option.textContent = z.Nombre;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Load Zones error:", err);
    }
}

loadZonas();

/* --- COMENTADO TEMPORALMENTE PARA BYPASSEAR EL LOGIN ---
document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/dashboard', {
        credentials: 'include'
    });

    if (!res.ok) {
        //window.location.href = '/tecnico/login/login.html';
    }
});
------------------------------------------------------- */


/* --- HISTORIAL FUNCIONAL START --- */

let fullHistoryData = []; 

async function updateHistoryUI() {
    try {
        const response = await fetch('/api/historial'); 
        fullHistoryData = await response.json();

        // 1. Render Dashboard Preview
        renderPreview(fullHistoryData.slice(0, 4));

        // 2. Render Modal Table (apply current filters)
        applyFilters();

    } catch (error) {
        console.error("Error al cargar el historial:", error);
    }
}


/**
 * Llenar los select de Robot y Zonas desde la API
 */
async function populateFilters() {
    try {
        // Cargar nombres de Robots
        const resRobots = await fetch('/api/robots/names');
        const robotNames = await resRobots.json();
        const robotSelect = document.getElementById('filter-robot');
        if (robotSelect) {
            robotSelect.innerHTML = '<option value="">Robot</option>' + 
                robotNames.map(name => `<option value="${name}">${name}</option>`).join('');
        }

        // Cargar nombres de Zonas (Usamos la misma lista para Zona Actual y Destino)
        const resZonas = await fetch('/api/zonas/names');
        const zonaNames = await resZonas.json();
        
        const zonaActualSelect = document.getElementById('filter-zona');
        if (zonaActualSelect) {
            zonaActualSelect.innerHTML = '<option value="">Zona actual</option>' + 
                zonaNames.map(name => `<option value="${name}">${name}</option>`).join('');
        }

        const destinoSelect = document.getElementById('filter-destino');
        if (destinoSelect) {
            destinoSelect.innerHTML = '<option value="">Destino</option>' + 
                zonaNames.map(name => `<option value="${name}">${name}</option>`).join('');
        }
    } catch (err) {
        console.error("Error populating filters:", err);
    }
}

// Función para cambiar de página y refrescar la vista
window.changePage = (page, totalPages) => {
    if (page < 1 || page > totalPages) return; // Seguridad para no salir de rango
    currentPage = page;
    
    // Volvemos a aplicar filtros (esto llamará a renderTable con la nueva página)
    applyFilters(); 
};


function renderPreview(data) {
    const previewList = document.getElementById('history-preview-list');
    if (!previewList) return;
    previewList.innerHTML = data.map(log => `
        <div class="history-item-row">
            <div class="history-text-group">
                <span class="history-route-title">${log.Robot} → ${log.Destino}</span>
                <span class="history-sub-detail">
                    <i class="ph ph-clock"></i> ${Math.floor(log.Duracion / 60)}m ${log.Duracion % 60}s
                </span>
            </div>
            <div class="star-gold">${'★'.repeat(log.Valoracion)}${'☆'.repeat(5-log.Valoracion)}</div>
        </div>
    `).join('');
}

function applyFilters() {

    const robotFilter = document.getElementById('filter-robot').value;
    const destinoFilter = document.getElementById('filter-destino').value;
    const zonaFilter = document.getElementById('filter-zona').value;
    const valoracionFilter = document.getElementById('filter-valoracion').value;
    const dateFilter = document.getElementById('filter-date').value;

    const filtered = fullHistoryData.filter(log => {
        const matchRobot = robotFilter === "" || log.Robot === robotFilter;
        const matchDestino = destinoFilter === "" || log.Destino === destinoFilter;
        const matchZona = zonaFilter === "" || log.ZonaActual === zonaFilter;
        const matchValor = valoracionFilter === "" || log.Valoracion == valoracionFilter;
        // Lógica para la fecha
        let matchDate = true;
        if (dateFilter !== "") {
            const logDate = new Date(log.FechaHora).toISOString().split('T')[0];
            matchDate = logDate === dateFilter;
        }

        return matchRobot && matchDestino &&matchZona   &&matchValor && matchDate;
    });

    renderTable(filtered);
}
window.exportToCSV = () => {
    if (fullHistoryData.length === 0) return;
    
    // Convert filtered data to CSV string
    const headers = ["ID,Robot,Zona Actual,Destino,Fecha,Duracion,Valoracion,Comentario"];
    const rows = fullHistoryData.map(log => 
        `${log.InteraccionID},${log.Robot},${log.ZonaActual},${log.Destino},${log.FechaHora},${log.Duracion},${log.Valoracion},"${log.Comentario || ''}"`
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historial_roberto.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
/* --- LÓGICA DE PAGINACIÓN DINÁMICA --- */
let currentPage = 1;
const rowsPerPage = 10;

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = ''; 
        return;
    }

    // Botón Izquierdo
    let html = `<i class="ph ph-caret-left" onclick="changePage(${currentPage - 1}, ${totalPages})" style="cursor:pointer"></i>`;
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        html += `<span class="page-num ${i === currentPage ? 'active' : ''}" onclick="changePage(${i}, ${totalPages})">${i}</span>`;
    }
    
    // Botón Derecho
    html += `<i class="ph ph-caret-right" onclick="changePage(${currentPage + 1}, ${totalPages})" style="cursor:pointer"></i>`;
    
    container.innerHTML = html;
}
function renderTable(data) {
    const tableBody = document.getElementById('full-history-table-body');
    const stats = document.getElementById('table-stats');
    if (!tableBody) return;

    const total = data.length;

    // --- LÓGICA DE RECORTAR DATOS (Slicing) ---
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end); // Solo toma las 10 filas de esta página

    if (total === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px;">No se encontraron resultados</td></tr>`;
        if (stats) stats.innerText = "No hay interacciones";
        return;
    }

    // Dibujar las filas recortadas
    tableBody.innerHTML = paginatedData.map(log => `
        <tr>
            <td>${log.InteraccionID}</td>
            <td><strong>${log.Robot}</strong></td>
            <td>${log.ZonaActual}</td>
            <td>${log.Destino}</td>
            <td style="font-size: 0.85rem;">${new Date(log.FechaHora).toLocaleString()}</td>
            <td>${Math.floor(log.Duracion / 60)}m ${log.Duracion % 60}s</td>
            <td><span class="star-gold">${'★'.repeat(log.Valoracion)}${'☆'.repeat(5-log.Valoracion)}</span></td>
            <td style="color: #6b7280; font-size: 0.85rem;">${log.Comentario || 'Sin comentarios'}</td>
        </tr>
    `).join('');

    // Actualizar texto de estadísticas dinámicamente
    if (stats) {
        stats.innerText = `Mostrando ${start + 1} a ${Math.min(end, total)} de ${total} interacciones`;
    }

    renderPagination(total);
}

window.clearAllFilters = () => {
    document.getElementById('filter-robot').value = "";
    document.getElementById('filter-destino').value = "";
    document.getElementById('filter-zona').value = "";
    document.getElementById('filter-valoracion').value = "";
    if(document.getElementById('filter-date')) document.getElementById('filter-date').value = "";
    renderTable(fullHistoryData);
};

window.openHistoryModal = () => {
    document.getElementById('historyModal').style.display = 'flex';
};

window.closeHistoryModal = () => {
    document.getElementById('historyModal').style.display = 'none';
};

// Listen for changes on all filters
document.addEventListener('change', (e) => {
    if (e.target.id && e.target.id.startsWith('filter-')) {
        applyFilters();
    }
});

// INITIAL LOAD
document.addEventListener('DOMContentLoaded', () => {
    populateFilters(); // Llena los dropdowns desde la base de datos
    updateHistoryUI(); // Carga los datos de la tabla
});

/* --- HISTORIAL FUNCIONAL END --- */
