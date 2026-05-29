const transaccionForm = document.getElementById('transaction-form');
const listaTransacciones = document.getElementById('transactions-list');
const balanceIngresos = document.getElementById('balance-ingresos');
const balanceGastos = document.getElementById('balance-gastos');
const balanceNeto = document.getElementById('balance-neto');

let transacciones = [];

const actualizarPantalla = () => {
    let ingresos = 0;
    let gastos = 0;

    transacciones.forEach(item => {
        if (item.tipo === 'ingreso') ingresos += item.monto;
        else gastos += item.monto;
    });

    balanceIngresos.textContent = `$${ingresos}`;
    balanceGastos.textContent = `$${gastos}`;
    balanceNeto.textContent = `$${ingresos - gastos}`;
};

const renderizarTabla = () => {
    listaTransacciones.innerHTML = ''; 
    transacciones.forEach((item, index) => {
        const tr = document.createElement('tr');
        const colorMonto = item.tipo === 'ingreso' ? 'text-success fw-bold' : 'text-danger fw-bold';
        const badge = item.tipo === 'ingreso' ? 'bg-success' : 'bg-danger';

        tr.innerHTML = `
            <td>${item.concepto}</td>
            <td><span class="badge ${badge}">${item.tipo.toUpperCase()}</span></td>
            <td class="${colorMonto}">$${item.monto}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="eliminarItem(${index})">Eliminar</button>
            </td>
        `;
        listaTransacciones.appendChild(tr);
    });
};

transaccionForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    transacciones.push({
        concepto: document.getElementById('concept').value,
        monto: parseFloat(document.getElementById('amount').value),
        tipo: document.getElementById('type').value
    });
    renderizarTabla();
    actualizarPantalla();
    transaccionForm.reset(); 
});

window.eliminarItem = (index) => {
    transacciones.splice(index, 1);
    renderizarTabla();
    actualizarPantalla();
};