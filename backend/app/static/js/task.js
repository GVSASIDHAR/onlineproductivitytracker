const activeTimers = {};
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    fetchAndRenderTasks();

    document.getElementById("saveTaskBtn").addEventListener("click", handleAddTask);

    document.getElementById("addTaskBtn").addEventListener("click", () => {
        document.getElementById("taskForm").reset();
        document.getElementById("taskModalLabel").innerText = "Add Task";
        delete document.getElementById("taskForm").dataset.editingId; // Ensure fresh add
        const modal = new bootstrap.Modal(document.getElementById("taskModal"));
        modal.show();
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        document.getElementById("filterDeadline").value = "all";
        document.getElementById("filterPriority").value = "all";
        document.getElementById("filterCategory").value = "all";
        fetchAndRenderTasks();
    });

    ["filterDeadline", "filterPriority", "filterCategory"].forEach(id => {
        document.getElementById(id).addEventListener("change", fetchAndRenderTasks);
    });
});

function isOnAnalyticsPage() {
    return window.location.pathname.includes("analytics.html");
}

async function checkAuth() {
    try {
        const res = await fetch("/api/auth/whoami", { credentials: "include" });
        if (!res.ok) window.location.href = "/login";
    } catch (err) {
        console.error("Auth check failed", err);
        window.location.href = "/login";
    }
}

async function fetchAndRenderTasks() {
    try {
        const res = await fetch("/api/tasks", { credentials: "include" });
        const tasks = await res.json();

        const deadlineFilter = document.getElementById("filterDeadline").value;
        const priorityFilter = document.getElementById("filterPriority").value;
        const categoryFilter = document.getElementById("filterCategory").value;

        const today = new Date().toISOString().split("T")[0];

        const filtered = tasks.filter(task => {
            const deadline = task.deadline?.split("T")[0];
            return (
                (deadlineFilter === "all" ||
                    (deadlineFilter === "today" && deadline === today) ||
                    (deadlineFilter === "overdue" && deadline && deadline < today)) &&
                (priorityFilter === "all" || task.priority === priorityFilter) &&
                (categoryFilter === "all" || task.category === categoryFilter)
            );
        });

        renderTasks(filtered);
    } catch (err) {
        console.error("Failed to load tasks", err);
    }
}

function renderTasks(tasks) {
    const container = document.getElementById("taskList");
    container.innerHTML = "";

    if (!tasks.length) {
        container.innerHTML = `
                            <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
                                <p style="color: white; font-size: 24px; text-align: center; margin: 0;">No tasks found.</p>
                            </div>
                            `;
        return;
    }

    tasks.forEach(task => {
        const col = document.createElement("div");
        col.className = "col-md-4";

        col.innerHTML = `
            <div class="card mb-3">
                <div class="card-body">
                    <div id="timerStatus-${task.id}" class="text-muted small mt-2"></div>
                    <h5 class="card-title">${task.title}</h5>
                    <p class="card-text">${task.description || ""}</p>
                   <p class="card-text">
                        <small class="text-muted">Priority: ${task.priority}</small><br>
                        <small class="text-muted">Category: ${task.category}</small><br>
                        <small class="text-muted">Due: ${task.deadline || "N/A"}</small><br>
                        <small class="text-muted">Status: ${task.is_completed ? "Completed" : "Pending"}</small><br>
                        <small class="text-muted">Time Spent: ${(task.total_time || 0)} min</small>
                    </p>

                    <div class="d-flex flex-wrap gap-2 mt-2">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${task.id}">Edit</button>
                        <button class="btn btn-sm btn-success complete-btn" data-id="${task.id}" ${task.is_completed ? "disabled" : ""}>Mark Completed</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${task.id}">Delete</button>
                    </div>
                    ${!task.is_completed ? `
                        <div class="d-flex align-items-center mt-2">
                            <button class="btn btn-sm btn-primary me-2 task-start-btn" data-task-id="${task.id}">Start</button>
                            <button class="btn btn-sm btn-danger task-stop-btn" data-task-id="${task.id}" style="display: none;">Stop</button>
                            <span class="ms-3 timer-display" data-task-id="${task.id}">00:00:00</span>
                        </div>` : `
                        <div class="text-muted mt-2">Timer disabled (Task completed)</div>`
                    }
                </div>
            </div>
        `;

        container.appendChild(col);

        const startBtn = col.querySelector(`.task-start-btn[data-task-id="${task.id}"]`);
        const stopBtn = col.querySelector(`.task-stop-btn[data-task-id="${task.id}"]`);
        const timerDisplay = col.querySelector(`.timer-display[data-task-id="${task.id}"]`);



        if (activeTimers[task.id]) {
            const { previousElapsed, startTime } = activeTimers[task.id];
            let base = previousElapsed || 0;

            if (startTime) {
             
                activeTimers[task.id].intervalId = setInterval(() => {
                    const now = Date.now();
                    const total = base + Math.floor((now - startTime) / 1000);
                    const hours = String(Math.floor(total / 3600)).padStart(2, '0');
                    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
                    const seconds = String(total % 60).padStart(2, '0');

                    if (timerDisplay) timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
                }, 1000);

                if (startBtn) startBtn.style.display = "none";
                if (stopBtn) stopBtn.style.display = "inline-block";
            } else {
             
                const hours = String(Math.floor(base / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((base % 3600) / 60)).padStart(2, '0');
                const seconds = String(base % 60).padStart(2, '0');

                if (timerDisplay) timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
                if (startBtn) {
                    startBtn.textContent = "Resume";
                    startBtn.style.display = "inline-block";
                }
                if (stopBtn) stopBtn.style.display = "none";
            }
        }


        if (startBtn) {
            startBtn.addEventListener("click", () => {
                toggleTimer(task.id, true);
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener("click", () => {
                toggleTimer(task.id, false);
            });
        }
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const res = await fetch(`/api/tasks/${id}`, { credentials: "include" });
            const task = await res.json();

            document.getElementById("title").value = task.title;
            document.getElementById("description").value = task.description;
            document.getElementById("dueDate").value = task.deadline;
            document.getElementById("priority").value = task.priority;
            document.getElementById("category").value = task.category;
            document.getElementById("taskId").value = task.id;
            document.getElementById("taskModalLabel").innerText = "Edit Task";
            document.getElementById("taskForm").dataset.editingId = task.id;

            const modal = new bootstrap.Modal(document.getElementById("taskModal"));
            modal.show();
        });
    });

    document.querySelectorAll(".complete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;

            
            if (activeTimers[id]) {
                await toggleTimer(id, false);
            }
            await updateTaskCompletion(id, true);

            await fetchAndRenderTasks();
            document.dispatchEvent(new CustomEvent("taskStatusChanged"));
            try {
                const res = await fetch(`/api/tasks/${id}/analytics/latest`, { credentials: "include" });
                const data = await res.json();
                if (data?.duration_minutes !== undefined) {
                    const el = document.getElementById(`timerStatus-${id}`);
                    if (el) el.innerText = `Time Spent: ${data.duration_minutes} min`;
                }
            } catch (err) {
                console.warn("Couldn't fetch final duration:", err);
            }
        });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            await deleteTask(id);
            await fetchAndRenderTasks();
            document.dispatchEvent(new CustomEvent("taskStatusChanged"));
        });
    });
}


