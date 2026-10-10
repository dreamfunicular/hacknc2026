import {initPocketBase} from "@/lib/initPocketBase";

export default async function CompanyList() {
    const pb = await initPocketBase();
    const companies = await pb.collection('companies').getFullList({
        fields: 'id,name,ticker',
    });
    const investList = companies.map(investment =>
        <li key={investment.id} className="flex flex-row gap-x-5">
            <div>{investment.name}</div>
            <div>{investment.ticker}</div>
        </li>
    )
    return (
        <ul>{investList}</ul>
    )
}