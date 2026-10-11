"use client"

import {useEffect, useState, useSyncExternalStore} from "react";
import pb from "@/lib/pocketbaseClient";
import StockGraph from "@/components/StockGraph";

let authSnapshot = pb.authStore.record;

function subscribeToAuth(onChange) {
    return pb.authStore.onChange((_token, record) => {
        authSnapshot = record;
        onChange();
    });
}

function getAuthSnapshot() {
    return authSnapshot;
}

function getServerAuthSnapshot() {
    return null;
}

export function CompanyList() {
    const user = useSyncExternalStore(
        subscribeToAuth,
        getAuthSnapshot,
        getServerAuthSnapshot
    );
    const [companies, setCompanies] = useState([]);
    const [holdings, setHoldings] = useState({});
    const [loadedUserId, setLoadedUserId] = useState(null);
    const [isTrading, setIsTrading] = useState(false);
    const [tradeMessage, setTradeMessage] = useState("");

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        async function loadData() {
            const [companyRecords, investmentRecords] = await Promise.all([
                pb.collection("companies").getFullList({
                    fields: "id,name,ticker,currentPrice, priceHistory",
                    requestKey: null,
                }),
                pb.collection("investments").getFullList({
                    fields: "company,shares",
                    filter: pb.filter("user={:userId}", { userId: user.id }),
                    requestKey: null,
                }),
            ]);

            if (active) {
                setCompanies(companyRecords);
                setLoadedUserId(user.id);
                setHoldings(
                    investmentRecords.reduce((sharesByCompany, investment) => {
                        sharesByCompany[investment.company] =
                            (sharesByCompany[investment.company] ?? 0) + Number(investment.shares);
                        return sharesByCompany;
                    }, {})
                );
            }
        }

        loadData().catch(() => {
            if (active) {
                setTradeMessage("Unable to load companies or holdings.");
            }
        });

        return () => {
            active = false;
        };
    }, [user]);

    const USDollar = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    async function handleTrade(companyId, shareCount, action) {
        if (!user || isTrading) return;

        setIsTrading(true);
        setTradeMessage("");

        try {
            const [company, currentUser, userInvestments] = await Promise.all([
                pb.collection("companies").getOne(companyId, { requestKey: null }),
                pb.collection("users").getOne(user.id, { requestKey: null }),
                pb.collection("investments").getFullList({
                    filter: pb.filter("user={:userId}", { userId: user.id }),
                    requestKey: null,
                }),
            ]);
            const investment = userInvestments.find((record) => record.company === companyId);
            const ownedShares = Number(investment?.shares ?? 0);
            const price = Number(company.currentPrice);
            const cash = Number(currentUser.money);
            const value = price * shareCount;

            if (!Number.isFinite(price) || price <= 0) {
                throw new Error("This company does not have a valid share price.");
            }

            if (action === "buy" && value > cash) {
                throw new Error("You do not have enough cash for this purchase.");
            }

            if (action === "sell" && ownedShares < shareCount) {
                throw new Error("You do not own enough shares to complete this sale.");
            }

            const batch = pb.createBatch();
            if (action === "buy") {
                if (investment) {
                    batch.collection("investments").update(investment.id, {
                        shares: ownedShares + shareCount,
                    });
                } else {
                    batch.collection("investments").create({
                        user: user.id,
                        company: companyId,
                        shares: shareCount,
                    });
                }
            } else if (ownedShares === shareCount) {
                batch.collection("investments").delete(investment.id);
            } else {
                batch.collection("investments").update(investment.id, {
                    shares: ownedShares - shareCount,
                });
            }

            batch.collection("users").update(user.id, {
                money: cash + (action === "buy" ? -value : value),
            });

            await batch.send();

            const updatedShares = ownedShares + (action === "buy" ? shareCount : -shareCount);
            setHoldings((currentHoldings) => {
                const nextHoldings = { ...currentHoldings };
                if (updatedShares === 0) {
                    delete nextHoldings[companyId];
                } else {
                    nextHoldings[companyId] = updatedShares;
                }
                return nextHoldings;
            });
            setTradeMessage(
                `${action === "buy" ? "Bought" : "Sold"} ${shareCount} ${
                    shareCount === 1 ? "share" : "shares"
                } of ${company.name}.`
            );
        } catch (error) {
            setTradeMessage(error.message || "The trade could not be completed.");
        } finally {
            setIsTrading(false);
        }
    }

    return (
        <>
            {tradeMessage && (
                <p className="mb-3 text-sm font-medium text-sky-950" aria-live="polite">
                    {tradeMessage}
                </p>
            )}
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(53,160,186,0.55)_transparent] [scrollbar-width:thin]">
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {user?.id === loadedUserId && companies.map((company) => {
                        const ownedShares = holdings[company.id] ?? 0;

                        return (
                            <li
                                key={company.id}
                                className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/80 bg-gradient-to-b from-white/75 via-cyan-50/65 to-sky-100/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_5px_14px_rgba(0,92,132,0.10)] backdrop-blur-md"
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-sky-950">
                                        {company.name}
                                    </h2>
                                    <span className="shrink-0 rounded-full border border-white/90 bg-white/65 px-2.5 py-1 text-xs font-bold tracking-wide text-cyan-900 shadow-[inset_0_1px_0_white]">
                                        ${company.ticker}
                                    </span>
                                </div>

                                <div className="flex items-baseline justify-between gap-2 border-t border-white/80 pt-3 text-sm">
                                    <span className="text-sky-800">Share price</span>
                                    <span className="font-semibold tabular-nums text-sky-950">
                                        {USDollar.format(company.currentPrice)}
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="text-sky-800">Your shares</span>
                                    <span className="font-semibold tabular-nums text-sky-950">
                                        {ownedShares}
                                    </span>
                                </div>

                                <StockGraph pricehistory={company.priceHistory} ticker={company.ticker} />

                                <div className="grid grid-cols-2 gap-2 pt-3">
                                    <button
                                        className="!rounded-lg !border !border-white/90 !bg-gradient-to-b !from-white/90 !to-cyan-100/90 !px-3 !py-2 !text-sm !font-semibold !text-sky-900 !shadow-[inset_0_1px_0_white,0_2px_3px_rgba(0,92,132,0.12)]"
                                        type="button"
                                        disabled={isTrading}
                                        onClick={() => handleTrade(company.id, 1, "buy")}
                                    >
                                        Buy 1
                                    </button>
                                    <button
                                        className="!rounded-lg !border !border-white/90 !bg-gradient-to-b !from-white/90 !to-cyan-100/90 !px-3 !py-2 !text-sm !font-semibold !text-sky-900 !shadow-[inset_0_1px_0_white,0_2px_3px_rgba(0,92,132,0.12)]"
                                        type="button"
                                        disabled={isTrading}
                                        onClick={() => handleTrade(company.id, 10, "buy")}
                                    >
                                        Buy 10
                                    </button>
                                    {ownedShares > 0 && (
                                        <>
                                            <button
                                                className="!rounded-lg !border !border-white/90 !bg-gradient-to-b !from-white/90 !to-sky-100/90 !px-3 !py-2 !text-sm !font-semibold !text-sky-900 !shadow-[inset_0_1px_0_white,0_2px_3px_rgba(0,92,132,0.12)]"
                                                type="button"
                                                disabled={isTrading || ownedShares < 1}
                                                onClick={() => handleTrade(company.id, 1, "sell")}
                                            >
                                                Sell 1
                                            </button>
                                            <button
                                                className="!rounded-lg !border !border-white/90 !bg-gradient-to-b !from-white/90 !to-sky-100/90 !px-3 !py-2 !text-sm !font-semibold !text-sky-900 !shadow-[inset_0_1px_0_white,0_2px_3px_rgba(0,92,132,0.12)]"
                                                type="button"
                                                disabled={isTrading || ownedShares < 10}
                                                onClick={() => handleTrade(company.id, 10, "sell")}
                                            >
                                                Sell 10
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    )
}