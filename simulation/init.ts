import PocketBase from 'pocketbase';
import * as math from 'mathjs';

const pb = new PocketBase('https://pocketbase2026.vikramk.dev');

type company ={
    id: string,
    name: string,
    ticker: string,
    currentPrice: number,
    crescendo: number,
    instability: number,
}


const companies : company[] = await pb.collection('companies').getFullList({
    sort: 'name',
});

for (let i = 0; i < companies.length; i++) {
    let company = companies[i]
        
    company.currentPrice = 1000
    company.crescendo = math.sin(math.pi * i / 20.0 + .1)
    company.instability = math.cos(math.pi * i / 20.0 + .1)

    await pb.collection('companies').update(company.id, company);
}