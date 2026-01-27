import $ from 'jquery';
import select2 from 'select2';
import Cookies from 'js-cookie';
import "flatpickr/dist/flatpickr.css";
import { checkAuth, createNewTimeTrack, pauseFinishTimeTrack } from './api';
import { selectors } from './constants';
import { toggleNewTimeTrack, handlePasswordReset } from './controllers';
import { initRangePicker, setFilter, updateFilterTitles, refreshActiveFilter } from './filters';
import { clearCookies, showAlert } from './utils';
import { toggleModal } from './ui';

// Configuração global para compatibilidade do jQuery e plugins como Select2
window.jQuery = window.$ = $;
select2(); 

$(document).ready(function() {
    // Inicialização do Select2 no seletor de software via jQuery
    $('#sw-select').select2();
});

/**
 * @description Ponto de entrada principal. Configura o estado inicial da aplicação, 
 * autenticação, filtros e ouvintes de eventos globais.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Valida se o usuário está autenticado antes de carregar o conteúdo
    checkAuth();

    // Exibe o nome do usuário recuperado dos cookies no cabeçalho
    if (selectors.userSpan) {
        selectors.userSpan.innerText = Cookies.get("userName") || "Usuário";
    }

    // Prepara os títulos dos filtros (tooltips) com as datas correspondentes
    updateFilterTitles();

    // Define o filtro de "Semana" como padrão na carga inicial
    const weekBtn = document.querySelector('.filter-btn');
    if (weekBtn) {
        await setFilter(weekBtn);
    }

    // Inicializa o seletor de intervalo de datas (Flatpickr)
    initRangePicker();

    setInterval(async () => {
        console.log("Atualizando lista de tracks automaticamente...");
        await refreshActiveFilter();
    }, 120000);

    // --- Gerenciamento do Menu de Usuário ---
    selectors.userBtn?.addEventListener('click', e => {
        e.stopPropagation();
        selectors.userMenu.classList.toggle('active');
    });

    selectors.changePassBtn?.addEventListener('click', e => {
        e.stopPropagation();
        selectors.userMenu.classList.remove('active');
        toggleModal(true);
    });

    selectors.logOutBtn?.addEventListener('click', () => {
        clearCookies();
        window.location.href = "/login.html";
    });

    // --- Filtros e Ações de Apontamento ---
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn));
    });

    selectors.addNewTimeTrackBtn.addEventListener('click', () => {
        toggleNewTimeTrack();
    });

    if (selectors.forgotForm) {
        selectors.forgotForm.addEventListener('submit', handlePasswordReset);
    }

    selectors.resetCloseBtn.addEventListener('click', () => {
        toggleModal();
    });

    /**
     * @description Delegação de evento para a tabela de apontamentos. 
     * Gerencia cliques nos ícones de ação (Pausar, Finalizar, Iniciar e Editar).
     */
    selectors.tableBody.addEventListener('click', async (e) => {
        const icon = e.target.closest('i');
        if (!icon) return;

        // Extração de metadados armazenados nos atributos 'data-' da linha (tr)
        const row = icon.closest('tr');
        const trackId = row.getAttribute('data-timetrack-id');
        const taskId = row.querySelector('[data-task-id]').getAttribute('data-task-id');
        const startTime = row.querySelector('[data-start-time]').getAttribute('data-start-time');
        const notes = row.querySelector('[data-notes]').getAttribute('data-notes');

        // Geração de timestamp local formatado para envio à API
        const currentTime = new Date();
        const ano = currentTime.getFullYear();
        const mes = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dia = String(currentTime.getDate()).padStart(2, '0');
        const hora = String(currentTime.getHours()).padStart(2, '0');
        const min = String(currentTime.getMinutes()).padStart(2, '0');
        const seg = String(currentTime.getSeconds()).padStart(2, '0');
        const localTime = `${ano}-${mes}-${dia}T${hora}:${min}:${seg}.000`;

        // AÇÃO: Pausar Tarefa (Status 3)
        if (icon.classList.contains('fa-pause')) {
            try {
                await pauseFinishTimeTrack(trackId, taskId, startTime, localTime, "3", notes);
                showAlert("Tarefa pausada com sucesso!", "success");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                console.error(err);
                showAlert("Erro ao pausar tarefa.");
            }
        } 
        // AÇÃO: Finalizar Tarefa (Status 2)
        else if (icon.classList.contains('fa-flag-checkered')) {
            try {
                await pauseFinishTimeTrack(trackId, taskId, startTime, localTime, "2", notes);
                showAlert("Tarefa finalizada com sucesso!", "success");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                console.error(err);
                showAlert("Erro ao finalizar tarefa.");
            }
        } 
        // AÇÃO: Iniciar/Retomar Tarefa (Cria um novo registro com Status 1)
        else if (icon.classList.contains('fa-play')) {
            try {
                await createNewTimeTrack(Cookies.get("userId"), taskId, localTime, null, "1", '');
                showAlert("Tarefa iniciada com sucesso!", "success");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                console.error(err);
                showAlert("Erro ao iniciar tarefa.");
            }
        } 
        // AÇÃO: Abrir Modal de Edição
        else if (icon.classList.contains('fa-pen-to-square')) {
            const dataToEdit = {
                id: row.getAttribute('data-timetrack-id'),
                taskIdValue: row.querySelector('[data-task-id]').getAttribute('data-task-id'),
                software: row.cells[3].innerText,
                startTime: row.querySelector('[data-start-time]').getAttribute('data-start-time'),
                endTime: row.querySelector('[data-end-time]').getAttribute('data-end-time'),
                notes: row.querySelector('[data-notes]').getAttribute('data-notes'),
                status: row.querySelector('.status').classList.contains('opened') ? "1" : 
                        row.querySelector('.status').classList.contains('finished') ? "2" : "3"
            };

            toggleNewTimeTrack(dataToEdit);
        }
    });

    // Fecha menus suspensos ao clicar em qualquer área vazia da página
    document.addEventListener('click', () => selectors.userMenu.classList.remove('active'));
});