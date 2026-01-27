/** * @description URL base para as chamadas de API do sistema de Time Tracker.
 */
export const baseUrl = 'https://sngtimetracker.sng.com.br';

/**
 * @description Objeto que centraliza o mapeamento de elementos do DOM (Document Object Model).
 * Facilita a manutenção e evita a repetição de seletores em diferentes partes do código.
 */
export const selectors = {
    // Corpo da tabela onde os dados dos apontamentos são renderizados
    tableBody : document.getElementById('tableBody'),
    
    // Elementos de exibição e controle do perfil do usuário no cabeçalho
    userSpan : document.getElementById("userSpan"),
    userBtn : document.getElementById('userBtn'),
    userMenu : document.getElementById('userMenu'),
    logOutBtn : document.getElementById('logOutBtn'),
    changePassBtn : document.getElementById('togglePassword'),

    // Botões de ação do Modal de Apontamento
    addNewTimeTrackBtn : document.getElementById('add-track-btn'), 
    resetCloseBtn : document.getElementById('reset-close-btn'),
    saveTimeTrackerBtn : document.getElementById('save-track-btn'),

    // Campos de seleção e labels relacionados ao Software e Tarefa
    softwareSelect : document.getElementById('sw-select'),
    taskSelect : document.getElementById('ts-select'),
    taskNameField : document.getElementById('lbl-task'),
    serviceNameField : document.getElementById('lbl-service'),

    // Inputs de data e hora para abertura e fechamento de registros
    openingDate : document.getElementById('start-date'),
    openingHour : document.getElementById('start-time'),
    closingDate : document.getElementById('end-date'),
    closingHour : document.getElementById('end-time'),

    // Outros controles de entrada de dados do apontamento
    statusSelect : document.getElementById('status-select-modal'),
    notesInput : document.getElementById('track-notes'),
    
    // Indicadores e seletores de período (range)
    counter : document.getElementById('tracksCounter'),
    rangeBtn : document.getElementById("range-picker-btn"),
    rangeLabel : document.getElementById('range-label'),

    // Elementos relacionados a alertas e modais de sistema
    forgotForm : document.getElementById('forgotForm'),
    modalForgot : document.getElementById('modalForgot'),
    alertContainer : document.getElementById("alert-container"),
    alertTitle : document.getElementById("alert-title"),
    alertDesc : document.getElementById("alert-desc"),
    modalTrack : document.getElementById('modalTrack'),
    trackForm : document.getElementById('trackForm')
}