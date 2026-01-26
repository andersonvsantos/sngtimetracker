import { selectors } from './constants';

export function toggleModal(show) {
    if (selectors.modalForgot) selectors.modalForgot.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = "error") {
    if (!selectors.alertContainer) return;

    selectors.alertContainer.classList.toggle("success", type === "success");
    selectors.alertTitle.innerText = type === "success" ? "Sucesso" : "Erro";
    selectors.alertDesc.innerText = message;

    selectors.alertContainer.classList.add("show");
    setTimeout(() => selectors.alertContainer.classList.remove("show"), 3000);
}