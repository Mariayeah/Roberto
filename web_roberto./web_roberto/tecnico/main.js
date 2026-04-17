window.onload = () => {

    // ✅ ROS ONLY FOR MAP
    const ros = new ROSLIB.Ros({
        url: 'wss://solid-lizards-tie.loca.lt'
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
        fetch('/api/position')
            .then(res => res.json())
            .then(data => {
                if (!data.connected) {
                    console.log("⏳ Waiting for ROS...");
                    return;
                }

                robotMarker.x = data.x;
                robotMarker.y = -data.y;
            })
            .catch(err => {
                console.error("Error fetching position:", err);
            });
    }

    setInterval(updateRobotPosition, 500);
};