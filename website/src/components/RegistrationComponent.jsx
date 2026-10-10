'use client';

import { startTransition, useActionState } from "react";
import pb from "@/lib/pocketbaseClient";

export default function RegistrationComponent() {
    const [state, formAction, isPending] = useActionState(registerUser, null);

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => {
            formAction(formData);
        });
    }

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" id="username" name="username" placeholder="Username" />
                <input type="password" id="password" name="password" placeholder="Password" />
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm Password" />
                <button type="submit" disabled={isPending}>
                    Register
                </button>

                {state?.error && <p style={{ color: 'red' }}>{state.error.message}</p>}
            </form>
        </div>
    );
}

async function registerUser(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');


    try {
        await pb.collection('users').create({
            "username": username,
            "password": password,
            "passwordConfirm": confirmPassword,
            "money": 1000.0
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return {
            error: {
                message: error.toJSON?.()?.message || error.message || 'Registration failed.'
            }
        };
    }
}