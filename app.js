// ==========================================
// CAPTURA DE ELEMENTOS DEL DOM
// ==========================================
const transaccionForm = document.getElementById('transaction-form');
const listaTransacciones = document.getElementById('transactions-list');
const balanceIngresos = document.getElementById('balance-ingresos');
const balanceGastos = document.getElementById('balance-gastos');
const balanceNeto = document.getElementById('balance-neto');
const botonesFiltro = document.querySelectorAll('.btn-filtro');
const botonesTab = document.querySelectorAll('.nav-link-item');
const seccionesTab = document.querySelectorAll('.tab-content');

// Elementos de Estadísticas, Configuración y Nuevas Herramientas
const txtGastoMaximo = document.getElementById('gasto-maximo');
const txtGastoPromedio = document.getElementById('gasto-promedio');
const inputLimite = document.getElementById('input-limite');
const btnGuardarConfig = document.getElementById('btn-guardar-config');
const alertaPresupuesto = document.getElementById('alerta-presupuesto');
const inputFecha = document.getElementById('date');
const btnVaciarTodo = document.getElementById('btn-vaciar-todo');
const selectMoneda = document.getElementById('select-moneda');
const inputDolar = document.getElementById('input-dolar');
const btnGuardarDolar = document.getElementById('btn-guardar-dolar');

// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================
let transacciones = JSON.parse(localStorage.getItem('finanzas_datos')) || [];
let limiteGastos = parseFloat(localStorage.getItem('finanzas_limite')) || 0;
let valorDolar = parseFloat(localStorage.getItem('finanzas_dolar')) || 1000;
let filtroActual = 'todos';
let monedaActual = 'ARS'; // Puede ser ARS o USD

// Dejar la fecha de hoy marcada por defecto en el formulario
inputFecha.value = new Date().toISOString().split('T')[0];
if (limiteGastos > 0) inputLimite.value = limiteGastos;
inputDolar.value = valorDolar;

// ==========================================
// LOGICA DE INTERCAMBIO DE PESTAÑAS (TABS)
// ==========================================
botonesTab.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesTab.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const tabObjetivo = e.target.getAttribute('data-tab');
        seccionesTab.forEach(seccion => {
            if (seccion.id === tabObjetivo) seccion.classList.remove('d-none');
            else seccion.classList.add('d-none');
        });

        if (tabObjetivo === 'tab-estadisticas') calcularEstadisticas();
    });
});

// ==========================================
// HERRAMIENTA B: FUNCIÓN CONVERSORA DE DIVISAS
// ==========================================
const formatearMoneda = (monto) => {
    if (monedaActual === 'USD') {
        const convertido = monto / valorDolar;
        return `US$ ${convertido.toFixed(2)}`;
    }
    return `$${monto}`;
};

// ==========================================
// CÁLCULOS MATEMÁTICOS Y CONTADORES
// ==========================================
const actualizarContadores = () => {
    const ingresosTotales = transacciones
        .filter(item => item.tipo === 'ingreso')
        .reduce((sum, item) => sum + item.monto, 0);

    const gastosTotales = transacciones
        .filter(item => item.tipo === 'gasto')
        .reduce((sum, item) => sum + item.monto, 0);

    // Formateamos los textos dinámicamente según la moneda elegida
    balanceIngresos.textContent = formatearMoneda(ingresosTotales);
    balanceGastos.textContent = formatearMoneda(gastosTotales);
    balanceNeto.textContent = formatearMoneda(ingresosTotales - gastosTotales);

    if (limiteGastos > 0 && gastosTotales > limiteGastos) {
        alertaPresupuesto.classList.remove('d-none');
    } else {
        alertaPresupuesto.classList.add('d-none');
    }
};

const calcularEstadisticas = () => {
    const listaGastos = transacciones.filter(item => item.tipo === 'gasto');

    if (listaGastos.length === 0) {
        txtGastoMaximo.textContent = formatearMoneda(0);
        txtGastoPromedio.textContent = formatearMoneda(0);
        return;
    }

    const montos = listaGastos.map(g => g.monto);
    const maximo = Math.max(...montos);
    txtGastoMaximo.textContent = formatearMoneda(maximo);

    const FraserSuma = montos.reduce((sum, val) => sum + val, 0);
    const promedio = FraserSuma / listaGastos.length;
    txtGastoPromedio.textContent = formatearMoneda(promedio);
};

