import Cookies from 'js-cookie';
import flatpickr from "flatpickr";
import { getUserTimeTracks } from './api';
import { selectors } from './constants';
import { listUserTimeTracks } from './ui';
import { showAlert } from './utils';

export function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

export function getLastDaysPeriod(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { start, end };
}

export function updateFilterTitles() {
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

export async function setFilter(element) {
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

export function initRangePicker() {
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
                setCustomFilter(start, end);
            }
        }
    });
}

export async function setCustomFilter(start, end) {
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