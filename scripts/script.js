// Verifica se face-api.js foi carregado
if (typeof faceapi === 'undefined') {
    throw new Error("face-api.js não foi carregado corretamente!");
}

// Função principal assíncrona
(async () => {
    try {
        console.log("Iniciando configuração...");
        
        // 1. Carrega modelos locais
        await loadLocalModels();
        
        // 2. Inicia a câmera
        await setupCamera();
        
        // 3. Configura controles
        setupControls();
        
        console.log("Sistema pronto para uso!");
    } catch (error) {
        console.error("Erro na inicialização:", error);
        alert(`Erro: ${error.message}`);
    }
})();

// 1. Carrega modelos da pasta /models
async function loadLocalModels() {
    try {
        console.log("Carregando modelos faciais...");
        
        // Versão otimizada para carregar apenas o necessário
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('./models')
        ]);
        
        console.log("Modelos carregados com sucesso!");
    } catch (error) {
        throw new Error(`Falha ao carregar modelos: ${error.message}`);
    }
}

// 2. Configuração da câmera
async function setupCamera() {
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user' // Prioriza câmera frontal
            } 
        });
        
        video.srcObject = stream;
        
        // Espera o vídeo estar pronto
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;
                resolve();
            };
        });
    } catch (error) {
        throw new Error(`Erro na câmera: ${error.message}`);
    }
}

// 3. Controles
function setupControls() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    let isRunning = false;
    let detectionInterval;

    startBtn.addEventListener('click', () => {
        if (isRunning) return;
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        console.log("Iniciando detecção...");
        detectionInterval = setInterval(detectFaces, 100); // 10 FPS
    });

    stopBtn.addEventListener('click', () => {
        if (!isRunning) return;
        
        isRunning = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        clearInterval(detectionInterval);
        clearCanvas();
    });
}

// Detecção facial
async function detectFaces() {
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    
    try {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();
        
        const resizedDetections = faceapi.resizeResults(detections, {
            width: overlay.width,
            height: overlay.height
        });
        
        clearCanvas();
        faceapi.draw.drawDetections(overlay, resizedDetections);
        faceapi.draw.drawFaceLandmarks(overlay, resizedDetections);
        
    } catch (error) {
        console.error("Erro na detecção:", error);
    }
}

// Limpa o canvas
function clearCanvas() {
    const ctx = document.getElementById('overlay').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}