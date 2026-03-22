using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspireForge.ApiService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ContactName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Segment = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FollowUpAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MonthlyPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    MaxSeats = table.Column<int>(type: "integer", nullable: false),
                    Features = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStepId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToStepId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionBy = table.Column<string>(type: "text", nullable: false),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowProcesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PrimaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    AccentColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    IconClass = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    AppSlug = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    FormSchema = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowProcesses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppSuites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IconClass = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSuites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppSuites_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedAgencyConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgencyName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AgencyLicenseNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    EnableVialTracking = table.Column<bool>(type: "boolean", nullable: false),
                    EnableDailyChecks = table.Column<bool>(type: "boolean", nullable: false),
                    EnableControlledSubstanceLog = table.Column<bool>(type: "boolean", nullable: false),
                    EnableExpiryAlerts = table.Column<bool>(type: "boolean", nullable: false),
                    EnableSealedContainers = table.Column<bool>(type: "boolean", nullable: false),
                    EnableOpenFdaLookup = table.Column<bool>(type: "boolean", nullable: false),
                    EnableReporting = table.Column<bool>(type: "boolean", nullable: false),
                    EnforceRolePermissions = table.Column<bool>(type: "boolean", nullable: false),
                    ReportVialUsage = table.Column<bool>(type: "boolean", nullable: false),
                    ReportWasteLog = table.Column<bool>(type: "boolean", nullable: false),
                    ReportCheckCompliance = table.Column<bool>(type: "boolean", nullable: false),
                    ReportExpiryTracking = table.Column<bool>(type: "boolean", nullable: false),
                    ReportInventorySnapshot = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultCheckFrequencyHours = table.Column<int>(type: "integer", nullable: false),
                    ExpiryWarningDays = table.Column<int>(type: "integer", nullable: false),
                    RequireWitnessForAllWaste = table.Column<bool>(type: "boolean", nullable: false),
                    RequireWitnessForAllChecks = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedAgencyConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedAgencyConfigs_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedLicenseLevels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    CanAdminister = table.Column<bool>(type: "boolean", nullable: false),
                    CanWaste = table.Column<bool>(type: "boolean", nullable: false),
                    CanWitness = table.Column<bool>(type: "boolean", nullable: false),
                    CanStock = table.Column<bool>(type: "boolean", nullable: false),
                    CanOrder = table.Column<bool>(type: "boolean", nullable: false),
                    CanReceive = table.Column<bool>(type: "boolean", nullable: false),
                    CanMove = table.Column<bool>(type: "boolean", nullable: false),
                    CanPerformCheck = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageCatalog = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageRoster = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageLocations = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedLicenseLevels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedLicenseLevels_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedMedications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    GenericName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    BrandName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    DeaSchedule = table.Column<int>(type: "integer", nullable: false),
                    NdcCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Concentration = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    RouteOfAdministration = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    FormDescription = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedMedications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedMedications_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedStorageLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    LocationType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedStorageLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedStorageLocations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedTags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedTags_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Seats = table.Column<int>(type: "integer", nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    AutoRenew = table.Column<bool>(type: "boolean", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RenewsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantContacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantContacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantContacts_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TenantNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantNotes_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowDeployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowProcessId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeployedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowDeployments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowDeployments_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowDeployments_WorkflowProcesses_WorkflowProcessId",
                        column: x => x.WorkflowProcessId,
                        principalTable: "WorkflowProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowProcessId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    DefaultAssigneeRole = table.Column<string>(type: "text", nullable: true),
                    AllowBacktracking = table.Column<bool>(type: "boolean", nullable: false),
                    CanSkip = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowSteps_WorkflowProcesses_WorkflowProcessId",
                        column: x => x.WorkflowProcessId,
                        principalTable: "WorkflowProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MicroApps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowProcessId = table.Column<Guid>(type: "uuid", nullable: false),
                    AppSuiteId = table.Column<Guid>(type: "uuid", nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    AccentColor = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    IconClass = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    DeployedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MicroApps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MicroApps_AppSuites_AppSuiteId",
                        column: x => x.AppSuiteId,
                        principalTable: "AppSuites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MicroApps_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MicroApps_WorkflowProcesses_WorkflowProcessId",
                        column: x => x.WorkflowProcessId,
                        principalTable: "WorkflowProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MedPersonnel",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    LicenseLevelId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    LastName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    BadgeNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    KeycloakUserId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedPersonnel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedPersonnel_MedLicenseLevels_LicenseLevelId",
                        column: x => x.LicenseLevelId,
                        principalTable: "MedLicenseLevels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MedPersonnel_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedMedicationConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequireWitnessForWaste = table.Column<bool>(type: "boolean", nullable: false),
                    IsControlledSubstance = table.Column<bool>(type: "boolean", nullable: false),
                    RequireSealedStorage = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedMedicationConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedMedicationConfigs_MedMedications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "MedMedications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedContainers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageLocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ContainerType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    IsSealable = table.Column<bool>(type: "boolean", nullable: false),
                    IsSealed = table.Column<bool>(type: "boolean", nullable: false),
                    SealNumber = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    CheckFrequencyHours = table.Column<int>(type: "integer", nullable: false),
                    CheckRequiresWitness = table.Column<bool>(type: "boolean", nullable: false),
                    IsControlledSubstance = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedContainers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedContainers_MedStorageLocations_StorageLocationId",
                        column: x => x.StorageLocationId,
                        principalTable: "MedStorageLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedMedicationTags",
                columns: table => new
                {
                    MedicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedMedicationTags", x => new { x.MedicationId, x.TagId });
                    table.ForeignKey(
                        name: "FK_MedMedicationTags_MedMedications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "MedMedications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedMedicationTags_MedTags_TagId",
                        column: x => x.TagId,
                        principalTable: "MedTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DueAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_Subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "Subscriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Invoices_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowInstances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkflowProcessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentStepId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DataJson = table.Column<string>(type: "text", nullable: true),
                    CurrentAssigneeId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowInstances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowInstances_WorkflowProcesses_WorkflowProcessId",
                        column: x => x.WorkflowProcessId,
                        principalTable: "WorkflowProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkflowInstances_WorkflowSteps_CurrentStepId",
                        column: x => x.CurrentStepId,
                        principalTable: "WorkflowSteps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppDomains",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MicroAppId = table.Column<Guid>(type: "uuid", nullable: false),
                    Hostname = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    SslStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppDomains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppDomains_MicroApps_MicroAppId",
                        column: x => x.MicroAppId,
                        principalTable: "MicroApps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AppLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceMicroAppId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetMicroAppId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppLinks_MicroApps_SourceMicroAppId",
                        column: x => x.SourceMicroAppId,
                        principalTable: "MicroApps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppLinks_MicroApps_TargetMicroAppId",
                        column: x => x.TargetMicroAppId,
                        principalTable: "MicroApps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MedCheckSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageLocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonnelId = table.Column<Guid>(type: "uuid", nullable: false),
                    WitnessPersonnelId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedCheckSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedCheckSessions_MedPersonnel_PersonnelId",
                        column: x => x.PersonnelId,
                        principalTable: "MedPersonnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MedCheckSessions_MedPersonnel_WitnessPersonnelId",
                        column: x => x.WitnessPersonnelId,
                        principalTable: "MedPersonnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MedCheckSessions_MedStorageLocations_StorageLocationId",
                        column: x => x.StorageLocationId,
                        principalTable: "MedStorageLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MedCheckSessions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedVials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContainerId = table.Column<Guid>(type: "uuid", nullable: true),
                    LotNumber = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ManufacturerBarcode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    AgencyLabelCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    TotalVolumeMl = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: false),
                    RemainingVolumeMl = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OrderedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    StockedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AdministeredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    WastedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DisposedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedVials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedVials_MedContainers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "MedContainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MedVials_MedMedications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "MedMedications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MedVials_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MedCheckItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContainerId = table.Column<Guid>(type: "uuid", nullable: true),
                    VialId = table.Column<Guid>(type: "uuid", nullable: true),
                    SealIntact = table.Column<bool>(type: "boolean", nullable: false),
                    Passed = table.Column<bool>(type: "boolean", nullable: false),
                    Discrepancy = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CheckedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedCheckItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedCheckItems_MedCheckSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "MedCheckSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedCheckItems_MedContainers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "MedContainers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MedCheckItems_MedVials_VialId",
                        column: x => x.VialId,
                        principalTable: "MedVials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MedVialEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VialId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonnelId = table.Column<Guid>(type: "uuid", nullable: true),
                    WitnessPersonnelId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IncidentNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    PatientWeightKg = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    DosageAmountMl = table.Column<decimal>(type: "numeric(10,3)", precision: 10, scale: 3, nullable: true),
                    FromContainerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToContainerId = table.Column<Guid>(type: "uuid", nullable: true),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedVialEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedVialEvents_MedPersonnel_PersonnelId",
                        column: x => x.PersonnelId,
                        principalTable: "MedPersonnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MedVialEvents_MedPersonnel_WitnessPersonnelId",
                        column: x => x.WitnessPersonnelId,
                        principalTable: "MedPersonnel",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MedVialEvents_MedVials_VialId",
                        column: x => x.VialId,
                        principalTable: "MedVials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppDomains_Hostname",
                table: "AppDomains",
                column: "Hostname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppDomains_MicroAppId",
                table: "AppDomains",
                column: "MicroAppId");

            migrationBuilder.CreateIndex(
                name: "IX_AppLinks_SourceMicroAppId_TargetMicroAppId",
                table: "AppLinks",
                columns: new[] { "SourceMicroAppId", "TargetMicroAppId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppLinks_TargetMicroAppId",
                table: "AppLinks",
                column: "TargetMicroAppId");

            migrationBuilder.CreateIndex(
                name: "IX_AppSuites_TenantId_Slug",
                table: "AppSuites",
                columns: new[] { "TenantId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_SubscriptionId",
                table: "Invoices",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TenantId",
                table: "Invoices",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedAgencyConfigs_TenantId",
                table: "MedAgencyConfigs",
                column: "TenantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckItems_ContainerId",
                table: "MedCheckItems",
                column: "ContainerId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckItems_SessionId",
                table: "MedCheckItems",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckItems_VialId",
                table: "MedCheckItems",
                column: "VialId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckSessions_PersonnelId",
                table: "MedCheckSessions",
                column: "PersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckSessions_StorageLocationId",
                table: "MedCheckSessions",
                column: "StorageLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckSessions_TenantId",
                table: "MedCheckSessions",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedCheckSessions_WitnessPersonnelId",
                table: "MedCheckSessions",
                column: "WitnessPersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_MedContainers_StorageLocationId",
                table: "MedContainers",
                column: "StorageLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedLicenseLevels_TenantId_Rank",
                table: "MedLicenseLevels",
                columns: new[] { "TenantId", "Rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedMedicationConfigs_MedicationId",
                table: "MedMedicationConfigs",
                column: "MedicationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedMedicationConfigs_TenantId_MedicationId",
                table: "MedMedicationConfigs",
                columns: new[] { "TenantId", "MedicationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedMedications_TenantId",
                table: "MedMedications",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedMedicationTags_TagId",
                table: "MedMedicationTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_MedPersonnel_KeycloakUserId",
                table: "MedPersonnel",
                column: "KeycloakUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MedPersonnel_LicenseLevelId",
                table: "MedPersonnel",
                column: "LicenseLevelId");

            migrationBuilder.CreateIndex(
                name: "IX_MedPersonnel_TenantId",
                table: "MedPersonnel",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedStorageLocations_TenantId",
                table: "MedStorageLocations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MedTags_TenantId_Name",
                table: "MedTags",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MedVialEvents_PersonnelId",
                table: "MedVialEvents",
                column: "PersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_MedVialEvents_VialId",
                table: "MedVialEvents",
                column: "VialId");

            migrationBuilder.CreateIndex(
                name: "IX_MedVialEvents_WitnessPersonnelId",
                table: "MedVialEvents",
                column: "WitnessPersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_MedVials_ContainerId",
                table: "MedVials",
                column: "ContainerId");

            migrationBuilder.CreateIndex(
                name: "IX_MedVials_ManufacturerBarcode",
                table: "MedVials",
                column: "ManufacturerBarcode");

            migrationBuilder.CreateIndex(
                name: "IX_MedVials_MedicationId",
                table: "MedVials",
                column: "MedicationId");

            migrationBuilder.CreateIndex(
                name: "IX_MedVials_TenantId_AgencyLabelCode",
                table: "MedVials",
                columns: new[] { "TenantId", "AgencyLabelCode" },
                unique: true,
                filter: "\"AgencyLabelCode\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MedVials_TenantId_Status",
                table: "MedVials",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MicroApps_AppSuiteId",
                table: "MicroApps",
                column: "AppSuiteId");

            migrationBuilder.CreateIndex(
                name: "IX_MicroApps_TenantId_Slug",
                table: "MicroApps",
                columns: new[] { "TenantId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MicroApps_WorkflowProcessId",
                table: "MicroApps",
                column: "WorkflowProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_Slug",
                table: "SubscriptionPlans",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_TenantId",
                table: "Subscriptions",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantContacts_TenantId",
                table: "TenantContacts",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_TenantNotes_TenantId",
                table: "TenantNotes",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Slug",
                table: "Tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDeployments_TenantId",
                table: "WorkflowDeployments",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDeployments_WorkflowProcessId_TenantId",
                table: "WorkflowDeployments",
                columns: new[] { "WorkflowProcessId", "TenantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstances_CurrentStepId",
                table: "WorkflowInstances",
                column: "CurrentStepId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstances_WorkflowProcessId",
                table: "WorkflowInstances",
                column: "WorkflowProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowSteps_WorkflowProcessId_Order",
                table: "WorkflowSteps",
                columns: new[] { "WorkflowProcessId", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppDomains");

            migrationBuilder.DropTable(
                name: "AppLinks");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "Leads");

            migrationBuilder.DropTable(
                name: "MedAgencyConfigs");

            migrationBuilder.DropTable(
                name: "MedCheckItems");

            migrationBuilder.DropTable(
                name: "MedMedicationConfigs");

            migrationBuilder.DropTable(
                name: "MedMedicationTags");

            migrationBuilder.DropTable(
                name: "MedVialEvents");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropTable(
                name: "TenantContacts");

            migrationBuilder.DropTable(
                name: "TenantNotes");

            migrationBuilder.DropTable(
                name: "WorkflowDeployments");

            migrationBuilder.DropTable(
                name: "WorkflowHistories");

            migrationBuilder.DropTable(
                name: "WorkflowInstances");

            migrationBuilder.DropTable(
                name: "MicroApps");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "MedCheckSessions");

            migrationBuilder.DropTable(
                name: "MedTags");

            migrationBuilder.DropTable(
                name: "MedVials");

            migrationBuilder.DropTable(
                name: "WorkflowSteps");

            migrationBuilder.DropTable(
                name: "AppSuites");

            migrationBuilder.DropTable(
                name: "MedPersonnel");

            migrationBuilder.DropTable(
                name: "MedContainers");

            migrationBuilder.DropTable(
                name: "MedMedications");

            migrationBuilder.DropTable(
                name: "WorkflowProcesses");

            migrationBuilder.DropTable(
                name: "MedLicenseLevels");

            migrationBuilder.DropTable(
                name: "MedStorageLocations");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
