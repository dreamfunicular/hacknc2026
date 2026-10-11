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
        <div className="text-2xl flex flex-col">
            Welcome {user?.username ?? ""}
            <div>Cash: {USDollar.format(user ? money : 0)}</div>
            <div>Assets: {USDollar.format(user ? assets : 0)}</div>
        </div>
    );
}
