import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("rides", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.uuid("rider_id").notNullable().references("id").inTable("riders");
        table.uuid("driver_id").references("id").inTable("drivers");
        table.string("status").notNullable().defaultTo("PENDING");
        table.float("price").notNullable().defaultTo(0);
        table.float("penalty").notNullable().defaultTo(0);
        table.boolean("is_driver_on_the_way").notNullable().defaultTo(false);
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("rides");
}