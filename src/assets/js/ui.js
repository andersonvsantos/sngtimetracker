
import { selectors } from './constants';

export function listUserTimeTracks(tracks) {
    function formatUTC(dateString) {
        const d = new Date(dateString);

        return d.toLocaleString('pt-BR', {
            timeZone: 'UTC'
        });
    }
    
    selectors.tableBody.innerHTML = '';

    tracks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    tracks.forEach(track => {
        let statusHtml = '';
        let actionsHtml = '';

        if (track.status === "1") {
            statusHtml = '<span class="status opened">Aberto</span>';
            actionsHtml = `
                <i class="fas fa-pause" title="Pausar tarefa"></i>
                <i class="fas fa-flag-checkered" title="Finalizar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

        if (track.status === "3") {
            statusHtml = '<span class="status paused">Pausado</span>';
            actionsHtml = `
                <i class="fas fa-play" title="Iniciar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

        if (track.status === "2") {
            statusHtml = '<span class="status finished">Finalizado</span>';
            actionsHtml = `
                <i class="fas fa-play" title="Iniciar tarefa"></i>
                <i class="fa-solid fa-pen-to-square" title="Editar tarefa"></i>
            `;
        }

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

export function toggleModal(show) {
    if (selectors.modalForgot) selectors.modalForgot.style.display = show ? 'flex' : 'none';
}