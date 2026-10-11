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
            if (active && res.action === "create") {
                setNews(res.data.body)
            }
        })
        return () => {
            active = false
            pb.collection('news').unsubscribe("*");
        }
    })


    return(
        <div>
            {news}
        </div>
    )
}