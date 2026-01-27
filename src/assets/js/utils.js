import Cookies from 'js-cookie';
import { selectors } from './constants';

export function showAlert(message, type = "error") {
    if (!selectors.alertContainer) return;

    selectors.alertContainer.classList.toggle("success", type === "success");
    selectors.alertTitle.innerText = type === "success" ? "Sucesso" : "Erro";
    selectors.alertDesc.innerText = message;

    selectors.alertContainer.classList.add("show");
    setTimeout(() => selectors.alertContainer.classList.remove("show"), 3000);
}

export function clearCookies() {
    const allCookies = Cookies.get();

    Object.keys(allCookies).forEach(cookieName => {
        Cookies.remove(cookieName);
    });
}