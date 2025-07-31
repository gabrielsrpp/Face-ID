// navegação do menu lateral
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupTheme();
    await loadModels();
    setupRegisterSection();
});

// Configura navegação do menu
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const sectionId = item.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');

            // Inicia a webcam ao ativar a aba de cadastro
            if (sectionId === 'register') {
                startRegisterCamera();
            }
        });
    });
}

// Função para iniciar a câmera
async function startRegisterCamera() {
    const video = document.getElementById('registerVideo');
    if (navigator.mediaDevices && video) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            alert('Erro ao acessar a câmera: ' + err.message);
        }
    }
}

// Configura tema claro/escuro
function setupTheme() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const savedTheme = localStorage.getItem('faceTheme') || 'light';
    document.body.classList.add(savedTheme + '-mode');
    updateThemeButton();
    themeSwitcher.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('faceTheme', currentTheme);
        updateThemeButton();
    });
}

 async function setupRegisterSection() {
    const video = document.getElementById('registerVideo');
    const captureBtn = document.getElementById('captureBtn');
    const statusDiv = document.getElementById('registerStatus');
    const nameInput = document.getElementById('registerName');

    if (!video || !captureBtn) return;

    captureBtn.onclick = async () => {
        statusDiv.textContent = '';
        if (!nameInput.value) {
            statusDiv.textContent = 'Digite o nome do usuário';
            return;
        }
        // Captura frame do video
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        // detecta o rosto e extrai o embedding
        const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
        if (!detection) {
            statusDiv.textContent = 'Nenhum rosto detectado!';
            return;
        }
        // salva no LocalStorage
        const users = JSON.parse(localStorage.getItem('faceUsers') || '[]');
        users.push({
            name: nameInput.value,
            descriptor: Array.from(detection.descriptor)
        });
        localStorage.setItem('faceUsers', JSON.stringify(users));
        statusDiv.textContent = 'Usuário cadastrado com sucesso!';
        nameInput.value = '';
    };
}


function updateThemeButton() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeSwitcher.innerHTML = `
        <i class="fas fa-${isDarkMode ? 'sun' : 'moon'}"></i>
        <span>${isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
    `;
}

// Carregar modelos
async function loadModels() {
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
}