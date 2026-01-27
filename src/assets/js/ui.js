import { selectors } from './constants';

/**
 * @description Renderiza a lista de apontamentos de tempo na tabela principal da interface.
 * @param {Array} tracks Array de objetos contendo os dados dos apontamentos (time tracks).
 * @returns {void}
 */
export function listUserTimeTracks(tracks) {
    /**
     * @description Formata uma string de data para o padrão brasileiro (PT-BR) usando UTC.
     * @param {string} dateString String da data original.
     * @returns {string} Data formatada.
     */
    function formatUTC(dateString) {
        const d = new Date(dateString);

        return d.toLocaleString('pt-BR', {
            timeZone: 'UTC'
        });
    }
    
    // Limpa o conteúdo atual da tabela antes de renderizar a nova lista
    selectors.tableBody.innerHTML = '';

    // Ordena os apontamentos do mais recente para o mais antigo com base no horário de início
    tracks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Itera sobre cada apontamento para construir as linhas da tabela
    tracks.forEach(track => {
        let statusHtml = '';
        let actionsHtml = '';

        // Lógica para Status: "Aberto" (1)
        if (track.status === "1") {
            statusHtml = '<span class="status opened">Aberto</span>';
            actionsHtml = `
                <i class="fas fa-pause" title="Pausar tarefa"></i>
                <i class="fas fa-flag-checkered" title="Finalizar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

        // Lógica para Status: "Pausado" (3)
        if (track.status === "3") {
            statusHtml = '<span class="status paused">Pausado</span>';
            actionsHtml = `
                <i class="fas fa-play" title="Iniciar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

        // Lógica para Status: "Finalizado" (2)
        if (track.status === "2") {
            statusHtml = '<span class="status finished">Finalizado</span>';
            actionsHtml = `
                <i class="fas fa-play" title="Iniciar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

        // Inserção da linha formatada no corpo da tabela
        selectors.tableBody.innerHTML += `
            <tr data-timetrack-id="${track.id}">
                <td><a href="${track.url || ""}" target="_blank">${track.taskName || '-'}</a></td>
                <td>${track.serviceName || '-'}</td>
                <td data-task-id="${track.task_id}">${track.taskId}</td>
                <td>${track.software || '-'}</td>
                <td data-start-time="${track.startTime}">${formatUTC(track.startTime)}</td>
                <td data-end-time="${track.endTime}">${track.endTime ? formatUTC(track.endTime) : '-'}</td>
                <td>${statusHtml}</td>
                <td data-notes="${track.notes}">${track.notes || '-'}</td>
                <td class="actions">
                    <div class="actions-wrapper">
                        ${actionsHtml}
                    </div>
                </td>
            </tr>
        `;
    });
}

/**
 * @description Exibe ou oculta o modal de recuperação de senha (esqueci minha senha).
 * @param {boolean} show Define se o modal deve ser exibido (true) ou ocultado (false).
 * @returns {void}
 */
export function toggleModal(show) {
    if (selectors.modalForgot) selectors.modalForgot.style.display = show ? 'flex' : 'none';
}