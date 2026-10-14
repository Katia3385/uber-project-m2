import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("drivers", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.string("name").notNullable();
        table.boolean("isAvailable").notNullable().defaultTo(true);
        table.string("currentLocation").nullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("drivers");
}