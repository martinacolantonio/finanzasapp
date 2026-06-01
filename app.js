// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDUqV8qJ_rAgbGzbDyYFRSYbayP9kjZYg",
  authDomain: "finanzasapp-c5a87.firebaseapp.com",
  projectId: "finanzasapp-c5a87",
  storageBucket: "finanzasapp-c5a87.firebasestorage.app",
  messagingSenderId: "416253504177",
  appId: "1:416253504177:web:e9ac50c635c6919eb01090",
  measurementId: "G-LNS81RHGQC"
};


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Captura de Elementos
const transaccionForm = document.getElementById('transaccion-form');
const tablaCuerpo = document.getElementById('tabla-cuerpo');
const btnLogout = document.getElementById('btn-logout');
const btnVaciar = document.getElementById('btn-vaciar');
const selectPlanilla = document.getElementById('select-planilla');
const btnCrearPlanilla = document.getElementById('btn-crear-planilla');
const nuevaPlanillaInput = document.getElementById('nueva-planilla-nombre');

const balIngresos = document.getElementById('balance-ingresos');
const balGastos = document.getElementById('balance-gastos');
const balNeto = document.getElementById('balance-neto');
const tituloTabla = document.getElementById('titulo-tabla-planilla');

let usuarioActual = null;
let miGraficoPizza = null;
let planillaSeleccionada = "General"; 
let datosCompletosUser = {}; 

// Escucha del estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        escucharEstructuraMultiPlanilla(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Crear una nueva planilla de forma segura sin romper Firestore
if (btnCrearPlanilla) {
    btnCrearPlanilla.addEventListener('click', async () => {
        const nombre = nuevaPlanillaInput.value.trim();
        if (!nombre) return alert("Por favor, ingresá un nombre para la planilla.");
        
        if (nombre.includes('.') || nombre.includes('/') || nombre.includes('*')) {
            return alert("El nombre no puede incluir puntos, barras ni asteriscos.");
        }

        try {
            const userRef = db.collection("usuarios_gasto").doc(usuarioActual.uid);
            const docSnap = await userRef.get();

            let estructuraPlanillas = {};

            if (docSnap.exists && docSnap.data().planillas) {
                estructuraPlanillas = { ...docSnap.data().planillas };
            }
            
            if (estructuraPlanillas[nombre]) {
                return alert("Ese nombre de planilla ya existe.");
            }

            estructuraPlanillas[nombre] = { transacciones: [] };

            await userRef.set({
                planillas: estructuraPlanillas
            }, { merge: true });
            
            planillaSeleccionada = nombre;
            nuevaPlanillaInput.value = '';
            alert(`¡Planilla "${nombre}" creada de forma correcta!`);
        } catch (e) {
            console.error("Error al crear planilla: ", e);
            alert("Error de permisos en Firebase Database.");
        }
    });
}

// Cambiar de planilla activa
if (selectPlanilla) {
    selectPlanilla.addEventListener('change', (e) => {
        planillaSeleccionada = e.target.value;
        renderizarPlanillaActiva();
    });
}

// Registrar movimientos en la planilla seleccionada
if (transaccionForm) {
    transaccionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const concepto = document.getElementById('concept').value;
        const monto = parseFloat(document.getElementById('amount').value);
        const fechaManual = document.getElementById('date').value;
        const tipo = document.getElementById('type').value;
        const categoria = document.getElementById('category').value.trim();

        const partesFecha = fechaManual.split('-');
        const fechaFormateada = `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}`;
        
        const nuevoMovimiento = {
            id: Date.now(),
            concepto: concepto,
            monto: monto,
            tipo: tipo,
            categoria: tipo === 'ingreso' ? 'Ingreso' : categoria,
            fecha: fechaFormateada
        };

        try {
            const userRef = db.collection("usuarios_gasto").doc(usuarioActual.uid);
            
            const actuales = (datosCompletosUser.planillas && datosCompletosUser.planillas[planillaSeleccionada]) 
                ? datosCompletosUser.planillas[planillaSeleccionada].transacciones || [] : [];
            
            actuales.push(nuevoMovimiento);

            await userRef.set({
                planillas: {
                    [planillaSeleccionada]: { transacciones: actuales }
                }
            }, { merge: true });

            transaccionForm.reset();
            establecerFechaDeHoy();
        } catch (error) {
            console.error(error);
        }
    });
}

