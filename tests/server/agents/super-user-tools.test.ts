
import { superUserTools } from '@/app/dashboard/ceo/agents/super-user-tools-impl';

// Mock only what we use
jest.mock('@/server/services/letta/client', () => ({
    lettaClient: {
        listAgents: jest.fn().mockResolvedValue([{ id: 'mock-memory-id', name: 'Markitbot Research Memory' }]),
        sendMessage: jest.fn().mockResolvedValue({ success: true })
    }
}));

describe('Super User Tools Implementation', () => {
    describe('spawnAgent', () => {
        it('should successfully spawn an agent and return an ID', async () => {
             const result = await superUserTools.spawnAgent(
                 'Test Research Task',
                 'research',
                 3600
             );

             expect(result.success).toBe(true);
             expect(result.agentId).toBeDefined();
             expect(result.agentId).toContain('spawned-research-');
             expect(result.status).toBe('active');
        });
    });

    describe('generateExecutiveReport', () => {
        it('should allow Ember to generate a CEO report', async () => {
            const topic = 'Inventory Health';
            const result = await superUserTools.generateExecutiveReport(topic, 'Ember');
            
            expect(result.recipient).toBe('CEO');
            expect(result.topic).toBe(topic);
            expect(result.status).toBe('delivered');
            expect(result.summary).toContain('Ember');
        });

        it('should allow Pulse to generate a CEO report', async () => {
            const topic = 'Q3 Revenue';
            const result = await superUserTools.generateExecutiveReport(topic, 'Pulse');
            
            expect(result.recipient).toBe('CEO');
            expect(result.topic).toBe(topic);
            expect(result.status).toBe('delivered');
            expect(result.summary).toContain('Pulse');
        });
    });
});



