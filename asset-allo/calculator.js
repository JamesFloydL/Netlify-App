// Global variables to store user data
let userData = {};
let currentStep = 1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateAssetTotals();
    setupEventListeners();
});

function setupEventListeners() {
    // Life insurance selection change
    document.getElementById('hasLifeInsurance').addEventListener('change', function() {
        const existingCoverageGroup = document.getElementById('existingCoverageGroup');
        if (this.value === 'yes') {
            existingCoverageGroup.style.display = 'block';
        } else {
            existingCoverageGroup.style.display = 'none';
        }
    });

    // Asset input listeners
    const assetInputs = ['cash', 'stocks', 'bonds', 'realEstate', 'retirement', 'other'];
    assetInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateAssetTotals);
    });
}

function updateAssetTotals() {
    const cash = parseFloat(document.getElementById('cash').value) || 0;
    const stocks = parseFloat(document.getElementById('stocks').value) || 0;
    const bonds = parseFloat(document.getElementById('bonds').value) || 0;
    const realEstate = parseFloat(document.getElementById('realEstate').value) || 0;
    const retirement = parseFloat(document.getElementById('retirement').value) || 0;
    const other = parseFloat(document.getElementById('other').value) || 0;
    
    const total = cash + stocks + bonds + realEstate + retirement + other;
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
    // Store calculator data in hidden field
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
            bonds: parseFloat(document.getElementById('bonds').value) || 0,
            realEstate: parseFloat(document.getElementById('realEstate').value) || 0,
            retirement: parseFloat(document.getElementById('retirement').value) || 0,
            other: parseFloat(document.getElementById('other').value) || 0
        };
        userData.totalNetWorth = Object.values(userData.assets).reduce((sum, val) => sum + val, 0);
    }
}

function calculateResults() {
    if (!validateCurrentStep()) return;
    
    collectStepData();
    
    // Calculate recommended life insurance coverage
    const recommendedCoverage = calculateRecommendedLifeInsurance();
    
    // Generate asset allocation recommendations
    const recommendedAllocation = getRecommendedAssetAllocation();
    
    // Store results
    userData.recommendations = {
        lifeInsurance: recommendedCoverage,
        assetAllocation: recommendedAllocation
    };
    
    // Display results
    displayResults();
    showStep(3);
}

function calculateRecommendedLifeInsurance() {
    const { annualIncome, dependents, age, totalNetWorth, existingCoverage } = userData;
    
    // Base calculation: 8-12x annual income depending on dependents and age
    let multiplier = 8;
    if (dependents > 0) multiplier += dependents;
    if (age < 35) multiplier += 1;
    if (age > 55) multiplier -= 1;
    
    const baseRecommendation = annualIncome * multiplier;
    
    // Adjust for existing net worth (reduces need)
    const adjustedRecommendation = Math.max(baseRecommendation - (totalNetWorth * 0.5), annualIncome * 5);
    
    return {
        recommended: Math.round(adjustedRecommendation / 1000) * 1000,
        current: existingCoverage,
        gap: Math.max(0, adjustedRecommendation - existingCoverage),
        adequacy: existingCoverage >= adjustedRecommendation * 0.8 ? 'Adequate' : 
                 existingCoverage >= adjustedRecommendation * 0.5 ? 'Moderate' : 'Insufficient'
    };
}

function getRecommendedAssetAllocation() {
    const { age, totalNetWorth } = userData;
    
    // Age-based allocation (common rule: 100 - age = stock percentage)
    const stockPercentage = Math.max(20, Math.min(80, 100 - age));
    const bondPercentage = Math.min(50, age - 20);
    const cashPercentage = Math.max(5, Math.min(20, totalNetWorth < 50000 ? 15 : 10));
    const realEstatePercentage = Math.min(30, totalNetWorth > 100000 ? 15 : 5);
    
    // Normalize percentages
    const total = stockPercentage + bondPercentage + cashPercentage + realEstatePercentage;
    
    return {
        stocks: Math.round((stockPercentage / total) * 100),
        bonds: Math.round((bondPercentage / total) * 100),
        cash: Math.round((cashPercentage / total) * 100),
        realEstate: Math.round((realEstatePercentage / total) * 100),
        retirement: Math.min(40, age - 20), // Separate recommendation
        other: 5 // Conservative allocation for other investments
    };
}

function displayResults() {
    displayAssetCharts();
    displayInsuranceAnalysis();
    displayProsAndCons();
    displayActionItems();
}

function displayAssetCharts() {
    const currentAllocation = calculateCurrentAllocation();
    const recommendedAllocation = userData.recommendations.assetAllocation;
    
    // Current allocation chart
    createPieChart('currentChart', currentAllocation, 'Current Allocation');
    
    // Recommended allocation chart
    createPieChart('recommendedChart', recommendedAllocation, 'Recommended Allocation');
}

