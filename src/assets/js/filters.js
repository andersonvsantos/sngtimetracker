import Cookies from 'js-cookie';
import flatpickr from "flatpickr";
import { getUserTimeTracks } from './api';
import { selectors } from './constants';
import { listUserTimeTracks } from './ui';
import { showAlert } from './utils';

/**
 * @description Formata um objeto Date para uma string no padrão de data brasileiro.
 * @param {Date} date Objeto de data a ser formatado.
 * @returns {string} Data formatada como "dd/mm/aaaa".
 */
export function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

/**
 * @description Calcula o intervalo de datas baseado em um número de dias retroativos a partir de hoje.
 * @param {number} days Quantidade de dias para subtrair da data atual.
 * @returns {Object} Objeto contendo as datas de 'start' e 'end'.
 */
export function getLastDaysPeriod(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
}

/**
 * @description Atualiza o atributo 'title' dos botões de filtro para exibir o intervalo de datas ao passar o mouse.
 * @returns {void}
 */
export function updateFilterTitles() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        let days;

        // Mapeia o texto do botão para a quantidade de dias correspondente
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

/**
 * @description Ativa um filtro pré-definido (Semana, Mês, Ano), busca os dados e atualiza a interface.
 * @param {HTMLElement} element O botão de filtro que foi clicado.
 * @returns {Promise<void>}
 */
export async function setFilter(element) {
    // Reseta o estado visual de todos os botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.disabled = false;
    });

    // Define o botão clicado como ativo
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

        // Filtra os apontamentos dentro do intervalo calculado
        const filteredTracks = tracks.filter(track => {
            const date = new Date(track.startTime);
            return date >= start && date <= end;
        });

        // Atualiza o contador de registros na UI
        selectors.counter.innerHTML = `${filteredTracks.length} apontamentos.`;

        // Renderiza a lista filtrada na tabela
        listUserTimeTracks(filteredTracks);
    } catch (err) {
        console.error(err);
        showAlert("Erro ao atualizar os apontamentos");
    }
}

/**
 * @description Inicializa o componente Flatpickr para seleção de um intervalo de datas personalizado.
 * @returns {void}
 */
export function initRangePicker() {
    if (!selectors.rangeBtn) return;

    flatpickr(selectors.rangeBtn, {
        mode: "range",
        dateFormat: "d/m/Y",
        showMonths: 2,
        allowInput: false,
        disableMobile: true,
        onClose: function(selectedDates, dateStr) {
            // Executa a filtragem apenas quando as duas datas (início e fim) são selecionadas
            if (selectedDates.length === 2) {
                if (selectors.rangeLabel) selectors.rangeLabel.innerText = dateStr;
                
                // Desativa outros botões de filtro rápido
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    btn.disabled = false;
                });

                selectors.rangeBtn.classList.add('active');
                selectors.rangeBtn.disabled = false; 

                const [start, end] = selectedDates;
                setCustomFilter(start, end);
            }
        }
    });
}

/**
 * @description Filtra e exibe os apontamentos baseando-se em um intervalo de datas customizado.
 * @param {Date} start Data inicial do período.
 * @param {Date} end Data final do período.
 * @returns {Promise<void>}
 */
export async function setCustomFilter(start, end) {
    try {
        const userId = Cookies.get("userId");
        
        const tracks = await getUserTimeTracks(userId);
        
        // Ajusta as horas para garantir que o filtro englobe o dia inteiro
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        // Compara as datas dos apontamentos com o intervalo selecionado
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

/**
 * @description Localiza o filtro que está ativo no momento e dispara a atualização dos dados.
 */
export async function refreshActiveFilter() {
    // Busca o botão que tem a classe 'active'
    const activeBtn = document.querySelector('.filter-btn.active');
    
    if (activeBtn) {
        // Se for um dos botões rápidos (Semana, Mês, Ano)
        await setFilter(activeBtn);
    } else if (selectors.rangeBtn && selectors.rangeBtn.classList.contains('active')) {
        // Se for o filtro de calendário customizado
        const instance = selectors.rangeBtn._flatpickr;
        if (instance && instance.selectedDates.length === 2) {
            const [start, end] = instance.selectedDates;
            await setCustomFilter(start, end);
        }
    }
}