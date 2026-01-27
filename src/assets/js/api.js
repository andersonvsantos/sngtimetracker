import Cookies from 'js-cookie';
import { baseUrl } from './constants';
import { clearCookies } from './utils';

/**
 * @description Verifica se o usuário possui um token válido e redireciona para o login caso negativo.
 * @returns void
 */
export async function checkAuth() {
    const token = Cookies.get("token");

    // Se não houver token, redireciona imediatamente para a tela de login
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(`${baseUrl}/auth/validate`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        });

        // Se o backend retornar erro (token expirado ou inválido), lança exceção
        if (!response.ok) {
            throw new Error("Token inválido");
        }
    } catch (err) {
        // Limpa resíduos de sessão e força o re-login em caso de erro na validação
        clearCookies();
        window.location.href = "/login.html";
    }
}

/**
 * @description Registra um novo apontamento de tempo (time track) para uma tarefa.
 * @param {string|number} userId ID do usuário que realiza o apontamento.
 * @param {string|number} taskId ID da tarefa selecionada.
 * @param {string} startTime Data/hora de início.
 * @param {string} endTime Data/hora de término (opcional).
 * @param {string} status Status atual do apontamento.
 * @param {string} notes Observações adicionais.
 * @returns {Promise<Object>} Dados do apontamento criado.
 */
export async function createNewTimeTrack(userId, taskId, startTime, endTime, status, notes) {
    const response = await fetch(`${baseUrl}/maintenance`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId,
            task_id: taskId,
            startTime: startTime,
            endTime: endTime ? endTime : null,
            status: status,
            notes: notes
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar o apontamento");
    }

    return await response.json();
}

/**
 * @description Atualiza um apontamento existente para pausar ou finalizar a atividade.
 * @param {string|number} timeTrackId ID do registro de tempo.
 * @param {string|number} taskId ID da tarefa.
 * @param {string} startTime Data/hora de início original.
 * @param {string} endTime Data/hora de encerramento.
 * @param {string} status Novo status (ex: 'Paused', 'Finished').
 * @param {string} notes Notas de atualização.
 * @returns {Promise<void>}
 */
export async function pauseFinishTimeTrack(timeTrackId, taskId, startTime, endTime, status, notes) {
    const response = await fetch(`${baseUrl}/maintenance`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: timeTrackId,
            task_id: taskId,
            startTime,
            endTime,
            status,
            notes
        })
    }
    )
}

/**
 * @description Busca todos os apontamentos de tempo vinculados a um usuário específico.
 * @param {string|number} userId ID do usuário.
 * @returns {Promise<Array>} Lista de apontamentos do usuário.
 */
export function getUserTimeTracks(userId) {
    const token = Cookies.get("token");

    return fetch(`${baseUrl}/maintenance/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(res => {
        if (!res.ok) throw new Error("Erro ao buscar apontamentos");
        return res.json();
    });
}

/**
 * @description Obtém a lista completa de softwares cadastrados no sistema.
 * @returns {Promise<Array>} Lista de softwares.
 */
export function getAllSoftwares() {
    const token = Cookies.get("token");

    return fetch(`${baseUrl}/maintenance/softwares`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(res => {
        if (!res.ok) throw new Error("Erro ao buscar softwares");
        return res.json();
    });
}

/**
 * @description Busca todas as tarefas associadas a um software específico.
 * @param {string} software Nome ou identificador do software.
 * @returns {Promise<Array>} Lista de tarefas filtradas por software.
 */
export function getAllTasksBySoftware(software) {
    const token = Cookies.get("token");

    return fetch(`${baseUrl}/maintenance/tasksBySoftware/${software}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(res => {
        if (!res.ok) throw new Error("Erro ao buscar softwares");
        return res.json();
    });
}

/**
 * @description Envia a solicitação de alteração de senha para o servidor.
 * @param {string} userEmail E-mail do usuário.
 * @param {string} oldPassword Senha atual (opcional).
 * @param {string} newPassword Nova senha desejada.
 * @returns {Promise<Object>} Resposta da API.
 */
export async function updatePassword(userEmail, oldPassword, newPassword) {
    const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userEmail,
            oldPassword: oldPassword || null,
            newPassword
        })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar senha");
    }

    return await response.json();
}