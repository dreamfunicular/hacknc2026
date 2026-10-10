"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        pb.collection("users")
            .getOne(user.id, { requestKey: null })
            .then((record) => {
                if (active) {
                    setMoney(record.money);
                }
            });

        pb.collection("users").subscribe(user.id, (event) => {
            if (active) {
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
                        money
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
    }, [user, money]);

    const USDollar = Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    return (
        <div className="text-2xl flex flex-col">
            Welcome {user?.username ?? ""}
            <div>Cash: {USDollar.format(user ? money : 0)}</div>
            <div>Assets: {USDollar.format(user ? assets : 0)}</div>
        </div>
    );
}
