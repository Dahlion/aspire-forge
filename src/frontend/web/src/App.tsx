import { useMemo, useState } from "react";
import { keycloak } from "./auth/keycloak";

type TodoItem = { id: number; title: string; isDone: boolean; createdAt: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function apiFetch(path: string, init?: RequestInit) {
    const token = keycloak.token;
    const headers = new Headers(init?.headers);

    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

export default function App() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [title, setTitle] = useState("");

    const isAuthed = useMemo(() => !!keycloak.authenticated, []);

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 800 }}>
            <h1>YourApp</h1>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {!keycloak.authenticated ? (
                    <button onClick={() => keycloak.login()}>Log in</button>
                ) : (
                    <>
                        <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>Log out</button>
                        <button
                            onClick={async () => {
                                await keycloak.updateToken(30);
                                const me = await apiFetch("/api/me");
                                alert(`Logged in. Claims count: ${me.claims?.length ?? 0}`);
                            }}
                        >
                            Who am I?
                        </button>
                        <button
                            onClick={async () => {
                                await keycloak.updateToken(30);
                                const list = await apiFetch("/api/todos");
                                setTodos(list);
                            }}
                        >
                            Load todos
                        </button>
                    </>
                )}
            </div>

            <hr style={{ margin: "24px 0" }} />

            <div style={{ display: "flex", gap: 12 }}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="New todo title"
                    style={{ flex: 1, padding: 8 }}
                    disabled={!keycloak.authenticated}
                />
                <button
                    disabled={!keycloak.authenticated || !title.trim()}
                    onClick={async () => {
                        await keycloak.updateToken(30);
                        const created = await apiFetch("/api/todos", {
                            method: "POST",
                            body: JSON.stringify({ title, isDone: false }),
                        });
                        setTitle("");
                        setTodos((prev) => [created, ...prev]);
                    }}
                >
                    Add
                </button>
            </div>

            <ul>
                {todos.map((t) => (
                    <li key={t.id}>
                        {t.title} {t.isDone ? "✅" : ""}
                    </li>
                ))}
            </ul>

            {!isAuthed && <p style={{ opacity: 0.8 }}>Log in to call protected endpoints.</p>}
        </div>
    );
}
