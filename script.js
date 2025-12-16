let habits = [];
let selectedHabitId = null;
let charts = {};

// Load habits from localStorage
function loadHabits() {
    const saved = localStorage.getItem('habits');
    if (saved) {
        habits = JSON.parse(saved);
    }
    renderHabits();
    updateStats();
    updateCharts();
}

// Save habits to localStorage
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Add new habit
function addHabit() {
    const input = document.getElementById('habitInput');
    const name = input.value.trim();
    
    if (!name) return;
    
    const habit = {
        id: Date.now(),
        name: name,
        completions: [],
        created: new Date().toISOString()
    };
    
    habits.push(habit);
    input.value = '';
    saveHabits();
    renderHabits();
    updateStats();
    updateCharts();
}

// Toggle habit completion
function toggleCompletion(habitId) {
    const today = new Date().toDateString();
    const habit = habits.find(h => h.id === habitId);
    
    if (!habit) return;
    
    const index = habit.completions.indexOf(today);
    if (index > -1) {
        habit.completions.splice(index, 1);
    } else {
        habit.completions.push(today);
    }
    
    saveHabits();
    renderHabits();
    updateStats();
    updateCharts();
}

// Delete habit
function deleteHabit(habitId) {
    habits = habits.filter(h => h.id !== habitId);
    if (selectedHabitId === habitId) {
        selectedHabitId = null;
    }
    saveHabits();
    renderHabits();
    updateStats();
    updateCharts();
}

// Select habit for detailed view
function selectHabit(habitId) {
    selectedHabitId = habitId;
    renderHabits();
    updateCharts();
}

// Calculate streak
function getStreak(habit) {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    const sorted = habit.completions.sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let currentDate = new Date();
    
    for (let completion of sorted) {
        const compDate = new Date(completion);
        const diffDays = Math.floor((currentDate - compDate) / (1000 * 60 * 60 * 24));
        if (diffDays === streak) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// Get last 30 days
function getLast30Days() {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toDateString());
    }
    return days;
}

// Render habits list
function renderHabits() {
    const container = document.getElementById('habitsList');
    
    if (habits.length === 0) {
        container.innerHTML = '<p class="empty-state">No habits yet. Add one to get started!</p>';
        return;
    }
    
    container.innerHTML = habits.map(habit => {
        const today = new Date().toDateString();
        const isCompleted = habit.completions.includes(today);
        const streak = getStreak(habit);
        const isSelected = selectedHabitId === habit.id;
        
        return `
            <div class="habit-card ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}" onclick="selectHabit(${habit.id})">
                <div class="habit-info">
                    <button class="check-btn ${isCompleted ? 'checked' : ''}" onclick="event.stopPropagation(); toggleCompletion(${habit.id})">
                        ${isCompleted ? '✓' : ''}
                    </button>
                    <div class="habit-details">
                        <h3>${habit.name}</h3>
                        <p>🔥 ${streak} day streak • ${habit.completions.length} total</p>
                    </div>
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteHabit(${habit.id})">🗑️</button>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);
    const avgStreak = habits.length ? (habits.reduce((sum, h) => sum + getStreak(h), 0) / habits.length).toFixed(1) : 0;
    const today = new Date().toDateString();
    const todayCompleted = habits.filter(h => h.completions.includes(today)).length;
    
    document.getElementById('totalCompletions').textContent = totalCompletions;
    document.getElementById('avgStreak').textContent = avgStreak;
    document.getElementById('todayProgress').textContent = `${todayCompleted}/${habits.length}`;
}

// Update charts
function updateCharts() {
    updateDoughnutChart();
    updateBarChart();
    updateLineChart();
}

// Doughnut chart
function updateDoughnutChart() {
    const ctx = document.getElementById('doughnutChart');
    const today = new Date().toDateString();
    const todayCompleted = habits.filter(h => h.completions.includes(today)).length;
    const remaining = Math.max(0, habits.length - todayCompleted);
    
    if (charts.doughnut) charts.doughnut.destroy();
    
    charts.doughnut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed Today', 'Remaining'],
            datasets: [{
                data: [todayCompleted, remaining],
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.8)']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// Bar chart
function updateBarChart() {
    const ctx = document.getElementById('barChart');
    
    if (charts.bar) charts.bar.destroy();
    
    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: habits.map(h => h.name),
            datasets: [{
                label: 'Total Completions',
                data: habits.map(h => h.completions.length),
                backgroundColor: 'rgba(99, 102, 241, 0.8)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Line chart
function updateLineChart() {
    const container = document.getElementById('lineChartContainer');
    const ctx = document.getElementById('lineChart');
    
    if (!selectedHabitId) {
        container.style.display = 'none';
        return;
    }
    
    const habit = habits.find(h => h.id === selectedHabitId);
    if (!habit) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    document.getElementById('lineChartTitle').textContent = `${habit.name} - Last 30 Days`;
    
    const last30Days = getLast30Days();
    const data = last30Days.map(day => habit.completions.includes(day) ? 1 : 0);
    
    if (charts.line) charts.line.destroy();
    
    charts.line = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map((_, i) => `Day ${i + 1}`),
            datasets: [{
                label: 'Completions',
                data: data,
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Enter key support
document.getElementById('habitInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addHabit();
    }
});

// Initialize
loadHabits();