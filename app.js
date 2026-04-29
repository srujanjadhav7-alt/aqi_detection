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
            // Send image to Railway backend
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://web-production-494e8f.up.railway.app/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Prediction failed. Status: ' + response.status);
            }

            const result = await response.json();

            if (result.status !== "success") {
                throw new Error(result.message || "Prediction failed");
            }

            // Derive PM2.5 and PM10 from AQI
            const aqi = result.aqi;
            const pm25 = (aqi * 0.18).toFixed(1);
            const pm10 = (aqi * 0.27).toFixed(1);

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
            alert('Error connecting to AQI backend. Please try again.');
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

function updateResult(data) {

    // AQI value
    document.getElementById("aqiValue").innerText = data.aqi;

    // Category
    let category = "Good";
    if (data.aqi > 50) category = "Moderate";
    if (data.aqi > 100) category = "Unhealthy";
    if (data.aqi > 150) category = "Very Unhealthy";
    if (data.aqi > 200) category = "Hazardous";

    document.getElementById("aqiCategory").innerText = category;

    // Progress circle (if exists)
    const circle = document.getElementById("aqiProgress");
    if (circle) {
        const circumference = 440;
        const offset = circumference - (data.aqi / 500) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    // PM values
    document.getElementById("pm25").innerText = data.pm25;
    document.getElementById("pm10").innerText = data.pm10;
}
