/**
 * @file main.js
 * @description Gestión de la interfaz de valoración del servicio.
 * Permite al usuario calificar su experiencia mediante un sistema de estrellas
 * y enviar los datos de la misión junto con comentarios a la base de datos.
 * @author Mery
 * @version 1.0.0
 */
let rating = 0;

/**
 * Configura los eventos de interacción para el sistema de estrellas.
 * Al hacer clic, actualiza la variable global 'rating' y la apariencia visual.
 * @author Mery
 */
const stars = document.querySelectorAll("#stars span");

stars.forEach(star => {
  star.addEventListener("click", () => {
    rating = parseInt(star.dataset.value);

    stars.forEach((s, idx) => {
      s.classList.toggle("active", idx < rating);
    });
  });
});

/**
 * Gestiona el envío del formulario de feedback.
 * Valida la entrada, recopila los datos de la interacción y los envía a la API.
 * @author Mery
 * @async
 * @returns {Promise<void>}
 */
document.getElementById("finalizar").addEventListener("click", async () => {
  if (rating === 0) {
    alert("Por favor, selecciona una puntuación.");
    return;
  }

  const comentario = document.getElementById("comentario").value;

  const data = {
    robotId: 1,
    zonaActualId: 3,
    zonaDestinoId: 6,
    duracion: 195, // en segundos
    valoracion: rating,
    comentario: comentario || null
  };

  try {
    const res = await fetch("/api/valoracion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log(result);

    alert("Servicio finalizado. ¡Gracias por tu feedback!");

  } catch (error) {
    console.error(error);
    alert("Error al guardar, pero gracias por tu feedback.");
  }
});
