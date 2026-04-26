using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class CoreParkingEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ParkingLots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingLots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingLots_Code",
                table: "ParkingLots",
                column: "Code",
                unique: true);

            migrationBuilder.InsertData(
                table: "ParkingLots",
                columns: new[] { "Name", "Code", "Address" },
                values: new object[] { "Main garage", "MAIN", "Demo location" });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    PlateNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Label = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vehicles_AspNetUsers_ApplicationUserId",
                        column: x => x.ApplicationUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_ApplicationUserId_PlateNumber",
                table: "Vehicles",
                columns: new[] { "ApplicationUserId", "PlateNumber" },
                unique: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsUnderMaintenance",
                table: "ParkingSpaces",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "MapColumn",
                table: "ParkingSpaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MapRow",
                table: "ParkingSpaces",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParkingLotId",
                table: "ParkingSpaces",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "SlotCategory",
                table: "ParkingSpaces",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "Standard");

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSpaces_ParkingLots_ParkingLotId",
                table: "ParkingSpaces",
                column: "ParkingLotId",
                principalTable: "ParkingLots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSpaces_ParkingLotId_MapRow_MapColumn",
                table: "ParkingSpaces",
                columns: new[] { "ParkingLotId", "MapRow", "MapColumn" });

            migrationBuilder.AddColumn<bool>(
                name: "IsVisitor",
                table: "ParkingSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TicketCode",
                table: "ParkingSessions",
                type: "nvarchar(48)",
                maxLength: 48,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [ParkingSessions]
                SET [TicketCode] = LOWER(CONVERT(VARCHAR(32), [Id]) + REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''))
                WHERE [TicketCode] IS NULL OR [TicketCode] = '';
                """);

            migrationBuilder.Sql(
                "ALTER TABLE [ParkingSessions] ALTER COLUMN [TicketCode] nvarchar(48) NOT NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSessions_TicketCode",
                table: "ParkingSessions",
                column: "TicketCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSpaces_ParkingLots_ParkingLotId",
                table: "ParkingSpaces");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSessions_TicketCode",
                table: "ParkingSessions");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSpaces_ParkingLotId_MapRow_MapColumn",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "IsUnderMaintenance",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "MapColumn",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "MapRow",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "ParkingLotId",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "SlotCategory",
                table: "ParkingSpaces");

            migrationBuilder.DropColumn(
                name: "IsVisitor",
                table: "ParkingSessions");

            migrationBuilder.DropColumn(
                name: "TicketCode",
                table: "ParkingSessions");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "ParkingLots");
        }
    }
}
