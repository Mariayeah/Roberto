export function initOdom(ros) {
    const odom = new ROSLIB.Topic({
        ros: ros,
        name: '/odom',
        messageType: 'nav_msgs/msg/Odometry'
    });

    odom.subscribe(msg => {
        document.getElementById("pos_x").textContent =
            msg.pose.pose.position.x.toFixed(2);

        document.getElementById("pos_y").textContent =
            msg.pose.pose.position.y.toFixed(2);
    });
}