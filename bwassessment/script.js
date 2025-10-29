let chart;
let incomeSourceCount = 1;

document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    calculate();
    
    document.getElementById('add-income-btn').addEventListener('click', addIncomeSource);
    document.getElementById('calculate-btn').addEventListener('click', calculate);
    
    // Add event listeners to all form inputs for real-time calculation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });
});

function addIncomeSource() {
    const incomeSourcesDiv = document.getElementById('income-sources');
    const newIncomeSource = document.createElement('div');
    newIncomeSource.className = 'income-source';
    newIncomeSource.innerHTML = `
        <div class="form-group">
            <label for="income-amount-${incomeSourceCount}">Amount</label>
            <div class="input-with-symbol">
                <span>$</span>
                <input type="number" id="income-amount-${incomeSourceCount}" value="0">
            </div>
        </div>
        
        <div class="form-group">
            <label for="annual-increase-${incomeSourceCount}">Annual increase</label>
            <div class="input-with-symbol">
                <input type="number" id="annual-increase-${incomeSourceCount}" value="3" step="0.1">
                <span>%</span>
            </div>
        </div>
        
        <div class="form-group">
            <label for="start-age-${incomeSourceCount}">Start age</label>
            <input type="number" id="start-age-${incomeSourceCount}" value="30">
        </div>
        
        <div class="form-group">
            <label for="stop-age-${incomeSourceCount}">Stop age</label>
            <input type="number" id="stop-age-${incomeSourceCount}" value="65">
        </div>
        <button type="button" onclick="removeIncomeSource(this)" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
    `;
    incomeSourcesDiv.appendChild(newIncomeSource);
    
    // Add event listeners to new inputs
    const newInputs = newIncomeSource.querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', calculate);
    });
    
    incomeSourceCount++;
}

function removeIncomeSource(button) {
    button.parentNode.remove();
    calculate();
}

function getIncomeData() {
    const incomeSources = [];
    const incomeSourceDivs = document.querySelectorAll('.income-source');
    
    incomeSourceDivs.forEach((div, index) => {
        const amount = parseFloat(div.querySelector(`[id^="income-amount-"]`).value) || 0;
        const increase = parseFloat(div.querySelector(`[id^="annual-increase-"]`).value) || 0;
        const startAge = parseInt(div.querySelector(`[id^="start-age-"]`).value) || 0;
        const stopAge = parseInt(div.querySelector(`[id^="stop-age-"]`).value) || 0;
        
        if (amount > 0) {
            incomeSources.push({
                amount,
                increase: increase / 100,
                startAge,
                stopAge
            });
        }
    });
    
    return incomeSources;
}

function calculate() {
    const retirementAge = parseInt(document.getElementById('retirement-age').value) || 65;
    const initialAmount = parseFloat(document.getElementById('initial-amount').value) || 0;
    const amountPerYear = parseFloat(document.getElementById('amount-per-year').value) || 0;
    const inflation = parseFloat(document.getElementById('projected-inflation').value) / 100 || 0.02;
    const returnBefore = parseFloat(document.getElementById('return-before').value) / 100 || 0.06;
    const returnAfter = parseFloat(document.getElementById('return-after').value) / 100 || 0.04;
    
    const incomeSources = getIncomeData();
    const currentAge = 25; // Default starting age for projections
    const maxAge = 90;
    
    // Calculate projections
    const projectionData = calculateProjections(
        currentAge, maxAge, retirementAge, initialAmount, amountPerYear,
        returnBefore, returnAfter, inflation, incomeSources
    );
    
    // Update summary stats
    updateSummaryStats(projectionData, incomeSources);
    
    // Update chart
    updateChart(projectionData);
    
    // Update message
    updateMessage(projectionData);
}

function calculateProjections(currentAge, maxAge, retirementAge, initialAmount, amountPerYear, returnBefore, returnAfter, inflation, incomeSources) {
    const years = [];
    const totalIncome = [];
    const desiredIncome = [];
    const savings = [];
    
    let currentSavings = initialAmount;
    
    for (let age = currentAge; age <= maxAge; age++) {
        years.push(age);
        
        // Calculate total income for this age
        let totalIncomeForAge = 0;
        incomeSources.forEach(source => {
            if (age >= source.startAge && age <= source.stopAge) {
                const yearsFromStart = age - source.startAge;
                totalIncomeForAge += source.amount * Math.pow(1 + source.increase, yearsFromStart);
            }
        });
        
        totalIncome.push(totalIncomeForAge);
        
        // Calculate desired income (adjusted for inflation)
        const yearsFromNow = age - currentAge;
        const adjustedDesiredIncome = totalIncomeForAge * 0.8 * Math.pow(1 + inflation, yearsFromNow);
        desiredIncome.push(adjustedDesiredIncome);
        
        // Update savings
        if (age < retirementAge) {
            // Before retirement: add savings and apply growth
            currentSavings = (currentSavings + amountPerYear) * (1 + returnBefore);
        } else {
            // After retirement: apply growth and withdraw for expenses
            const withdrawalAmount = Math.max(0, adjustedDesiredIncome - totalIncomeForAge);
            currentSavings = Math.max(0, (currentSavings - withdrawalAmount) * (1 + returnAfter));
        }
        
        savings.push(currentSavings);
    }
    
    return {
        years,
        totalIncome,
        desiredIncome,
        savings,
        retirementAge
    };
}

function updateSummaryStats(projectionData, incomeSources) {
    let startingIncome = 0;
    if (incomeSources.length > 0) {
        startingIncome = incomeSources.reduce((sum, source) => sum + source.amount, 0);
    }
    
    const consumedIncome = startingIncome * 0.9; // Assuming 90% is consumed
    
    // Find age when income drops significantly
    let ageIncomeDrops = 65;
    for (let i = 1; i < projectionData.totalIncome.length; i++) {
        if (projectionData.totalIncome[i] < projectionData.totalIncome[i-1] * 0.5) {
            ageIncomeDrops = projectionData.years[i];
            break;
        }
    }
    
    document.getElementById('starting-income').textContent = `$${startingIncome.toLocaleString()}`;
    document.getElementById('consumed-income').textContent = `$${Math.round(consumedIncome).toLocaleString()}`;
    document.getElementById('age-income-drops').textContent = ageIncomeDrops;
}

function updateMessage(projectionData) {
    const finalSavings = projectionData.savings[projectionData.savings.length - 1];
    const messageBox = document.querySelector('.message-box');
    const messageIcon = document.querySelector('.message-icon');
    const messageTitle = document.querySelector('.message-title');
    const warningText = document.querySelector('.warning-text');
    
    if (finalSavings > 100000) {
        messageIcon.textContent = '😊';
        messageTitle.textContent = 'Great!';
        warningText.textContent = 'You are on track for a comfortable retirement!';
        warningText.style.color = '#28a745';
    } else {
        messageIcon.textContent = '😞';
        messageTitle.textContent = 'Yikes!';
        warningText.textContent = 'You are out of balance!';
        warningText.style.color = '#dc3545';
    }
}

function initializeChart() {
    const ctx = document.getElementById('wealth-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Income',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Desired Income',
                    data: [],
                    borderColor: '#8bc34a',
                    backgroundColor: 'rgba(139, 195, 74, 0.1)',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Income ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateChart(projectionData) {
    chart.data.labels = projectionData.years;
    chart.data.datasets[0].data = projectionData.totalIncome;
    chart.data.datasets[1].data = projectionData.desiredIncome;
    chart.update();
}
