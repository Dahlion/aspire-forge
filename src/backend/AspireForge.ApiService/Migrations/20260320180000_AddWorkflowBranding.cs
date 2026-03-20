using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AspireForge.ApiService.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccentColor",
                table: "WorkflowProcesses",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#4a9a9a");

            migrationBuilder.AddColumn<string>(
                name: "AppSlug",
                table: "WorkflowProcesses",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconClass",
                table: "WorkflowProcesses",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "bi-diagram-3-fill");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "WorkflowProcesses",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#2F4F4F");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "AccentColor", table: "WorkflowProcesses");
            migrationBuilder.DropColumn(name: "AppSlug", table: "WorkflowProcesses");
            migrationBuilder.DropColumn(name: "IconClass", table: "WorkflowProcesses");
            migrationBuilder.DropColumn(name: "PrimaryColor", table: "WorkflowProcesses");
        }
    }
}
