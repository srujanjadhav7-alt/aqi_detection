// Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    html.classList.add('dark');
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', html.classList.contains('dark'));
});

// Drag and Drop
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    document.getElementById('uploadContent').style.display = 'none';
    document.getElementById('loadingSpinner').style.display = 'block';

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        
        setTimeout(() => {

            const data = mockPrediction();

            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('resultCard').style.display = 'block';

            updateResult(data);

        }, 1500);
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    document.getElementById('uploadContent').style.display = 'block';
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('resultCard').style.display = 'none';
    fileInput.value = '';
    uploadZone.classList.remove('dragover');
}

// Contact Form
function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const button = form.querySelector('button');
    const originalText = button.textContent;
    button.textContent = '✓ Message Sent!';
    button.disabled = true;
    
    setTimeout(() => {
        form.reset();
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Navbar shadow
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('nav');
    if (window.scrollY > 50) {
        navbar.classList.add('shadow-lg');
    } else {
        navbar.classList.remove('shadow-lg');
    }
});

// Scroll animation
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('slide-left');
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});

// Mock Prediction
function mockPrediction() {
    return {
        aqi: Math.floor(Math.random() * 300) + 50,
        pm25: (Math.random() * 100).toFixed(1),
        pm10: (Math.random() * 150).toFixed(1),
        confidence: Math.floor(Math.random() * 10) + 90,
        latitude: 12.97,
        longitude: 77.59
    };
}

// Update Result
function updateResult(data) {

    const aqiValue = document.getElementById("aqiValue");
    const categoryLabel = document.getElementById("aqiCategory");
    const progressBar = document.querySelector(".progress-fill");
    

    aqiValue.innerText = data.aqi;

    const percent = (data.aqi / 500) * 100;
    progressBar.style.width = percent + "%";

    let category = "";
    let color = "";
    let advice = "";

    if (data.aqi <= 50) {
        category = "Good";
        color = "#22c55e";
        advice = "Air quality is excellent. Enjoy outdoor activities 🌿";
    }
    else if (data.aqi <= 100) {
        category = "Moderate";
        color = "#eab308";
        advice = "Air quality is acceptable for most people.";
    }
    else if (data.aqi <= 200) {
        category = "Unhealthy";
        color = "#f97316";
        advice = "Sensitive groups should limit outdoor exposure.";
    }
    else if (data.aqi <= 300) {
        category = "Very Unhealthy";
        color = "#ef4444";
        advice = "Avoid outdoor activities. Wear a mask if necessary.";
    }
    else {
        category = "Hazardous";
        color = "#7c3aed";
        advice = "Health alert! Stay indoors immediately.";
    }

    categoryLabel.innerText = category;
    categoryLabel.style.background = color;
    progressBar.style.background = color;
    aqiValue.style.color = color;

    // 🔥 Animated Circular Ring
    const circle = document.getElementById("aqiProgress");
    const circumference = 440;

    const progress = circumference - (data.aqi / 500) * circumference;

    circle.style.strokeDashoffset = progress;
    circle.style.transition = "stroke-dashoffset 1.2s ease";
    circle.style.stroke = color;

    document.querySelector(".health-text").innerText = advice;

    // 🔥 PM VALUES (FIXED)
    document.getElementById("pm25").innerText = data.pm25;
    document.getElementById("pm10").innerText = data.pm10;

    // 🔥 CONFIDENCE (FIXED)
    document.getElementById("confidence").innerText =
        "Model Confidence: " + data.confidence + "%";
}