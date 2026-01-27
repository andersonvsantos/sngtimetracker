import Cookies from 'js-cookie';
import { selectors } from './constants';

/**
 * @description Exibe um alerta visual temporário na interface para o usuário.
 * @param {string} message A mensagem a ser exibida no corpo do alerta.
 * @param {string} [type="error"] O tipo do alerta ("success" ou "error"), definindo a estilização.
 * @returns {void}
 */
export function showAlert(message, type = "error") {
    // Aborta a função caso o container de alertas não esteja presente no DOM
    if (!selectors.alertContainer) return;

    // Gerencia as classes de estilo e textos baseados no tipo do alerta
    selectors.alertContainer.classList.toggle("success", type === "success");
    selectors.alertTitle.innerText = type === "success" ? "Sucesso" : "Erro";
    selectors.alertDesc.innerText = message;

    // Torna o alerta visível
    selectors.alertContainer.classList.add("show");

    // Remove a visibilidade do alerta após 3 segundos (3000ms)
    setTimeout(() => selectors.alertContainer.classList.remove("show"), 3000);
}

/**
 * @description Localiza e remove todos os cookies armazenados no navegador para a aplicação.
 * @returns {void}
 */
export function clearCookies() {
    // Obtém um objeto contendo todos os cookies disponíveis
    const allCookies = Cookies.get();

    // Itera sobre as chaves do objeto e remove cada cookie individualmente
    Object.keys(allCookies).forEach(cookieName => {
        Cookies.remove(cookieName);
    });
}