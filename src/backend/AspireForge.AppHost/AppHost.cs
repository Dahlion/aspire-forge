using Aspire.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.AspireForge_ApiService>("api")
    .WithExternalHttpEndpoints();

builder.Build().Run();