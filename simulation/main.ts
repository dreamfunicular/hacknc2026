import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase2026.vikramk.dev');

type company ={
    id: string,
    name: string,
    ticker: string,
    currentPrice: number,
}

async function mutateDB() {
    const companies : company[] = await pb.collection('companies').getFullList({
        sort: 'name',
    });

    for (let i = 0; i < companies.length; i++) {
        let company = companies[i]
        
        let percentChange = Math.random() / 5.0 - .1
        company.currentPrice = company.currentPrice * (1 + percentChange)
         
        console.log(String(company.name) + " (" + company.ticker + ")\nCurrent Price: " + company.currentPrice.toFixed(2) + " (" + (percentChange > 0 ? "+" : "") + (percentChange * 100).toFixed(2)  + "%)" + "\n")

        await pb.collection('companies').update(company.id, company);
    }
}

// In a real project, this code would live in a separate executable. For this, cursedly integrating stuff into instrumentation is "okay."
setInterval(mutateDB, 5000)