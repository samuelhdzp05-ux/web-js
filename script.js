// Referencias al DOM 
const formulario = document.getElementById("formulario");
const buscador = document.getElementById("buscador");
const tabla = document.getElementById("tabla");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton");
const campoId = document.getElementById("id");

// Array de usuarios (objetos { id, nombre, correo, ciudad })
let usuarios = [];

// Id del usuario que se está editando (null si se está agregando)
let idEditando = null;

// Mensajes 
const mostrarMensaje = (texto) => {
  mensaje.textContent = texto;
};

// Dibujar la tabla con la lista recibida 
const dibujarTabla = (lista) => {
  tabla.innerHTML = "";

  lista.forEach((usuario) => {
    // Destructuring para extraer los campos
    const { id, nombre, correo, ciudad } = usuario;

    // Template string para armar la fila
    tabla.innerHTML += `
      <tr>
        <td>${id}</td>
        <td>${nombre}</td>
        <td>${correo}</td>
        <td>${ciudad}</td>
        <td>
          <button class="editar" data-id="${id}">Editar</button>
          <button class="eliminar" data-id="${id}">Eliminar</button>
        </td>
      </tr>`;
  });
};

// Se llama cada vez que cambia la lista: imprime en consola y redibuja
const actualizarLista = () => {
  console.log(JSON.stringify(usuarios));
  dibujarTabla(usuarios);
  contarPorCiudad();
};

//  Bucle: cuenta cuántos usuarios hay por ciudad (se muestra en consola) 
const contarPorCiudad = () => {
  const conteo = {};
  for (const { ciudad } of usuarios) {
    conteo[ciudad] = (conteo[ciudad] || 0) + 1;
  }
  console.log("Usuarios por ciudad:", conteo);
};

//  Cargar usuarios desde la API
const cargarUsuarios = async () => {
  mostrarMensaje("Cargando...");
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const datos = await res.json();

    // map: nos quedamos solo con los campos que necesitamos
    usuarios = datos.map((u) => ({
      id: u.id,
      nombre: u.name,
      correo: u.email,
      ciudad: u.address.city,
    }));

    mostrarMensaje("Usuarios cargados.");
    actualizarLista();
  } catch (error) {
    mostrarMensaje("No se pudieron cargar los usuarios. Intenta de nuevo más tarde.");
  }
};

//  Validar el formulario: devuelve un código de resultado 
const validar = ({ id, nombre, correo, ciudad }) => {
  if (id === "" || nombre === "" || correo === "" || ciudad === "") return "vacio";
  if (isNaN(id)) return "idNoNumero";
  if (!correo.includes("@")) return "correoInvalido";
  // Al agregar, el id no debe existir (incluye los de la API)
  if (idEditando === null && usuarios.some((u) => u.id === Number(id))) return "idRepetido";
  return "ok";
};

//  Enviar formulario (agregar o modificar) 
formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const datos = {
    id: campoId.value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
  };

  // Elegimos el mensaje según el resultado de la validación
  const resultado = validar(datos);
  switch (resultado) {
    case "vacio":
      mostrarMensaje("Todos los campos son obligatorios.");
      return;
    case "idNoNumero":
      mostrarMensaje("El id debe ser un número.");
      return;
    case "correoInvalido":
      mostrarMensaje("El correo debe contener '@'.");
      return;
    case "idRepetido":
      mostrarMensaje(`Ya existe un usuario con el id ${datos.id}`);
      return;
  }

  const usuario = { ...datos, id: Number(datos.id) };

  if (idEditando === null) {
    usuarios.push(usuario);
    mostrarMensaje(`Usuario ${usuario.nombre} agregado.`);
  } else {
    // Buscamos el usuario por su id y lo reemplazamos
    const posicion = usuarios.findIndex((u) => u.id === idEditando);
    usuarios[posicion] = usuario;
    mostrarMensaje(`Usuario ${usuario.nombre} modificado.`);
  }

  // Limpiar formulario y volver al modo "Agregar"
  formulario.reset();
  campoId.disabled = false;
  boton.textContent = "Agregar";
  idEditando = null;

  buscador.value = "";
  actualizarLista();
});

// Búsqueda en vivo con filter (no modifica el array original) 
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  const filtrados = usuarios.filter((u) => u.nombre.toLowerCase().includes(texto));
  dibujarTabla(filtrados);
});

//  Editar y Eliminar (delegación de eventos sobre el tbody) 
tabla.addEventListener("click", (event) => {
  const id = Number(event.target.dataset.id);

  if (event.target.classList.contains("editar")) {
    const { nombre, correo, ciudad } = usuarios.find((u) => u.id === id);
    campoId.value = id;
    document.getElementById("nombre").value = nombre;
    document.getElementById("correo").value = correo;
    document.getElementById("ciudad").value = ciudad;
    campoId.disabled = true; // el id no se puede cambiar
    boton.textContent = "Guardar cambios";
    idEditando = id;
  }

  if (event.target.classList.contains("eliminar")) {
    if (confirm("¿Seguro que quieres eliminar este usuario?")) {
      usuarios = usuarios.filter((u) => u.id !== id);
      mostrarMensaje(`Usuario con id ${id} eliminado.`);
      actualizarLista();
    }
  }
});

//  Inicio 
cargarUsuarios();
