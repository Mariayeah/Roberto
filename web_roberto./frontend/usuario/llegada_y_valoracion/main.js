let rating = 0;

// ⭐ Star selection
const stars = document.querySelectorAll("#stars span");

stars.forEach(star => {
  star.addEventListener("click", () => {
    rating = parseInt(star.dataset.value);

    stars.forEach((s, idx) => {
      s.classList.toggle("active", idx < rating);
    });
  });
});

// 🚀 Finalizar Servicio
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
