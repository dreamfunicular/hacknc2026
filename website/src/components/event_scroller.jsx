"use client"

import pb from "@/lib/pocketbaseClient";
import {useEffect, useState, useSyncExternalStore} from "react";

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

export default function EventScroller() {
    const user = useSyncExternalStore(
        subscribeToAuth,
        getAuthSnapshot,
        getServerAuthSnapshot
    );

    const [lastEvent, setLastEvent] = useState("No Event");
    const [lastChange, setLastChange] = useState(0);

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true

        pb.collection("users").getOne(user.id, {
            fields: "lastEventText,lastEventChange",
            requestKey: null
        }).then((doc) => {
            if (!active) return;
            setLastEvent(doc.lastEventText);
            setLastChange(doc.lastEventChange);
        })

        pb.collection("users").subscribe(user.id, (doc) => {
            setLastEvent(doc.lastEventText);
            setLastChange(doc.lastEventChange)
        })

        return () => {
            active = false;
            pb.collection("users").unsubscribe();
        }
    })

    return (
        <div className="w-full overflow-hidden bordered_div my-2">
            <span className="inline-block whitespace-nowrap animate-scroll-right text-2xl">
                {lastEvent} : Your account changed by {lastChange} dollars
            </span>
            <span className="inline-block whitespace-nowrap animate-scroll-right text-2xl"
            style={{
                animationDelay: "12.5s",
                animationFillMode: "backwards"
            }}>
                This is where the global event ticker will exist
            </span>
        </div>
    )
}