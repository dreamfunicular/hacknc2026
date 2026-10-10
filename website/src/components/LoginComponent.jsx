'use client';

import { startTransition, useActionState } from "react";
import pb from "@/lib/pocketbaseClient";

export default function LoginComponent() {
    const [state, formAction, isPending] = useActionState(loginUser, null);

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
            formAction(formData);
        });
    }

    return (
        <div className="text-center">
            <h1 className={"text-3xl font-bold mb-2"}>Login</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" id="username" name="username" placeholder="Username" />
                <input type="password" id="password" name="password" placeholder="Password" />
                <button type="submit" disabled={isPending}>
                    Login
                </button>

                {state?.error && <p style={{ color: 'red' }}>{state.error.message}</p>}
            </form>
        </div>
    );
}

async function loginUser(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        await pb.collection('users').authWithPassword(username, password);
    } catch (error) {
        console.error('Error registering user:', error);
        return {
            error: {
                message: error.toJSON?.()?.message || error.message || 'Registration failed.'
            }
        };
    }
}