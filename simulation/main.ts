import { GoogleGenAI, Type } from '@google/genai';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);
await pb.collection('_superusers').authWithPassword(process.env.SU_USER ?? '', process.env.SU_PASSWORD?? '');
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type company ={
    id: string,
    name: string,
    ticker: string,
    description: string,
    currentPrice: number,
    trend: trend,
    priceHistory?: priceHistoryEntry[],
}

type trend = 'up_fast' | 'up_slow' | 'stagnant' | 'penny' | 'down_slow' | 'down_fast';

type news = {
    title: string,
    body: string,
}

type aiUpdate = {
    price: number,
    trend: trend,
    news: news,
}

type priceHistoryEntry = {
    date: string,
    price: number,
}

const pendingAiUpdates = new Map<string, aiUpdate>();
let aiGenerationRunning = false;

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

async function generateAiUpdate(company: company): Promise<aiUpdate> {
    const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a fictional news event for this company that will affect its stock price.

Company name: ${company.name}
Company description: ${company.description}
Current price: ${company.currentPrice}

The price must be positive and rounded to two decimals. The trend and news must reflect the event. Do not create news for the event based on any real world parllels. For example: If the company given was Theranos, you should not create news about the company being a fraud, as that is a real world event. Instead you could create news about the company releasing a new product that is a huge success, or the company being acquired by another company. The news should be fictional and not based on any real world events. Make it whimsical.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    price: { type: Type.NUMBER },
                    trend: {
                        type: Type.STRING,
                        enum: ['up_fast', 'up_slow', 'stagnant', 'penny', 'down_slow', 'down_fast'],
                    },
                    news: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            body: { type: Type.STRING },
                        },
                        required: ['title', 'body'],
                    },
                },
                required: ['price', 'trend', 'news'],
            },
        },
    });

    const result = JSON.parse(response.text ?? '') as Partial<aiUpdate>;
    const validTrends: trend[] = ['up_fast', 'up_slow', 'stagnant', 'penny', 'down_slow', 'down_fast'];

    if (
        typeof result.price !== 'number' ||
        !Number.isFinite(result.price) ||
        result.price <= 0 ||
        !validTrends.includes(result.trend as trend) ||
        !result.news ||
        typeof result.news.title !== 'string' ||
        typeof result.news.body !== 'string'
    ) {
        throw new Error(`Gemini bad response`);
    }
    console.log(company.ticker + " " + result.price.toFixed(2) + " " + result.trend + " " + result.news.title);

    return {
        price: Number(result.price.toFixed(2)),
        trend: result.trend as trend,
        news: result.news,
    };
}

async function generateAiUpdates() {
    if (aiGenerationRunning) {
        return;
    }

    aiGenerationRunning = true;

    try {
        const companies: company[] = await pb.collection('companies').getFullList({
            sort: 'name',
            requestKey: null,
        });
        if (companies.length === 0) {
            return;
        }

        const company = companies[Math.floor(Math.random() * companies.length)];

        try {
            pendingAiUpdates.set(company.id, await generateAiUpdate(company));
        } catch (error) {
            console.error(`${company.ticker}:`, error);
        }
    } finally {
        aiGenerationRunning = false;
    }
}

async function mutateDB() {
    const companies : company[] = await pb.collection('companies').getFullList({
        sort: 'name',
        requestKey: null,
    });
    const date = getNextSimulationDate(companies);

    for (let i = 0; i < companies.length; i++) {
        const company = companies[i]
        const previousPrice = company.currentPrice;
        const aiUpdate = pendingAiUpdates.get(company.id);
        const percentChange = aiUpdate ? undefined : getPercentChange(company.trend);
        const currentPrice = aiUpdate
            ? aiUpdate.price
            : Number((previousPrice * (1 + percentChange!)).toFixed(2));
        const priceHistory = Array.isArray(company.priceHistory)
            ? [...company.priceHistory]
            : [];

        console.log(String(company.name) + " (" + company.ticker + ")\nCurrent Price: " + currentPrice.toFixed(2) + "\n")

        if (currentPrice !== previousPrice) {
            priceHistory.push({ date, price: currentPrice });
            if (priceHistory.length > 50) {
                priceHistory.shift();
            }
        }

        await pb.collection('companies').update(company.id, {
            currentPrice,
            ...(aiUpdate ? { trend: aiUpdate.trend } : {}),
            priceHistory,
        });
        if (aiUpdate) {
            await pb.collection('news').create({
                title: aiUpdate.news.title,
                body: aiUpdate.news.body,
            });
            pendingAiUpdates.delete(company.id);
        }
    }
    console.log("Ran");
}
setInterval(mutateDB, Number(process.env.TIMEOUT))
setInterval(generateAiUpdates, Number(process.env.AI_TIMEOUT));