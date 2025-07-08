import { animateGauge } from './gauge.js';

window.addEventListener('DOMContentLoaded', () => {
    // Animate gauge to 70%
    animateGauge('gaugeContainer', 70, 100);

    document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
        window.location.href = 'analytics.html';
    });

    document.getElementById('downloadAnalyticsBtn').addEventListener('click', () => {
        alert('Download triggered! (Feature coming soon)');
    });

    document.getElementById('getStartedBtn').addEventListener('click', () => {
        window.location.href = 'tasklist.html';
    });
});
