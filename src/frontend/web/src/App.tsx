import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Spinner,
} from "@heroui/react";
import { useMemo } from "react";
import { useAuthSession } from "./auth/useAuthSession";
import { AdminConsole } from "./features/admin/AdminConsole";

export default function App() {
    const { ready, authenticated, busy, canManageTenants, login, logout } = useAuthSession();

    const statusChip = useMemo(() => {
        return authenticated ? (
            <Chip color="success" variant="flat">
                Authenticated
            </Chip>
        ) : (
            <Chip color="warning" variant="flat">
                Logged out
            </Chip>
        );
    }, [authenticated]);

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
                    {!authenticated ? (
                        <NavbarItem>
                            <Button color="primary" onPress={login} isLoading={busy}>
                                Log in
                            </Button>
                        </NavbarItem>
                    ) : (
                        <NavbarItem>
                            <Button color="danger" variant="flat" onPress={logout} isLoading={busy}>
                                Log out
                            </Button>
                        </NavbarItem>
                    )}
                </NavbarContent>
            </Navbar>

            <main className="mx-auto max-w-6xl px-4 py-8">
                {!authenticated ? (
                    <Card className="shadow-sm">
                        <CardBody className="py-8 text-center text-sm opacity-80">
                            Sign in to access the admin control plane.
                        </CardBody>
                    </Card>
                ) : !canManageTenants ? (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="text-lg font-semibold">Platform Admin Access Required</div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-2">
                            <p className="text-sm opacity-80">
                                Your account is authenticated, but it does not include the <strong>platform_admin</strong> role.
                            </p>
                            <p className="text-sm opacity-70">Ask a platform administrator to assign the role in Keycloak.</p>
                        </CardBody>
                    </Card>
                ) : (
                    <AdminConsole enabled={canManageTenants} />
                )}
            </main>
        </div>
    );
}
