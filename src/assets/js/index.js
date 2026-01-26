import $ from 'jquery';
import select2 from 'select2';
import Cookies from 'js-cookie';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { baseUrl, selectors } from './constants';
import { showAlert, toggleModal, clearCookies } from './utils';

// IMPORTANTE: Expõe o jQuery globalmente para os plugins
window.jQuery = window.$ = $;

// Inicializa o plugin no jQuery global
select2(); 

$(document).ready(function() {
    // Agora o .select2() deve existir no objeto jQuery
    $('#sw-select').select2();
});

/* ===========================
   UTILIDADES
   =========================== */

function initRangePicker() {
    if (!selectors.rangeBtn) return;

    flatpickr(selectors.rangeBtn, {
        mode: "range",
        dateFormat: "d/m/Y",
        showMonths: 2,
        allowInput: false,
        disableMobile: true,
        onClose: function(selectedDates, dateStr) {
            if (selectedDates.length === 2) {
                if (selectors.rangeLabel) selectors.rangeLabel.innerText = dateStr;
                
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.disabled = false;
                });

                selectors.rangeBtn.classList.add('active');
                selectors.rangeBtn.disabled = false; 

                const [start, end] = selectedDates;
                executarFiltroCustomizado(start, end);
            }
        }
    });
}

async function executarFiltroCustomizado(start, end) {
    try {
        const userId = Cookies.get("userId");
        // Não limpamos a tabela aqui para evitar o efeito de "tela branca"
        
        const tracks = await getUserTimeTracks(userId);
        
        // Criamos cópias para não alterar os objetos originais do Flatpickr
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        const filteredTracks = tracks.filter(track => {
            const trackDate = new Date(track.startTime);
            return trackDate >= startDate && trackDate <= endDate;
        });

        if (selectors.counter) selectors.counter.innerHTML = `${filteredTracks.length} apontamentos.`;
        
        listUserTimeTracks(filteredTracks);
    } catch (err) {
        console.error(err);
        showAlert("Erro ao filtrar período.");
    }
}

async function checkAuth() {
    const token = Cookies.get("token");

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

        if (!response.ok) {
            throw new Error("Token inválido");
        }
    } catch (err) {
        clearCookies();
        window.location.href = "/login.html";
    }
}

/* ===========================
   API
   =========================== */

