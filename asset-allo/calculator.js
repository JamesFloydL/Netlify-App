let userData = {};
let currentStep = 1;
let charts = {};

const BENCHMARK_MODELS = {
    rockefeller: {
        name: 'Rockefeller Model',
        alternatives: 40,
        stocks: 25,
        realEstate: 20,
        cash: 10,
        privateBusiness: 5
    },
    walton: {
        name: 'Walton Family Model',
        stocks: 50,
        privateBusiness: 20,
        realEstate: 15,
        cash: 10,
        alternatives: 5
    },
    trump: {
        name: 'Trump Estate Model',
        realEstate: 60,
        stocks: 15,
        cash: 10,
        privateBusiness: 10,
        alternatives: 5
    },
    disney: {
        name: 'Disney Family Model',
        privateBusiness: 50,
        stocks: 20,
        realEstate: 15,
        cash: 10,
        alternatives: 5
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateAssetTotals();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('hasLifeInsurance').addEventListener('change', function() {
        const existingCoverageGroup = document.getElementById('existingCoverageGroup');
        if (this.value === 'yes') {
            existingCoverageGroup.style.display = 'block';
        } else {
            existingCoverageGroup.style.display = 'none';
        }
    });

    const assetInputs = ['cash', 'stocks', 'realEstate', 'privateBusiness', 'alternatives'];
    assetInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateAssetTotals);
    });
}

function updateAssetTotals() {
    const cash = parseFloat(document.getElementById('cash').value) || 0;
    const stocks = parseFloat(document.getElementById('stocks').value) || 0;
    const realEstate = parseFloat(document.getElementById('realEstate').value) || 0;
    const privateBusiness = parseFloat(document.getElementById('privateBusiness').value) || 0;
    const alternatives = parseFloat(document.getElementById('alternatives').value) || 0;
    
    const total = cash + stocks + realEstate + privateBusiness + alternatives;
    document.getElementById('totalNetWorth').textContent = formatCurrency(total);
}

function nextStep() {
    if (validateCurrentStep()) {
        collectStepData();
        showStep(currentStep + 1);
    }
}

function prevStep() {
    showStep(currentStep - 1);
}

