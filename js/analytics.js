// analytics.js

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

const completionCtx = document.getElementById('completionChart').getContext('2d');
const categoryCtx = document.getElementById('categoryChart').getContext('2d');
const priorityCtx = document.getElementById('priorityChart').getContext('2d');
const taskWiseContainer = document.getElementById('taskWiseContainer');
const noTaskMsg = document.getElementById('noTaskMsg');

let completionChart, categoryChart, priorityChart;

if (tasks.length === 0) {
    noTaskMsg.style.display = 'block';
} else {
    renderOverallCharts();
    renderTaskWiseCharts();
}

// Listen to localStorage changes in real-time
window.addEventListener('storage', (e) => {
    if (e.key === 'tasks') {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        refreshAnalytics();
    }
});

// Refresh all charts and task-wise graphs
function refreshAnalytics() {
    if (tasks.length === 0) {
        noTaskMsg.style.display = 'block';
        clearCharts();
        taskWiseContainer.innerHTML = '';
        return;
    }

    noTaskMsg.style.display = 'none';
    renderOverallCharts();
    renderTaskWiseCharts();
}

// Clear old charts to prevent duplication
function clearCharts() {
    if (completionChart) completionChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (priorityChart) priorityChart.destroy();
}

function renderOverallCharts() {
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    if (completionChart) completionChart.destroy();
    completionChart = new Chart(completionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completedTasks, pendingTasks],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: { animation: { animateScale: true } }
    });

    const categoryCounts = { Work: 0, Study: 0, Personal: 0 };
    tasks.forEach(t => categoryCounts[t.category]++);

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Work', 'Study', 'Personal'],
            datasets: [{
                data: [categoryCounts.Work, categoryCounts.Study, categoryCounts.Personal],
                backgroundColor: ['#007bff', '#ffc107', '#6f42c1']
            }]
        },
        options: { animation: { animateScale: true } }
    });

    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(t => priorityCounts[t.priority]++);

    if (priorityChart) priorityChart.destroy();
    priorityChart = new Chart(priorityCtx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [priorityCounts.High, priorityCounts.Medium, priorityCounts.Low],
                backgroundColor: ['#dc3545', '#ffc107', '#0dcaf0']
            }]
        },
        options: { animation: { animateScale: true } }
    });
}

function renderTaskWiseCharts() {
    taskWiseContainer.innerHTML = '';

    tasks.forEach(task => {
        const progressPercent = task.completed ? 100 : task.startTime ? Math.min(calculateProgress(task), 99) : 0;

        const taskCard = document.createElement('div');
        taskCard.className = 'col-md-4 mb-4 d-flex flex-column align-items-center';

        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;

        const label = document.createElement('p');
        label.textContent = task.text;

        taskCard.appendChild(canvas);
        taskCard.appendChild(label);
        taskWiseContainer.appendChild(taskCard);

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Progress', 'Remaining'],
                datasets: [{
                    data: [progressPercent, 100 - progressPercent],
                    backgroundColor: ['#17a2b8', '#e9ecef']
                }]
            },
            options: {
                animation: { animateScale: true },
                plugins: { tooltip: { enabled: false } },
                cutout: '70%',
            }
        });
    });
}

function calculateProgress(task) {
    if (!task.startTime) return 0;

    const start = new Date(task.startTime);
    const deadline = task.deadline ? new Date(task.deadline) : null;

    if (!deadline) return 0;

    const totalDuration = deadline - start;
    const elapsed = new Date() - start;

    if (elapsed >= totalDuration) return 100;

    return Math.floor((elapsed / totalDuration) * 100);
}

