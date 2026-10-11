import {GoogleGenAI} from "@google/genai";
import {initPocketBase} from "@/lib/initPocketBase";

export async function POST() {
    const pb = await initPocketBase();

    if (!pb.authStore.isValid || !pb.authStore.record) {
        return Response.json({error: "Not signed in."}, {status: 401});
    }
    if (!process.env.GEMINI_API_KEY) {
        return Response.json({error: "Evaluation is not configured."}, {status: 500});
    }

    try {
        const userId = pb.authStore.record.id;
        const [user, investments, news, companies] = await Promise.all([
            pb.collection("users").getOne(userId, {requestKey: null}),
            pb.collection("investments").getFullList({
                expand: "company",
                filter: pb.filter("user={:userId}", {userId}),
                requestKey: null,
            }),
            pb.collection("news").getList(1, 8, {sort: "-created", requestKey: null}),
            pb.collection("companies").getFullList({
                fields: "name,ticker,currentPrice,trend",
                requestKey: null,
            }),
        ]);

        const holdings = investments.map((investment) => {
            const company = investment.expand?.company;
            return `${company?.name} (${company?.ticker}): ${investment.shares} shares at $${company?.currentPrice} each, trend ${company?.trend}`;
        });
        const headlines = news.items.map((item) => `- ${item.title}: ${item.body}`);
        const market = companies.map(
            (company) => `${company.ticker}: $${company.currentPrice} (${company.trend})`
        );

        const gemini = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
        const response = await gemini.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `You are a friendly investing teacher in a stock market simulation game with fictional companies. Evaluate the player's decisions educationally, based on their portfolio and the current events.

Cash: $${user.money}
Portfolio:
${holdings.length ? holdings.join("\n") : "(no holdings)"}

Market:
${market.join("\n")}

Recent news (newest first):
${headlines.length ? headlines.join("\n") : "(none)"}

Explain what the player is doing well and what they could improve, covering concepts like diversification, risk, and reacting to news. Reference specific holdings and headlines. Be encouraging, concrete, and concise (under 150 words). Plain text only, no markdown.`,
        });

        return Response.json({evaluation: response.text ?? ""});
    } catch (error) {
        console.error(error);
        return Response.json({error: "Could not generate an evaluation."}, {status: 500});
    }
}