function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step${stepNumber}`).classList.add('active');
    currentStep = stepNumber;
}

function showLeadForm() {
    document.getElementById('calculatorData').value = JSON.stringify(userData);
    showStep('leadCapture');
}

function validateCurrentStep() {
    const currentStepEl = document.querySelector('.step.active');
    const requiredInputs = currentStepEl.querySelectorAll('input[required], select[required]');
    
    for (let input of requiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            alert('Please fill in all required fields.');
            return false;
        }
    }
    return true;
}

function collectStepData() {
    if (currentStep === 1) {
        userData.age = parseInt(document.getElementById('age').value);
        userData.annualIncome = parseFloat(document.getElementById('annualIncome').value);
        userData.dependents = parseInt(document.getElementById('dependents').value);
        userData.hasLifeInsurance = document.getElementById('hasLifeInsurance').value === 'yes';
        userData.existingCoverage = parseFloat(document.getElementById('existingCoverage').value) || 0;
    } else if (currentStep === 2) {
        userData.assets = {
            cash: parseFloat(document.getElementById('cash').value) || 0,
            stocks: parseFloat(document.getElementById('stocks').value) || 0,
            realEstate: parseFloat(document.getElementById('realEstate').value) || 0,
            privateBusiness: parseFloat(document.getElementById('privateBusiness').value) || 0,
            alternatives: parseFloat(document.getElementById('alternatives').value) || 0
        };
        userData.totalNetWorth = Object.values(userData.assets).reduce((sum, val) => sum + val, 0);
    }
}

function calculateHumanLifeValue() {
    const { annualIncome, age } = userData;
    const workingYears = Math.min(Math.max(0, 65 - age), 40);
    const humanLifeValue = annualIncome * workingYears * 0.70;
    
    return {
        value: humanLifeValue,
        workingYears: workingYears
    };
}

function calculateResults() {
    if (!validateCurrentStep()) return;
    
    collectStepData();
    
    const recommendedAllocation = getRecommendedAssetAllocation();
    const hlv = calculateHumanLifeValue();
    
    userData.recommendations = {
        assetAllocation: recommendedAllocation,
        humanLifeValue: hlv
    };
    
    displayResults();
    showStep(3);
}

function getRecommendedAssetAllocation() {
    const { age, totalNetWorth } = userData;
    
    const stockPercentage = Math.max(20, Math.min(60, 100 - age));
    const bondPercentage = Math.min(30, age - 20);
    const cashPercentage = Math.max(5, Math.min(15, totalNetWorth < 50000 ? 15 : 10));
    const realEstatePercentage = Math.min(25, totalNetWorth > 100000 ? 20 : 10);
    const alternativePercentage = 10;
    
    const total = stockPercentage + bondPercentage + cashPercentage + realEstatePercentage + alternativePercentage;
    
    return {
        stocks: Math.round((stockPercentage / total) * 100),
        cash: Math.round((bondPercentage / total) * 100 + (cashPercentage / total) * 100),
        realEstate: Math.round((realEstatePercentage / total) * 100),
        privateBusiness: 0,
        alternatives: Math.round((alternativePercentage / total) * 100)
    };
}

function displayResults() {
    displayHumanLifeValue();
    displayAssetCharts();
    displayActionItems();
}

function displayHumanLifeValue() {
    const hlv = userData.recommendations.humanLifeValue;
    const { existingCoverage } = userData;
    
    document.getElementById('hlvValue').textContent = formatCurrency(hlv.value);
    
    const gap = Math.max(0, hlv.value - existingCoverage);
    if (gap > 0) {
        document.getElementById('coverageGap').innerHTML = 
            `<p class="gap-negative">Coverage Gap: ${formatCurrency(gap)}</p>`;
    } else {
        document.getElementById('coverageGap').innerHTML = 
            `<p class="gap-positive">Coverage is Adequate</p>`;
    }
}

function displayAssetCharts() {
    const currentAllocation = calculateCurrentAllocation();
    const recommendedAllocation = userData.recommendations.assetAllocation;
    const benchmarkModel = document.getElementById('benchmarkModel').value;
    const benchmarkAllocation = BENCHMARK_MODELS[benchmarkModel];
    
    if (charts.current) charts.current.destroy();
    if (charts.recommended) charts.recommended.destroy();
    if (charts.benchmark) charts.benchmark.destroy();
    
    charts.current = createPieChart('currentChart', currentAllocation, 'Your Current Allocation');
    charts.recommended = createPieChart('recommendedChart', recommendedAllocation, 'Recommended Allocation');
    charts.benchmark = createPieChart('benchmarkChart', benchmarkAllocation, benchmarkAllocation.name);
    
    calculateAlignmentScore(currentAllocation, benchmarkAllocation);
}

function calculateCurrentAllocation() {
    const { assets, totalNetWorth } = userData;
    if (totalNetWorth === 0) return { stocks: 0, cash: 0, realEstate: 0, privateBusiness: 0, alternatives: 0 };
    
    return {
        cash: Math.round((assets.cash / totalNetWorth) * 100),
        stocks: Math.round((assets.stocks / totalNetWorth) * 100),
        realEstate: Math.round((assets.realEstate / totalNetWorth) * 100),
        privateBusiness: Math.round((assets.privateBusiness / totalNetWorth) * 100),
        alternatives: Math.round((assets.alternatives / totalNetWorth) * 100)
    };
}

function calculateAlignmentScore(currentAllocation, benchmarkAllocation) {
    const categories = ['cash', 'stocks', 'realEstate', 'privateBusiness', 'alternatives'];
    let totalDifference = 0;
    
    categories.forEach(cat => {
        const current = currentAllocation[cat] || 0;
        const benchmark = benchmarkAllocation[cat] || 0;
        totalDifference += Math.abs(current - benchmark);
    });
    
    const alignmentScore = Math.max(0, Math.round(100 - (totalDifference / 2)));
    document.getElementById('alignmentScore').textContent = alignmentScore;
}

function createPieChart(canvasId, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const labels = [];
    const values = [];
    const colors = ['#D4AF37', '#4BC0C0', '#36A2EB', '#9966FF', '#FF9F40'];
    
    const categoryNames = {
        cash: 'Cash/Bonds',
        stocks: 'Public Equities',
        realEstate: 'Real Estate',
        privateBusiness: 'Private Business',
        alternatives: 'Alternatives'
    };
    
    Object.entries(data).forEach(([key, value], index) => {
        if (key !== 'name' && value > 0) {
            labels.push(`${categoryNames[key] || key}: ${value}%`);
            values.push(value);
        }
    });
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderWidth: 2,
                borderColor: '#161B22'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#D4AF37',
                        font: {
                            size: 11
                        }
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function updateBenchmarkChart() {
    const benchmarkModel = document.getElementById('benchmarkModel').value;
    const benchmarkAllocation = BENCHMARK_MODELS[benchmarkModel];
    const currentAllocation = calculateCurrentAllocation();
    
    if (charts.benchmark) charts.benchmark.destroy();
    charts.benchmark = createPieChart('benchmarkChart', benchmarkAllocation, benchmarkAllocation.name);
    
    calculateAlignmentScore(currentAllocation, benchmarkAllocation);
    displayActionItems();
}

function displayActionItems() {
    const actions = [];
    const benchmarkModel = document.getElementById('benchmarkModel').value;
    const benchmark = BENCHMARK_MODELS[benchmarkModel];
    const currentAllocation = calculateCurrentAllocation();
    const hlv = userData.recommendations.humanLifeValue;
    
    if (hlv.value - userData.existingCoverage > 0) {
        actions.push(`Consider life insurance coverage of ${formatCurrency(hlv.value)} to protect your human capital`);
    }
    
    const categories = ['alternatives', 'stocks', 'realEstate', 'privateBusiness', 'cash'];
    const categoryNames = {
        alternatives: 'alternative investments',
        stocks: 'public equities',
        realEstate: 'real estate',
        privateBusiness: 'private business assets',
        cash: 'cash/bonds'
    };
    
    categories.forEach(cat => {
        const current = currentAllocation[cat] || 0;
        const target = benchmark[cat] || 0;
        const diff = target - current;
        
        if (Math.abs(diff) > 5) {
            const action = diff > 0 
                ? `To align with the ${benchmark.name}, increase ${categoryNames[cat]} by ${Math.abs(diff)}%`
                : `To align with the ${benchmark.name}, decrease ${categoryNames[cat]} by ${Math.abs(diff)}%`;
            actions.push(action);
        }
    });
    
    if (actions.length === 0) {
        actions.push(`Your portfolio is well-aligned with the ${benchmark.name}`);
    }
    
    document.getElementById('actionList').innerHTML = actions.map(action => `<li>${action}</li>`).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            setTimeout(() => {
                alert('Thank you! Your personalized report will be sent to your email within 24 hours.');
            }, 100);
        });
    }
});
