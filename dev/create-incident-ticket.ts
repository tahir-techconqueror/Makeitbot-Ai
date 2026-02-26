
import { supportService } from '@/server/services/support/tickets';

async function main() {
    console.log('Simulating automated error capture...');
    try {
        const ticket = await supportService.createTicket(
            "CRASH: Markitbot brand page 'ecstaticedibles' failed to load. Potential unhandled exception in data fetch.",
            "felisha-auto-monitor",
            { url: "https://markitbot.com/ecstaticedibles", priority: "critical" }
        );
        console.log(`Ticket created: ${ticket.id}`);
    } catch (e) {
        console.error('Error creating ticket:', e);
    }
}

main();
