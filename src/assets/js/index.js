import $ from 'jquery';
import select2 from 'select2';
import Cookies from 'js-cookie';
import "flatpickr/dist/flatpickr.css";
import { checkAuth, createNewTimeTrack, pauseFinishTimeTrack } from './api';
import { selectors } from './constants';
import { toggleNewTimeTrack } from './controllers';
import { initRangePicker, setFilter, updateFilterTitles } from './filters';
import { clearCookies, showAlert } from './utils';
import { toggleModal } from './ui';

window.jQuery = window.$ = $;

select2(); 

$(document).ready(function() {
    // Agora o .select2() deve existir no objeto jQuery
    $('#sw-select').select2();
});

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    if (selectors.userSpan) {
        selectors.userSpan.innerText = Cookies.get("userName") || "Usuário";
    }

    updateFilterTitles();

    // Inicializa com SEMANA ativa
    const weekBtn = document.querySelector('.filter-btn');
    if (weekBtn) {
        await setFilter(weekBtn);
    }

    initRangePicker();

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

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn));
    });

    selectors.addNewTimeTrackBtn.addEventListener('click', () => {
        toggleNewTimeTrack();
    });

    selectors.resetCloseBtn.addEventListener('click', () => {
        toggleModal();
    });

    selectors.tableBody.addEventListener('click', async (e) => {
        // Busca o ícone clicado ou o elemento pai caso clique na bordinha do ícone
        const icon = e.target.closest('i');
        if (!icon) return;

        // Busca a linha (tr) correspondente para pegar os dados
        const row = icon.closest('tr');
        const trackId = row.getAttribute('data-timetrack-id');
        const taskId = row.querySelector('[data-task-id]').getAttribute('data-task-id');
        const startTime = row.querySelector('[data-start-time]').getAttribute('data-start-time');
        const endTime = row.querySelector('[data-end-time]').getAttribute('data-end-time');
        const notes = row.querySelector('[data-notes]').getAttribute('data-notes');

        const currentTime = new Date();
        
        // Formata manualmente para o padrão local (YYYY-MM-DD HH:mm:ss)
        const ano = currentTime.getFullYear();
        const mes = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dia = String(currentTime.getDate()).padStart(2, '0');
        const hora = String(currentTime.getHours()).padStart(2, '0');
        const min = String(currentTime.getMinutes()).padStart(2, '0');
        const seg = String(currentTime.getSeconds()).padStart(2, '0');

        const localTime = `${ano}-${mes}-${dia}T${hora}:${min}:${seg}.000`;

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
        
        else if (icon.classList.contains('fa-pen-to-square')) {
            const row = icon.closest('tr');
            
            // Coleta os dados da linha para o selectors..modalTrack
            const dataToEdit = {
                id: row.getAttribute('data-timetrack-id'),
                taskIdValue: row.querySelector('[data-task-id]').getAttribute('data-task-id'),
                software: row.cells[3].innerText, // Pega o texto da coluna Software
                startTime: row.querySelector('[data-start-time]').getAttribute('data-start-time'),
                endTime: row.querySelector('[data-end-time]').getAttribute('data-end-time'),
                notes: row.querySelector('[data-notes]').getAttribute('data-notes'),
                status: row.querySelector('.status').classList.contains('opened') ? "1" : 
                        row.querySelector('.status').classList.contains('finished') ? "2" : "3"
            };

            toggleNewTimeTrack(dataToEdit);
        }
    });

    document.addEventListener('click', () => selectors.userMenu.classList.remove('active'));
});
