import $ from 'jquery';
import Cookies from 'js-cookie';
import { createNewTimeTrack, getAllSoftwares, getAllTasksBySoftware, pauseFinishTimeTrack, updatePassword } from './api';
import { selectors } from './constants';
import { showAlert} from './utils';
import { toggleModal } from './ui';

/**
 * @description Captura os dados do formulário de reset de senha e processa a atualização.
 * @param {Event} event Evento de submit do formulário.
 * @returns {Promise<void>}
 */
export async function handlePasswordReset(event) {
    event.preventDefault();

    const oldPassword = document.getElementById("reset-old-password").value;
    const newPassword = document.getElementById("reset-new-password").value;

    if (!newPassword) {
        showAlert("Nova senha é obrigatória.", "error");
        return;
    }

    try {
        await updatePassword(Cookies.get("userEmail"), oldPassword, newPassword);
        showAlert("Senha atualizada com sucesso!", "success");
        
        // Limpa o formulário e fecha o modal
        event.target.reset();
        setTimeout(() => toggleModal(false), 2000);
    } catch (err) {
        showAlert(err.message, "error");
    }
}

/**
 * @description Coleta os dados do formulário e envia para a API para criar um novo registro de tempo.
 * @returns {Promise<void>} Redireciona a página após o salvamento.
 */
export async function saveNewTimeTracker() {
    // Formatação de data/hora para o padrão aceito pelo SQL Server (ISO com milissegundos)
    const startTime = `${selectors.openingDate.value}T${selectors.openingHour.value}:00.0000000`;
    const endTime = selectors.closingDate.value && selectors.closingDate.value ? `${selectors.closingDate.value}T${selectors.closingHour.value}:00.0000000`: null;
    
    await createNewTimeTrack(
        Cookies.get("userId"), 
        selectors.taskSelect.value, 
        startTime, 
        endTime, 
        selectors.statusSelect.value, 
        selectors.notesInput.value
    );
    location.reload();
}

/**
 * @description Controla a abertura, preenchimento e validação do modal de apontamento (Criação e Edição).
 * @param {Object|null} [editData=null] Objeto contendo os dados do apontamento para modo edição.
 * @returns {Promise<void>}
 */
