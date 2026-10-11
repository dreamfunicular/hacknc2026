"use client"

import pb from "@/lib/pocketbaseClient";
import {useEffect, useRef, useState, useSyncExternalStore} from "react";

const NEWS_COUNT = 3;
// Non-breaking spaces, since normal whitespace collapses to a single space.
const TICKER_SEPARATOR = "\u00A0".repeat(16);
const CHARS_PER_SECOND = 8;
const START_DELAY_MS = 3000;

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
            pb.collection("users").unsubscribe(user.id);
        }
    }, [user])

    const [news, setNews] = useState([]);

    useEffect(() => {
        let active = true;

        const load = (sort) => pb.collection("news").getList(1, NEWS_COUNT, {
            ...(sort ? {sort} : {}),
            requestKey: null
        });

        // `created` may not exist on the collection, so fall back to the default order.
        load("-created")
            .catch(() => load(""))
            .then((res) => {
                if (active) setNews(res.items);
            })
            .catch((err) => console.error("Failed to load news", err));

        pb.collection("news").subscribe("*", (e) => {
            if (!active || e.action !== "create") return;
            setNews((prev) => [e.record, ...prev.filter((n) => n.id !== e.record.id)].slice(0, NEWS_COUNT));
        }).catch((err) => console.error("Failed to subscribe to news", err));

        return () => {
            active = false;
            pb.collection("news").unsubscribe("*");
        }
    }, [])

    const tickerText = [
        `${lastEvent} : Your account changed by ${lastChange} dollars`,
        ...(news.length === 0 ? ["No global events yet"] : news.map((item) => item.title))
    ].join(TICKER_SEPARATOR);

    // The account line updates on every simulation tick, which would restart the scroll
    // before it ever crosses the screen. Hold the visible text until a pass finishes.
    const latestText = useRef(tickerText);
    const [shownText, setShownText] = useState(tickerText);

    useEffect(() => {
        latestText.current = tickerText;
    }, [tickerText]);

    // Give the initial requests time to land so the first pass doesn't show empty data.
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShownText(latestText.current);
            setStarted(true);
        }, START_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-12 overflow-hidden bordered_div my-2">
            {started && <span onAnimationIteration={() => setShownText(latestText.current)}
                  className="absolute left-0 top-1/2 whitespace-nowrap text-2xl ticker-text"
                  style={{animationDuration: `${Math.max(shownText.length / CHARS_PER_SECOND, 10)}s`}}>
                {shownText}
            </span>}
        </div>
    )
}