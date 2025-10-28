function controlReturn(r, c) {
    return ((r - c) / c) * 100;
}
function formatReturn(value) {
    const rounded = Math.round(value);
    if (rounded > 0)
        return `+${rounded}%`;
    if (rounded < 0)
        return `${rounded}%`;
    return `${rounded}%`;
}
function getReturnClass(value) {
    const rounded = Math.round(value);
    if (rounded > 0)
        return 'return-positive';
    if (rounded < 0)
        return 'return-negative';
    return 'return-zero';
}
function parseOpportunities(input, controlCost) {
    const values = input
        .split(',')
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v) && v >= 0 && v <= 100);
    const uniqueValues = Array.from(new Set([...values, controlCost]));
    return uniqueValues.sort((a, b) => a - b);
}
function renderTable(controlCost, opportunities) {
    const tbody = document.getElementById('resultsBody');
    if (!tbody)
        return;
    tbody.innerHTML = '';
    opportunities.forEach(opp => {
        const row = document.createElement('tr');
        const returnValue = controlReturn(opp, controlCost);
        if (opp === controlCost) {
            row.classList.add('current-control');
        }
        const oppCell = document.createElement('td');
        oppCell.textContent = `${opp.toFixed(1)}%`;
        row.appendChild(oppCell);
        const returnCell = document.createElement('td');
        returnCell.textContent = formatReturn(returnValue);
        returnCell.classList.add(getReturnClass(returnValue));
        row.appendChild(returnCell);
        tbody.appendChild(row);
    });
}
function generateCSV(controlCost, opportunities) {
    let csv = 'Opportunity,Return\n';
    opportunities.forEach(opp => {
        const returnValue = controlReturn(opp, controlCost);
        csv += `${opp.toFixed(1)}%,${formatReturn(returnValue)}\n`;
    });
    return csv;
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        if (!btn)
            return;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}
const state = {
    controlCost: 7.0,
    defaultOpportunities: [0, 5, 10, 15],
    customOpportunities: null
};
function updateDisplay() {
    const controlValueSpan = document.querySelector('.control-value');
    if (controlValueSpan) {
        controlValueSpan.textContent = `${state.controlCost.toFixed(1)}%`;
    }
    const opportunities = state.customOpportunities || state.defaultOpportunities;
    renderTable(state.controlCost, opportunities);
}
function init() {
    const controlInput = document.getElementById('controlInput');
    const controlSlider = document.getElementById('controlSlider');
    const opportunitiesInput = document.getElementById('opportunitiesInput');
    const copyBtn = document.getElementById('copyBtn');
    let debounceTimer = null;
    const syncControls = (value) => {
        state.controlCost = Math.max(0, Math.min(20, value));
        controlInput.value = state.controlCost.toFixed(1);
        controlSlider.value = state.controlCost.toFixed(1);
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            updateDisplay();
        }, 100);
    };
    controlInput?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            syncControls(value);
        }
    });
    controlSlider?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        syncControls(value);
    });
    opportunitiesInput?.addEventListener('input', (e) => {
        const input = e.target.value.trim();
        if (input === '') {
            state.customOpportunities = null;
        }
        else {
            state.customOpportunities = parseOpportunities(input, state.controlCost);
        }
        updateDisplay();
    });
    copyBtn?.addEventListener('click', () => {
        const opportunities = state.customOpportunities || state.defaultOpportunities;
        const csv = generateCSV(state.controlCost, opportunities);
        copyToClipboard(csv);
    });
    updateDisplay();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
export { controlReturn, formatReturn, parseOpportunities };
