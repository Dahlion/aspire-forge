using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

// --- Postgres (fixed credentials — values in appsettings.json Parameters section) ---
var pgUser = builder.AddParameter("pg-username");
var pgPass = builder.AddParameter("pg-password", secret: true);

var pgServer = builder
    .AddPostgres("SeacoastDevOpsDbServer", userName: pgUser, password: pgPass)
    .WithPgAdmin(pd =>
    {
        pd.WithHostPort(5050);
        pd.WithImage("dpage/pgadmin4");
    })
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

var postgresDb = pgServer.AddDatabase("dbSeacoastDevops");

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

// --- API ---
var api = builder.AddProject<Projects.AspireForge_ApiService>("api")
    .WithReference(postgresDb)
    .WithReference(redis)
    .WithReference(keycloak)
    .WithReference(mailpit.GetEndpoint("smtp"))
    .WithReference(blobs)
    .WaitFor(postgresDb)
    .WaitFor(keycloak)
    .WithExternalHttpEndpoints();

_ = api;

builder.Build().Run();
