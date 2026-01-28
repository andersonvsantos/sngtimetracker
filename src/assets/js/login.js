import Cookies from 'js-cookie'

/**
 * @description URL base para as chamadas de autenticação.
 */
let baseUrl = 'https://sngtimetracker.sng.com.br';

const msalConfig = {
    auth: {
        clientId: "86370d8b-58c6-48e3-ab6d-223cc00cd806", // Do registro no Azure
        authority: "https://login.microsoftonline.com/8d357e44-1e9f-480e-a0ee-61c49408b798",
        redirectUri: window.location.origin // Onde ele volta após o login
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

async function loginMicrosoft() {
    try {
        // 1. Abre o popup da Microsoft para login
        const loginResponse = await msalInstance.loginPopup({
            scopes: ["user.read", "openid", "profile", "email"]
        });

        // 2. Extrai o e-mail do usuário logado na Microsoft
        const userEmail = loginResponse.account.username;

        // 3. Envia para o SEU backend (usando uma rota que ignore a senha, ou enviando um flag)
        const response = await fetch(`${baseUrl}/auth/login-ad`, { // Crie uma rota específica no back
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ userEmail, isExternal: true })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.message || "Usuário AD não encontrado no sistema.", "error");
            return;
        }

        // 4. Reaproveita sua lógica de cookies existente
        Cookies.set("userId", data.user.id, { expires: 30, path: '/'});
        Cookies.set("userName", data.user.userName, { expires: 30, path: '/' });
        Cookies.set("userEmail", data.user.userEmail, { expires: 30, path: '/' });
        Cookies.set("token", data.token, { expires: 30, path: '/' });

        window.location.href = "./index.html";

    } catch (err) {
        console.error("Erro no login Microsoft:", err);
        showAlert("Falha na autenticação com a Microsoft.");
    }
}

// Vincule ao botão
document.getElementById('ms-login-btn').addEventListener('click', loginMicrosoft);

/**
 * @description Exibe mensagens de feedback (sucesso ou erro) em um container flutuante na tela de login.
 * @param {string} message Texto descritivo da mensagem.
 * @param {string} [type='error'] Tipo do alerta para definir cores e ícones.
 * @returns {void}
 */
const showAlert = (message, type = 'error') => {
    const alertBox = document.getElementById('alert-container');
    const alertDesc = document.getElementById('alert-desc');
    const alertTitle = document.getElementById('alert-title');
    const alertIcon = alertBox.querySelector('i');

    // Configuração visual baseada no tipo de alerta
    if (type === 'success') {
        alertBox.classList.add('success');
        alertTitle.textContent = "Sucesso";
        alertIcon.className = "fa-solid fa-circle-check";
    } else {
        alertBox.classList.remove('success');
        alertTitle.textContent = "Erro";
        alertIcon.className = "fa-solid fa-circle-exclamation";
    }

    alertDesc.textContent = message;
    alertBox.classList.add('show');

    // Remove o alerta automaticamente após 6 segundos
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 6000);
};

/**
 * @description Realiza a autenticação do usuário, armazena os dados em cookies e redireciona para o dashboard.
 * @returns {Promise<void>}
 */
async function login() {
    let userEmail = document.getElementById("login-email").value;
    userEmail = userEmail.trim().toLowerCase();
    const userPassword = document.getElementById("login-password").value;

    // Validação básica de preenchimento
    if (!userEmail || !userPassword) {
        showAlert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ userEmail, password: userPassword })
        });

        const data = await response.json();

        // Tratamento de credenciais inválidas ou erro de negócio
        if (!response.ok) {
            showAlert(data.message || "E-mail ou senha inválidos. Verifique se suas credenciais estão cadastradas!", "error");
            return; 
        }

        // Sucesso: Persistência dos dados do usuário por 30 dias via Cookies
        Cookies.set("userId", data.user.id, { expires: 30, path: '/'});
        Cookies.set("userName", data.user.userName, { expires: 30, path: '/' });
        Cookies.set("userEmail", data.user.userEmail, { expires: 30, path: '/' });
        Cookies.set("token", data.token, { expires: 30, path: '/' });

        // Redirecionamento para a página principal
        window.location.href = "./index.html";

    } catch (err) {
        console.error(err);
        showAlert("Não foi possível conectar ao servidor.", "error");
    }
}

/**
 * @description Solicita a alteração ou definição de uma nova senha para o usuário.
 * @param {Event} event Evento de submit do formulário.
 * @returns {Promise<void>}
 */
async function resetPassword(event) {
    event.preventDefault();

    let userEmail = document.getElementById("reset-email").value;
    userEmail = userEmail.trim().toLowerCase();
    const oldPassword = document.getElementById("reset-old-password").value;
    const newPassword = document.getElementById("reset-new-password").value;

    // Validação de campos obrigatórios para o reset
    if (!userEmail || !newPassword) {
        showAlert("Preencha o e-mail e a nova senha.", "error");
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/auth/reset-password`, {
            method: "PUT", 
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ 
                userEmail, 
                oldPassword: oldPassword || null, // Garante envio de null se a conta for nova/sem senha
                newPassword 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || "Erro ao processar solicitação.", "error");
            return;
        }

        showAlert("Senha salva com sucesso!", "success");
        // Fecha o modal após 2 segundos em caso de sucesso
        setTimeout(() => toggleModal(false), 2000);

    } catch (err) {
        showAlert("Erro na conexão com o servidor.", "error");
    }
}

/**
 * @description Inicializa os ouvintes de eventos da tela de login após o carregamento do DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('login-btn');
    const loginPasswordInput = document.getElementById('login-password');
    const forgotForm = document.getElementById('forgotForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            login();
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            if (loginBtn.type === 'button') {
                login();
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            resetPassword(e);
        });
    }

    /**
     * @description Gerencia a funcionalidade de "mostrar/esconder" a senha.
     */
    const togglePassIcon = document.getElementById('togglePassword');
    if (togglePassIcon && loginPasswordInput) {
        togglePassIcon.addEventListener('click', () => {
            const isPass = loginPasswordInput.type === 'password';
            loginPasswordInput.type = isPass ? 'text' : 'password';
            
            if (isPass) {
                togglePassIcon.classList.remove('fa-eye');
                togglePassIcon.classList.add('fa-eye-slash');
            } else {
                togglePassIcon.classList.remove('fa-eye-slash');
                togglePassIcon.classList.add('fa-eye');
            }
        });
    }

    const modal = document.getElementById('forgotModal');
    window.toggleModal = (show) => { if (modal) modal.style.display = show ? 'flex' : 'none'; };
    window.onclick = (e) => { if (e.target === modal) toggleModal(false); };
});