import PocketBase from 'pocketbase';
import evs from "./personal_events.json" with {type: 'json'}

const pb = new PocketBase(process.env.POCKETBASE_URL);


async function mutateDB() {
    const users = await pb.collection('users').getFullList();
    const batch = pb.createBatch();
    for (let user of users) {
        let ev = evs[Math.floor(Math.random() * evs.length)];
        batch.collection('users').update(user.id, {
            lastEventText: ev.event,
            lastEventChange: ev.change,
            money: ev.money + ev.change
        })
    }
    await batch.send()
}

// In a real project, this code would live in a separate executable. For this, cursedly integrating stuff into instrumentation is "okay."
setInterval(mutateDB, Number(process.env.TIMEOUT))