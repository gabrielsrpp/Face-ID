// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Variável para verificar se os modelos foram carregados
let modelsLoaded = false;
let recognitionActive = false;
let recognitionInterval = null;
let labeledDescriptors = [];

// Estatísticas de reconhecimento
let stats = {
    facesDetected: 0,
    facesRecognized: 0,
    lastDetection: null
};

// navegação do menu lateral
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupTheme();
    setupModal();
    
    // Aguarda carregar os modelos antes de configurar o registro
    try {
        await loadModels();
        modelsLoaded = true;
        setupRegisterSection();
        setupRecognitionSection();
        console.log('✅ Sistema inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
    }
    
    renderUsersList();
    const refreshBtn = document.getElementById('refreshUsersBtn');
    if (refreshBtn) refreshBtn.onclick = renderUsersList;
});

// Função para verificar se Face-API está disponível
function checkFaceAPI() {
    if (typeof faceapi === 'undefined') {
        throw new Error('Face-API.js não foi carregada. Verifique se o script está incluído no HTML.');
    }
    return true;
}

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
            // Renderiza users cadastrados ao ativar a aba
            if (sectionId === 'users') {
                renderUsersList();
            }
            // Para o reconhecimento se sair da aba
            if (sectionId !== 'recognize' && recognitionActive) {
                stopRecognition();
            }
            // Carrega usuários para reconhecimento
            if (sectionId === 'recognize') {
                loadUsersForRecognition();
            }
        });
    });
}

// Função para buscar usuários da API
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            throw new Error('Erro ao buscar usuários');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

