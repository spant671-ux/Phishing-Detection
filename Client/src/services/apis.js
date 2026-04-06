
const API_URL = import.meta.env.VITE_API_URL

export const APIS = {
    HEALTH_API : API_URL + '/health',
    LOAD_HISTORY_API : API_URL + '/history?limit=20',
    ANAYLZE_API : API_URL + '/anaylze'
}