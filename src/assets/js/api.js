import Cookies from 'js-cookie';
import { baseUrl } from './constants';
import { clearCookies } from './utils';

export async function checkAuth() {
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

export async function createNewTimeTrack(userId, taskId, startTime, endTime, status, notes) {
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

export async function pauseFinishTimeTrack(timeTrackId, taskId, startTime, endTime, status, notes) {
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

export function getUserTimeTracks(userId) {
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

export function getAllSoftwares() {
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

export function getAllTasksBySoftware(software) {
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