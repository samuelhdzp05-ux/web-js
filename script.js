// Samuel Hernández y Diego Tovar

// Selección de elementos del DOM necesarios para la interfaz
const formulario = document.getElementById("formulario");
const buscador = document.getElementById("buscador");
const tabla = document.getElementById("tabla");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton");
const campoId = document.getElementById("id");

// Variables de estado para almacenar los usuarios y el ID del registro en edición
let usuarios = [];
let idEditando = null;

// Función para mostrar mensajes informativos o de error en pantalla
const mostrarMensaje = (texto) => {
  mensaje.textContent = texto;
};

// Función para renderizar y actualizar dinámicamente las filas de la tabla con los usuarios
const dibujarTabla = (lista) => {
  tabla.innerHTML = "";

  lista.forEach((usuario) => {
    const { id, nombre, correo, ciudad } = usuario;

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

// Función para actualizar la vista de la tabla y ejecutar los conteos en consola
const actualizarLista = () => {
  console.log(JSON.stringify(usuarios));
  dibujarTabla(usuarios);
  contarPorCiudad();
};

// Función para calcular y mostrar en consola cuántos usuarios hay por cada ciudad
const contarPorCiudad = () => {
  const conteo = {};
  for (const { ciudad } of usuarios) {
    conteo[ciudad] = (conteo[ciudad] || 0) + 1;
  }
  console.log("Usuarios por ciudad:", conteo);
};

// Función asíncrona para obtener los usuarios iniciales desde la API pública
const cargarUsuarios = async () => {
  mostrarMensaje("Cargando...");
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const datos = await res.json();

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

// Función para validar que los datos ingresados en el formulario sean correctos
const validar = ({ id, nombre, correo, ciudad }) => {
  if (id === "" || nombre === "" || correo === "" || ciudad === "") return "vacio";
  if (isNaN(id)) return "idNoNumero";
  if (!correo.includes("@")) return "correoInvalido";
  if (idEditando === null && usuarios.some((u) => u.id === Number(id))) return "idRepetido";
  return "ok";
};

// Evento para manejar el envío del formulario (tanto para agregar como para modificar usuarios)
formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const datos = {
    id: campoId.value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
  };

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

  // Condicional para saber si se está creando un usuario nuevo o editando uno existente
  if (idEditando === null) {
    usuarios.push(usuario);
    mostrarMensaje(`Usuario ${usuario.nombre} agregado.`);
  } else {
    const posicion = usuarios.findIndex((u) => u.id === idEditando);
    const usuarioActual = usuarios[posicion];

    // Validación extra para comprobar si los datos se mantuvieron iguales al editar
    if (
      usuarioActual.nombre === usuario.nombre &&
      usuarioActual.correo === usuario.correo &&
      usuarioActual.ciudad === usuario.ciudad
    ) {
      mostrarMensaje("No se realizaron cambios en el usuario.");
    } else {
      usuarios[posicion] = usuario;
      mostrarMensaje(`Usuario ${usuario.nombre} modificado.`);
    }
  }

  formulario.reset();
  campoId.disabled = false;
  boton.textContent = "REGISTRAR";

  buscador.value = "";
  actualizarLista();
});

// Evento para filtrar los usuarios en tiempo real según el texto ingresado en el buscador
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  const filtrados = usuarios.filter((u) => u.nombre.toLowerCase().includes(texto));
  dibujarTabla(filtrados);
});

// Evento para capturar los clics en la tabla y determinar si se desea editar o eliminar un usuario
tabla.addEventListener("click", (event) => {
  const id = Number(event.target.dataset.id);

  // Lógica para cargar los datos en el formulario al presionar el botón "Editar"
  if (event.target.classList.contains("editar")) {
    const { nombre, correo, ciudad } = usuarios.find((u) => u.id === id);
    campoId.value = id;
    document.getElementById("nombre").value = nombre;
    document.getElementById("correo").value = correo;
    document.getElementById("ciudad").value = ciudad;
    campoId.disabled = true;
    boton.textContent = "Guardar cambios";
    idEditando = id;
  }

  // Lógica para confirmar y eliminar un usuario al presionar el botón "Eliminar"
  if (event.target.classList.contains("eliminar")) {
    if (confirm("¿Seguro que quieres eliminar este usuario?")) {
      usuarios = usuarios.filter((u) => u.id !== id);
      mostrarMensaje(`Usuario con id ${id} eliminado.`);
      actualizarLista();
    }
  }
});

// Llamada inicial para cargar los usuarios al abrir la página
cargarUsuarios();
