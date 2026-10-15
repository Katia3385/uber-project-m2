import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("blocked_drivers", (table) => {
        table.uuid("rider_id").notNullable().references("id").inTable("riders").onDelete("CASCADE");
        table.uuid("driver_id").notNullable().references("id").inTable("drivers").onDelete("CASCADE");
        table.primary(["rider_id", "driver_id"]);
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("blocked_drivers");
}
