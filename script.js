// Mock Data and State
const state = {
    selectedClamId: 'clam-1',
    isAlerting: false,
    alertSource: null,
    clams: {
        'clam-1': { name: 'Clam Sensor 01', location: 'Downstream A', ph: 7.2, do: 8.5, hm: 0.01, turb: 12 },
        'clam-2': { name: 'Clam Sensor 02', location: 'Downstream B', ph: 7.1, do: 8.2, hm: 0.02, turb: 15 },
        'clam-3': { name: 'Clam Sensor 03', location: 'Downstream C', ph: 7.3, do: 8.0, hm: 0.01, turb: 10 },
        'clam-4': { name: 'Clam Sensor 04', location: 'Estuary / Main', ph: 7.4, do: 8.6, hm: 0.01, turb: 18 }
    },
    factories: {
        'factory-a': { name: 'Factory A', targetClam: 'clam-1' },
        'factory-b': { name: 'Factory B', targetClam: 'clam-2' },
        'factory-c': { name: 'Factory C', targetClam: 'clam-3' },
        'factory-d': { name: 'Factory D', targetClam: 'clam-4' }
    }
};

// DOM Elements
const elements = {
    phVal: document.getElementById('val-ph'),
    doVal: document.getElementById('val-do'),
    hmVal: document.getElementById('val-hm'),
    turbVal: document.getElementById('val-turb'),
    sysStatus: document.getElementById('sys-status'),
    sysStatusText: document.getElementById('sys-status-text')
};

// Initialize
function init() {
    // Add click listeners to clams
    document.querySelectorAll('.clam').forEach(clam => {
        clam.addEventListener('click', (e) => {
            selectClam(clam.id);
        });
    });

    // Initial Selection
    selectClam(state.selectedClamId);

    // Start random data fluctuation
    setInterval(fluctuateData, 2000);
    
    // Add initial log
    addLog('系統已初始化。人工蛤蜊監測網上線。', false);
}

// Select a clam to view its data
function selectClam(id) {
    // Update active class
    document.querySelectorAll('.clam').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    state.selectedClamId = id;
    updateDashboard();
}

// Update the right panel with selected clam's data
function updateDashboard() {
    const data = state.clams[state.selectedClamId];
    
    // Update values with some formatting
    elements.phVal.textContent = data.ph.toFixed(2);
    elements.doVal.textContent = data.do.toFixed(1);
    elements.hmVal.textContent = data.hm.toFixed(3);
    elements.turbVal.textContent = data.turb.toFixed(1);

    // Color code based on thresholds (mock thresholds)
    updateStatusClass(elements.phVal, data.ph, 6.5, 8.5); // pH safe range 6.5 - 8.5
    updateStatusClass(elements.doVal, data.do, 5.0, 20.0, true); // DO needs to be high
    updateStatusClass(elements.hmVal, data.hm, 0.0, 0.05); // Heavy metals should be low
    updateStatusClass(elements.turbVal, data.turb, 0, 30); // Turbidity should be low
}

function updateStatusClass(element, value, min, max, reverse = false) {
    element.className = 'metric-value';
    if (reverse) {
        if (value < min) element.classList.add('status-danger');
        else if (value < min + 2) element.classList.add('status-warn');
        else element.classList.add('status-good');
    } else {
        if (value < min || value > max) element.classList.add('status-danger');
        else if (value > max - (max*0.2) || value < min + (min*0.2)) element.classList.add('status-warn');
        else element.classList.add('status-good');
    }
}

// Slightly vary data to simulate real-time sensors
function fluctuateData() {
    if (state.isAlerting) return; // Don't fluctuate back to normal during alert
    
    Object.keys(state.clams).forEach(id => {
        const c = state.clams[id];
        c.ph += (Math.random() - 0.5) * 0.05;
        c.do += (Math.random() - 0.5) * 0.2;
        c.hm = Math.max(0, c.hm + (Math.random() - 0.5) * 0.002);
        c.turb = Math.max(0, c.turb + (Math.random() - 0.5) * 1);
        
        // Keep within reasonable bounds
        if(c.ph < 6) c.ph = 6; if(c.ph > 9) c.ph = 9;
        if(c.do < 4) c.do = 4; if(c.do > 12) c.do = 12;
    });

    if(!state.isAlerting) {
        updateDashboard();
    }
}

// Simulate Pollution Event
window.simulatePollution = function(factoryId) {
    if (state.isAlerting && state.alertSource === factoryId) return; // Ignore if already alerting for same factory
    
    if (state.isAlerting) {
        resetSystem(true); // Silent reset without logging
    }
    
    const factory = state.factories[factoryId];
    const targetClamId = factory.targetClam;
    const clam = state.clams[targetClamId];
    
    state.isAlerting = true;
    state.alertSource = factoryId;

    // Drastically change metrics for the affected clam
    clam.ph = 5.2; // Acidic
    clam.hm = 0.15; // High heavy metals
    clam.do = 3.5; // Low oxygen
    clam.turb = 85.0; // High turbidity

    // Visual Alert on map
    document.getElementById(targetClamId).classList.add('alert');
    
    // System status
    elements.sysStatus.classList.add('alert');
    elements.sysStatusText.textContent = '發現污染源！';
    
    // Auto-select the affected clam to show data
    selectClam(targetClamId);
    
    // Log event
    const time = new Date().toLocaleTimeString();
    const msg = `嚴重水質異常警告！位於 <strong>${clam.name}</strong> 檢測到水質急遽惡化。軌跡推算污染源極可能來自 <strong>${factory.name}</strong>。`;
    addLog(msg, true);
}

// Reset System
window.resetSystem = function(silent = false) {
    state.isAlerting = false;
    state.alertSource = null;
    
    // Reset Data
    state.clams['clam-1'] = { name: 'Clam Sensor 01', location: 'Downstream A', ph: 7.2, do: 8.5, hm: 0.01, turb: 12 };
    state.clams['clam-2'] = { name: 'Clam Sensor 02', location: 'Downstream B', ph: 7.1, do: 8.2, hm: 0.02, turb: 15 };
    state.clams['clam-3'] = { name: 'Clam Sensor 03', location: 'Downstream C', ph: 7.3, do: 8.0, hm: 0.01, turb: 10 };
    state.clams['clam-4'] = { name: 'Clam Sensor 04', location: 'Estuary / Main', ph: 7.4, do: 8.6, hm: 0.01, turb: 18 };
    
    // Reset visuals
    document.querySelectorAll('.clam').forEach(c => c.classList.remove('alert'));
    elements.sysStatus.classList.remove('alert');
    elements.sysStatusText.textContent = '系統監控中';
    
    updateDashboard();
    if (!silent) {
        addLog('系統已重置。恢復正常監測。', false);
    }
}

function addLog(message, isAlert) {
    const toast = document.createElement('div');
    toast.className = `toast-msg ${isAlert ? 'alert' : ''}`;
    
    const time = new Date().toLocaleTimeString();
    
    toast.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.3rem;">${time}</div>
        <div style="line-height: 1.4;">${message}</div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove toast after 6 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 6000);
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
