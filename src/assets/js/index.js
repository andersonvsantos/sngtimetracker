import $ from 'jquery';
import select2 from 'select2';

// IMPORTANTE: Expõe o jQuery globalmente para os plugins
window.jQuery = window.$ = $;

// Inicializa o plugin no jQuery global
select2(); 

$(document).ready(function() {
    // Agora o .select2() deve existir no objeto jQuery
    $('#sw-select').select2();
});

let baseUrl = 'https://sngtimetracker.sng.com.br';

/* ===========================
   CONSTANTES
   =========================== */

const tableBody = document.getElementById('tableBody');
const userSpan = document.getElementById("userSpan");
const userBtn = document.getElementById('userBtn');
const userMenu = document.getElementById('userMenu');
const logOutBtn = document.getElementById('logOutBtn');
const changePassBtn = document.getElementById('togglePassword');
const addNewTimeTrackBtn = document.getElementById('add-track-btn'); 
const resetCloseBtn = document.getElementById('reset-close-btn');
const softwareSelect = document.getElementById('sw-select');
const taskSelect = document.getElementById('ts-select');
const taskNameField = document.getElementById('lbl-task');
const serviceNameField = document.getElementById('lbl-service');
const dataAbertura = document.getElementById('start-date');
const horaAbertura = document.getElementById('start-time');
const dataFechamento = document.getElementById('end-date');
const horaFechamento = document.getElementById('end-time');
const statusSelect = document.getElementById('status-select-modal');
const notesInput = document.getElementById('track-notes');
const saveTimeTrackerBtn = document.getElementById('save-track-btn');

/* ===========================
   UTILIDADES
   =========================== */

async function checkAuth() {
    const token = sessionStorage.getItem("sessionToken");

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
        sessionStorage.clear();
        window.location.href = "/login.html";
    }
}

function toggleModal(show) {
    const modal = document.getElementById('modalForgot');
    if (modal) modal.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = "error") {
    const alertContainer = document.getElementById("alert-container");
    const alertTitle = document.getElementById("alert-title");
    const alertDesc = document.getElementById("alert-desc");

    if (!alertContainer) return;

    alertContainer.classList.toggle("success", type === "success");
    alertTitle.innerText = type === "success" ? "Sucesso" : "Erro";
    alertDesc.innerText = message;

    alertContainer.classList.add("show");
    setTimeout(() => alertContainer.classList.remove("show"), 3000);
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
    const token = sessionStorage.getItem("sessionToken");

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
    const token = sessionStorage.getItem("sessionToken");

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
    const token = sessionStorage.getItem("sessionToken");

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
    const startTime = `${dataAbertura.value}T${horaAbertura.value}:00.0000000`;
    const endTime = dataFechamento.value && dataFechamento.value ? `${dataFechamento.value}T${horaFechamento.value}:00.0000000`: null;
    await createNewTimeTrack(sessionStorage.getItem("userId"), taskSelect.value, startTime, endTime, statusSelect.value, notesInput.value);
    location.reload();
}

