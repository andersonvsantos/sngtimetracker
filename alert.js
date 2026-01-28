/**
 * SISTEMA: iZit - Lembrete de TimeTracker com Carga Horária Dinâmica
 * VERSÃO: Compatível com Power Automate (Schema PHP/GLPI)
 */

const TEAMS_WEBHOOK = "https://synergroupcombr.webhook.office.com/webhookb2/42a66a20-cbbe-41d5-9032-2359ce567031@8d357e44-1e9f-480e-a0ee-61c49408b798/IncomingWebhook/3cd64c08ed094529ba89d882a352e663/c29dec07-3ac0-40c4-a2b4-b611412f6609/V2nVkYEbTe38UREoxq78Z4sdHEBERymXo-APM2u7tfnNo1";

// Mapeamento de Regras: Carga Horária -> Horário de Disparo
const REGRAS_DISPARO = {
    "25": "12:50",
    "30": "13:50",
    "40": "16:50",
    "padrao": "16:50"
};

async function getTasksInfo() {
    try {
        const response = await fetch(`https://sngtimetracker.sng.com.br/tasks/`);
        return await response.json();
    } catch (e) { return []; }
}

async function getAllOpenTimeTracks() {
    try {
        const response = await fetch(`https://sngtimetracker.sng.com.br/timetracks/`);
        const data = await response.json();
        return data.filter(track => track.status == 1);
    } catch (e) { return []; }
}

async function getUserInfo() {
    try {
        const response = await fetch(`https://sngtimetracker.sng.com.br/users/`);
        return await response.json();
    } catch (e) { return []; }
}

async function enviarLembretes() {
    const agora = new Date();
    const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    
    console.log(`Verificando execuções para o horário: ${horaAtual}`);

    const [tracks, users, tasks] = await Promise.all([
        getAllOpenTimeTracks(),
        getUserInfo(),
        getTasksInfo()
    ]);

    for (const track of tracks) {
        const user = users.find(u => u.id == track.userId);
        if (!user) continue;

        const carga = user.cargaHoraria ? user.cargaHoraria.toString() : "padrao";
        const horarioAlvo = REGRAS_DISPARO[carga] || REGRAS_DISPARO["padrao"];

        // Validação de horário (Mantenha desativado se quiser testar agora)
        if (horaAtual !== horarioAlvo) {
            console.log(`Ignorando ${user.userName}: Carga ${carga}h exige disparo às ${horarioAlvo}`);
            continue;
        }

        const taskData = tasks.find(t => t.taskName === track.task || t.taskId === track.taskId);
        const urlFinal = taskData ? taskData.url : "https://sngtimetracker.sng.com.br/";

        // Payload adaptado para o seu Power Automate (Igual ao PHP funcional)
        const payload = {
            type: "message",
            attachments: [{
                contentType: "application/vnd.microsoft.card.adaptive",
                content: {
                    type: "AdaptiveCard",
                    version: "1.0", // Versão 1.0 para compatibilidade total
                    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                    body: [
                        {
                            type: "TextBlock",
                            text: "⏰ Lembrete: Apontamento Aberto",
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "TextBlock",
                            text: `Olá <at>${user.userName}</at>, notamos que você ainda tem um timer ativo em: **${track.task}**. Não esqueça de pausar ao encerrar seu expediente de **${carga === "padrao" ? "40" : carga}h**.`,
                            wrap: true
                        }
                    ],
                    msteams: {
                        entities: [{
                            type: "mention",
                            text: `<at>${user.userName}</at>`,
                            mentioned: { 
                                id: user.userEmail,
                                name: user.userName 
                            }
                        }]
                    },
                    actions: [{
                        type: "Action.OpenUrl",
                        title: "Ver no Azure DevOps",
                        url: urlFinal
                    }]
                }
            }]
        };

        try {
            const response = await fetch(TEAMS_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if(response.ok) {
                console.log(`✅ Alerta enviado: ${user.userName} (${carga}h) às ${horaAtual}`);
            } else {
                console.error(`❌ Erro no Teams (${response.status}):`, await response.text());
            }
        } catch (err) {
            console.error("Erro ao enviar:", err);
        }
    }
}

enviarLembretes();