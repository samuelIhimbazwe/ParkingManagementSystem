using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class _DetectPendingModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ManagerUserId",
                table: "ParkingSpaces",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpaces_ManagerUserId",
                table: "ParkingSpaces",
                column: "ManagerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSpaces_AspNetUsers_ManagerUserId",
                table: "ParkingSpaces",
                column: "ManagerUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSpaces_AspNetUsers_ManagerUserId",
                table: "ParkingSpaces");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSpaces_ManagerUserId",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "ManagerUserId",
                table: "ParkingSpaces");
        }
    }
}
