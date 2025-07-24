export function animateGauge(containerId, percentage, totalTasks) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '300');
    svg.setAttribute('height', '150');
    svg.setAttribute('viewBox', '0 0 300 150');

    
    const bgArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgArc.setAttribute('d', describeArc(150, 150, 120, 180, 0));
    bgArc.setAttribute('fill', 'none');
    bgArc.setAttribute('stroke', '#e0e0e0');
    bgArc.setAttribute('stroke-width', '20');
    bgArc.setAttribute('stroke-linecap', 'round');
    svg.appendChild(bgArc);

    
    const fgArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fgArc.setAttribute('fill', 'none');
    fgArc.setAttribute('stroke', '#5d18dc'); 
    fgArc.setAttribute('stroke-width', '20');
    fgArc.setAttribute('stroke-linecap', 'round');
    svg.appendChild(fgArc);

    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '150');
    text.setAttribute('y', '90');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '32');
    text.setAttribute('fill', '#ffffff');
    text.textContent = '0%';
    svg.appendChild(text);


    const completionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    completionText.setAttribute('x', '150');
    completionText.setAttribute('y', '120');
    completionText.setAttribute('text-anchor', 'middle');
    completionText.setAttribute('font-size', '18');
    completionText.setAttribute('fill', '#ffffff');
    completionText.textContent = `Completed: 0/${totalTasks}`;
    svg.appendChild(completionText);

    container.appendChild(svg);

    let currentPercentage = 0;
    let currentTasks = 0;
    const targetAngle = 180 * (percentage / 100);
    const totalAngle = 180;
    const step = 1; // Increase per frame
    const interval = setInterval(() => {
        if (currentPercentage >= percentage) {
            clearInterval(interval);
            return;
        }
        currentPercentage++;
        currentTasks = Math.round((currentPercentage / 100) * totalTasks);

        const newArc = describeArc(150, 150, 120, 180, 180 - (totalAngle * currentPercentage / 100));
        fgArc.setAttribute('d', newArc);
        text.textContent = `${currentPercentage}%`;
        completionText.textContent = `Completed: ${currentTasks}/${totalTasks}`;
    }, 15);
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY - (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");

    return d;
}
