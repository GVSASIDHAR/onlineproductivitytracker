import { animateGauge } from './gauge.js';


(async () => {
  try {
    const res = await fetch("/api/auth/whoami", {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Not authenticated");

    const user = await res.json();
    console.log("Logged in as:", user.email);
  } catch (err) {
    console.warn("Auth failed, redirecting...");
    window.location.href = "/";
  }
})();

async function fetchTasks() {
  const response = await fetch("/api/tasks", {
    credentials: "include",
  });

  if (!response.ok) throw new Error("Failed to fetch tasks");

  return await response.json();
}


function calculateProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.is_completed === true).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { percentage, total, completed };
}


window.addEventListener('DOMContentLoaded', async () => {
  const gaugeContainer = document.getElementById("gaugeContainer");

  try {
    const tasks = await fetchTasks();
    const { percentage, total, completed } = calculateProgress(tasks);

    if (total === 0) {
      gaugeContainer.innerHTML = `
        <div style="text-align: center; font-size: 1rem; font-weight: 500; color: #888; padding: 1.5rem;">
          No tasks added to show the overall progress.<br>
          Add tasks and complete them to see progress.
        </div>
      `;
    } else {
      animateGauge("gaugeContainer", percentage, 100);
      const progressText = document.getElementById("progressText");
      if (progressText) {
        progressText.textContent = `Progress: ${percentage}% (${completed} / ${total})`;
      }
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
    gaugeContainer.innerHTML = `
      <div style="text-align: center; color: red; padding: 1rem;">
         Failed to load progress. Please try again later.
      </div>
    `;
  }


  document.getElementById('viewAnalyticsBtn')?.addEventListener('click', () => {
    window.location.href = '/analytics';
  });

  document.getElementById('downloadAnalyticsBtn')?.addEventListener('click', async() => {
    const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const total = document.getElementById("totalTasks")?.innerText || "0";
  const completed = document.getElementById("completedTasks")?.innerText || "0";
  const pending = document.getElementById("pendingTasks")?.innerText || "0";

  doc.setFontSize(16);
  doc.text("Productivity Tracker - Analytics Report", 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  doc.text(`Total Tasks     : ${total}`, 20, 50);
  doc.text(`Completed Tasks : ${completed}`, 20, 60);
  doc.text(`Pending Tasks   : ${pending}`, 20, 70);

  doc.save("analytics-report.pdf");
  });

  document.getElementById('getStartedBtn')?.addEventListener('click', () => {
    window.location.href = '/tasklist';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });
    window.location.href = "/";
  });
});

document.addEventListener("taskStatusChanged", async () => {
  console.log(" Detected task status change from anywhere → Updating gauge...");

  const gaugeContainer = document.getElementById("gaugeContainer");

  try {
    const tasks = await fetchTasks();
    const { percentage, total, completed } = calculateProgress(tasks);

    if (total === 0) {
      gaugeContainer.innerHTML = `
        <div style="text-align: center; font-size: 1rem; font-weight: 500; color: #888; padding: 1.5rem;">
          No tasks added to show the overall progress.<br>
          Add tasks and complete them to see progress.
        </div>
      `;
    } else {
      animateGauge("gaugeContainer", percentage, total);
      const progressText = document.getElementById("progressText");
      if (progressText) {
        progressText.textContent = `Progress: ${percentage}% (${completed} / ${total})`;
      }
    }
  } catch (err) {
    console.error("Failed to dynamically update gauge:", err);
    gaugeContainer.innerHTML = `
      <div style="text-align: center; color: red; padding: 1rem;">
         Failed to update progress. Please try again later.
      </div>
    `;
  }
});