using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RealTime.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskOwnerId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"TaskItems\";");

            migrationBuilder.AddColumn<string>(
                name: "OwnerId",
                table: "TaskItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_OwnerId",
                table: "TaskItems",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_AspNetUsers_OwnerId",
                table: "TaskItems",
                column: "OwnerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_AspNetUsers_OwnerId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_OwnerId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "TaskItems");
        }
    }
}
