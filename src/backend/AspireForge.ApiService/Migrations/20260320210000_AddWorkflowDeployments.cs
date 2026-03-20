using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspireForge.ApiService.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowDeployments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FormSchema",
                table: "WorkflowProcesses",
                type: "text",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDeployments_WorkflowProcessId_TenantId",
                table: "WorkflowDeployments",
                columns: new[] { "WorkflowProcessId", "TenantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDeployments_TenantId",
                table: "WorkflowDeployments",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "WorkflowDeployments");

            migrationBuilder.DropColumn(name: "FormSchema", table: "WorkflowProcesses");
        }
    }
}
