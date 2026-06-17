// Função principal para alternar entre as telas
function showScreen(screenId) {
    // Esconde todas as telas removendo a classe 'active'
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Mostra a tela desejada adicionando a classe 'active'
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Esconder ou mostrar a bottom nav em telas de login, home e landing
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        const shouldHide = ['home-screen', 'login-screen', 'register-screen', 'recover-screen', 'landing-screen', 'bio-screen', 'profile-screen', 'favorites-screen', 'applications-screen'];
        if (shouldHide.includes(screenId)) {
            bottomNav.classList.add('hidden');
        } else {
            bottomNav.classList.remove('hidden');
        }
    }

    const globalScrollbar = document.getElementById('global-scrollbar');
    const showGlobal = ['landing-screen', 'bio-screen', 'settings-screen'].includes(screenId);
    if (globalScrollbar) {
        globalScrollbar.classList.toggle('hidden', !showGlobal);
    }

    if (screenId === 'landing-screen') {
        updateScrollThumb('landing-screen', 'landing-scroll-thumb');
    }

    if (screenId === 'bio-screen') {
        updateScrollThumb('bio-screen', 'bio-scroll-thumb');
    }

    // Carregar dados específicos das telas
    if (screenId === 'profile-screen') {
        setTimeout(() => loadProfileData(), 100);
    } else if (screenId === 'favorites-screen') {
        setTimeout(() => loadFavorites(), 100);
    } else if (screenId === 'applications-screen') {
        setTimeout(() => loadApplications(), 100);
    } else if (screenId === 'messages-screen') {
        setTimeout(() => loadMessages(), 100);
    } else if (screenId === 'settings-screen') {
        setTimeout(() => loadSettingsProgress(), 100);
    } else if (screenId === 'home-screen') {
        setTimeout(() => updateHomeProfileSummary(), 100);
    }

    // rebind global scrollbar to the new active screen and update thumb
    const active = getActiveScrollableScreen();
    if (!showGlobal) {
        if (_globalScrollListener && _globalCurrentScreen) {
            _globalCurrentScreen.removeEventListener('scroll', _globalScrollListener);
        }
        _globalCurrentScreen = null;
        _globalScrollListener = null;
    } else {
        if (_globalScrollListener && _globalCurrentScreen && _globalCurrentScreen !== active) {
            _globalCurrentScreen.removeEventListener('scroll', _globalScrollListener);
        }
        if (active && _globalCurrentScreen !== active) {
            _globalCurrentScreen = active;
            _globalScrollListener = () => updateGlobalThumb();
            _globalCurrentScreen.addEventListener('scroll', _globalScrollListener);
        }
    }

    if (showGlobal && typeof updateGlobalThumb === 'function') updateGlobalThumb();
}

function toggleLandingSheet() {
    const landing = document.getElementById('landing-screen');
    if (!landing) return;
    landing.classList.toggle('expanded');
}

function initLandingHandle() {
    const handle = document.querySelector('.landing-handle');
    const card = document.querySelector('.landing-card');
    const screen = document.getElementById('landing-screen');
    if (!handle || !card || !screen) return;

    let isDragging = false;
    let startY = 0;
    let startTranslate = 0;
    const maxUp = -120; // expanded translateY
    const maxDown = 0; // collapsed translateY

    const getCurrentTranslate = () => {
        const t = window.getComputedStyle(card).transform;
        if (!t || t === 'none') return 0;
        const m = t.match(/matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^\)]+)\)/);
        return m ? parseFloat(m[6]) : 0;
    };

    const applyTranslate = (y) => {
        card.style.transition = 'transform 0s';
        card.style.transform = `translateY(${y}px)`;
        // keep expanded class in sync for other styles
        if (y <= maxUp + 2) screen.classList.add('expanded');
        else if (y >= -2) screen.classList.remove('expanded');
        // update global thumb position live
        if (typeof updateGlobalThumb === 'function') updateGlobalThumb();
    };

    const endDrag = () => {
        isDragging = false;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        // decide final state
        const cur = getCurrentTranslate();
        // if more than half pulled up -> expand
        if (cur < (maxUp / 2)) {
            card.style.transition = '';
            card.style.transform = `translateY(${maxUp}px)`;
            screen.classList.add('expanded');
        } else {
            card.style.transition = '';
            card.style.transform = `translateY(${maxDown}px)`;
            screen.classList.remove('expanded');
        }
        // refresh scrollbar thumb
        if (typeof updateGlobalThumb === 'function') setTimeout(updateGlobalThumb, 80);
    };

    const onPointerMove = (ev) => {
        if (!isDragging) return;
        const delta = ev.clientY - startY;
        const newY = Math.min(maxDown, Math.max(maxUp, startTranslate + delta));
        applyTranslate(newY);
    };

    const onPointerUp = () => endDrag();

    handle.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        isDragging = true;
        startY = ev.clientY;
        startTranslate = getCurrentTranslate();
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });

    // also allow click to toggle
    handle.addEventListener('click', (ev) => {
        // ignore click if it was a real drag
        if (isDragging) return;
        toggleLandingSheet();
        if (typeof updateGlobalThumb === 'function') setTimeout(updateGlobalThumb, 120);
    });
}

