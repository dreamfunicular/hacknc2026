"use client";
import pb from "@/lib/pocketbaseClient";
import {useEffect, useState} from "react";

export default function UserInfo() {

    const user = pb.authStore.record
    const [money, setMoney] = useState(0)
    useEffect(() => {
        pb.collection('users').getOne(user.id, {requestKey: null}).then((e) => {setMoney(e.money)});
        pb.collection('users').subscribe(user.id, (e) => {
            if (e.record.money != money) {
                setMoney(e.record.money)
            }
        })
        return () => {
            pb.collection('users').unsubscribe()
        }
    }, [setMoney, user, money])

    return (<div className="text-2xl flex flex-col">Welcome {user ? user.username : ''}
            <div>Cash: {money}</div>
        </div>)
}