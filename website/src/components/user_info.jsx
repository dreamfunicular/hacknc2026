"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import pb from "@/lib/pocketbaseClient";

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

export default function UserInfo() {
    const user = useSyncExternalStore(
        subscribeToAuth,
        getAuthSnapshot,
        getServerAuthSnapshot
    );
    const [money, setMoney] = useState(0);
    const [assets, setAssets] = useState(0);
    const moneyRef = useRef(0);

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        pb.collection("users")
            .getOne(user.id, { requestKey: null })
            .then((record) => {
                if (active) {
                    moneyRef.current = record.money;
                    setMoney(record.money);
                }
            });


        pb.collection("users").subscribe(user.id, (event) => {
            if (active) {
                moneyRef.current = event.record.money;
                setMoney(event.record.money);
            }
        });

        return () => {
            active = false;
            pb.collection("users").unsubscribe(user.id);
        };
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        const updateAssets = () => {
            pb.collection("investments")
                .getFullList({
                    expand: "company",
                    filter: pb.filter("user={:userId}", { userId: user.id }),
                    requestKey: null,
                })
                .then((investments) => {
                    if (!active) {
                        return;
                    }

                    const total = investments.reduce(
                        (sum, investment) =>
                            sum + investment.shares * investment.expand.company.currentPrice,
                        moneyRef.current
                    );
                    setAssets(total);
                });
        };

        updateAssets();
        pb.collection("companies").subscribe("*", updateAssets);

        return () => {
            active = false;
            pb.collection("companies").unsubscribe("*");
        };
    }, [user]);

    const USDollar = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    return (
        <div className="mb-3 flex min-w-0 flex-col gap-3 rounded-xl border border-white/80 bg-gradient-to-b from-white/75 via-cyan-50/65 to-sky-100/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_5px_14px_rgba(0,92,132,0.10)] backdrop-blur-md">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-sky-950">
                    Welcome{user?.username ? `, ${((String) (user.username)).charAt(0).toUpperCase() + ((String) (user.username)).slice(1)}` : ""}!
                </h2>
            </div>

            <div className="flex items-baseline justify-between gap-2 border-t border-white/80 pt-3 text-sm">
                <span className="text-sky-800">Cash</span>
                <span className="font-semibold tabular-nums text-sky-950">
                    {USDollar.format(user ? money : 0)}
                </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-sky-800">Total assets</span>
                <span className="font-semibold tabular-nums text-sky-950">
                    {USDollar.format(user ? assets : 0)}
                </span>
            </div>
        </div>
    );
}
