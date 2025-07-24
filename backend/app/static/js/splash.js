document.addEventListener("DOMContentLoaded", function () {
    const text = "Online Productivity Tracker";
    let index = 0;
    const speed = 120;

    function typeWriter() {
        if (index < text.length) {
            document.getElementById("typing-text").innerHTML += text.charAt(index);
            index++;
            setTimeout(typeWriter, speed);
        } else {
            showAuthButtons();
        }
    }

    function showAuthButtons() {
        const buttons = document.getElementById("auth-buttons");
        buttons.style.display = "block";
        buttons.style.opacity = 0;

        let opacity = 0;
        const fadeIn = setInterval(() => {
            if (opacity >= 1) {
                clearInterval(fadeIn);
            } else {
                opacity += 0.05;
                buttons.style.opacity = opacity;
            }
        }, 50);
    }

    typeWriter();
});
