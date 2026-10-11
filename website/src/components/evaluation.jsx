"use client"

import {useState} from "react";

export default function Evaluation() {
    const [evaluation, setEvaluation] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function updateEvaluation() {
        if (loading) return;
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/evaluation", {method: "POST"});
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setEvaluation(data.evaluation);
        } catch (e) {
            setError(e.message || "Could not generate an evaluation.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mb-3 flex min-w-0 flex-col gap-3 rounded-xl border border-white/80 bg-gradient-to-b from-white/75 via-cyan-50/65 to-sky-100/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_5px_14px_rgba(0,92,132,0.10)] backdrop-blur-md">
            <div className="flex min-w-0 items-center justify-between gap-3">
                <h2 className="min-w-0 break-words text-lg font-bold leading-tight text-sky-950">
                    Your Evaluation
                </h2>
                <button
                    type="button"
                    onClick={updateEvaluation}
                    disabled={loading}
                    className="shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-yellow-950 shadow-sm transition hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
                >
                    {loading ? "Updating..." : "Update"}
                </button>
            </div>
            <p className="min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere] border-t border-white/80 pt-3 text-sm text-sky-800">
                {error || evaluation || "Press Update to get feedback on your decisions."}
            </p>
        </div>
    )
}
