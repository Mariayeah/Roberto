export function initCage(ros) {

    const btnOn = document.getElementById("btn_cage_on");
    const btnOff = document.getElementById("btn_cage_off");
    const btnStart = document.getElementById("btn_cage_start");
    const status = document.getElementById("cage_status");

    // Publisher (ajusta el topic si usas otro)
    const cagePub = new ROSLIB.Topic({
        ros: ros,
        name: '/cage_control',
        messageType: 'std_msgs/msg/String'
    });

    function publishCommand(cmd) {
        const msg = new ROSLIB.Message({
            data: cmd
        });
        cagePub.publish(msg);
    }

    // Activar jaula
    btnOn.onclick = () => {
        publishCommand("ON");
        status.textContent = "Activada";
        status.className = "text-warning";

        btnStart.disabled = false;
    };

    // Desactivar jaula
    btnOff.onclick = () => {
        publishCommand("OFF");
        status.textContent = "Desactivada";
        status.className = "text-secondary";

        btnStart.disabled = true;
    };

    // Iniciar marcha dentro de la jaula
    btnStart.onclick = () => {
        publishCommand("START");
        status.textContent = "En movimiento";
        status.className = "text-success";
    };
}