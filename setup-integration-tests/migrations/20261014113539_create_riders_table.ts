import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("riders", (table) => {
        table.uuid("id").primary().defaultTo(knex.fn.uuid());
        table.string("name").notNullable();
        table.float("balance").notNullable().defaultTo(0);
        table.date("birthday").notNullable();
        table.timestamps(true, true); // Ajoute created_at et updated_at
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("riders");
}