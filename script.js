// Mock Data and State
const state = {
    selectedClamId: 'clam-1',
    isAlerting: false,
    alertSource: null,
    clams: {
        'clam-1': { name: 'Clam Sensor 01', location: 'Downstream A', closure: 12.0, ph: 7.2, do: 8.5, ec: 310, turb: 12 },
        'clam-2': { name: 'Clam Sensor 02', location: 'Downstream B', closure: 8.5, ph: 7.1, do: 8.2, ec: 290, turb: 15 },
        'clam-3': { name: 'Clam Sensor 03', location: 'Downstream C', closure: 15.2, ph: 7.3, do: 8.0, ec: 330, turb: 10 },
        'clam-4': { name: 'Clam Sensor 04', location: 'Estuary / Main', closure: 5.4, ph: 7.4, do: 8.6, ec: 300, turb: 18 }
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
    closureVal: document.getElementById('val-closure'),
    phVal: document.getElementById('val-ph'),
    doVal: document.getElementById('val-do'),
    ecVal: document.getElementById('val-ec'),
    turbVal: document.getElementById('val-turb'),
    sysStatus: document.getElementById('sys-status'),
    sysStatusText: document.getElementById('sys-status-text'),
    extraMetrics: document.getElementById('extra-metrics'),
    btnToggleMetrics: document.getElementById('btn-toggle-metrics')
};

// Initialize
function init() {
    // Add click listeners to clams
    document.querySelectorAll('.clam').forEach(clam => {
        clam.addEventListener('click', (e) => {
            selectClam(clam.id);
        });
    });

    // Toggle advanced metrics
    if (elements.btnToggleMetrics) {
        elements.btnToggleMetrics.addEventListener('click', () => {
            toggleAdvancedMetrics();
        });
    }

    // Initial Selection
    selectClam(state.selectedClamId);

    // Start random data fluctuation
    setInterval(fluctuateData, 2000);

    // Add initial log
    addLog('系統已初始化，監測網已上線。', false);
}

// Toggle advanced metrics panel
function toggleAdvancedMetrics(forceExpand = null) {
    if (!elements.extraMetrics || !elements.btnToggleMetrics) return;

    const isExpanded = forceExpand !== null ? forceExpand : !elements.extraMetrics.classList.contains('expanded');
    if (isExpanded) {
        elements.extraMetrics.classList.add('expanded');
        elements.btnToggleMetrics.classList.add('expanded');
        elements.btnToggleMetrics.setAttribute('aria-label', '收合水質數據');
        elements.btnToggleMetrics.setAttribute('title', '收合水質數據');
    } else {
        elements.extraMetrics.classList.remove('expanded');
        elements.btnToggleMetrics.classList.remove('expanded');
        elements.btnToggleMetrics.setAttribute('aria-label', '展開水質數據');
        elements.btnToggleMetrics.setAttribute('title', '展開水質數據');
    }
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
    elements.closureVal.textContent = data.closure.toFixed(1);
    elements.phVal.textContent = data.ph.toFixed(2);
    elements.doVal.textContent = data.do.toFixed(1);
    elements.ecVal.textContent = data.ec.toFixed(0);
    elements.turbVal.textContent = data.turb.toFixed(1);

    // Color code based on thresholds (mock thresholds)
    updateStatusClass(elements.closureVal, data.closure, 0, 30); // Closure should be low (<30%)
    updateStatusClass(elements.phVal, data.ph, 6.5, 8.5); // pH safe range 6.5 - 8.5
    updateStatusClass(elements.doVal, data.do, 5.0, 20.0, true); // DO needs to be high
    updateStatusClass(elements.ecVal, data.ec, 0, 800); // EC should be low (<800)
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
        c.closure = Math.max(0, Math.min(100, c.closure + (Math.random() - 0.5) * 5));
        c.ph += (Math.random() - 0.5) * 0.05;
        c.do += (Math.random() - 0.5) * 0.2;
        c.ec = Math.max(0, c.ec + (Math.random() - 0.5) * 10);
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

    // --- Stage 1: Biological Alert (Closure Rate Spikes) ---
    clam.closure = 85.5; // Huge spike in closure rate
    
    // Auto-select the affected clam to show data
    selectClam(targetClamId);
    
    // System status
    elements.sysStatus.classList.add('alert');
    elements.sysStatusText.textContent = '觀測到異常閉合，啟動感測器...';
    
    // Auto expand advanced metrics panel
    toggleAdvancedMetrics(true);

    // Log event
    const time1 = new Date().toLocaleTimeString();
    const msg1 = `【階段一】<strong>${clam.name}</strong> 異常閉合 (85.5%)，已啟動水質偵測。`;
    addLog(msg1, true);

    // --- Stage 2: Sensor Confirmation (After 3.5 seconds) ---
    state.alertTimeout = setTimeout(() => {
        // Drastically change metrics for the affected clam
        clam.ph = 5.2; // Acidic
        clam.ec = 1650; // High EC
        clam.do = 3.5; // Low oxygen
        clam.turb = 85.0; // High turbidity
        
        // Visual Alert on map
        document.getElementById(targetClamId).classList.add('alert');
        
        elements.sysStatusText.textContent = '確認污染，已派員採樣！';
        
        updateDashboard();
        
        const time2 = new Date().toLocaleTimeString();
        const msg2 = `【階段二】<strong>${clam.name}</strong> 水質異常，研判污染源為 <strong>${factory.name}</strong>，已派員採樣。`;
        addLog(msg2, true);
    }, 3500);
}

// Reset System
window.resetSystem = function(silent = false) {
    if (state.alertTimeout) {
        clearTimeout(state.alertTimeout);
        state.alertTimeout = null;
    }

    state.isAlerting = false;
    state.alertSource = null;
    
    // Reset Data
    state.clams['clam-1'] = { name: 'Clam Sensor 01', location: 'Downstream A', closure: 12.0, ph: 7.2, do: 8.5, ec: 310, turb: 12 };
    state.clams['clam-2'] = { name: 'Clam Sensor 02', location: 'Downstream B', closure: 8.5, ph: 7.1, do: 8.2, ec: 290, turb: 15 };
    state.clams['clam-3'] = { name: 'Clam Sensor 03', location: 'Downstream C', closure: 15.2, ph: 7.3, do: 8.0, ec: 330, turb: 10 };
    state.clams['clam-4'] = { name: 'Clam Sensor 04', location: 'Estuary / Main', closure: 5.4, ph: 7.4, do: 8.6, ec: 300, turb: 18 };
    
    // Reset visuals
    document.querySelectorAll('.clam').forEach(c => c.classList.remove('alert'));
    elements.sysStatus.classList.remove('alert');
    elements.sysStatusText.textContent = '系統監控中';
    
    // Auto collapse advanced metrics panel
    toggleAdvancedMetrics(false);

    updateDashboard();
    if (!silent) {
        addLog('系統已重置，恢復監測。', false);
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