function updateScrollThumb(screenId, thumbId) {
    const screen = document.getElementById(screenId);
    const thumb = document.getElementById(thumbId);
    if (!screen || !thumb) return;

    const contentHeight = screen.scrollHeight;
    const visibleHeight = screen.clientHeight;
    const maxScroll = contentHeight - visibleHeight;

    if (maxScroll <= 0) {
        thumb.style.transform = 'translateY(0)';
        thumb.style.height = '44px';
        thumb.style.opacity = '0.4';
        return;
    }

    const trackHeight = visibleHeight - 12;
    const thumbHeight = Math.max(48, Math.min(trackHeight * (visibleHeight / contentHeight), trackHeight));
    const maxThumbTranslate = Math.max(0, trackHeight - thumbHeight);
    const scrollRatio = screen.scrollTop / maxScroll;
    const translateY = scrollRatio * maxThumbTranslate;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${translateY}px)`;
    thumb.style.opacity = '1';
}

function scrollScreen(screenId, direction) {
    const screen = document.getElementById(screenId);
    if (!screen) return;
    screen.scrollBy({ top: direction * 180, left: 0, behavior: 'smooth' });
}

function initScrollBar(screenId, thumbId) {
    const screen = document.getElementById(screenId);
    const thumb = document.getElementById(thumbId);
    if (!screen || !thumb) return;

    let isDragging = false;
    let startY = 0;
    let startTranslate = 0;

    const contentHeight = () => screen.scrollHeight;
    const visibleHeight = () => screen.clientHeight;
    const trackHeight = () => visibleHeight() - 12;
    const thumbHeight = () => Math.max(48, Math.min(trackHeight() * (visibleHeight() / contentHeight()), trackHeight()));
    const maxScroll = () => contentHeight() - visibleHeight();
    const maxThumbTranslate = () => Math.max(0, trackHeight() - thumbHeight());

    const updateThumb = () => {
        if (maxScroll() <= 0) {
            thumb.style.transform = 'translateY(0)';
            thumb.style.height = '44px';
            return;
        }

        const ratio = screen.scrollTop / maxScroll();
        const translateY = ratio * maxThumbTranslate();
        thumb.style.height = `${thumbHeight()}px`;
        thumb.style.transform = `translateY(${translateY}px)`;
    };

    const getCurrentTranslate = () => {
        const transform = window.getComputedStyle(thumb).transform;
        if (!transform || transform === 'none') return 0;
        const values = transform.match(/matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^\)]+)\)/);
        return values ? parseFloat(values[6]) : 0;
    };

    const onPointerMove = (event) => {
        if (!isDragging) return;
        const delta = event.clientY - startY;
        const newTranslate = Math.min(Math.max(0, startTranslate + delta), maxThumbTranslate());
        const ratio = newTranslate / Math.max(1, maxThumbTranslate());
        screen.scrollTop = ratio * maxScroll();
        thumb.style.transform = `translateY(${newTranslate}px)`;
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };

    thumb.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        isDragging = true;
        startY = event.clientY;
        startTranslate = getCurrentTranslate();
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });

    screen.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);
    updateThumb();
}

// Funções para gerenciar o LocalStorage
function getUsers() {
    const users = localStorage.getItem('oportuniza-users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('oportuniza-users', JSON.stringify(users));
}

function getCurrentUser() {
    const raw = localStorage.getItem('oportuniza-current-user');
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('oportuniza-current-user', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('oportuniza-current-user');
}

function getUserStorageKey(key) {
    const currentUser = getCurrentUser();
    const email = currentUser && currentUser.email ? currentUser.email : 'guest';
    return `oportuniza-${key}-${email}`;
}

function saveProfileName(name) {
    localStorage.setItem(getUserStorageKey('profileName'), name);
}

function saveProfilePhoto(photo) {
    localStorage.setItem(getUserStorageKey('profilePhoto'), photo);
}

function saveProfileDataKey(data) {
    localStorage.setItem(getUserStorageKey('profileData'), JSON.stringify(data));
}

function getProfileName() {
    return localStorage.getItem(getUserStorageKey('profileName'));
}

function getProfilePhoto() {
    return localStorage.getItem(getUserStorageKey('profilePhoto'));
}

function getProfileData() {
    return JSON.parse(localStorage.getItem(getUserStorageKey('profileData')) || '{}');
}

// Lógica de Cadastro
function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
    }

    const users = getUsers();
    if (users.find(user => user.email === email)) {
        showError('Este e-mail já está cadastrado!');
        return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    setCurrentUser({ name, email });
    saveProfileName(name);
    showSuccess('Conta criada com sucesso!');
    
    // Limpa os campos e volta para login
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('user-display-name').innerText = name;
    showScreen('login-screen');
}

// Lógica de Login
function handleLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Atualiza o nome na tela de Home
        document.getElementById('user-display-name').innerText = user.name;
        setCurrentUser({ name: user.name, email: user.email });
        saveProfileName(user.name);
        
        // Navega para a Home
        showScreen('home-screen');
        
        // Limpa os campos
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } else {
        showError('E-mail ou senha incorretos!');
    }
}

// Lógica de Recuperação de Senha
function handleRecover() {
    const email = document.getElementById('recover-email').value;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (user) {
        showSuccess('Enviamos instruções para recuperar sua senha para o e-mail informado.');
        showScreen('login-screen');
    } else {
        showError('E-mail não encontrado no sistema.');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.width === '250px') {
        sidebar.style.width = '0';
    } else {
        sidebar.style.width = '250px';
    }
}

// Função para mostrar o card da vaga no mapa
function toggleVacancyCard() {
    const card = document.getElementById('vacancy-card');
    if (card) card.classList.toggle('active');
}

function applyMapVacancy() {
    currentJobId = 1;
    startApplication();
}

// Contexto atual das mensagens: 'general' | 'jobs' | 'courses'
let currentMessageContext = 'general';
let confirmCallback = null;

// Fechar o card se clicar no mapa novamente
document.querySelector('iframe').onclick = function() {
    document.getElementById('vacancy-card').classList.remove('active');
};

// ====================== DETALHES DAS VAGAS ======================
let currentJobId = null;
let detailReturnScreen = null;

function showJobDetail(id, origin = 'jobs') {
    currentJobId = id;
    detailReturnScreen = origin === 'favorites' ? 'home-screen' : 'jobs-screen';
    const card = document.getElementById('job-detail-card');
    if (!card) {
        showError("Erro: Tela de detalhes não encontrada!");
        return;
    }

    let html = '';

    if (id === 1) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="images/Bosch-Logo-2002-2018.png" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Desenvolvedor Full Stack</h3>
                    <p style="color: var(--text-muted);">Bosch • Araucária, PR</p>
                </div>
            </div>
            <h2 style="color: #0071e3;">R$ 5.800 - R$ 8.200</h2>
            <p><strong>Contrato:</strong> CLT • Pleno</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>React, Node.js e Python</li>
                <li>Experiência com APIs</li>
                <li>Inglês intermediário</li>
            </ul>
            <h4>Benefícios</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Plano de saúde</li>
                <li>PLR</li>
                <li>Vale Alimentação</li>
            </ul>
        `;
    } 
    else if (id === 2) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="images/Bosch-Logo-2002-2018.png" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Designer de UI/UX</h3>
                    <p style="color: var(--text-muted);">Bosch • Araucária, PR</p>
                </div>
            </div>
            <h2 style="color: #0071e3;">R$ 4.900 - R$ 7.000</h2>
            <p><strong>Contrato:</strong> CLT • Júnior/Pleno</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Figma e Adobe XD</li>
                <li>Prototipação</li>
                <li>Portfólio</li>
            </ul>
        `;
    } 
    else if (id === 3) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="images/r.jpg" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Analista de Dados Júnior</h3>
                    <p style="color: var(--text-muted);">Mondelez • Curitiba, PR</p>
                </div>
            </div>
            <h2 style="color: #e30613;">R$ 3.800 - R$ 5.200</h2>
            <p><strong>Contrato:</strong> CLT • Júnior</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Power BI, SQL e Excel Avançado</li>
                <li>Boa capacidade analítica</li>
            </ul>
        `;
    }
    else if (id === 4) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" style="height: 40px; border-radius: 8px;">
                <div>
                    <h3>Engenheiro de Dados Sênior</h3>
                    <p style="color: var(--text-muted);">Google • São Paulo, SP</p>
                </div>
            </div>
            <h2 style="color: #4285F4;">R$ 12.500 - R$ 17.000</h2>
            <p><strong>Contrato:</strong> CLT • Sênior</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>BigQuery, Python e Spark</li>
                <li>Engenharia de dados em nuvem</li>
                <li>Experiência com pipelines escaláveis</li>
            </ul>
        `;
    }
    else if (id === 5) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Analista de Logística</h3>
                    <p style="color: var(--text-muted);">Amazon • Barueri, SP</p>
                </div>
            </div>
            <h2 style="color: #FF9900;">R$ 6.500 - R$ 9.000</h2>
            <p><strong>Contrato:</strong> CLT • Pleno</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Gestão de estoque e transporte</li>
                <li>Melhoria contínua em logística</li>
                <li>Experiência com WMS e ERP</li>
            </ul>
        `;
    }
    else if (id === 6) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Product Manager</h3>
                    <p style="color: var(--text-muted);">Microsoft • Campinas, SP</p>
                </div>
            </div>
            <h2 style="color: #F25022;">R$ 13.000 - R$ 18.500</h2>
            <p><strong>Contrato:</strong> CLT • Sênior</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Gestão de produtos de software</li>
                <li>Roadmap e estratégia de lançamento</li>
                <li>Comunicação com times ágeis</li>
            </ul>
        `;
    }
    else if (id === 7) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style="height: 45px; border-radius: 8px;">
                <div>
                    <h3>Especialista em Suporte Técnico</h3>
                    <p style="color: var(--text-muted);">Apple • São Paulo, SP</p>
                </div>
            </div>
            <h2 style="color: #000000;">R$ 8.200 - R$ 10.500</h2>
            <p><strong>Contrato:</strong> CLT • Pleno</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Suporte a produtos Apple</li>
                <li>Atendimento ao cliente</li>
                <li>Conhecimento de sistemas iOS e macOS</li>
            </ul>
        `;
    }
    else if (id === 8) {
        html = `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" style="height: 40px; border-radius: 8px;">
                <div>
                    <h3>Especialista em Marketing Digital</h3>
                    <p style="color: var(--text-muted);">Netflix • Rio de Janeiro, RJ</p>
                </div>
            </div>
            <h2 style="color: #E50914;">R$ 9.000 - R$ 12.500</h2>
            <p><strong>Contrato:</strong> CLT • Pleno</p>
            <hr style="margin: 20px 0;">
            <h4>Requisitos</h4>
            <ul style="padding-left: 20px; line-height: 1.8;">
                <li>Campanhas em redes sociais</li>
                <li>Insights de audiência e métricas</li>
                <li>Planejamento de lançamentos</li>
            </ul>
        `;
    }

    card.innerHTML = html;
    showScreen('job-detail-screen');
}

