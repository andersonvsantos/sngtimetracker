const baseUrl = 'https://sngtimetracker.sng.com.br';

// --- Função de Alerta Global ---
const showAlert = (message, type = 'error') => {
    const alertBox = document.getElementById('alert-container');
    const alertDesc = document.getElementById('alert-desc');
    const alertTitle = document.getElementById('alert-title');
    const alertIcon = alertBox.querySelector('i');

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

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 6000);
};

// --- Função de Login ---
async function login() {
    const userEmail = document.getElementById("login-email").value;
    const userPassword = document.getElementById("login-password").value;

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

        if (!response.ok) {
            showAlert(data.message || "E-mail ou senha inválidos. Verifique se suas credenciais estão cadastradas!", "error");
            return; 
        }

        // Sucesso: Salva e Redireciona
        sessionStorage.setItem("userId", data.user.id);
        sessionStorage.setItem("userName", data.user.userName);
        sessionStorage.setItem("userEmail", data.user.userEmail);
        sessionStorage.setItem("sessionToken", data.token);
        window.location.href = "./index.html";

    } catch (err) {
        console.error(err);
        showAlert("Não foi possível conectar ao servidor.", "error");
    }
}

// --- Função de Reset de Senha ---
async function resetPassword(event) {
    event.preventDefault();

    const userEmail = document.getElementById("reset-email").value;
    const oldPassword = document.getElementById("reset-old-password").value; // Pode vir vazio
    const newPassword = document.getElementById("reset-new-password").value;

    // Apenas Email e Nova Senha são obrigatórios para o envio
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
                oldPassword: oldPassword || null, // Garante que envie null se estiver vazio
                newPassword 
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showAlert(data.error || "Erro ao processar solicitação.", "error");
            return;
        }

        showAlert("Senha salva com sucesso!", "success");
        setTimeout(() => toggleModal(false), 2000);

    } catch (err) {
        showAlert("Erro na conexão com o servidor.", "error");
    }
}

// --- Inicialização e Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const loginPasswordInput = document.getElementById('login-password');
    const loginEmailInput = document.getElementById('login-email');
    const forgotForm = document.getElementById('forgotForm');

    // Clique no botão de entrar
    if (loginBtn) loginBtn.addEventListener('click', login);

    // Enter nos campos de login
    const handleLoginEnter = (e) => { if (e.key === 'Enter') login(); };
    if (loginEmailInput) loginEmailInput.addEventListener('keydown', handleLoginEnter);
    if (loginPasswordInput) loginPasswordInput.addEventListener('keydown', handleLoginEnter);

    // Submit do formulário de reset
    if (forgotForm) forgotForm.addEventListener('submit', resetPassword);

    // Mostrar/Esconder Senha
    const togglePassIcon = document.getElementById('togglePassword');
    if (togglePassIcon && loginPasswordInput) {
        togglePassIcon.addEventListener('click', () => {
            const isPass = loginPasswordInput.type === 'password';
            
            // Troca o tipo do input
            loginPasswordInput.type = isPass ? 'text' : 'password';
            
            // Troca o ícone de forma limpa
            if (isPass) {
                togglePassIcon.classList.remove('fa-eye');
                togglePassIcon.classList.add('fa-eye-slash');
            } else {
                togglePassIcon.classList.remove('fa-eye-slash');
                togglePassIcon.classList.add('fa-eye');
            }
        });
    }

    // Controle do Modal
    const modal = document.getElementById('modalForgot');
    window.toggleModal = (show) => { if (modal) modal.style.display = show ? 'flex' : 'none'; };
    window.onclick = (e) => { if (e.target === modal) toggleModal(false); };
});