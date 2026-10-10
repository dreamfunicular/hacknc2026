import PocketBase from 'pocketbase';
import {cache} from "react";
import {cookies} from "next/headers";

// you can place this helper in a separate file so that it can be reused

export const initPocketBase = cache(async () => {
    const pb = new PocketBase(process.env.POCKETBASE_URL);

    // load the store data from the request cookie string
    const cookieStore = await cookies();

    // Retrieve the user's existing authentication
    const authCookie = cookieStore.get("pb_auth");

    if (authCookie) {
        pb.authStore.loadFromCookie(
            `pb_auth=${authCookie.value}`
        );
    }

    return pb
})