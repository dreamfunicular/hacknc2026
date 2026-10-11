import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

type company ={
    id: string,
    name: string,
    ticker: string,
    currentPrice: number,
    trend: trend,
    priceHistory?: priceHistoryEntry[],
}

type trend = 'up_fast' | 'up_slow' | 'stagnant' | 'penny' | 'down_slow' | 'down_fast';

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

    const nextDate = latestDate ?? new Date('2026-01-01T00:00:00Z');
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return formatSimulationDate(nextDate);
}

function getPercentChange(trend: trend): number {
    switch (trend) {
        case 'up_fast':
            return Math.random() * 0.1;
        case 'up_slow':
            return Math.random() * 0.05;
        case 'stagnant':
            return Math.random() * 0.02 - 0.01;
        case 'down_slow':
            return Math.random() * -0.05;
        case 'down_fast':
            return Math.random() * -0.1;
        case 'penny':
            return Math.random() - 0.5;
    }
}

async function mutateDB() {
    const companies : company[] = await pb.collection('companies').getFullList({
        sort: 'name',
    });
    const date = getNextSimulationDate(companies);

    for (let i = 0; i < companies.length; i++) {
        const company = companies[i]
        const previousPrice = company.currentPrice;
        const percentChange = getPercentChange(company.trend);
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