async function fetchAnalyticsTasks() {
  try {
    const res = await fetch("/api/tasks/", {
      credentials: "include",
    });
    if (!res.ok) {
      console.error("Failed to fetch tasks");
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return [];
  }
}

function renderCompletionChart(tasks) {
  const completed = tasks.filter(t => t.is_completed === true).length;
  const pending = tasks.length - completed;

  new Chart(document.getElementById("completionChart"), {
    type: "doughnut",
    data: {
      labels: ["Completed", "Pending"],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ["#4caf50", "#f44336"],
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderCategoryChart(tasks) {
  const categoryMap = {};
  tasks.forEach(task => {
    categoryMap[task.category] = (categoryMap[task.category] || 0) + 1;
  });

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);

  new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ["#2196f3", "#ff9800", "#9c27b0", "#03a9f4", "#8bc34a"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function renderPriorityChart(tasks) {
  const priorityMap = {};
  tasks.forEach(task => {
    priorityMap[task.priority] = (priorityMap[task.priority] || 0) + 1;
  });

  const labels = Object.keys(priorityMap);
  const values = Object.values(priorityMap);

  new Chart(document.getElementById("priorityChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Tasks by Priority",
        data: values,
        backgroundColor: ["#ffeb3b", "#ff9800", "#f44336", "#03a9f4"]
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });
}

function renderTaskWiseCharts(tasks) {
  const container = document.getElementById("taskWiseContainer");
  container.innerHTML = "";

  if (tasks.length === 0) {
    document.getElementById("noTaskMsg").style.display = "block";
    return;
  }

  document.getElementById("noTaskMsg").style.display = "none";

  tasks.forEach((task, i) => {
    const div = document.createElement("div");
    div.className = "col-md-4 text-center mb-4";
    div.innerHTML = `
      <canvas id="taskChart${i}" width="180" height="180"></canvas>
      <p class="mt-2">${task.title}</p>
    `;
    container.appendChild(div);

    const completed = task.is_completed ? 1 : 0;
    const pending = 1 - completed;

    new Chart(document.getElementById(`taskChart${i}`), {
      type: "doughnut",
      data: {
        labels: ["Completed", "Pending"],
        datasets: [{
          data: [completed, pending],
          backgroundColor: ["#4caf50", "#e0e0e0"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  });
}

async function fetchTimePerTask() {
  try {
    const res = await fetch('/api/analytics/time-per-task');
    if (!res.ok) throw new Error('Failed to fetch task durations');
    const data = await res.json();

    const labels = data.map(entry => entry.task_title);
    const durations = data.map(entry => entry.total_minutes);

    const ctx = document.getElementById('timePerTaskChart').getContext('2d');
   new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [{
      label: 'Time Spent (mins)',
      data: durations,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderRadius: 5,
      borderSkipped: false,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Time Spent per Task',
        color: '#ffffff',
        font: {
          size: 16,
          family: 'sans-serif',
          weight: 'bold'
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.x} minutes`;
          }
        }
      }
    },
   scales: {
  x: {
    beginAtZero: true,
    title: {
      display: true,
      text: 'Minutes',
      color: '#ffffff'
    },
    ticks: {
      color: '#ffffff',
      stepSize: 5
    },
    grid: {
      color: '#444444'
    }
  },
  y: {
    title: {
      display: true,
      text: 'Tasks',
      color: '#ffffff'
    },
    ticks: {
      color: '#ffffff'
    },
    grid: {
      color: '#444444'
    }
  }
}
  }
});
  } catch (err) {
    console.error(err);
  }
}

async function populateAnalyticsSummary() {
  try {
    const res = await fetch("/api/analytics/user-summary", {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch analytics summary");

    const data = await res.json();

    document.getElementById("totalTasks").innerText = data.total_tasks;
    document.getElementById("completedTasks").innerText = data.completed_tasks;
    document.getElementById("pendingTasks").innerText = data.pending_tasks;

    const time = parseFloat(data.total_time_spent_minutes);
    const timeDisplay = time < 1
      ? `${Math.round(time * 60)} seconds`
      : `${time} minutes`;

    document.getElementById("timeSpentBox").innerText = timeDisplay;
  } catch (err) {
    console.error("Analytics summary fetch failed:", err);
  }
}


async function updateAnalytics() {
  const tasks = await fetchAnalyticsTasks();

  document.getElementById("completionChartContainer").innerHTML = `<canvas id="completionChart" width="200" height="200"></canvas>`;

  renderCompletionChart(tasks);
  renderCategoryChart(tasks);
  renderPriorityChart(tasks);
  renderTaskWiseCharts(tasks);
}

document.addEventListener("taskStatusChanged", async () => {
  console.log("taskStatusChanged triggered - refreshing analytics...");
  await populateAnalyticsSummary();
  await updateAnalytics();
  await fetchTimePerTask(); 
});


document.getElementById("downloadAnalyticsBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const total = document.getElementById("totalTasks")?.innerText || "0";
  const completed = document.getElementById("completedTasks")?.innerText || "0";
  const pending = document.getElementById("pendingTasks")?.innerText || "0";
  const timeSpent = document.getElementById("timeSpentBox")?.innerText || "0";

  doc.setFontSize(30);
  doc.text("Productivity Tracker - Analytics Report", 20, 20);
  doc.setFontSize(24);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  doc.text(`Total Tasks     : ${total}`, 20, 50);
  doc.text(`Completed Tasks : ${completed}`, 20, 60);
  doc.text(`Pending Tasks   : ${pending}`, 20, 70);
  doc.text(`Time Spent      : ${timeSpent}`, 20, 80);

  const addChartToPDF = (canvasId, title) => {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const imgData = canvas.toDataURL("image/png");
      doc.addPage();
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.addImage(imgData, 'PNG', 15, 30, 180, 90);
    }
  };

  addChartToPDF("completionChart", "Completion Status");
  addChartToPDF("categoryChart", "Category Distribution");
  addChartToPDF("priorityChart", "Priority Distribution");
  addChartToPDF("timePerTaskChart", "Time Spent per Task");


  doc.save("analytics-report.pdf");
});

document.addEventListener("DOMContentLoaded", async () => {
  await populateAnalyticsSummary();
  await updateAnalytics();
  await fetchTimePerTask();
});