export async function toggleNewTimeTrack(editData = null) {
    
    selectors.modalTrack.style.display = 'flex';

    // Inicializa o botão de salvar como desabilitado por segurança
    selectors.saveTimeTrackerBtn.disabled = true;
    selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
    selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
    
    // Mapeamento das opções de status para manipulação de visibilidade/bloqueio
    const statusOptions = {
        aberto: selectors.statusSelect.querySelector('option[value="1"]'),
        pausado: selectors.statusSelect.querySelector('option[value="3"]'),
        finalizado: selectors.statusSelect.querySelector('option[value="2"]')
    };

    // Reinicialização do Select2 (jQuery) para evitar duplicidade de instâncias
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

    /**
     * @description Gerencia a disponibilidade dos campos de fechamento e status baseando-se no preenchimento da abertura.
     */
    function updateClosingState() {
        const aberturaOk = selectors.openingDate.value && selectors.openingHour.value;
        const fechamentoOk = selectors.closingDate.value && selectors.closingHour.value;

        // ESTADO 1: Sem data de abertura informada
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

        // ESTADO 2: Abertura preenchida, mas sem fechamento
        if (aberturaOk && !fechamentoOk) {
            selectors.closingDate.disabled = false;
            selectors.closingHour.disabled = false;

            selectors.statusSelect.style.display = 'inline-block';
            selectors.statusSelect.value = '1'; // Força status "Aberto"
            selectors.statusSelect.disabled = true;

            statusOptions.aberto.disabled = false;
            statusOptions.pausado.disabled = true;
            statusOptions.finalizado.disabled = true;
            return;
        }

        // ESTADO 3: Abertura e Fechamento preenchidos
        if (aberturaOk && fechamentoOk) {
            selectors.closingDate.disabled = false;
            selectors.closingHour.disabled = false;

            selectors.statusSelect.style.display = 'inline-block';
            selectors.statusSelect.disabled = false;
            
            if(!editData) selectors.statusSelect.value = ''; 

            statusOptions.aberto.disabled = true; // Impede manter "Aberto" se há data de fim
            statusOptions.pausado.disabled = false;
            statusOptions.finalizado.disabled = false;
        }
    }

    /**
     * @description Valida a consistência lógica dos dados (campos obrigatórios e ordem cronológica).
     * @returns {boolean}
     */
    function validateDates() {
        const dadosAberturaOk =
            selectors.softwareSelect.value &&
            selectors.taskSelect.value &&
            selectors.openingDate.value &&
            selectors.openingHour.value;

        const temDataFechamento = !!selectors.closingDate.value;
        const temHoraFechamento = !!selectors.closingHour.value;

        // Verifica se o usuário preencheu apenas um dos campos de fechamento
        const fechamentoParcial =
            (temDataFechamento && !temHoraFechamento) ||
            (!temDataFechamento && temHoraFechamento);

        const dadosFechamentoOk = temDataFechamento && temHoraFechamento;

        if (fechamentoParcial) {
            bloquearBotaoSalvar();
            return false;
        }

        if (dadosFechamentoOk && !selectors.statusSelect.value) {
            bloquearBotaoSalvar();
            return false;
        }

        // Regra Cronológica: Abertura deve ser anterior ao Fechamento
        if (dadosFechamentoOk) {
            const start = new Date(`${selectors.openingDate.value}T${selectors.openingHour.value}`);
            const end = new Date(`${selectors.closingDate.value}T${selectors.closingHour.value}`);

            if (end < start) {
                showAlert('Data de fechamento não pode ser menor que a abertura');
                selectors.closingDate.value = '';
                selectors.closingHour.value = '';
                selectors.statusSelect.value = '1';
                selectors.statusSelect.disabled = true;
                bloquearBotaoSalvar();
                return false;
            }
        }

        // Habilita o botão se os requisitos mínimos forem atendidos
        if (
            dadosAberturaOk &&
            (
                (!temDataFechamento && !temHoraFechamento) || 
                (dadosFechamentoOk && selectors.statusSelect.value != '')
            )
        ) {
            selectors.saveTimeTrackerBtn.disabled = false;
            selectors.saveTimeTrackerBtn.style.backgroundColor = '#007bff';
            selectors.saveTimeTrackerBtn.style.cursor = 'pointer';
        } else {
            bloquearBotaoSalvar();
        }
        return true;
    }

    function bloquearBotaoSalvar() {
        selectors.saveTimeTrackerBtn.disabled = true;
        selectors.saveTimeTrackerBtn.style.backgroundColor = '#0054ad';
        selectors.saveTimeTrackerBtn.style.cursor = 'not-allowed';
    }

    // Configuração do evento de fechar o modal e resetar formulário
    document.getElementById('closemodalTrack').onclick = () => {
        selectors.modalTrack.style.display = 'none';
        selectors.trackForm.reset();
        selectors.taskNameField.textContent = 'Nova Tarefa';
        selectors.serviceNameField.textContent = 'Selecione uma task para começar';
        $(selectors.softwareSelect).val(null).trigger('change').prop('disabled', false);
        $(selectors.taskSelect).val(null).trigger('change');
    };

    // Carregamento inicial da lista de softwares no select
    const softwares = await getAllSoftwares();
    let swHTML = '<option value="">Selecione</option>';
    softwares.forEach(s => swHTML += `<option value="${s.name}">${s.name}</option>`);
    selectors.softwareSelect.innerHTML = swHTML;
    $(selectors.softwareSelect).trigger('change.select2');

    // Listener para carregar tarefas assim que um software é selecionado
    $(selectors.softwareSelect).off('select2:select').on('select2:select', async function(e) {
        const software = e.target.value;
        
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

    // Atualiza labels descritivas ao selecionar uma tarefa específica
    $(selectors.taskSelect).off('select2:select').on('select2:select', function(e) {
        const data = e.params.data.element; 
        selectors.taskNameField.textContent = data.dataset.taskName || 'Nova Tarefa';
        selectors.serviceNameField.textContent = data.dataset.serviceName || 'Selecione uma task para começar';
    });

    // Atribuição de ouvintes de eventos para validação em tempo real
    $(selectors.taskSelect).on('change', () => { validateDates(); updateClosingState(); });
    $(selectors.softwareSelect).on('change', () => { validateDates(); updateClosingState(); });
    selectors.statusSelect.addEventListener('change', () => { validateDates(); });

    [selectors.openingDate, selectors.openingHour, selectors.closingDate, selectors.closingHour].forEach(el => {
        el.addEventListener('change', () => {
            validateDates();
            updateClosingState();
        });
    });

    // Lógica para MODO EDIÇÃO: Preenche o formulário com dados existentes
    if (editData) {
        $(selectors.softwareSelect).val(editData.software).trigger('change');
        selectors.softwareSelect.disabled = true;
        $(selectors.softwareSelect).next('.select2-container').css('pointer-events', 'none');

        const tasks = await getAllTasksBySoftware(editData.software);
        let taskHTML = '<option value="">Selecione</option>';
        tasks.forEach(t => {
            taskHTML += `<option value="${t.id}" data-task-name="${t.taskName}" data-service-name="${t.serviceName}">${t.taskId}</option>`;
        });
        selectors.taskSelect.innerHTML = taskHTML;
        selectors.taskSelect.disabled = false;
        
        $(selectors.taskSelect).val(editData.taskIdValue).trigger('change');
        const opt = selectors.taskSelect.options[selectors.taskSelect.selectedIndex];
        if(opt) {
            selectors.taskNameField.textContent = opt.dataset.taskName;
            selectors.serviceNameField.textContent = opt.dataset.serviceName;
        }

        // Decomposição da string ISO para inputs de data e hora
        selectors.openingDate.value = editData.startTime.split('T')[0];
        selectors.openingHour.value = editData.startTime.split('T')[1].substring(0, 5);
        
        if (editData.endTime && editData.endTime !== "null") {
            selectors.closingDate.value = editData.endTime.split('T')[0];
            selectors.closingHour.value = editData.endTime.split('T')[1].substring(0, 5);
        }

        selectors.notesInput.value = editData.notes || '';
        selectors.statusSelect.value = editData.status;

        // Altera o comportamento do botão para UPDATE em vez de CREATE
        selectors.saveTimeTrackerBtn.onclick = async (e) => {
            e.preventDefault();
            const start = `${selectors.openingDate.value}T${selectors.openingHour.value}:00.000`;
            const end = selectors.closingDate.value ? `${selectors.closingDate.value}T${selectors.closingHour.value}:00.000` : null;
            await pauseFinishTimeTrack(editData.id, selectors.taskSelect.value, start, end, selectors.statusSelect.value, selectors.notesInput.value);
            location.reload();
        };
    } else {
        // Lógica para MODO CRIAÇÃO
        selectors.saveTimeTrackerBtn.onclick = async (e) => {
            e.preventDefault();
            if(!selectors.saveTimeTrackerBtn.disabled) {
                selectors.statusSelect.value == '' ? showAlert('Por favor selecione um status!') : saveNewTimeTracker();
            }
        };
    }

    // Validação inicial para configurar o estado dos campos ao abrir o modal
    validateDates();
    updateClosingState();
}