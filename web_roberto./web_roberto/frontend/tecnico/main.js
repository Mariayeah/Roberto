window.onload = () => {

    // ✅ ROS ONLY FOR MAP
    const ros = new ROSLIB.Ros({
        url: `ws://${window.location.hostname}:9090`
    });

    ros.on('connection', () => {
        console.log('Connected to ROS (map only)');
    });

    ros.on('error', (error) => {
        console.error('ROS error:', error);
    });

    // -----------------------------
    // CREATE VIEWER
    // -----------------------------
    const mapDiv = document.getElementById('map-canvas');

    const viewer = new ROS2D.Viewer({
        divID: 'map-canvas',
        width: mapDiv.clientWidth || 600,
        height: mapDiv.clientHeight || 400
    });

    // -----------------------------
    // LOAD MAP (needs ROS)
    // -----------------------------
    const gridClient = new ROS2D.OccupancyGridClient({
        ros: ros,
        rootObject: viewer.scene
    });

    gridClient.on('change', () => {
        console.log("Map received");

        viewer.scaleToDimensions(
            gridClient.currentGrid.width,
            gridClient.currentGrid.height
        );

        viewer.shift(
            gridClient.currentGrid.pose.position.x,
            gridClient.currentGrid.pose.position.y
        );
    });

    // -----------------------------
    // ROBOT LAYER
    // -----------------------------
    const robotLayer = new createjs.Container();
    viewer.scene.addChild(robotLayer);

    const robotMarker = new createjs.Shape();
    robotMarker.graphics.beginFill("blue").drawCircle(0, 0, 5);
    robotMarker.scaleX = 0.03;
    robotMarker.scaleY = 0.03;
    robotLayer.addChild(robotMarker);

    // -----------------------------
    // GET POSITION FROM SERVER
    // -----------------------------
    function updateRobotPosition() {
        fetch('/api/robots')
            .then(res => res.json())
            .then(resData => {
                if (!resData.success || !resData.data.robots.length) {
                    console.log("⏳ Waiting for DB robots...");
                    return;
                }
                
                // Usando el primer robot como ejemplo temporal
                const robot = resData.data.robots[0];
                // Idealmente deberíamos leer PosX y PosY, o el estatus. Roberto.sql indica % de Batería. 
                // Por ahora no re-escribimos toda la lógica del DOM para no romper, pero
                // actualizamos la X/Y temporal base.
                robotMarker.x = 0; // Podrías enlazarlo a la tabla PosicionRobot en logica.js en el futuro
                robotMarker.y = 0;
                
                // Actualizar UI del robot activo en el menú (Simulación ligera de consumo de DB)
                const batteryStat = document.querySelector('.battery-status span');
                if (batteryStat) batteryStat.textContent = `${robot.Bateria}%`;
            })
            .catch(err => {
                console.error("Error fetching position:", err);
            });
    }

    setInterval(updateRobotPosition, 500);
};