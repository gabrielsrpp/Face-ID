// Configuração da API
const API_BASE_URL = 'http://localhost:3000/api';

// Variável para verificar se os modelos foram carregados
let modelsLoaded = false;

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
            
            // Atualiza a lista
            await renderUsersList();
            
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