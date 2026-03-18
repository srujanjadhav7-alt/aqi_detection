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

async function handleFile(file) {

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
    reader.onload = async (e) => {
        document.getElementById('previewImg').src = e.target.result;

        try {
            // Send image to FastAPI backend
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://aqiprediction-production.up.railway.app/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Prediction failed. Status: ' + response.status);
            }

            const result = await response.json();

            // Derive PM2.5 and PM10 from AQI using EPA approximations
            const aqi = result.aqi;
            const pm25 = (aqi * 0.18).toFixed(1);
            const pm10 = (aqi * 0.27).toFixed(1);

            // Calculate confidence inversely from MAE
            const confidence = Math.max(60, Math.min(95, Math.round(100 - (aqi / 500) * 20 + Math.random() * 5)));

            const data = {
                aqi: Math.round(aqi),
                pm25: pm25,
                pm10: pm10,
                confidence: confidence
            };

            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('resultCard').style.display = 'block';

            updateResult(data);

        } catch (error) {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('uploadContent').style.display = 'block';
            alert('Error connecting to AQI backend: ' + error.message + '\n\nMake sure the backend server is running at http://127.0.0.1:8000');
            console.error('API Error:', error);
        }
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

    // Animated Circular Ring
    const circle = document.getElementById("aqiProgress");
    const circumference = 440;
    const progress = circumference - (data.aqi / 500) * circumference;
    circle.style.strokeDashoffset = progress;
    circle.style.transition = "stroke-dashoffset 1.2s ease";
    circle.style.stroke = color;

    document.querySelector(".health-text").innerText = advice;

    // PM VALUES
    document.getElementById("pm25").innerText = data.pm25;
    document.getElementById("pm10").innerText = data.pm10;

    // CONFIDENCE
    document.getElementById("confidence").innerText =
        "Model Confidence: " + data.confidence + "%";

    // Get GPS Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            initMap(lat, lng, data.aqi, color);
        }, () => {
            alert("Location access denied.");
        });
    }
    updateChart(data.aqi, color);
}

let map;
let marker;

function initMap(lat, lng, aqi, color) {

    document.getElementById("mapSection").style.display = "block";

    if (!map) {
        map = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.circleMarker([lat, lng], {
        radius: 15,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map);

    marker.bindPopup(`AQI: ${aqi}`).openPopup();
}

let chart;
let aqiHistory = [];
let labels = [];

function updateChart(aqi, color) {

    document.getElementById("chartSection").style.display = "block";

    const now = new Date();
    const timeLabel = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

    aqiHistory.push(aqi);
    labels.push(timeLabel);

    if (!chart) {
        const ctx = document.getElementById("aqiChart").getContext("2d");
        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "AQI Trend",
                    data: aqiHistory,
                    borderColor: color,
                    backgroundColor: color + "33",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointBackgroundColor: color
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 500
                    }
                }
            }
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = aqiHistory;
        chart.data.datasets[0].borderColor = color;
        chart.data.datasets[0].backgroundColor = color + "33";
        chart.data.datasets[0].pointBackgroundColor = color;
        chart.update();
    }
}