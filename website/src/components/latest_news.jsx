"use client"

import pocketbaseClient from "@/lib/pocketbaseClient";
import {useEffect, useState} from "react";

export default function LatestNews(){
    const pb = pocketbaseClient

    const [news, setNews] = useState("Whats the latest?");

    useEffect(()=>{
        let active = true
        pb.collection('news').getFullList({
            sort: "-created",
            requestKey: null
        }).then((result) => {
            if (!active) return;
            setNews(result[0].body)
        })
        pb.collection('news').subscribe("*", (res) => {
            if (active) {
                setNews(res.record.body)
            }
        })
        return () => {
            active = false
            pb.collection('news').unsubscribe("*");
        }
    })


    return(
        <div className="mb-3 flex min-w-0 flex-col gap-3 rounded-xl border border-white/80 bg-gradient-to-b from-white/75 via-cyan-50/65 to-sky-100/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_5px_14px_rgba(0,92,132,0.10)] backdrop-blur-md">
            <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-sky-950">
                Latest News
            </h2>
            <p className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] border-t border-white/80 pt-3 text-sm text-sky-800">
                {news}
            </p>
        </div>
    )
}