async function updateTaskCompletion(taskId, is_completed) {
    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ is_completed })
        });
    } catch (err) {
        console.error("Error updating task status", err);
    }
}

async function deleteTask(taskId) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!res.ok) {
            const error = await res.text();
            console.error("Delete error:", error);
        }
    } catch (err) {
        console.error("Error deleting task", err);
    }
}

async function handleAddTask() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const deadline = document.getElementById("dueDate").value;
    const priority = document.getElementById("priority").value;
    const category = document.getElementById("category").value;

    if (!title || !description) {
        
        return;
    }

    const editingId = document.getElementById("taskForm").dataset.editingId;
    const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";
    const method = editingId ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title, description, deadline, priority, category })
        });

        if (!res.ok) {
    const contentType = res.headers.get("content-type");
    const errorData = contentType && contentType.includes("application/json")
        ? await res.json()
        : await res.text();

    const errorBox = document.getElementById("taskError");
    errorBox.classList.remove("d-none");

    if (typeof errorData === "string") {
        errorBox.textContent = "Error - " + errorData;
    } else {
        errorBox.textContent = "Error - " + (errorData.error || "Failed to save task.");
    }

    console.error("Save error:", errorData);
    return;
}

        document.getElementById("taskError").classList.add("d-none");
        document.getElementById("taskError").textContent = "";
        document.getElementById("taskForm").reset();
        delete document.getElementById("taskForm").dataset.editingId;

        const modal = bootstrap.Modal.getInstance(document.getElementById("taskModal"));
        modal.hide();

        await fetchAndRenderTasks();
    } catch (err) {
        console.error("Error saving task", err);
        
    }
}

async function toggleTimer(taskId, isStarting) {
    const startBtn = document.querySelector(`.task-start-btn[data-task-id="${taskId}"]`);
    const stopBtn = document.querySelector(`.task-stop-btn[data-task-id="${taskId}"]`);
    const timerDisplay = document.querySelector(`.timer-display[data-task-id="${taskId}"]`);

    if (isStarting) {
        try {
            const res = await fetch(`/api/tasks/${taskId}/timer`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "start" }),
            });

            if (!res.ok) throw new Error("Failed to start timer");

            let previousElapsed = activeTimers[taskId]?.previousElapsed || 0;
            const startTime = Date.now();
            activeTimers[taskId] = {
                startTime,
                previousElapsed,
                intervalId: null
            };

            activeTimers[taskId].intervalId = setInterval(() => {
                const now = Date.now();
                const elapsed = previousElapsed + Math.floor((now - startTime) / 1000);
                const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
                const seconds = String(elapsed % 60).padStart(2, '0');
                if (timerDisplay) timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
            }, 1000);

            if (startBtn) startBtn.style.display = "none";
            if (stopBtn) stopBtn.style.display = "inline-block";
        } catch (error) {
            console.error(error);
           
        }
    } else {
        try {
            const res = await fetch(`/api/tasks/${taskId}/timer`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "stop" }),
            });

            if (!res.ok) throw new Error("Failed to stop timer");

            if (activeTimers[taskId]) {
                clearInterval(activeTimers[taskId].intervalId);
                const totalElapsed = activeTimers[taskId].previousElapsed + Math.floor((Date.now() - activeTimers[taskId].startTime) / 1000);
                activeTimers[taskId] = {
                    previousElapsed: totalElapsed
                };
            }

            if (stopBtn) stopBtn.style.display = "none";
            if (startBtn) {
                startBtn.textContent = "Resume";
                startBtn.style.display = "inline-block";
            }
        } catch (error) {
            console.error(error);
        }
    }
}