function calculateCurrentAllocation() {
    const { assets, totalNetWorth } = userData;
    if (totalNetWorth === 0) return {};
    
    return {
        cash: Math.round((assets.cash / totalNetWorth) * 100),
        stocks: Math.round((assets.stocks / totalNetWorth) * 100),
        bonds: Math.round((assets.bonds / totalNetWorth) * 100),
        realEstate: Math.round((assets.realEstate / totalNetWorth) * 100),
        retirement: Math.round((assets.retirement / totalNetWorth) * 100),
        other: Math.round((assets.other / totalNetWorth) * 100)
    };
}

function createPieChart(canvasId, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const labels = [];
    const values = [];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    Object.entries(data).forEach(([key, value]) => {
        if (value > 0) {
            labels.push(capitalizeFirst(key) + ` (${value}%)`);
            values.push(value);
        }
    });
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
}

function displayInsuranceAnalysis() {
    const insurance = userData.recommendations.lifeInsurance;
    const resultsDiv = document.getElementById('insuranceResults');
    
    let html = `
        <div class="insurance-summary">
            <div class="metric">
                <h4>Recommended Coverage</h4>
                <span class="value">${formatCurrency(insurance.recommended)}</span>
            </div>
            <div class="metric">
                <h4>Current Coverage</h4>
                <span class="value">${formatCurrency(insurance.current)}</span>
            </div>
            <div class="metric">
                <h4>Coverage Gap</h4>
                <span class="value ${insurance.gap > 0 ? 'negative' : 'positive'}">${formatCurrency(insurance.gap)}</span>
            </div>
            <div class="metric">
                <h4>Coverage Adequacy</h4>
                <span class="value ${insurance.adequacy.toLowerCase()}">${insurance.adequacy}</span>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

function displayProsAndCons() {
    const { hasLifeInsurance } = userData;
    const insurance = userData.recommendations.lifeInsurance;
    
    const pros = [
        "Provides financial security for dependents",
        "Tax-advantaged death benefit",
        "Can build cash value over time (whole life)",
        "Estate planning benefits",
        "Business succession planning option"
    ];
    
    const cons = [
        "Monthly premium costs",
        "Complexity of different policy types",
        "Opportunity cost of premium payments",
        "May not be needed if financially independent",
        "Policy lapses if premiums not paid"
    ];
    
    // Customize based on user situation
    if (userData.dependents === 0) {
        cons.unshift("Limited need with no dependents");
    }
    
    if (userData.age > 60) {
        cons.push("Higher premiums due to age");
    }
    
    if (insurance.adequacy === 'Adequate') {
        pros.unshift("Current coverage appears sufficient");
    }
    
    document.getElementById('prosList').innerHTML = pros.map(pro => `<li>${pro}</li>`).join('');
    document.getElementById('consList').innerHTML = cons.map(con => `<li>${con}</li>`).join('');
}

function displayActionItems() {
    const actions = [];
    const insurance = userData.recommendations.lifeInsurance;
    const currentAllocation = calculateCurrentAllocation();
    const recommendedAllocation = userData.recommendations.assetAllocation;
    
    // Insurance actions
    if (insurance.gap > 0) {
        actions.push(`Consider increasing life insurance coverage by ${formatCurrency(insurance.gap)}`);
    } else if (!userData.hasLifeInsurance && userData.dependents > 0) {
        actions.push(`Consider obtaining life insurance coverage of ${formatCurrency(insurance.recommended)}`);
    }
    
    // Asset allocation actions
    if (Math.abs(currentAllocation.cash - recommendedAllocation.cash) > 10) {
        actions.push(`Adjust cash allocation from ${currentAllocation.cash}% to ${recommendedAllocation.cash}%`);
    }
    
    if (Math.abs(currentAllocation.stocks - recommendedAllocation.stocks) > 15) {
        actions.push(`Rebalance stock allocation from ${currentAllocation.stocks}% to ${recommendedAllocation.stocks}%`);
    }
    
    // General recommendations
    if (userData.totalNetWorth < userData.annualIncome * 1) {
        actions.push("Build emergency fund equal to 3-6 months of expenses");
    }
    
    if (currentAllocation.retirement < 10 && userData.age < 50) {
        actions.push("Maximize retirement account contributions");
    }
    
    document.getElementById('actionList').innerHTML = actions.map(action => `<li>${action}</li>`).join('');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Let Netlify handle the form submission
            setTimeout(() => {
                alert('Thank you! Your personalized report will be sent to your email within 24 hours.');
            }, 100);
        });
    }
});
