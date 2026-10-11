'use client';

import bb, { area } from 'billboard.js';
import 'billboard.js/dist/billboard.css';
import { useEffect, useMemo, useRef } from "react";


// ex:
// [{ "date": "2026-10-10T12:00:00Z", "price": 42.5 },
//   { "date": "2026-10-11T14:30:00Z", "price": 108 },
//   { "date": "2026-10-12T09:15:00Z", "price": 89.2 }]
export default function StockGraph({ pricehistory }) {
    const chartContainerRef = useRef(null);
    const ph = useMemo(
        () => Array.isArray(pricehistory) ? pricehistory : [],
        [pricehistory]
    )


    const x = useMemo(
        () => ['x', ...ph.map(item => item.date)],
        [ph]
    )
    const data = useMemo(
        () => ['Price', ...ph.map(item => item.price)],
        [ph]
    )

    const lastPrice = data.at(-1)
    const previousPrice = data.at(-2)
    const lineColor = previousPrice !== undefined && lastPrice < previousPrice
        ? '#ef4444'
        : '#22c55e'

    useEffect(() => {
        if (!chartContainerRef.current) {
            return undefined;
        }

        const chart = bb.generate({
            bindto: chartContainerRef.current,
            size: {
                height: 100,
                // width: 200
            },
            data: {
                x: 'x',
                columns: [
                    x,
                    data
                ],
                type: area(),
                colors: {
                    Price: lineColor
                },
            },
            tooltip: {
                contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                    const value = d[0].value;
                    return `<div class="bb-tooltip p-0.5">${value}</div>`;
                }
            },
            legend: {
                show: false
            },
            point: {
                show: false
            },
            axis: {
                x: {
                    type: 'timeseries',
                    show: false,
                },
                y: {
                    show: false
                }
            }
        });

        return () => chart.destroy();
    }, [lineColor, x, data]);

    return <div ref={chartContainerRef} />;
}