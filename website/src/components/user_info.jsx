"use client";
import pb from "@/lib/pocketbaseClient";
import {useEffect, useState} from "react";

export default function UserInfo() {

    const user = pb.authStore.record
    const [money, setMoney] = useState(0)
    useEffect(() => {
        pb.collection('users').getOne(user.id, {requestKey: null}).then((e) => {setMoney(e.money)});
        pb.collection('users').subscribe(user.id, (e) => {
            if (e.record.money !== money) {
                setMoney(e.record.money)
            }
        })
        return () => {
            pb.collection('users').unsubscribe()
        }
    }, [setMoney, user, money])

    const USDollar = Intl.NumberFormat("en-US", {style: 'currency', currency: 'USD'})

    const [assets, setAssets] = useState(0)
    useEffect(() => {
        pb.collection('investments').getFullList({
            expand: "company",
            filter: pb.filter("user={:userId}", {userId: user.id}),
            requestKey: null
        }).then((e) => {
            let sum = money
            e.forEach(i => {
                sum += i.shares * i.expand.company.currentPrice
            })
            setAssets(sum);
        })
        pb.collection('companies').subscribe('*', (e) => {
            pb.collection('investments').getFullList({
                expand: "company.currentPrice",
                filter: `user=${user.id}`
            }).then((e) => {
                let sum = money
                e.forEach(i => {
                    sum += i.shares * i.expand.company.currentPrice
                })
                setAssets(sum);
            })
        })
        return () => {
            pb.collection('assets').unsubscribe()
        }
    })

    return (<div className="text-2xl flex flex-col">Welcome {user ? user.username : ''}
            <div>Cash: {USDollar.format(money)}</div>
            <div>Assets: {USDollar.format(money)}</div>
        </div>)
}