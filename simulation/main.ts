import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

type company ={
    id: string,
    name: string,
    ticker: string,
    currentPrice: number,
    priceHistory?: priceHistoryEntry[],
}

type priceHistoryEntry = {
    date: string,
    price: number,
}

function formatSimulationDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function getNextSimulationDate(companies: company[]): string {
    const latestDate = companies
        .flatMap((company) => company.priceHistory ?? [])
        .map((entry) => new Date(`${entry.date}T00:00:00Z`))
        .filter((date) => !Number.isNaN(date.getTime()))
        .reduce<Date | undefined>(
            (latest, date) => !latest || date > latest ? date : latest,
            undefined,
        );

    const nextDate = latestDate ?? new Date();
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return formatSimulationDate(nextDate);
}

async function mutateDB() {
    const companies : company[] = await pb.collection('companies').getFullList({
        sort: 'name',
    });
    const date = getNextSimulationDate(companies);

    for (let i = 0; i < companies.length; i++) {
            const company = companies[i]
            const previousPrice = company.currentPrice;
            const percentChange = Math.random() / 5.0 - .1;
            const currentPrice = Number((previousPrice * (1 + percentChange)).toFixed(2));
            const priceHistory = Array.isArray(company.priceHistory)
                ? [...company.priceHistory]
                : [];

            console.log(String(company.name) + " (" + company.ticker + ")\nCurrent Price: " + currentPrice.toFixed(2) + " (" + (percentChange > 0 ? "+" : "") + (percentChange * 100).toFixed(2)  + "%)" + "\n")

            if (currentPrice !== previousPrice) {
                priceHistory.push({ date, price: currentPrice });
                if (priceHistory.length > 50) {
                    priceHistory.shift();
                }
            }

            await pb.collection('companies').update(company.id, {
                currentPrice,
                priceHistory,
            });
    }
    console.log("Ran");
}

// In a real project, this code would live in a separate executable. For this, cursedly integrating stuff into instrumentation is "okay."
setInterval(mutateDB, Number(process.env.TIMEOUT))