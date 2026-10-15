import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("estimates", (table) => {
        table.boolean("used").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("estimates", (table) => {
        table.dropColumn("used");
    });
}
