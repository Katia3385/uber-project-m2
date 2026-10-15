import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("estimates", (table) => {
        table.uuid("token").primary().defaultTo(knex.fn.uuid());
        table.uuid("rider_id").notNullable().references("id").inTable("riders").onDelete("CASCADE");
        table.float("price").notNullable();
        table.timestamp("expires_at", { useTz: true }).notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("estimates");
}