// Função para buscar usuários para reconhecimento
async function fetchUsersForRecognition() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/recognition`);
        if (!response.ok) {
            throw new Error('Erro ao buscar usuários para reconhecimento');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar usuários para reconhecimento:', error);
        return [];
    }
}

// Função para renderizar a lista dos usuários
async function renderUsersList() {
    const usersSection = document.getElementById('usersListContainer');
    
    // Mostrar loading
    usersSection.innerHTML = `<div class="users-list"><p>Carregando usuários...</p></div>`;
    
    try {
        const users = await fetchUsers();
        let html = '';
        
        if (!users.length) {
            html = `<div class="users-list"><p>Nenhum usuário cadastrado.</p></div>`;
        } else {
            html = `
            <div class="users-list">
                <h2>Usuários Cadastrados (${users.length})</h2>
                <ul>
                    ${users.map(user => `
                        <li class="user-item">
                            <img src="${user.photo}" alt="${user.name}" class="user-photo">
                            <div class="user-info">
                                <div class="user-name">${user.name}</div>
                                <div class="user-date">${new Date(user.createdAt).toLocaleDateString('pt-BR')}</div>
                            </div>
                            <div class="user-actions">
                                <button class="btn-edit" onclick="editUser('${user._id}', '${user.name.replace(/'/g, "\\'")}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-delete" onclick="deleteUser('${user._id}', '${user.name.replace(/'/g, "\\'")}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
        }
        usersSection.innerHTML = html;
    } catch (error) {
        usersSection.innerHTML = `<div class="users-list"><p>Erro ao carregar usuários. Verifique se o servidor está funcionando.</p></div>`;
    }
}

// Função para carregar usuários para reconhecimento
async function loadUsersForRecognition() {
    try {
        const users = await fetchUsersForRecognition();
        labeledDescriptors = users.map(user => {
            const descriptor = new Float32Array(user.descriptor);
            return new faceapi.LabeledFaceDescriptors(user.name, [descriptor]);
        });
        console.log(`✅ ${labeledDescriptors.length} usuários carregados para reconhecimento`);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários para reconhecimento:', error);
    }
}

// Função para cadastrar usuário na API
async function saveUser(name, descriptor, photo) {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                descriptor: descriptor,
                photo: photo
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao cadastrar usuário');
        }

        return data;
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        throw error;
    }
}

// Função para editar usuário
async function updateUser(id, name) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao atualizar usuário');
        }

        return data;
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
    }
}

// Função para deletar usuário
async function removeUser(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao deletar usuário');
        }

        return data;
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        throw error;
    }
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

// Função para iniciar a câmera de reconhecimento
async function startRecognitionCamera() {
    const video = document.getElementById('recognitionVideo');
    if (navigator.mediaDevices && video) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480 
                } 
            });
            video.srcObject = stream;
            return true;
        } catch (err) {
            console.error('Erro ao acessar a câmera:', err);
            return false;
        }
    }
    return false;
}

// Configurar seção de reconhecimento
function setupRecognitionSection() {
    const startBtn = document.getElementById('startRecognitionBtn');
    const stopBtn = document.getElementById('stopRecognitionBtn');
    
    startBtn.onclick = startRecognition;
    stopBtn.onclick = stopRecognition;
}

// Iniciar reconhecimento
async function startRecognition() {
    if (!modelsLoaded) {
        updateRecognitionStatus('Aguarde, os modelos ainda estão carregando...', '#f39c12');
        return;
    }

    if (labeledDescriptors.length === 0) {
        updateRecognitionStatus('Nenhum usuário cadastrado para reconhecer!', '#e74c3c');
        return;
    }

    const startBtn = document.getElementById('startRecognitionBtn');
    const stopBtn = document.getElementById('stopRecognitionBtn');
    
    startBtn.disabled = true;
    updateRecognitionStatus('Iniciando câmera...', '#1761e6');

    const cameraStarted = await startRecognitionCamera();
    if (!cameraStarted) {
        updateRecognitionStatus('Erro ao acessar a câmera!', '#e74c3c');
        startBtn.disabled = false;
        return;
    }

    recognitionActive = true;
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-flex';
    
    updateRecognitionStatus('Reconhecimento ativo - Posicione-se na frente da câmera', '#2ecc40');
    
    // Iniciar loop de reconhecimento
    recognitionInterval = setInterval(performRecognition, 100);
}

// Parar reconhecimento
function stopRecognition() {
    recognitionActive = false;
    
    if (recognitionInterval) {
        clearInterval(recognitionInterval);
        recognitionInterval = null;
    }
    
    const startBtn = document.getElementById('startRecognitionBtn');
    const stopBtn = document.getElementById('stopRecognitionBtn');
    const video = document.getElementById('recognitionVideo');
    const canvas = document.getElementById('recognitionCanvas');
    const ctx = canvas.getContext('2d');
    
    // Parar câmera
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    startBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';
    startBtn.disabled = false;
    
    updateRecognitionStatus('Reconhecimento pausado', '#6c757d');
    resetStats();
}

// Realizar reconhecimento
async function performRecognition() {
    if (!recognitionActive) return;
    
    const video = document.getElementById('recognitionVideo');
    const canvas = document.getElementById('recognitionCanvas');
    const ctx = canvas.getContext('2d');
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    try {
        // Detectar rostos com landmarks e descriptors
        const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detections.length > 0) {
            // Redimensionar detecções para o tamanho do canvas
            const resizedDetections = faceapi.resizeResults(detections, {
                width: canvas.width,
                height: canvas.height
            });
            
            // Criar matcher com os usuários cadastrados
            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            
            // Atualizar estatísticas
            stats.facesDetected = detections.length;
            stats.facesRecognized = 0;
            stats.lastDetection = new Date().toLocaleTimeString('pt-BR');
            
            resizedDetections.forEach(detection => {
                const box = detection.detection.box;
                const match = faceMatcher.findBestMatch(detection.descriptor);
                
                // Configurar estilo do texto
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#1761e6';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                
                let label = match.label;
                let confidence = (1 - match.distance).toFixed(2);
                
                if (match.label !== 'unknown') {
                    stats.facesRecognized++;
                    // Desenhar retângulo azul para pessoa reconhecida
                    ctx.strokeStyle = '#1761e6';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                    
                    // Fundo para o texto
                    ctx.fillStyle = '#1761e6';
                    ctx.fillRect(box.x, box.y - 30, box.width, 30);
                    
                    // Texto do nome
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, box.x + 5, box.y - 10);
                    
                    // Texto da confiança
                    ctx.font = 'normal 12px Arial';
                    ctx.fillText(`${(confidence * 100).toFixed(0)}%`, box.x + 5, box.y + box.height + 15);
                } else {
                    // Desenhar retângulo vermelho para pessoa não reconhecida
                    ctx.strokeStyle = '#e74c3c';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                    
                    // Fundo para o texto
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(box.x, box.y - 30, box.width, 30);
                    
                    // Texto "Desconhecido"
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText('Desconhecido', box.x + 5, box.y - 10);
                }
            });
            
            updateRecognitionStatus(`${stats.facesDetected} rosto(s) detectado(s), ${stats.facesRecognized} reconhecido(s)`, '#2ecc40');
        } else {
            stats.facesDetected = 0;
            stats.facesRecognized = 0;
            updateRecognitionStatus('Nenhum rosto detectado - Posicione-se na frente da câmera', '#f39c12');
        }
        
        // Atualizar cards de informação
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Erro no reconhecimento:', error);
        updateRecognitionStatus('Erro durante o reconhecimento', '#e74c3c');
    }
}

// Atualizar status do reconhecimento
function updateRecognitionStatus(message, color = '#1761e6') {
    const statusDiv = document.getElementById('recognitionStatus');
    statusDiv.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.borderColor = color;
    statusDiv.style.background = `${color}15`;
}

// Atualizar display das estatísticas
function updateStatsDisplay() {
    document.getElementById('facesCount').textContent = stats.facesDetected;
    document.getElementById('recognizedCount').textContent = stats.facesRecognized;
    document.getElementById('lastDetection').textContent = stats.lastDetection || '--';
}

// Resetar estatísticas
function resetStats() {
    stats = {
        facesDetected: 0,
        facesRecognized: 0,
        lastDetection: null
    };
    updateStatsDisplay();
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
        
        // Verificar se os modelos foram carregados
        if (!modelsLoaded) {
            statusDiv.textContent = 'Aguarde, os modelos ainda estão carregando...';
            statusDiv.style.color = '#f39c12';
            return;
        }

        if (!nameInput.value.trim()) {
            statusDiv.textContent = 'Digite o nome do usuário';
            statusDiv.style.color = '#e74c3c';
            return;
        }
        
        statusDiv.textContent = 'Processando...';
        statusDiv.style.color = '#1761e6';
        captureBtn.disabled = true;
        
        try {
            // Verificar se Face-API está disponível
            checkFaceAPI();
            
            // Captura frame do video
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Converter canvas para base64
            const photo = canvas.toDataURL('image/jpeg', 0.8);
            
            // detecta o rosto e extrai o embedding
            const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
            if (!detection) {
                statusDiv.textContent = 'Nenhum rosto detectado! Posicione seu rosto na câmera.';
                statusDiv.style.color = '#e74c3c';
                return;
            }
            
            // Salva na API
            statusDiv.textContent = 'Salvando no banco de dados...';
            await saveUser(nameInput.value.trim(), Array.from(detection.descriptor), photo);
            
            statusDiv.textContent = 'Usuário cadastrado com sucesso!';
            statusDiv.style.color = '#2ecc40';
            nameInput.value = '';
            showSuccessToast('Usuário cadastrado com sucesso!');
            
            // Atualiza a lista e recarrega usuários para reconhecimento
            await renderUsersList();
            await loadUsersForRecognition();
            
        } catch (error) {
            statusDiv.textContent = `Erro: ${error.message}`;
            statusDiv.style.color = '#e74c3c';
            console.error('Erro completo:', error);
        } finally {
            captureBtn.disabled = false;
        }
    };
}

// Configurar modal
function setupModal() {
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.btn-cancel');
    
    // Fechar modal clicando no X
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    // Fechar modal clicando em Cancelar
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    // Fechar modal clicando fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Função para editar usuário (chamada pelos botões)
function editUser(id, currentName) {
    const modal = document.getElementById('editModal');
    const nameInput = document.getElementById('editUserName');
    const saveBtn = document.querySelector('.btn-save');
    
    nameInput.value = currentName;
    modal.classList.add('show');
    nameInput.focus();
    
    // Remover event listeners anteriores
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    // Adicionar novo event listener
    newSaveBtn.onclick = async () => {
        const newName = nameInput.value.trim();
        
        if (!newName) {
            alert('Por favor, digite um nome válido.');
            return;
        }
        
        if (newName === currentName) {
            modal.classList.remove('show');
            return;
        }
        
        try {
            newSaveBtn.disabled = true;
            newSaveBtn.textContent = 'Salvando...';
            
            await updateUser(id, newName);
            
            modal.classList.remove('show');
            showSuccessToast('Usuário atualizado com sucesso!');
            await renderUsersList();
            await loadUsersForRecognition();
            
        } catch (error) {
            alert(`Erro ao atualizar usuário: ${error.message}`);
        } finally {
            newSaveBtn.disabled = false;
            newSaveBtn.textContent = 'Salvar';
        }
    };
}

// Função para deletar usuário (chamada pelos botões)
async function deleteUser(id, name) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
        return;
    }
    
    try {
        await removeUser(id);
        showSuccessToast('Usuário excluído com sucesso!');
        await renderUsersList();
        await loadUsersForRecognition();
    } catch (error) {
        alert(`Erro ao excluir usuário: ${error.message}`);
    }
}

// Toast de sucesso
function showSuccessToast(msg) {
    const toast = document.getElementById('successToast');
    const toastMsg = document.getElementById('successToastMsg');
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
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
    try {
        console.log('🔄 Carregando modelos...');
        
        // Verificar se Face-API está disponível
        checkFaceAPI();
        
        // Usar CDN para os modelos (mais confiável)
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
        
        await Promise.all([
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        
        console.log('✅ Modelos carregados com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar modelos:', error);
        throw new Error('Falha ao carregar modelos de reconhecimento facial');
    }
}