async function toggleNewTimeTrack() {
    const modal = document.getElementById('modalTrack');
    const form = document.getElementById('trackForm');
    
    // Abrir Modal
    modal.style.display = 'flex';

    // Seleção de Elementos
    saveTimeTrackerBtn.disabled = true;
    saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
    saveTimeTrackerBtn.style.cursor = 'not-allowed';
    
    const statusOptions = {
        aberto: statusSelect.querySelector('option[value="1"]'),
        pausado: statusSelect.querySelector('option[value="3"]'),
        finalizado: statusSelect.querySelector('option[value="2"]')
    };

    /* ===========================
        INICIALIZAÇÃO SELECT2
    =========================== */

    // Reinicializa para evitar bugs de memória ou duplicação
    if ($(softwareSelect).hasClass('select2-hidden-accessible')) {
        $(softwareSelect).select2('destroy');
    }
    if ($(taskSelect).hasClass('select2-hidden-accessible')) {
        $(taskSelect).select2('destroy');
    }

    $(softwareSelect).select2({
        dropdownParent: $('#modalTrack'),
        placeholder: 'Selecione um software',
        width: '100%'
    });

    $(taskSelect).select2({
        dropdownParent: $('#modalTrack'),
        placeholder: 'Digite para buscar task',
        width: '100%'
    });

    /* ===========================
        REGRAS DE NEGÓCIO
    =========================== */


    function updateClosingState() {
        const aberturaOk = dataAbertura.value && horaAbertura.value;
        const fechamentoOk = dataFechamento.value && horaFechamento.value;

        // Estado 1: sem abertura
        if (!aberturaOk) {
            dataFechamento.value = '';
            horaFechamento.value = '';
            dataFechamento.disabled = true;
            horaFechamento.disabled = true;

            statusSelect.style.display = 'none';
            statusSelect.value = '';
            statusSelect.disabled = true;

            statusOptions.aberto.disabled = false;
            statusOptions.pausado.disabled = true;
            statusOptions.finalizado.disabled = true;
            return;
        }

        // Estado 2: com abertura, sem fechamento
        if (aberturaOk && !fechamentoOk) {
            dataFechamento.disabled = false;
            horaFechamento.disabled = false;

            statusSelect.style.display = 'inline-block';
            statusSelect.value = '1'; // Aberto
            statusSelect.disabled = true;

            statusOptions.aberto.disabled = false;
            statusOptions.pausado.disabled = true;
            statusOptions.finalizado.disabled = true;
            return;
        }

        // Estado 3: com abertura e fechamento
        if (aberturaOk && fechamentoOk) {
            dataFechamento.disabled = false;
            horaFechamento.disabled = false;

            statusSelect.style.display = 'inline-block';
            statusSelect.disabled = false;
            statusSelect.value = ''; // força escolha

            statusOptions.aberto.disabled = true;
            statusOptions.pausado.disabled = false;
            statusOptions.finalizado.disabled = false;
        }
    }


    function validateDates() {
        const dadosAberturaOk =
            softwareSelect.value &&
            taskSelect.value &&
            dataAbertura.value &&
            horaAbertura.value;

        const temDataFechamento = !!dataFechamento.value;
        const temHoraFechamento = !!horaFechamento.value;

        const fechamentoParcial =
            (temDataFechamento && !temHoraFechamento) ||
            (!temDataFechamento && temHoraFechamento);

        const dadosFechamentoOk = temDataFechamento && temHoraFechamento;

        // Fechamento parcial → inválido
        if (fechamentoParcial) {
            saveTimeTrackerBtn.disabled = true;
            saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            saveTimeTrackerBtn.style.cursor = 'not-allowed';
            return false;
        }

        // Fechamento completo SEM status → inválido
        if (dadosFechamentoOk && !statusSelect.value) {
            saveTimeTrackerBtn.disabled = true;
            saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            saveTimeTrackerBtn.style.cursor = 'not-allowed';
            return false;
        }

        // Validação de ordem de datas
        if (dadosFechamentoOk) {
            const start = new Date(`${dataAbertura.value}T${horaAbertura.value}`);
            const end = new Date(`${dataFechamento.value}T${horaFechamento.value}`);

            if (end < start) {
                showAlert('Data de fechamento não pode ser menor que a abertura');
                dataFechamento.value = '';
                horaFechamento.value = '';
                statusSelect.value = '1';
                statusSelect.disabled = true;

                saveTimeTrackerBtn.disabled = true;
                saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
                saveTimeTrackerBtn.style.cursor = 'not-allowed';
                return false;
            }
        }

        // Regra final do botão
        if (
            dadosAberturaOk &&
            (
                (!temDataFechamento && !temHoraFechamento) || // sem fechamento
                (dadosFechamentoOk && statusSelect.value != '')               // fechamento completo + status
            )
        ) {
            saveTimeTrackerBtn.disabled = false;
            saveTimeTrackerBtn.style.backgroundColor = '#007bff';
            saveTimeTrackerBtn.style.cursor = 'pointer';
        } else {
            saveTimeTrackerBtn.disabled = true;
            saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
            saveTimeTrackerBtn.style.cursor = 'not-allowed';
        }
        return true;
    }

    /* ===========================
        EVENTOS E CARREGAMENTO
    =========================== */

    // Fechar Modal
    document.getElementById('closeTrackModal').onclick = () => {
        modal.style.display = 'none';
        form.reset();
        taskNameField.textContent = 'Nova Tarefa';
        serviceNameField.textContent = 'Selecione uma task para começar';
        $(softwareSelect).val(null).trigger('change');
        $(taskSelect).val(null).trigger('change');
    };

    // Carregar Softwares
    const softwares = await getAllSoftwares();
    let swHTML = '<option value="">Selecione</option>';
    softwares.forEach(s => swHTML += `<option value="${s.name}">${s.name}</option>`);
    softwareSelect.innerHTML = swHTML;
    $(softwareSelect).trigger('change.select2');

    // Evento Change Software (Select2)
    $(softwareSelect).off('select2:select').on('select2:select', async function(e) {
        const software = e.target.value;
        
        // Reset campos dependentes
        taskSelect.innerHTML = '<option value="">Selecione</option>';
        taskSelect.disabled = true;
        taskNameField.textContent = 'Nova Tarefa';
        serviceNameField.textContent = 'Selecione uma task para começar';
        
        if (!software) {
            $(taskSelect).trigger('change.select2');
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
        
        taskSelect.innerHTML = taskHTML;
        taskSelect.disabled = false;
        $(taskSelect).trigger('change.select2');
    });

    // Evento Change Task (Select2)
    $(taskSelect).off('select2:select').on('select2:select', function(e) {
        const data = e.params.data.element; // Acessa o elemento <option> original
        taskNameField.textContent = data.dataset.taskName || 'Nova Tarefa';
        serviceNameField.textContent = data.dataset.serviceName || 'Selecione uma task para começar';
    });

    // Mudanças nos Selects (Ajustado para funcionar com Select2)
    $(taskSelect).on('change', () => {
        validateDates();
        updateClosingState();
    });

    $(softwareSelect).on('change', () => {
        validateDates();
        updateClosingState();
    });

    statusSelect.addEventListener('change', () => {
        validateDates();
    });

    // Datas e Horas (Nativo)
    dataAbertura.addEventListener('change', () => {
        validateDates();
        updateClosingState();
    });

    horaAbertura.addEventListener('change', () => {
        validateDates();
        updateClosingState();
    });
    
    dataFechamento.addEventListener('change', () => {
        validateDates();
        updateClosingState();
    });

    horaFechamento.addEventListener('change', () => {
        validateDates();
        updateClosingState();
    });
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

    const tableBody = document.getElementById('tableBody');
    
    tableBody.innerHTML = '';

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

        tableBody.innerHTML += `
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
        const userId = sessionStorage.getItem("userId");
        const tracks = await getUserTimeTracks(userId);

        const counter = document.getElementById('tracksCounter');

        const { start, end } = getLastDaysPeriod(days);

        const filteredTracks = tracks.filter(track => {
            const date = new Date(track.startTime);
            return date >= start && date <= end;
        });

        counter.innerHTML = `${filteredTracks.length} apontamentos.`;

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

    if (userSpan) {
        userSpan.innerText = sessionStorage.getItem("userName") || "Usuário";
    }

    updateFilterTitles();

    // Inicializa com SEMANA ativa
    const weekBtn = document.querySelector('.filter-btn');
    if (weekBtn) {
        await setFilter(weekBtn);
    }

    userBtn?.addEventListener('click', e => {
        e.stopPropagation();
        userMenu.classList.toggle('active');
    });

    changePassBtn?.addEventListener('click', e => {
        e.stopPropagation();
        userMenu.classList.remove('active');
        toggleModal(true);
    });

    logOutBtn?.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = "./pages/login.html";
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn));
    });

    addNewTimeTrackBtn.addEventListener('click', () => {
        toggleNewTimeTrack();
    });

    resetCloseBtn.addEventListener('click', () => {
        toggleModal();
    });

    saveTimeTrackerBtn.addEventListener('click', async(e) => {
        e.preventDefault();
        if(saveTimeTrackerBtn.disabled == false) {
            statusSelect.value == '' ? showAlert('Por favor selecione um status para salvar!') : saveNewTimeTracker();
        }
    });

    tableBody.addEventListener('click', async (e) => {
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
                await createNewTimeTrack(sessionStorage.getItem("userId"), taskId, localTime, null, "1", '');
                showAlert("Tarefa iniciada com sucesso!", "success");
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                console.error(err);
                showAlert("Erro ao iniciar tarefa.");
            }
        } 
        
        else if (icon.classList.contains('fa-pen-to-square')) {
            console.log('Editando ID:', trackId);
            // Lógica para abrir o modal de edição com os dados da 'row'
        }
    });

    document.addEventListener('click', () => userMenu.classList.remove('active'));
});