// Escucha en tiempo real de toda la estructura de planillas
function escucharEstructuraMultiPlanilla(userId) {
    db.collection("usuarios_gasto").doc(userId)
    .onSnapshot((docSnap) => {
        // Inicializa la primera planilla si la colección está vacía
        if (!docSnap.exists || !docSnap.data().planillas) {
            db.collection("usuarios_gasto").doc(userId).set({
                planillas: { "General": { transacciones: [] } }
            }, { merge: true });
            return;
        }

        datosCompletosUser = docSnap.data();
        
        // Renderizar el selector desplegable dinámico
        const listaPlanillas = Object.keys(datosCompletosUser.planillas);
        selectPlanilla.innerHTML = '';
        listaPlanillas.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.innerText = p;
            opt.selected = (p === planillaSeleccionada);
            selectPlanilla.appendChild(opt);
        });

        renderizarPlanillaActiva();
        renderizarPizzaGlobal(datosCompletosUser.planillas);
    });
}

// Pintar tabla e indicadores de la planilla activa
function renderizarPlanillaActiva() {
    if (!tablaCuerpo) return;
    tablaCuerpo.innerHTML = '';
    tituloTabla.innerText = `Historial: ${planillaSeleccionada}`;

    let inc = 0, gast = 0;
    const planilla = datosCompletosUser.planillas[planillaSeleccionada];
    
    if (planilla && planilla.transacciones) {
        planilla.transacciones.forEach(item => {
            const esGasto = item.tipo === 'gasto';
            if (esGasto) gast += item.monto; 
            else inc += item.monto;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.fecha}</td>
                <td style="font-weight:500;">${item.concepto}</td>
                <td><span class="badge bg-secondary">${item.categoria}</span></td>
                <td style="color:${esGasto ? '#dc3545':'#198754'}; font-weight:bold;">$${item.monto}</td>
                <td><button class="btn-borrar-item" data-id="${item.id}" style="background:none; border:none; cursor:pointer;">❌</button></td>
            `;
            tablaCuerpo.appendChild(tr);
        });
    }

    balIngresos.innerText = `$${inc}`;
    balGastos.innerText = `$${gast}`;
    balNeto.innerText = `$${inc - gast}`;

    // Evento para remover movimientos sueltos
    document.querySelectorAll('.btn-borrar-item').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idBorrar = parseFloat(btn.getAttribute('data-id'));
            const actuales = datosCompletosUser.planillas[planillaSeleccionada].transacciones;
            const filtrados = actuales.filter(t => t.id !== idBorrar);

            await db.collection("usuarios_gasto").doc(usuarioActual.uid).set({
                planillas: {
                    [planillaSeleccionada]: { transacciones: filtrados }
                }
            }, { merge: true });
        });
    });
}

// VINCULACIÓN: Une y calcula los porcentajes de todas las categorías en la pizza general
function renderizarPizzaGlobal(todasLasPlanillas) {
    const canvasElement = document.getElementById('graficoPizza');
    if (!canvasElement) return;

    let categoriasDinamicas = {};
    let totalGastosGlobal = 0;

    Object.keys(todasLasPlanillas).forEach(nombrePlanilla => {
        const transacciones = todasLasPlanillas[nombrePlanilla].transacciones || [];
        transacciones.forEach(item => {
            if (item.tipo === 'gasto') {
                totalGastosGlobal += item.monto;
                if (!categoriasDinamicas[item.categoria]) {
                    categoriasDinamicas[item.categoria] = 0;
                }
                categoriasDinamicas[item.categoria] += item.monto;
            }
        });
    });

    const etiquetas = Object.keys(categoriasDinamicas);
    const valores = etiquetas.map(cat => ((categoriasDinamicas[cat] / totalGastosGlobal) * 100).toFixed(1));

    // Paleta de colores rotativos HSL automáticos para que varíen siempre
    const colores = etiquetas.map((_, i) => `hsl(${(i * 360 / etiquetas.length) % 360}, 75%, 55%)`);

    if (miGraficoPizza) miGraficoPizza.destroy();

    miGraficoPizza = new Chart(canvasElement.getContext('2d'), {
        type: 'pie',
        data: {
            labels: etiquetas,
            datasets: [{
                data: valores,
                backgroundColor: colores,
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

// Borrar el contenido entero de una planilla
if (btnVaciar) {
    btnVaciar.addEventListener('click', async () => {
        if (confirm(`¿Estás seguro de vaciar por completo los movimientos de la planilla "${planillaSeleccionada}"?`)) {
            await db.collection("usuarios_gasto").doc(usuarioActual.uid).set({
                planillas: {
                    [planillaSeleccionada]: { transacciones: [] }
                }
            }, { merge: true });
        }
    });
}

if (btnLogout) { btnLogout.addEventListener('click', () => auth.signOut()); }

function establecerFechaDeHoy() {
    const inputFecha = document.getElementById('date');
    if (inputFecha) inputFecha.valueAsDate = new Date();
}
establecerFechaDeHoy();