async function createNewTimeTrack(userId, taskId, startTime, endTime, status, notes) {
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

async function pauseFinishTimeTrack(timeTrackId, taskId, startTime, endTime, status, notes) {
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

function getUserTimeTracks(userId) {
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

function getAllSoftwares() {
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

function getAllTasksBySoftware(software) {
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

async function saveNewTimeTracker() {
    // Resultado esperado: "2026-01-15T14:18:00.0000000"
    const startTime = `${selectors.openingDate.value}T${selectors.openingHour.value}:00.0000000`;
    const endTime = selectors.closingDate.value && selectors.closingDate.value ? `${selectors.closingDate.value}T${selectors.closingHour.value}:00.0000000`: null;
    await createNewTimeTrack(Cookies.get("userId"), selectors.taskSelect.value, startTime, endTime, selectors.statusSelect.value, selectors.notesInput.value);
    location.reload();
}

async function toggleNewTimeTrack(editData = null) {
    
    // Abrir Modal
    selectors.modalTrack.style.display = 'flex';

    // Seleção de Elementos
    selectors.saveTimeTrackerBtn.disabled = true;
    selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
    selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
    
    const statusOptions = {
        aberto: selectors.statusSelect.querySelector('option[value="1"]'),
        pausado: selectors.statusSelect.querySelector('option[value="3"]'),
        finalizado: selectors.statusSelect.querySelector('option[value="2"]')
    };

    /* ===========================
        INICIALIZAÇÃO SELECT2
    =========================== */

    // Reinicializa para evitar bugs de memória ou duplicação
    if ($(selectors.softwareSelect).hasClass('select2-hidden-accessible')) {
        $(selectors.softwareSelect).select2('destroy');
    }
    if ($(selectors.taskSelect).hasClass('select2-hidden-accessible')) {
        $(selectors.taskSelect).select2('destroy');
    }

    $(selectors.softwareSelect).select2({
        dropdownParent: $('#modalTrack'),
        placeholder: 'Selecione um software',
        width: '100%'
    });

    $(selectors.taskSelect).select2({
        dropdownParent: $('#modalTrack'),
        placeholder: 'Digite para buscar task',
        width: '100%'
    });

    /* ===========================
        REGRAS DE NEGÓCIO
    =========================== */

    function updateClosingState() {
        const aberturaOk = selectors.openingDate.value && selectors.openingHour.value;
        const fechamentoOk = selectors.closingDate.value && selectors.closingHour.value;

        // Estado 1: sem abertura
        if (!aberturaOk) {
            selectors.closingDate.value = '';
            selectors.closingHour.value = '';
            selectors.closingDate.disabled = true;
            selectors.closingHour.disabled = true;

            selectors.statusSelect.style.display = 'none';
            selectors.statusSelect.value = '';
            selectors.statusSelect.disabled = true;

            statusOptions.aberto.disabled = false;
            statusOptions.pausado.disabled = true;
            statusOptions.finalizado.disabled = true;
            return;
        }

        // Estado 2: com abertura, sem fechamento
        if (aberturaOk && !fechamentoOk) {
            selectors.closingDate.disabled = false;
            selectors.closingHour.disabled = false;

            selectors.statusSelect.style.display = 'inline-block';
            selectors.statusSelect.value = '1'; // Aberto
            selectors.statusSelect.disabled = true;

            statusOptions.aberto.disabled = false;
            statusOptions.pausado.disabled = true;
            statusOptions.finalizado.disabled = true;
            return;
        }

        // Estado 3: com abertura e fechamento
        if (aberturaOk && fechamentoOk) {
            selectors.closingDate.disabled = false;
            selectors.closingHour.disabled = false;

            selectors.statusSelect.style.display = 'inline-block';
            selectors.statusSelect.disabled = false;
            
            // Se for novo track, força escolha. Se for edição, mantém o que veio.
            if(!editData) selectors.statusSelect.value = ''; 

            statusOptions.aberto.disabled = true;
            statusOptions.pausado.disabled = false;
            statusOptions.finalizado.disabled = false;
        }
    }

    function validateDates() {
        const dadosAberturaOk =
            selectors.softwareSelect.value &&
            selectors.taskSelect.value &&
            selectors.openingDate.value &&
            selectors.openingHour.value;

        const temDataFechamento = !!selectors.closingDate.value;
        const temHoraFechamento = !!selectors.closingHour.value;

        const fechamentoParcial =
            (temDataFechamento && !temHoraFechamento) ||
            (!temDataFechamento && temHoraFechamento);

        const dadosFechamentoOk = temDataFechamento && temHoraFechamento;

        // Fechamento parcial → inválido
        if (fechamentoParcial) {
            selectors.saveTimeTrackerBtn.disabled = true;
            selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
            return false;
        }

        // Fechamento completo SEM status → inválido
        if (dadosFechamentoOk && !selectors.statusSelect.value) {
            selectors.saveTimeTrackerBtn.disabled = true;
            selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
            return false;
        }

        // Validação de ordem de datas
        if (dadosFechamentoOk) {
            const start = new Date(`${selectors.openingDate.value}T${selectors.openingHour.value}`);
            const end = new Date(`${selectors.closingDate.value}T${selectors.closingHour.value}`);

            if (end < start) {
                showAlert('Data de fechamento não pode ser menor que a abertura');
                selectors.closingDate.value = '';
                selectors.closingHour.value = '';
                selectors.statusSelect.value = '1';
                selectors.statusSelect.disabled = true;

                selectors.saveTimeTrackerBtn.disabled = true;
                selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
                selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
                return false;
            }
        }

        // Regra final do botão
        if (
            dadosAberturaOk &&
            (
                (!temDataFechamento && !temHoraFechamento) || // sem fechamento
                (dadosFechamentoOk && selectors.statusSelect.value != '') // fechamento completo + status
            )
        ) {
            selectors.saveTimeTrackerBtn.disabled = false;
            selectors.saveTimeTrackerBtn.style.backgroundColor = '#007bff';
            selectors.saveTimeTrackerBtn.style.cursor = 'pointer';
        } else {
            selectors.saveTimeTrackerBtn.disabled = true;
            selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
        }
        return true;
    }

    /* ===========================
        EVENTOS E CARREGAMENTO
    =========================== */

    // Fechar Modal
    document.getElementById('closemodalTrack').onclick = () => {
        selectors.modalTrack.style.display = 'none';
        selectors.trackForm.reset();
        selectors.taskNameField.textContent = 'Nova Tarefa';
        selectors.serviceNameField.textContent = 'Selecione uma task para começar';
        $(selectors.softwareSelect).val(null).trigger('change').prop('disabled', false); // Reabilita software ao fechar
        $(selectors.taskSelect).val(null).trigger('change');
    };

    // Carregar Softwares
    const softwares = await getAllSoftwares();
    let swHTML = '<option value="">Selecione</option>';
    softwares.forEach(s => swHTML += `<option value="${s.name}">${s.name}</option>`);
    selectors.softwareSelect.innerHTML = swHTML;
    $(selectors.softwareSelect).trigger('change.select2');

    // Evento Change Software (Select2)
    $(selectors.softwareSelect).off('select2:select').on('select2:select', async function(e) {
        const software = e.target.value;
        
        // Reset campos dependentes
        selectors.taskSelect.innerHTML = '<option value="">Selecione</option>';
        selectors.taskSelect.disabled = true;
        selectors.taskNameField.textContent = 'Nova Tarefa';
        selectors.serviceNameField.textContent = 'Selecione uma task para começar';
        
        if (!software) {
            $(selectors.taskSelect).trigger('change.select2');
            return;
        }

        const tasks = await getAllTasksBySoftware(software);
        let taskHTML = '<option value="">Selecione</option>';
        tasks.forEach(task => {
            taskHTML += `<option value="${task.id}" 
                            data-task-name="${task.taskName}" 
                            data-service-name="${task.serviceName}"
                            title="${task.taskName}">
                            ${task.taskId}
                         </option>`;
        });
        
        selectors.taskSelect.innerHTML = taskHTML;
        selectors.taskSelect.disabled = false;
        $(selectors.taskSelect).trigger('change.select2');
    });

    // Evento Change Task (Select2)
    $(selectors.taskSelect).off('select2:select').on('select2:select', function(e) {
        const data = e.params.data.element; 
        selectors.taskNameField.textContent = data.dataset.taskName || 'Nova Tarefa';
        selectors.serviceNameField.textContent = data.dataset.serviceName || 'Selecione uma task para começar';
    });

    // Mudanças nos Selects (Ajustado para funcionar com Select2)
    $(selectors.taskSelect).on('change', () => {
        validateDates();
        updateClosingState();
    });

    $(selectors.softwareSelect).on('change', () => {
        validateDates();
        updateClosingState();
    });

    selectors.statusSelect.addEventListener('change', () => {
        validateDates();
    });

    // Datas e Horas (Nativo)
    [selectors.openingDate, selectors.openingHour, selectors.closingDate, selectors.closingHour].forEach(el => {
        el.addEventListener('change', () => {
            validateDates();
            updateClosingState();
        });
    });

    /* ===========================
        LÓGICA DE PREENCHIMENTO DE EDIÇÃO
    =========================== */
    if (editData) {
        // Bloqueia troca de software
        $(selectors.softwareSelect).val(editData.software).trigger('change');
        selectors.softwareSelect.disabled = true;
        $(selectors.softwareSelect).next('.select2-container').css('pointer-events', 'none');

        // Carregar tasks do software para que o Select2 possa selecionar o ID correto
        const tasks = await getAllTasksBySoftware(editData.software);
        let taskHTML = '<option value="">Selecione</option>';
        tasks.forEach(t => {
            taskHTML += `<option value="${t.id}" data-task-name="${t.taskName}" data-service-name="${t.serviceName}">${t.taskId}</option>`;
        });
        selectors.taskSelect.innerHTML = taskHTML;
        selectors.taskSelect.disabled = false;
        
        // Seleciona a task e atualiza labels
        $(selectors.taskSelect).val(editData.taskIdValue).trigger('change');
        const opt = selectors.taskSelect.options[selectors.taskSelect.selectedIndex];
        if(opt) {
            selectors.taskNameField.textContent = opt.dataset.taskName;
            selectors.serviceNameField.textContent = opt.dataset.serviceName;
        }

        // Preenche tempos (YYYY-MM-DD e HH:mm)
        selectors.openingDate.value = editData.startTime.split('T')[0];
        selectors.openingHour.value = editData.startTime.split('T')[1].substring(0, 5);
        
        if (editData.endTime && editData.endTime !== "null") {
            selectors.closingDate.value = editData.endTime.split('T')[0];
            selectors.closingHour.value = editData.endTime.split('T')[1].substring(0, 5);
        }

        selectors.notesInput.value = editData.notes || '';
        selectors.statusSelect.value = editData.status;

        // Sobrescreve o clique do botão para EDITAR
        selectors.saveTimeTrackerBtn.onclick = async (e) => {
            e.preventDefault();
            const start = `${selectors.openingDate.value}T${selectors.openingHour.value}:00.000`;
            const end = selectors.closingDate.value ? `${selectors.closingDate.value}T${selectors.closingHour.value}:00.000` : null;
            await pauseFinishTimeTrack(editData.id, selectors.taskSelect.value, start, end, selectors.statusSelect.value, selectors.notesInput.value);
            location.reload();
        };
    } else {
        // Modo criação: garante comportamento original de salvamento
        selectors.saveTimeTrackerBtn.onclick = async (e) => {
            e.preventDefault();
            if(!selectors.saveTimeTrackerBtn.disabled) {
                selectors.statusSelect.value == '' ? showAlert('Por favor selecione um status!') : saveNewTimeTracker();
            }
        };
    }

    // Execução inicial para aplicar regras de "Estado" baseadas nos dados carregados
    validateDates();
    updateClosingState();
}

/* ===========================
   LISTAGEM
   =========================== */

function listUserTimeTracks(tracks) {
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

/* ===========================
   FILTROS DE DATA
   =========================== */

function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

function getLastDaysPeriod(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
}

function updateFilterTitles() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        let days;

        switch (btn.innerText) {
            case 'Semana': days = 7; break;
            case 'Mês': days = 30; break;
            case 'Ano': days = 365; break;
        }

        if (days) {
            const { start, end } = getLastDaysPeriod(days);
            btn.title = `${formatDate(start)} - ${formatDate(end)}`;
        }
    });
}

/* ===========================
   FILTRO + REFETCH
   =========================== */

async function setFilter(element) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.disabled = false;
    });

    element.classList.add('active');
    element.disabled = true;

    updateFilterTitles();

    let days;
    switch (element.innerText) {
        case 'Semana': days = 7; break;
        case 'Mês': days = 30; break;
        case 'Ano': days = 365; break;
    }

    try {
        const userId = Cookies.get("userId");
        const tracks = await getUserTimeTracks(userId);

        const { start, end } = getLastDaysPeriod(days);

        const filteredTracks = tracks.filter(track => {
            const date = new Date(track.startTime);
            return date >= start && date <= end;
        });

        selectors.counter.innerHTML = `${filteredTracks.length} apontamentos.`;

        listUserTimeTracks(filteredTracks);
    } catch (err) {
        console.error(err);
        showAlert("Erro ao atualizar os apontamentos");
    }
}

/* ===========================
   INIT
   =========================== */

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