// ==========================================
// RENDERIZADO DEL HISTORIAL Y HERRAMIENTA A (SORT BY DATE)
// ==========================================
const renderizarTabla = () => {
    listaTransacciones.innerHTML = ''; 

    // HERRAMIENTA A: Ordenar el array por fecha de la más nueva a la más vieja antes de filtrar
    transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const transaccionesFiltradas = transacciones.filter(item => {
        if (filtroActual === 'todos') return true;
        return item.tipo === filtroActual;
    });

    transaccionesFiltradas.forEach((item) => {
        const tr = document.createElement('tr');
        const colorMonto = item.tipo === 'ingreso' ? 'text-success fw-bold' : 'text-danger fw-bold';
        const badge = item.tipo === 'ingreso' ? 'bg-success' : 'bg-danger';

        // Formatear fecha para que quede más linda a la vista (DD/MM/AAAA)
        const [anio, mes, dia] = item.fecha.split('-');
        const fechaFormateada = `${dia}/${mes}/${anio}`;

        tr.innerHTML = `
            <td><small class="text-muted">${fechaFormateada}</small></td>
            <td>${item.concepto}</td>
            <td><span class="badge ${badge}">${item.tipo.toUpperCase()}</span></td>
            <td class="${colorMonto}">${formatearMoneda(item.monto)}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary btn-eliminar" data-id="${item.id}">Eliminar</button>
            </td>
        `;
        listaTransacciones.appendChild(tr);
    });

    asignarEventosEliminar();
};

const guardarEnStorage = () => {
    localStorage.setItem('finanzas_datos', JSON.stringify(transacciones));
};

// ==========================================
// CAPTURA DE EVENTOS Y ENVÍOS
// ==========================================
transaccionForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const nuevaTransaccion = {
        id: Date.now(),
        concepto: document.getElementById('concept').value,
        monto: parseFloat(document.getElementById('amount').value),
        fecha: document.getElementById('date').value, // Guardamos la fecha elegida
        tipo: document.getElementById('type').value
    };

    transacciones.push(nuevaTransaccion);

    guardarEnStorage();
    renderizarTabla();
    actualizarContadores();
    
    // Reseteamos el form pero mantenemos la fecha de hoy marcada
    transaccionForm.reset(); 
    inputFecha.value = new Date().toISOString().split('T')[0];
});

const asignarEventosEliminar = () => {
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const idParaEliminar = parseInt(e.target.getAttribute('data-id'));
            transacciones = transacciones.filter(item => item.id !== idParaEliminar);
            
            guardarEnStorage();
            renderizarTabla();
            actualizarContadores();
            calcularEstadisticas();
        });
    });
};

// Filtros de la lista
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesFiltro.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filtroActual = e.target.getAttribute('data-filter');
        renderizarTabla();
    });
});

// Evento para cambiar de divisa (ARS / USD)
selectMoneda.addEventListener('change', (e) => {
    monedaActual = e.target.value;
    renderizarTabla();
    actualizarContadores();
});

// Actualizar cotización del dólar
btnGuardarDolar.addEventListener('click', () => {
    valorDolar = parseFloat(inputDolar.value) || 1000;
    localStorage.setItem('finanzas_dolar', valorDolar);
    renderizarTabla();
    actualizarContadores();
    alert('Cotización del dólar actualizada.');
});

// Guardar configuración del límite de presupuesto
btnGuardarConfig.addEventListener('click', () => {
    limiteGastos = parseFloat(inputLimite.value) || 0;
    localStorage.setItem('finanzas_limite', limiteGastos);
    actualizarContadores();
    alert('¡Límite de presupuesto guardado!');
});

// ==========================================
// HERRAMIENTA C: LOGICA DE VACIAR TODO
// ==========================================
btnVaciarTodo.addEventListener('click', () => {
    // Usamos confirm() para pedir validación lógica antes de borrar
    const confirmacion = confirm('¿Estás completamente seguro de que querés borrar TODO el historial? Esta acción no se puede deshacer.');
    
    if (confirmacion) {
        transacciones = []; // Vaciamos el array por completo
        localStorage.removeItem('finanzas_datos'); // Limpiamos el localStorage
        renderizarTabla();
        actualizarContadores();
        alert('Historial borrado con éxito.');
    }
});

// ==========================================
// ARRANQUE INICIAL
// ==========================================
renderizarTabla();
actualizarContadores();