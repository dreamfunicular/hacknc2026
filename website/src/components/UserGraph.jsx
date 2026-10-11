'use client';

import bb, { line } from 'billboard.js';
import 'billboard.js/dist/billboard.css';
import { useEffect, useMemo } from "react";


// ex:
// [{ "date": "2026-10-10T12:00:00Z", "value": 42.5 },
//   { "date": "2026-10-11T14:30:00Z", "value": 108 },
//   { "date": "2026-10-12T09:15:00Z", "value": 89.2 }]
export default function UserGraph(moneyhistory) {
    const x = useMemo(
        () => ['x', ...moneyhistory.moneyhistory.map(item => item.date)],
        [moneyhistory.moneyhistory]
    )
    const data = useMemo(
        () => ['Price', ...moneyhistory.moneyhistory.map(item => item.price)],
        [moneyhistory.moneyhistory]
    )

    const lastPrice = data.at(-1)
    const previousPrice = data.at(-2)
    const lineColor = previousPrice !== undefined && lastPrice < previousPrice
        ? '#ef4444'
        : '#22c55e'

    useEffect(() => {
        bb.generate({
            // size: {
            //     height: 100,
            //     width: 200
            // },
            data: {
                x: 'x',
                columns: [
                    x,
                    data
                ],
                type: line(),
                colors: {
                    Price: lineColor
                },
            },
            point: {
                show: false
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d'
                    }
                },
            }
        })
    }, [lineColor, x, data]);
    return <div id="chart" />;
}