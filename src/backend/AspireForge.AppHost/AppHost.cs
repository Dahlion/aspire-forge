using Aspire.Hosting;
using Aspire.Hosting.Azure;

var builder = DistributedApplication.CreateBuilder(args);

// --- Postgres ---
// Fixed port 5433 (avoids clashing with any local Postgres on 5432) and a
// stable dev password so docker/pgadmin/servers.json can auto-connect.
var pgPassword = builder.AddParameter("pg-password", "aspireforgedev");

var pgServer = builder.AddPostgres("pg", password: pgPassword, port: 5433)
    .WithDataVolume();

var postgres = pgServer.AddDatabase("Postgres");

// --- Redis ---
var redis = builder.AddRedis("Redis")
    .WithDataVolume();

// --- Keycloak ---
var keycloak = builder.AddKeycloak("keycloak", port: 8080)
    .WithRealmImport(Path.Combine(builder.AppHostDirectory, "..", "..", "..", "docker", "keycloak"))
    .WithBindMount(
        Path.Combine(builder.AppHostDirectory, "..", "..", "..", "docker", "keycloak", "Themes"),
        "/opt/keycloak/themes",
        isReadOnly: true);

// --- Mailpit (dev SMTP trap + web UI on port 8025) ---
var mailpit = builder.AddContainer("mailpit", "axllent/mailpit")
    .WithHttpEndpoint(port: 8025, targetPort: 8025, name: "ui")
    .WithEndpoint(port: 1025, targetPort: 1025, name: "smtp");

// --- Azure Blob Storage (Azurite emulator in dev) ---
var storage = builder.AddAzureStorage("storage")
    .RunAsEmulator(azurite => azurite
        .WithLifetime(ContainerLifetime.Persistent)
        .WithDataVolume());

var blobs = storage.AddBlobs("blobs");

// --- pgAdmin ---
// Desktop mode: no login required.
// servers.json pre-configures the Postgres connection so you land straight
// in the query tool. Password stored in the JSON: aspireforgedev
builder.AddContainer("pgadmin", "dpage/pgadmin4")
    .WithHttpEndpoint(port: 5050, targetPort: 80)
    .WithEnvironment("PGADMIN_DEFAULT_EMAIL", "admin@local.dev")
    .WithEnvironment("PGADMIN_DEFAULT_PASSWORD", "admin")
    // Desktop mode — disables the login page entirely
    .WithEnvironment("PGADMIN_CONFIG_SERVER_MODE", "False")
    // No master password prompt for saved credentials
    .WithEnvironment("PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED", "False")
    // Point pgAdmin at our pre-configured servers list
    .WithEnvironment("PGADMIN_SERVER_JSON_FILE", "/pgadmin4/servers.json")
    .WithBindMount(
        Path.Combine(builder.AppHostDirectory, "..", "..", "..", "docker", "pgadmin", "servers.json"),
        "/pgadmin4/servers.json",
        isReadOnly: true)
    .WithVolume("pgadmin-data", "/var/lib/pgadmin")
    .WaitFor(pgServer);

// --- API ---
var api = builder.AddProject<Projects.AspireForge_ApiService>("api")
    .WithReference(postgres)
    .WithReference(redis)
    .WithReference(keycloak)
    .WithReference(mailpit.GetEndpoint("smtp"))
    .WithReference(blobs)
    .WaitFor(keycloak)
    .WithExternalHttpEndpoints();

_ = api;

builder.Build().Run();
