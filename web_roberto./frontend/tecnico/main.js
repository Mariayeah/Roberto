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

document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/dashboard', {
        credentials: 'include'
    });

    if (!res.ok) {
        //window.location.href = '/tecnico/login/login.html';
    }
});