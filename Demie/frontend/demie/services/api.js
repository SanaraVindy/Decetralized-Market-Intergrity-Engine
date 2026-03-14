import axios from 'axios';

//  FastAPI port (usually 8000)
const API = axios.create({ baseURL: 'http://127.0.0.1:8000/api/v1' });

export const getRiskAssessment = async (nodeId) => {
    try {
        const response = await API.get(`/risk-assessment/${nodeId}`);
        return response.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};