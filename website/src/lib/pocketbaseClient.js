"use client";

import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);


if (typeof document !== "undefined") {
    const hasAuthCookie = document.cookie
        .split("; ")
        .some(cookie => cookie.startsWith("pb_auth="));

    // Only restore from cookies when a cookie exists.
    // Otherwise, preserve PocketBase's localStorage authentication.
    if (hasAuthCookie) {
        pb.authStore.loadFromCookie(document.cookie);
    }

    pb.authStore.onChange(() => {
        document.cookie = pb.authStore.exportToCookie({
            httpOnly: false,
            secure: window.location.protocol === "https:",
            sameSite: "Lax",
            path: "/",
        });
    });

    // Synchronize any existing localStorage session immediately.
    document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        secure: window.location.protocol === "https:",
        sameSite: "Lax",
        path: "/",
    });
}

export default pb;