import axios from 'axios';
import { config } from '../config/environment';

export class AIService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.aiServiceUrl;
    }

    async getSemanticRecommendations(description: string, userId?: string) {
        try {
            const response = await axios.post(`${this.baseUrl}/recommend`, {
                description,
                userId,
            });
            return response.data;
        } catch (error: any) {
            console.error('AI Service Error:', error.message);
            // If AI is offline, throw error
            throw new Error(`AI Service unavailable: ${error.message}`);
        }
    }
}

export const aiService = new AIService();
