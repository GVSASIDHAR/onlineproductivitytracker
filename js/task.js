// Updated tasks.js with working filters and analytics sync

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editTaskId = null;

// DOM Elements
const saveTaskBtn = document.getElementById('saveTaskBtn');
const taskList = document.getElementById('taskList');
const taskAlertBox = document.getElementById('taskAlertBox');
const taskModalLabel = document.getElementById('taskModalLabel');
const filterDeadline = document.getElementById('filterDeadline');
const filterPriority = document.getElementById('filterPriority');
const filterCategory = document.getElementById('filterCategory');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Save or Edit Task
saveTaskBtn.addEventListener('click', () => {
    const taskText = document.getElementById('taskInput').value.trim();
    const taskPriority = document.getElementById('taskPriority').value;
    const taskCategory = document.getElementById('taskCategory').value;
    const taskDeadline = document.getElementById('taskDeadline').value;

    if (taskText === '') {
        showTaskAlert('Task name cannot be empty!', 'danger');
        return;
    }

    if (editTaskId) {
        const task = tasks.find(t => t.id === editTaskId);
        task.text = taskText;
        task.priority = taskPriority;
        task.category = taskCategory;
        task.deadline = taskDeadline;

        showTaskAlert('Task updated successfully!', 'success');
        editTaskId = null;
    } else {
        const newTask = {
            id: Date.now(),
            text: taskText,
            priority: taskPriority,
            category: taskCategory,
            deadline: taskDeadline,
            completed: false,
            startTime: null,
            endTime: null,
            elapsedTime: null
        };

        tasks.push(newTask);
        showTaskAlert('Task added successfully!', 'success');
    }

    updateLocalStorage();
    renderTasks();

    const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
    modal.hide();

    resetModal();
});

// Event Delegation for Task List
taskList.addEventListener('click', (e) => {
    const taskId = parseInt(e.target.closest('li').getAttribute('data-id'));
    const task = tasks.find(t => t.id === taskId);

    if (e.target.classList.contains('delete-btn')) {
        tasks = tasks.filter(t => t.id !== taskId);
        updateLocalStorage();
        renderTasks();
        showTaskAlert('Task deleted.', 'warning');
    }

    if (e.target.classList.contains('edit-btn')) {
        editTaskId = taskId;

        document.getElementById('taskInput').value = task.text;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDeadline').value = task.deadline;

        taskModalLabel.textContent = 'Edit Task';
        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();
    }

    if (e.target.classList.contains('complete-btn')) {
        if (!task.startTime) {
            showTaskAlert('Start time must be logged before completing the task.', 'danger');
            return;
        }

        task.completed = !task.completed;
        task.endTime = task.completed ? new Date() : null;

        if (task.completed && task.startTime) {
            const elapsedMs = task.endTime - new Date(task.startTime);
            task.elapsedTime = Math.floor(elapsedMs / 1000);
        }

        updateLocalStorage();
        renderTasks();
    }

    if (e.target.classList.contains('start-btn')) {
        if (!task.startTime) {
            task.startTime = new Date();
            showTaskAlert('Timer started!', 'success');
        } else {
            showTaskAlert('Timer already started!', 'info');
        }

        updateLocalStorage();
    }
});

// Filters
filterDeadline.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);
filterCategory.addEventListener('change', renderTasks);

clearFiltersBtn.addEventListener('click', () => {
    filterDeadline.value = 'all';
    filterPriority.value = 'all';
    filterCategory.value = 'all';
    renderTasks();
});

// Render Tasks
function renderTasks() {
    let filteredTasks = tasks;

    const deadlineFilter = filterDeadline.value;
    const priorityFilter = filterPriority.value;
    const categoryFilter = filterCategory.value;

    const today = new Date().toISOString().split('T')[0];

    if (deadlineFilter === 'today') {
        filteredTasks = filteredTasks.filter(t => t.deadline === today);
    } else if (deadlineFilter === 'overdue') {
        filteredTasks = filteredTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && !t.completed);
    }

    if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.category === categoryFilter);
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="list-group-item text-center">No tasks found.</li>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {
        const overdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

        return `
            <li class="list-group-item d-flex justify-content-between align-items-center mb-2" data-id="${task.id}">
                <div class="d-flex flex-column w-100">
                    <div class="mb-2">
                        <span class="fw-bold ${task.completed ? 'text-decoration-line-through' : ''}">${task.text}</span>
                        <span class="badge bg-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'info'} me-1">${task.priority}</span>
                        <span class="badge bg-secondary me-1">${task.category}</span>
                        <span class="badge bg-light text-dark me-1 ${overdue ? 'text-danger fw-bold' : ''}">${task.deadline || 'No Deadline'}</span>
                    </div>

                    <div>
                        <button class="btn btn-sm btn-success me-1 complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
                        <button class="btn btn-sm btn-secondary me-1 edit-btn">Edit</button>
                        <button class="btn btn-sm btn-danger me-1 delete-btn">Delete</button>
                        <button class="btn btn-sm btn-primary me-1 start-btn">Start Timer</button>
                        ${task.elapsedTime ? `<span class="ms-2">Elapsed Time: ${formatTime(task.elapsedTime)}</span>` : ''}
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

// LocalStorage Sync
function updateLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Alert Box
function showTaskAlert(message, type = 'danger') {
    taskAlertBox.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    setTimeout(() => {
        taskAlertBox.innerHTML = '';
    }, 2000);
}

// Time Formatter
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Modal Reset
function resetModal() {
    document.getElementById('taskInput').value = '';
    document.getElementById('taskPriority').value = 'High';
    document.getElementById('taskCategory').value = 'Work';
    document.getElementById('taskDeadline').value = '';
    editTaskId = null;
    taskModalLabel.textContent = 'Add New Task';
}

// Initial Render
renderTasks();
