import PocketBase from 'pocketbase';
import evs from "./personal_events.json" with {type: 'json'}
process.loadEnvFile("./.env")

const pb = new PocketBase(process.env.POCKETBASE_URL);

await pb.collection('_superusers').authWithPassword(process.env.POCKETBASE_USER, process.env.POCKETBASE_PASS)


async function mutateDB() {
    const users = await pb.collection('users').getFullList();
    const batch = pb.createBatch();
    for (let user of users) {
        let ev = evs[Math.floor(Math.random() * evs.length)];
        batch.collection('users').update(user.id, {
            lastEventText: ev.event,
            lastEventChange: ev.change,
            money: user.money + ev.change
        })

    }
    let res = await batch.send()
    console.log(res)

}

// In a real project, this code would live in a separate executable. For this, cursedly integrating stuff into instrumentation is "okay."

setInterval(mutateDB, Number(process.env.TIMEOUT))