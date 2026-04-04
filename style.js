// Almacenamiento de datos por motor
const motorsData = {}; // { motorId: { measurements: [], chart: null } }

// Motores predefinidos
const predefinedMotors = ['M1', 'M2', 'M3', 'M4'];

let currentMotorId = null;
let availableMotorsChart = null;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    initPredefinedMotors();
    updateAvailableMotors();
    setupEventListeners();
});

function initPredefinedMotors() {
    predefinedMotors.forEach(id => {
        motorsData[id] = {
            name: `Motor ${id}`,
            measurements: [],
            chart: null
        };
    });
}

function setupEventListeners() {
    document.getElementById('currentInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCurrentMeasurement();
    });
}

// 🏭 GESTIÓN DE MOTORES
function addMotor() {
    const nameInput = document.getElementById('newMotorName');
    const name = nameInput.value.trim().toUpperCase();
    
    if (!name) {
        alert('⚠️ Ingresa un nombre para el motor');
        return;
    }
    
    if (motorsData[name]) {
        alert('⚠️ Este motor ya existe');
        return;
    }
    
    motorsData[name] = {
        name: nameInput.value.trim(),
        measurements: [],
        chart: null
    };
    
    nameInput.value = '';
    updateAvailableMotors();
    updateMotorSelect();
    console.log(`✅ Motor agregado: ${name}`);
}

function removeMotor() {
    const select = document.getElementById('currentMotorSelect');
    const motorId = select.value;
    
    if (!motorId || !confirm(`¿Eliminar todas las mediciones del ${motorsData[motorId]?.name || 'motor seleccionado'}?`)) {
        return;
    }
    
    // Remover tab si está activo
    const tab = document.querySelector(`[data-motor="${motorId}"]`);
    if (tab) tab.remove();
    
    delete motorsData[motorId];
    updateAvailableMotors();
    updateMotorSelect();
    if (currentMotorId === motorId) {
        currentMotorId = null;
        document.getElementById('currentMotorSelect').value = '';
    }
}

function updateAvailableMotors() {
    const container = document.getElementById('availableMotors');
    container.innerHTML = `
        ${Object.keys(motorsData).map(id => `
            <div class="motor-tag ${currentMotorId === id ? 'active' : ''}" 
                 onclick="selectMotor('${id}')">
                ${motorsData[id].name}
            </div>
        `).join('')}
    `;
}

function updateMotorSelect() {
    const select = document.getElementById('currentMotorSelect');
    select.innerHTML = '<option value="">-- Selecciona un motor --</option>' +
        Object.keys(motorsData).map(id => 
            `<option value="${id}">${motorsData[id].name}</option>`
        ).join('');
}

// 🔄 NAVEGACIÓN ENTRE MOTORES
function selectMotor(motorId) {
    document.getElementById('currentMotorSelect').value = motorId;
    switchMotor(motorId);
}

function switchMotor(motorId) {
    if (currentMotorId === motorId) return;
    
    currentMotorId = motorId;
    updateAvailableMotors();
    
    if (motorId) {
        updateMotorTabs();
        showMotorTab(motorId);
    }
}

// 📊 MEDICIONES
function addCurrentMeasurement() {
    if (!currentMotorId) {
        alert('⚠️ Selecciona un motor primero');
        return;
    }
    
    const motorData = motorsData[currentMotorId];
    const currentInput = document.getElementById('currentInput');
    const current = parseFloat(currentInput.value);
    
    if (isNaN(current) || current < 0) {
        alert('⚠️ Corriente inválida');
        return;
    }
    
    const timestamp = new Date().toLocaleString('es-ES');
    motorData.measurements.unshift({
        timestamp,
        current
    });
    
    currentInput.value = '';
    updateMotorDashboard(currentMotorId);
    console.log(`📊 ${motorData.name}: ${current.toFixed(2)}A`);
}

function updateMotorDashboard(motorId) {
    const motorData = motorsData[motorId];
    updateMotorTabs();
    showMotorTab(motorId);
}

// 🖥️ INTERFACE TABS
function updateMotorTabs() {
    const tabsContainer = document.getElementById('motorTabs');
    const contentsContainer = document.getElementById('motorContents');
    
    tabsContainer.innerHTML = Object.keys(motorsData).map(id => `
        <button class="tab ${currentMotorId === id ? 'active' : ''}" 
                data-motor="${id}" onclick="showMotorTab('${id}')">
            ${motorsData[id].name} (${motorsData[id].measurements.length})
        </button>
    `).join('');
}

function showMotorTab(motorId) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activar tab seleccionado
    document.querySelector(`[data-motor="${motorId}"]`).classList.add('active');
    
    // Crear/contenido del tab si no existe
    let content = document.querySelector(`#tab-content-${motorId}`);
    if (!content) {
        content = createMotorContent(motorId);
        document.getElementById('motorContents').appendChild(content);
    }
    
    content.classList.add('active');
    currentMotorId = motorId;
    updateAvailableMotors();
}

function createMotorContent(motorId) {
    const motorData = motorsData[motorId];
    
    const container = document.createElement('div');
    container.id = `tab-content-${motorId}`;
    container.className = 'tab-content motor-dashboard';
    
    container.innerHTML = `
        <div>
            <h3>${motorData.name}</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3 id="total-${motorId}">0</h3>
                    <p>Total Mediciones</p>
                </div>
                <div class="stat-card">
                    <h3 id="avg-${motorId}">0.00 A</h3>
                    <p>Promedio</p>
                </div>
                <div class="stat-card">
                    <h3 id="max-${motorId}">0.00 A</h3>
                    <p>Máximo</p>
                </div>
                <div class="stat-card">
                    <h3 id="min-${motorId}">-- A</h3>
                    <p>Mínimo</p>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="chart-${motorId}"></canvas>
            </div>
            <div style="text-align: center; margin: 20px 0;">
                <button onclick="exportMotor('${motorId}')" style="padding: 12px 24px; font-size: 16px;">
                    💾 Exportar ${motorData.name} a Excel
                </button>
                <button onclick="clearMotorMeasurements('${motorId}')" class="danger" 
                        style="margin-left: 10px; padding: 12px 24px;">
                    🗑️ Limpiar Mediciones
                </button>
            </div>
        </div>
        <div class="measurements-list">
            <h4>📋 Últimas 15 Mediciones</h4>
            <div id="measurements-${motorId}"></div>
        </div>
    `;
    
    // Inicializar gráfico después de insertar en DOM
    setTimeout(() => initMotorChart(motorId), 100);
    
    return container;
}

function initMotorChart(motorId) {
    const canvas = document.getElementById(`chart-${motorId}`);
    if (!canvas || motorsData[motorId].chart) return;
    
    const ctx = canvas.getContext('2d');
    motorsData[motorId].chart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{
            label: `Corriente (${motorsData[motorId].name})`,
            data: [],
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5
        }]},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
    
    updateMotorStats(motorId);
}

function updateMotorStats(motorId) {
    const motorData = motorsData[motorId];
    const measurements = motorData.measurements;
    
    // Actualizar estadísticas
    document.getElementById(`total-${motorId}`).textContent = measurements.length;
    }