import { useEffect, useMemo, useState } from "react";
import { keycloak } from "./auth/keycloak";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Input,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Spinner,
    Chip,
} from "@heroui/react";

type TodoItem = { id: number; title: string; isDone: boolean; createdAt: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function apiFetch(path: string, init?: RequestInit) {
    // Ensure token is fresh before sending
    await keycloak.updateToken(30);

    const headers = new Headers(init?.headers);
    if (keycloak.token) headers.set("Authorization", `Bearer ${keycloak.token}`);
    headers.set("Content-Type", "application/json");

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

export default function App() {
    const [authed, setAuthed] = useState<boolean>(!!keycloak.authenticated);
    const [ready, setReady] = useState(false);

    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [title, setTitle] = useState("");
    const [loadingTodos, setLoadingTodos] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // Keycloak-js sets authenticated after init/redirect; also update on events
        const update = () => setAuthed(!!keycloak.authenticated);

        // Some keycloak-js builds expose these callbacks:
        (keycloak as any).onAuthSuccess = update;
        (keycloak as any).onAuthLogout = update;
        (keycloak as any).onAuthRefreshSuccess = update;
        (keycloak as any).onTokenExpired = async () => {
            try {
                await keycloak.updateToken(30);
                update();
            } catch {
                // token refresh failed; user effectively logged out
                update();
            }
        };

        update();
        setReady(true);

        return () => {
            (keycloak as any).onAuthSuccess = undefined;
            (keycloak as any).onAuthLogout = undefined;
            (keycloak as any).onAuthRefreshSuccess = undefined;
            (keycloak as any).onTokenExpired = undefined;
        };
    }, []);

    const statusChip = useMemo(() => {
        return authed ? (
            <Chip color="success" variant="flat">
                Authenticated
            </Chip>
        ) : (
            <Chip color="warning" variant="flat">
                Logged out
            </Chip>
        );
    }, [authed]);

    const login = async () => {
        setBusy(true);
        try {
            await keycloak.login();
        } finally {
            setBusy(false);
        }
    };

    const logout = async () => {
        setBusy(true);
        try {
            await keycloak.logout({ redirectUri: window.location.origin });
        } finally {
            setBusy(false);
        }
    };

    const whoAmI = async () => {
        setBusy(true);
        try {
            const me = await apiFetch("/api/me");
            alert(`Logged in. Claims count: ${me.claims?.length ?? 0}`);
        } finally {
            setBusy(false);
        }
    };

    const loadTodos = async () => {
        setLoadingTodos(true);
        try {
            const list = await apiFetch("/api/todos");
            setTodos(list);
        } finally {
            setLoadingTodos(false);
        }
    };

    const addTodo = async () => {
        setBusy(true);
        try {
            const created = await apiFetch("/api/todos", {
                method: "POST",
                body: JSON.stringify({ title, isDone: false }),
            });
            setTitle("");
            setTodos((prev) => [created, ...prev]);
        } finally {
            setBusy(false);
        }
    };

    if (!ready) {
        return (
            <div className="min-h-screen grid place-items-center">
                <Spinner label="Loading..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar maxWidth="xl" className="border-b">
                <NavbarBrand>
                    <span className="font-semibold tracking-tight">AspireForge</span>
                </NavbarBrand>

                <NavbarContent justify="end" className="gap-2">
                    <NavbarItem>{statusChip}</NavbarItem>

                    {!authed ? (
                        <NavbarItem>
                            <Button color="primary" onPress={login} isLoading={busy}>
                                Log in
                            </Button>
                        </NavbarItem>
                    ) : (
                        <>
                            <NavbarItem>
                                <Button variant="flat" onPress={whoAmI} isLoading={busy}>
                                    Who am I?
                                </Button>
                            </NavbarItem>
                            <NavbarItem>
                                <Button color="danger" variant="flat" onPress={logout} isLoading={busy}>
                                    Log out
                                </Button>
                            </NavbarItem>
                        </>
                    )}
                </NavbarContent>
            </Navbar>

            <main className="mx-auto max-w-3xl px-4 py-8">
                <Card className="shadow-sm">
                    <CardHeader className="flex items-center justify-between">
                        <div>
                            <div className="text-lg font-semibold">Todos</div>
                            <div className="text-sm opacity-70">Protected endpoints via Keycloak</div>
                        </div>

                        <Button
                            color="secondary"
                            variant="flat"
                            onPress={loadTodos}
                            isDisabled={!authed}
                            isLoading={loadingTodos}
                        >
                            Load
                        </Button>
                    </CardHeader>

                    <Divider />

                    <CardBody className="space-y-4">
                        <div className="flex gap-3">
                            <Input
                                label="New todo"
                                placeholder="Add something…"
                                value={title}
                                onValueChange={setTitle}
                                isDisabled={!authed}
                                className="flex-1"
                            />
                            <Button
                                color="primary"
                                onPress={addTodo}
                                isDisabled={!authed || !title.trim()}
                                isLoading={busy}
                                className="self-end"
                            >
                                Add
                            </Button>
                        </div>

                        <Divider />

                        {todos.length === 0 ? (
                            <div className="text-sm opacity-70">
                                {authed ? "No todos yet. Click Load or add one." : "Log in to view and manage todos."}
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {todos.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex items-center justify-between rounded-xl border border-divider px-4 py-3"
                                    >
                                        <span className="font-medium">{t.title}</span>
                                        <Chip size="sm" variant="flat" color={t.isDone ? "success" : "default"}>
                                            {t.isDone ? "Done" : "Open"}
                                        </Chip>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardBody>
                </Card>
            </main>
        </div>
    );
}
