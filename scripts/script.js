// Apenas navegação do menu lateral

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupTheme();
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
        });
    });
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

function updateThemeButton() {
    const themeSwitcher = document.querySelector('.theme-switcher');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeSwitcher.innerHTML = `
        <i class="fas fa-${isDarkMode ? 'sun' : 'moon'}"></i>
        <span>${isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
    `;
}