function backFromDetail() {
    if (detailReturnScreen) {
        showScreen(detailReturnScreen);
    } else {
        showScreen('home-screen');
    }
}

function startApplication() {
    const jobInfo = document.getElementById('application-job-info');
    let html = '';

    if (currentJobId === 1) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="images/Bosch-Logo-2002-2018.png" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Desenvolvedor Full Stack</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Bosch • Araucária, PR</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 2) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="images/Bosch-Logo-2002-2018.png" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Designer de UI/UX</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Bosch • Araucária, PR</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 3) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="images/r.jpg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Analista de Dados Júnior</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Mondelez • Curitiba, PR</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 4) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Engenheiro de Dados Sênior</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Google • São Paulo, SP</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 5) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Analista de Logística</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Amazon • Barueri, SP</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 6) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Product Manager</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Microsoft • Campinas, SP</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 7) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Especialista em Suporte Técnico</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Apple • São Paulo, SP</p>
                </div>
            </div>
        `;
    } else if (currentJobId === 8) {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" style="height: 45px; border-radius: 6px;">
                <div>
                    <h3 style="margin: 0;">Especialista em Marketing Digital</h3>
                    <p style="margin: 5px 0 0; color: var(--text-muted);">Netflix • Rio de Janeiro, RJ</p>
                </div>
            </div>
        `;
    } else {
        html = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <p style="color: var(--text-muted);">Vaga desconhecida</p>
            </div>
        `;
    }

    jobInfo.innerHTML = html;
    showScreen('application-screen');
}

function submitApplication() {
    // Registrar no histórico de candidaturas
    const jobTitle = document.querySelector('#application-job-info h3')?.textContent || 'Vaga';
    const company = document.querySelector('#application-job-info p')?.textContent?.split('•')[0]?.trim() || 'Empresa';
    
    addApplication(currentJobId, jobTitle, company);
    
    // Volta para a tela inicial
    showScreen('home-screen');
    
    // Mostra o modal de sucesso bonito
    showSuccess("✅ Candidatura enviada com sucesso!<br><small>Obrigado! Entraremos em contato em breve.</small>");
}

// ====================== DETALHES DO CURSO (Tela completa) ======================
let currentCourseCard = null;

function showCourseDetail(courseCard, origin = 'courses') {
    currentCourseCard = courseCard;
    detailReturnScreen = origin === 'favorites' ? 'home-screen' : 'courses-screen';

    const title = courseCard.querySelector('h3').textContent;
    const instructor = courseCard.querySelector('.course-instructor').textContent;
    const desc = courseCard.querySelector('.course-desc').textContent;
    const level = courseCard.querySelector('.course-level').textContent;
    const metaSpans = courseCard.querySelectorAll('.course-meta span');
    const duration = metaSpans[0] ? metaSpans[0].textContent.replace(/<i.*?<\/i>/g, '').trim() : 'N/A';
    const rating = metaSpans[1] ? metaSpans[1].textContent.replace(/<i.*?<\/i>/g, '').trim() : 'N/A';
    const imgSrc = courseCard.querySelector('img').src;

    const detailCard = document.getElementById('course-detail-card');

    detailCard.innerHTML = `
        <div class="course-image" style="position: relative; margin-bottom: 20px;">
            <img src="${imgSrc}" style="width: 100%; height: auto; max-height: 300px; object-fit: contain; border-radius: 16px;">
            <span class="course-level" style="position: absolute; top: 15px; right: 15px;">${level}</span>
        </div>
        <h2 style="margin: 0 0 8px 0;">${title}</h2>
        <p style="color: var(--text-muted); margin-bottom: 15px;">${instructor}</p>
        
        <div class="course-meta" style="margin: 15px 0;">
            <span><i class="fa-solid fa-clock"></i> ${duration}</span>
            <span><i class="fa-solid fa-star"></i> ${rating}</span>
        </div>

        <h3>Sobre o curso</h3>
        <p style="line-height: 1.6; color: #444;">${desc}</p>

        <h3>O que você vai receber </h3>
        <ul style="padding-left: 20px; line-height: 1.8;">
            <li>Certificado de conclusão</li>
            <li>Acesso vitalício ao conteúdo</li>
            <li>Projetos práticos</li>
            <li>Suporte da comunidade</li>
            <li>Material de apoio em PDF</li>
        </ul>
    `;

    showScreen('course-detail-screen');
}

function enrollInCourseFromDetail() {
    if (!currentCourseCard) return;
    const title = currentCourseCard.querySelector('h3').textContent;
    showScreen('courses-screen');
    showSuccess(`✅ Inscrição realizada com sucesso no curso:<br><strong>${title}</strong>`);
}

function enrollInCourse() {
    if (!currentCourseCard) {
        showError('Nenhum curso selecionado para inscrição.');
        return;
    }
    const title = currentCourseCard.querySelector('h3').textContent;
    closeCourseModal();
    showScreen('courses-screen');
    showSuccess(`✅ Inscrição confirmada no curso:<br><strong>${title}</strong>`);
}

function closeCourseModal() {
    const modal = document.getElementById('course-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Filtro por Categoria + Busca
let currentCategory = 'all';

function filterByCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-category') === category) {
            card.classList.add('active');
        }
    });

    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase().trim();
    const courseCards = document.querySelectorAll('.course-card');
    const sectionTitle = document.getElementById('section-title');

    courseCards.forEach(card => {
        const title = card.getAttribute('data-title') || card.querySelector('h3').textContent;
        const category = card.getAttribute('data-category');

        const matchesSearch = searchTerm === '' || title.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    if (searchTerm !== '') {
        sectionTitle.textContent = `Resultados para "${searchTerm}"`;
    } else if (currentCategory === 'all') {
        sectionTitle.textContent = 'Todos os Cursos';
    } else {
        sectionTitle.textContent = document.querySelector(`[data-category="${currentCategory}"] span`).textContent;
    }
}

// ====================== INICIALIZAÇÃO REMOVIDA - Consolidada no DOMContentLoaded abaixo ======================

// ===================== FUNÇÕES DO MODAL (EDITAR NOME + SUCESSO) =====================

function showEditNameModal() {
    const currentName = document.getElementById('user-display-name').textContent || "Usuário";
    document.getElementById('new-name-input').value = currentName;
    document.getElementById('edit-name-modal').style.display = 'flex';
}

function closeEditNameModal() {
    document.getElementById('edit-name-modal').style.display = 'none';
}

function saveNewName() {
    const newName = document.getElementById('new-name-input').value.trim();
    
    if (newName === "") {
        showError("O nome não pode ficar vazio!");
        return;
    }

    document.getElementById('user-display-name').textContent = newName;
    saveProfileName(newName);
    closeEditNameModal();
    showSuccess("Nome atualizado e salvo com sucesso!");
}

function showSuccess(message) {
    document.getElementById('success-message').innerHTML = message;
    document.getElementById('success-screen').classList.remove('hidden');
    
    setTimeout(() => {
        document.getElementById('success-screen').classList.add('hidden');
    }, 2500);
}

function closeSuccessScreen() {
    document.getElementById('success-screen').classList.add('hidden');
}

function showError(message) {
    const el = document.getElementById('error-message');
    if (el) el.innerHTML = message;
    const screen = document.getElementById('error-screen');
    if (screen) screen.classList.remove('hidden');

    setTimeout(() => {
        if (screen) screen.classList.add('hidden');
    }, 3500);
}

function closeErrorScreen() {
    const screen = document.getElementById('error-screen');
    if (screen) screen.classList.add('hidden');
}

// ===================== FUNÇÃO PARA TROCA DE FOTO =====================
function changeProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const settingsImg = document.getElementById('profile-img-settings');
        const homeImg = document.getElementById('home-profile-img');
        if (settingsImg) settingsImg.src = e.target.result;
        if (homeImg) homeImg.src = e.target.result;

        saveProfilePhoto(e.target.result);
        showSuccess("Foto de perfil atualizada e salva com sucesso!");
    };
    reader.readAsDataURL(file);
}

function loadSettingsProgress() {
    const currentUser = getCurrentUser();
    const profileData = getProfileData();
    const profileName = getProfileName() || (currentUser && currentUser.name) || 'Usuário';
    const profilePhoto = getProfilePhoto();
    const favorites = JSON.parse(localStorage.getItem(getUserStorageKey('favorites')) || '{"jobs":[],"courses":[]}');
    const applications = JSON.parse(localStorage.getItem(getUserStorageKey('applications')) || '[]');

    const values = [
        currentUser && currentUser.name ? 1 : 0,
        profileData.profession ? 1 : 0,
        profileData.city ? 1 : 0,
        profileData.bio ? 1 : 0,
        profileData.skills ? 1 : 0,
        profilePhoto ? 1 : 0
    ];
    const completed = values.reduce((sum, item) => sum + item, 0);
    const percentage = Math.round((completed / values.length) * 100);

    const progressFill = document.getElementById('profile-progress-fill');
    const progressLabel = document.getElementById('profile-completion-label');
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = `${percentage}%`;

    const settingsName = document.getElementById('profile-name-settings');
    const settingsImg = document.getElementById('profile-img-settings');
    if (settingsName) settingsName.textContent = profileName;
    if (settingsImg && profilePhoto) settingsImg.src = profilePhoto;

    const profileStatus = document.getElementById('status-profile');
    const favoritesStatus = document.getElementById('status-favorites');
    const applicationsStatus = document.getElementById('status-applications');
    if (profileStatus) profileStatus.classList.toggle('completed', percentage >= 50);
    if (favoritesStatus) favoritesStatus.classList.toggle('completed', favorites.jobs.length + favorites.courses.length > 0);
    if (applicationsStatus) applicationsStatus.classList.toggle('completed', applications.length > 0);

    renderProfileTasks(buildProfileTasks());
    updateHomeProfileSummary();
}

function buildProfileTasks() {
    const currentUser = getCurrentUser();
    const profileData = getProfileData();
    const profilePhoto = getProfilePhoto();
    const tasks = [];

    if (!currentUser || !currentUser.name) {
        tasks.push({ text: 'Complete seu nome', action: 'profile-screen' });
    }
    if (!profileData.profession) {
        tasks.push({ text: 'Adicione sua profissão', action: 'profile-screen' });
    }
    if (!profileData.city) {
        tasks.push({ text: 'Adicione sua cidade', action: 'profile-screen' });
    }
    if (!profileData.bio) {
        tasks.push({ text: 'Escreva uma breve bio', action: 'profile-screen' });
    }
    if (!profileData.skills) {
        tasks.push({ text: 'Informe suas habilidades', action: 'profile-screen' });
    }
    if (!profilePhoto) {
        tasks.push({ text: 'Envie uma foto de perfil', action: 'settings-screen' });
    }

    return tasks;
}

function renderProfileTasks(tasks) {
    const list = document.getElementById('pending-tasks-list');
    const count = document.getElementById('pending-tasks-count');

    if (!list || !count) return;

    count.textContent = tasks.length;
    if (tasks.length === 0) {
        list.innerHTML = '<div class="task-item empty">Nenhuma tarefa pendente. Seu perfil está completo!</div>';
        return;
    }

    list.innerHTML = tasks.map(task => `
        <div class="task-item">
            <span>${task.text}</span>
            <button class="task-action" onclick="showScreen('${task.action}')">Ir</button>
        </div>
    `).join('');
}

function updateHomeProfileSummary() {
    const tasks = buildProfileTasks();
    const totalItems = 6;
    const completed = Math.max(0, totalItems - tasks.length);
    const percentage = Math.round((completed / totalItems) * 100);
    const label = document.getElementById('home-profile-progress-label');
    const summaryText = document.getElementById('home-profile-summary-text');
    const summaryCard = document.querySelector('.profile-summary-card');

    if (summaryCard) {
        summaryCard.style.display = percentage === 100 ? 'none' : 'block';
    }

    if (label) {
        label.textContent = `${percentage}%`;
    }

    if (summaryText) {
        if (tasks.length === 0) {
            summaryText.textContent = 'Seu perfil está completo! Aproveite as melhores oportunidades agora mesmo.';
        } else {
            summaryText.textContent = `Você tem ${tasks.length} tarefa(s) pendente(s) para completar seu perfil e ganhar recomendações melhores.`;
        }
    }
}

// ===================== PERFIL COMPLETO =====================
function saveProfileData() {
    const name = document.getElementById('profile-name-input').value.trim();
    const email = document.getElementById('profile-email-input').value.trim().toLowerCase();
    const profession = document.getElementById('profile-profession').value.trim();
    const experience = document.getElementById('profile-experience').value.trim();
    const city = document.getElementById('profile-city').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const skills = document.getElementById('profile-skills').value.trim();

    if (!name || !email || !profession || !experience || !city || !bio || !skills) {
        showError('Preencha todos os campos antes de salvar o perfil.');
        return;
    }

    if (isNaN(experience) || Number(experience) < 0) {
        showError('Informe um valor válido para experiência.');
        return;
    }

    const profileData = {
        profession,
        experience,
        city,
        bio,
        skills
    };

    saveProfileName(name);
    const currentUser = getCurrentUser();
    if (currentUser) {
        currentUser.name = name;
        currentUser.email = email;
        setCurrentUser(currentUser);
    }

    const profileFullnameElem = document.getElementById('profile-fullname');
    const profileEmailDisplay = document.getElementById('profile-email-display');
    const userDisplayName = document.getElementById('user-display-name');
    const profileNameSettings = document.getElementById('profile-name-settings');
    if (profileFullnameElem) profileFullnameElem.textContent = name;
    if (profileEmailDisplay) profileEmailDisplay.textContent = email;
    if (userDisplayName) userDisplayName.textContent = name;
    if (profileNameSettings) profileNameSettings.textContent = name;

    saveProfileName(name);
    saveProfileDataKey(profileData);
    showSuccess('Perfil atualizado com sucesso!');
    loadSettingsProgress();
}

function loadProfileData() {
    const currentUser = getCurrentUser();
    const savedName = getProfileName();
    const nameValue = savedName || (currentUser && currentUser.name) || 'Usuário';
    const emailValue = (currentUser && currentUser.email) || '';

    document.getElementById('profile-fullname').textContent = nameValue;
    document.getElementById('profile-email-display').textContent = emailValue || 'email@example.com';
    document.getElementById('profile-name-input').value = nameValue;
    document.getElementById('profile-email-input').value = emailValue;

    const profileData = getProfileData();
    if (profileData) {
        const data = profileData;
        document.getElementById('profile-profession').value = data.profession || '';
        document.getElementById('profile-experience').value = data.experience || '';
        document.getElementById('profile-city').value = data.city || '';
        document.getElementById('profile-bio').value = data.bio || '';
        document.getElementById('profile-skills').value = data.skills || '';
    } else {
        document.getElementById('profile-profession').value = '';
        document.getElementById('profile-experience').value = '';
        document.getElementById('profile-city').value = '';
        document.getElementById('profile-bio').value = '';
        document.getElementById('profile-skills').value = '';
    }

    const savedPhoto = getProfilePhoto();
    if (savedPhoto) {
        document.getElementById('profile-avatar').src = savedPhoto;
    }
}

// ===================== FAVORITOS =====================
function addToFavorites(type, id, title) {
    let favorites = JSON.parse(localStorage.getItem(getUserStorageKey('favorites')) || '{"jobs":[],"courses":[]}');
    const item = { id, title };
    
    if (type === 'job') {
        if (!favorites.jobs.find(j => j.id === id)) {
            favorites.jobs.push(item);
        }
    } else if (type === 'course') {
        if (!favorites.courses.find(c => c.id === id)) {
            favorites.courses.push(item);
        }
    }
    
    localStorage.setItem(getUserStorageKey('favorites'), JSON.stringify(favorites));
    showSuccess('Adicionado aos favoritos!');
}

function showFavoriteDetail(type, id) {
    if (type === 'job') {
        showJobDetail(id, 'favorites');
    } else if (type === 'course') {
        const courseCard = document.querySelector(`.course-card[data-id="${id}"]`);
        if (courseCard) {
            showCourseDetail(courseCard, 'favorites');
        } else {
            showError('Curso favorito não encontrado para exibir detalhes.');
        }
    }
}

function removeFromFavorites(type, id) {
    let favorites = JSON.parse(localStorage.getItem(getUserStorageKey('favorites')) || '{"jobs":[],"courses":[]}');
    
    if (type === 'job') {
        favorites.jobs = favorites.jobs.filter(j => j.id !== id);
    } else if (type === 'course') {
        favorites.courses = favorites.courses.filter(c => c.id !== id);
    }
    
    localStorage.setItem(getUserStorageKey('favorites'), JSON.stringify(favorites));
    loadFavorites();
    showSuccess('Removido dos favoritos!');
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem(getUserStorageKey('favorites')) || '{"jobs":[],"courses":[]}');
    
    // Carregar vagas favoritas
    const jobsContainer = document.getElementById('favorites-jobs');
    if (jobsContainer) {
        jobsContainer.innerHTML = favorites.jobs.length > 0 
            ? favorites.jobs.map(j => `
                <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>${j.title}</span>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="showFavoriteDetail('job', ${j.id})" style="background: #0071e3; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
                            Detalhes
                        </button>
                        <button onclick="removeFromFavorites('job', ${j.id})" style="background: #e74c3c; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')
            : '<p style="color: var(--text-muted);">Nenhuma vaga salva ainda</p>';
    }

    // Carregar cursos favoritos
    const coursesContainer = document.getElementById('favorites-courses');
    if (coursesContainer) {
        coursesContainer.innerHTML = favorites.courses.length > 0
            ? favorites.courses.map(c => `
                <div style="background: white; border-radius: 12px; padding: 15px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <span>${c.title}</span>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="showFavoriteDetail('course', ${c.id})" style="background: #0071e3; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
                            Detalhes
                        </button>
                        <button onclick="removeFromFavorites('course', ${c.id})" style="background: #e74c3c; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')
            : '<p style="color: var(--text-muted);">Nenhum curso salvo ainda</p>';
    }
}

// ===================== HISTÓRICO DE CANDIDATURAS =====================
function addApplication(jobId, jobTitle, company) {
    let applications = JSON.parse(localStorage.getItem(getUserStorageKey('applications')) || '[]');
    const app = {
        id: jobId,
        title: jobTitle,
        company: company,
        date: new Date().toLocaleDateString('pt-BR')
    };
    applications.push(app);
    localStorage.setItem(getUserStorageKey('applications'), JSON.stringify(applications));
}

function removeApplication(index) {
    let applications = JSON.parse(localStorage.getItem(getUserStorageKey('applications')) || '[]');
    if (index < 0 || index >= applications.length) {
        showError('Não foi possível excluir a candidatura.');
        return;
    }
    applications.splice(index, 1);
    localStorage.setItem('applications', JSON.stringify(applications));
    loadApplications();
    showSuccess('Candidatura excluída com sucesso!');
}

function loadApplications() {
    const applications = JSON.parse(localStorage.getItem(getUserStorageKey('applications')) || '[]');
    const container = document.getElementById('applications-list');
    const noApps = document.getElementById('no-applications');
    
    if (applications.length > 0) {
        noApps.style.display = 'none';
        container.innerHTML = applications.map((app, index) => `
            <div style="background: white; border-radius: 12px; padding: 15px; border-left: 4px solid var(--primary); display: grid; gap: 12px;">
                <div>
                    <h3 style="margin: 0 0 5px; color: var(--text-main);">${app.title}</h3>
                    <p style="margin: 0 0 8px; color: var(--text-muted); font-size: 14px;">${app.company}</p>
                    <p style="margin: 0; color: var(--text-muted); font-size: 12px;">
                        <i class="fa-solid fa-calendar"></i> ${app.date}
                    </p>
                </div>
                <button onclick="removeApplication(${index})" style="background: #e74c3c; color: white; border: none; border-radius: 12px; padding: 12px 14px; cursor: pointer; font-weight: 600;">
                    <i class="fa-solid fa-trash"></i> Excluir candidatura
                </button>
            </div>
        `).join('');
    } else {
        noApps.style.display = 'block';
        container.innerHTML = '';
    }
}

// ===================== CARREGAR DADOS SALVOS =====================
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('course-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Botões "Ver Detalhes" dos cursos - agora abre tela completa
    document.querySelectorAll('.btn-enroll').forEach(button => {
        button.addEventListener('click', function() {
            const courseCard = this.closest('.course-card');
            if (courseCard) {
                showCourseDetail(courseCard);
            }
        });
    });

    // Carrega nome salvo para o usuário logado
    const savedName = getProfileName();
    if (savedName) {
        document.getElementById('user-display-name').textContent = savedName;
    }

    // Restaura usuário logado, mas não força mostrar a Home
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.name) {
        document.getElementById('user-display-name').textContent = currentUser.name;
        // Apenas carrega os dados do usuário, não muda a tela
    }

    // Carrega foto salva para o usuário logado
    const savedPhoto = getProfilePhoto();
    if (savedPhoto) {
        const settingsImg = document.getElementById('profile-img-settings');
        const homeImg = document.getElementById('home-profile-img');
        if (settingsImg) settingsImg.src = savedPhoto;
        if (homeImg) homeImg.src = savedPhoto;
    }

    // Ajusta visibilidade inicial da bottom nav se a Home estiver ativa
    const bottomNav = document.querySelector('.bottom-nav');
    const activeScreen = document.querySelector('.screen.active');
    if (bottomNav) {
        if (activeScreen && activeScreen.id === 'home-screen') bottomNav.classList.add('hidden');
        else bottomNav.classList.remove('hidden');
    }

    if (activeScreen && activeScreen.id === 'home-screen') {
        updateHomeProfileSummary();
    }

    initScrollBar('landing-screen', 'landing-scroll-thumb');
    initScrollBar('bio-screen', 'bio-scroll-thumb');
    initLandingHandle();
    initGlobalScrollbar();
    updateMessagesBadge();
});

// ===================== MENSAGENS =====================
function loadMessages() {
    const raw = localStorage.getItem(getUserStorageKey('messages'));
    let messages = raw ? JSON.parse(raw) : null;

    if (!messages) {
        // seed sample messages
        messages = [
            { id: 1, sender: 'bot', context: 'general', title: 'Bem-vindo ao Oportuniza', body: 'Obrigado por criar sua conta! Explore vagas e cursos.', time: 'Agora', read: false },
            { id: 2, sender: 'bot', context: 'jobs', title: 'Nova vaga combinando com seu perfil', body: 'Desenvolvedor Full Stack - Bosch.', time: 'Ontem', read: false },
            { id: 3, sender: 'bot', context: 'courses', title: 'Curso recomendado', body: 'React do Zero ao Avançado - novas turmas.', time: '3 dias', read: true }
        ];
        localStorage.setItem(getUserStorageKey('messages'), JSON.stringify(messages));
    }

    // filtra pelo contexto atual
    const filtered = messages.filter(m => (m.context || 'general') === currentMessageContext);
    renderMessages(filtered);
    updateMessagesBadge(messages);
}

function renderMessages(messages) {
    const container = document.getElementById('messages-list');
    if (!container) return;
    container.innerHTML = '';

    messages.forEach(msg => {
        const card = document.createElement('div');
        const senderClass = msg.sender === 'user' ? 'user' : 'bot';
        card.className = `message-card ${senderClass}`;

        let actions = '';
        if (msg.sender !== 'user') {
            actions = `<div class="message-actions"><button class="btn-primary" style="padding:8px 10px; font-size:13px;" onclick="markMessageRead(${msg.id})">Marcar como lida</button></div>`;
        }

        card.innerHTML = `
            <div>
                <div class="message-title">${msg.title || (msg.sender==='user' ? 'Você' : 'Oportuniza')}</div>
                <div class="message-body">${msg.body}</div>
                <div class="message-meta">${msg.time} ${msg.read ? '• lida' : '• não lida'}</div>
            </div>
            ${actions}
        `;

        container.appendChild(card);
    });

    // scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function switchMessageContext(context) {
    currentMessageContext = context;

    // Atualiza classes das tabs
    const tabs = document.querySelectorAll('.msg-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (context === 'general') document.getElementById('tab-general').classList.add('active');
    if (context === 'jobs') document.getElementById('tab-vagas').classList.add('active');
    if (context === 'courses') document.getElementById('tab-cursos').classList.add('active');

    loadMessages();
}

function markMessageRead(id) {
    const raw = localStorage.getItem(getUserStorageKey('messages'));
    if (!raw) return;
    const messages = JSON.parse(raw);
    const msg = messages.find(m => m.id === id);
    if (msg) {
        msg.read = true;
        localStorage.setItem(getUserStorageKey('messages'), JSON.stringify(messages));
        loadMessages();
        showSuccess('Mensagem marcada como lida.');
    }
}

function getUnreadMessagesCount() {
    const raw = localStorage.getItem(getUserStorageKey('messages'));
    const messages = raw ? JSON.parse(raw) : [];
    return messages.filter(msg => msg.sender === 'bot' && !msg.read).length;
}

function clearAppData() {
    showConfirmModal('Confirma limpar os dados do aplicativo? Isso removerá contas, perfil e mensagens locais.', () => {
        // remove only app-related keys
        localStorage.removeItem('oportuniza-users');
        localStorage.removeItem('oportuniza-current-user');
        localStorage.removeItem(getUserStorageKey('profileName'));
        localStorage.removeItem(getUserStorageKey('profilePhoto'));
        localStorage.removeItem(getUserStorageKey('profileData'));
        localStorage.removeItem(getUserStorageKey('favorites'));
        localStorage.removeItem(getUserStorageKey('applications'));
        localStorage.removeItem(getUserStorageKey('messages'));

        showSuccess('Dados do aplicativo limpos com sucesso!');
        updateMessagesBadge([]);
        // volta para tela de login
        showScreen('login-screen');
    });
}

function updateMessagesBadge(messages) {
    const allMessages = messages || JSON.parse(localStorage.getItem(getUserStorageKey('messages')) || '[]');
    const unread = allMessages.filter(msg => msg.sender === 'bot' && !msg.read).length;
    const badgeTop = document.getElementById('messages-badge');
    const badgeBottom = document.getElementById('messages-badge-bottom');
    [badgeTop, badgeBottom].forEach(badge => {
        if (!badge) return;
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

function showConfirmModal(message, callback) {
    const confirmMessage = document.getElementById('confirm-message');
    if (confirmMessage) confirmMessage.textContent = message;
    confirmCallback = callback;
    const screen = document.getElementById('confirm-screen');
    if (screen) screen.classList.remove('hidden');
}

function closeConfirmModal() {
    const screen = document.getElementById('confirm-screen');
    if (screen) screen.classList.add('hidden');
    confirmCallback = null;
}

function confirmModalYes() {
    if (typeof confirmCallback === 'function') confirmCallback();
    closeConfirmModal();
}

// ===================== BOT E ENVIO DE MENSAGENS =====================
function getNextMessageId() {
    const raw = localStorage.getItem(getUserStorageKey('messages'));
    const messages = raw ? JSON.parse(raw) : [];
    return messages.length ? Math.max(...messages.map(m=>m.id)) + 1 : 1;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        showError('Escreva uma mensagem antes de enviar.');
        return;
    }

    const raw = localStorage.getItem(getUserStorageKey('messages'));
    const messages = raw ? JSON.parse(raw) : [];
    const id = getNextMessageId();

    const msg = { id, sender: 'user', context: currentMessageContext, title: 'Você', body: text, time: 'Agora', read: true };
    messages.push(msg);
    localStorage.setItem(getUserStorageKey('messages'), JSON.stringify(messages));
    loadMessages();
    input.value = '';

    // Simula resposta do bot com leve delay
    setTimeout(() => botRespond(text), 900 + Math.random()*800);
}

function botRespond(userText) {
    const raw = localStorage.getItem(getUserStorageKey('messages'));
    const messages = raw ? JSON.parse(raw) : [];
    const id = getNextMessageId();

    const text = userText.toLowerCase();
    let reply = '';

    if (text.includes('oi') || text.includes('olá') || text.includes('ola')) {
        reply = 'Olá! Eu sou o assistente do Oportuniza. Como posso ajudar você hoje?';
    } else if (text.includes('vaga') || text.includes('vagas')) {
        reply = 'Encontrei algumas vagas que podem combinar com você. Quer ver as vagas recomendadas?';
    } else if (text.includes('curso') || text.includes('cursos')) {
        reply = 'Posso sugerir cursos por categoria. Qual categoria você prefere?';
    } else if (text.includes('obrigado') || text.includes('valeu')) {
        reply = 'De nada! Estou aqui para ajudar.';
    } else {
        reply = `Recebi sua mensagem: "${userText}". Vou encaminhar informações relevantes.`;
    }

    const botMsg = { id, sender: 'bot', context: currentMessageContext, title: 'Oportuniza', body: reply, time: 'Agora', read: false };
    messages.push(botMsg);
    localStorage.setItem(getUserStorageKey('messages'), JSON.stringify(messages));
    loadMessages();
}

// --- Global scrollbar that controls the currently active screen ---
let _globalDrag = false;
let _globalStartY = 0;
let _globalStartTranslate = 0;
let _globalCurrentScreen = null;
let _globalScrollListener = null;

function getActiveScrollableScreen() {
    const active = document.querySelector('.screen.active');
    if (!active) return null;

    // only use an inner container if it is actually scrollable
    const inner = active.querySelector('.bio-content');
    if (inner && inner.scrollHeight > inner.clientHeight && window.getComputedStyle(inner).overflowY !== 'visible') {
        return inner;
    }

    return active;
}

function updateGlobalThumb() {
    const screen = getActiveScrollableScreen();
    const thumb = document.getElementById('global-scroll-thumb');
    if (!screen || !thumb) return;

    const contentHeight = screen.scrollHeight;
    const visibleHeight = screen.clientHeight;
    const maxScroll = contentHeight - visibleHeight;
    const trackHeight = visibleHeight - 12;

    if (maxScroll <= 0) {
        thumb.style.transform = 'translateY(0)';
        thumb.style.height = '44px';
        thumb.style.opacity = '0.4';
        return;
    }

    const thumbHeight = Math.max(44, Math.min(trackHeight * (visibleHeight / contentHeight), trackHeight));
    const maxThumbTranslate = Math.max(0, trackHeight - thumbHeight);
    const scrollRatio = screen.scrollTop / maxScroll;
    const translateY = scrollRatio * maxThumbTranslate;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${translateY}px)`;
    thumb.style.opacity = '1';
}

function scrollActiveScreen(direction) {
    const screen = getActiveScrollableScreen();
    if (!screen) return;
    screen.scrollBy({ top: direction * 180, left: 0, behavior: 'smooth' });
}

function initGlobalScrollbar() {
    const thumb = document.getElementById('global-scroll-thumb');
    const upBtn = document.querySelector('#global-scrollbar .scroll-up');
    const downBtn = document.querySelector('#global-scrollbar .scroll-down');
    if (!thumb) return;

    const getContentHeight = () => {
        const s = getActiveScrollableScreen();
        return s ? s.scrollHeight : 0;
    };

    const getVisibleHeight = () => {
        const s = getActiveScrollableScreen();
        return s ? s.clientHeight : 0;
    };

    const getMaxScroll = () => {
        const s = getActiveScrollableScreen();
        return s ? (s.scrollHeight - s.clientHeight) : 0;
    };

    const getTrackHeight = () => Math.max(20, getVisibleHeight() - 12);

    const getThumbHeight = () => Math.max(44, Math.min(getTrackHeight() * (getVisibleHeight() / getContentHeight()), getTrackHeight()));

    const getMaxThumbTranslate = () => Math.max(0, getTrackHeight() - getThumbHeight());

    const getCurrentTranslate = () => {
        const transform = window.getComputedStyle(thumb).transform;
        if (!transform || transform === 'none') return 0;
        const values = transform.match(/matrix\(([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([^\)]+)\)/);
        return values ? parseFloat(values[6]) : 0;
    };

    const onPointerMove = (event) => {
        if (!_globalDrag) return;
        const delta = event.clientY - _globalStartY;
        const newTranslate = Math.min(Math.max(0, _globalStartTranslate + delta), getMaxThumbTranslate());
        const ratio = newTranslate / Math.max(1, getMaxThumbTranslate());
        const screen = getActiveScrollableScreen();
        if (screen) screen.scrollTop = ratio * getMaxScroll();
        thumb.style.transform = `translateY(${newTranslate}px)`;
    };

    const onPointerUp = () => {
        if (!_globalDrag) return;
        _globalDrag = false;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };

    thumb.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        _globalDrag = true;
        _globalStartY = event.clientY;
        _globalStartTranslate = getCurrentTranslate();
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    });

    // When active screen scrolls, update thumb
    const bindToActive = () => {
        const screen = getActiveScrollableScreen();
        if (!screen) return;
        if (_globalScrollListener && _globalCurrentScreen === screen) return;
        if (_globalScrollListener && _globalCurrentScreen) {
            _globalCurrentScreen.removeEventListener('scroll', _globalScrollListener);
        }
        _globalCurrentScreen = screen;
        _globalScrollListener = () => updateGlobalThumb();
        screen.addEventListener('scroll', _globalScrollListener);
        updateGlobalThumb();
    };

    // update when switching screens or resizing
    window.addEventListener('resize', updateGlobalThumb);
    document.addEventListener('click', () => setTimeout(bindToActive, 50));

    // also bind initially
    bindToActive();
}