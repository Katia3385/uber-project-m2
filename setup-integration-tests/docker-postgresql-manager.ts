import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import knex, { Knex } from 'knex';

let container: StartedPostgreSqlContainer | null = null;
let sqlConnection: Knex | null = null;

export async function startDockerPostgresql(): Promise<Knex> {
    if (sqlConnection) return sqlConnection;

    console.log('🐳 Starting PostgreSQL container...');
    container = await new PostgreSqlContainer('postgres:15-alpine')
        .withDatabase('uber_test')
        .withUsername('postgres')
        .withPassword('secret')
        .start();

    const dbUrl = container.getConnectionUri();

    sqlConnection = knex({
        client: 'pg',
        connection: dbUrl,
        searchPath: ['public'],
    });

    console.log('✅ PostgreSQL container started');
    return sqlConnection;
}

export async function resetDB(knexInstance: Knex): Promise<void> {
    // On vide les tables pour que chaque test parte de zéro.
    // (On met un try/catch car les tables n'existent peut-être pas encore au tout premier test)
    try {
        await knexInstance.raw('TRUNCATE TABLE rides, riders, drivers RESTART IDENTITY CASCADE');
    } catch (e) {
        // Ignore si les tables n'existent pas
    }
}

export async function stopDockerPostgresql(): Promise<void> {
    if (sqlConnection) {
        await sqlConnection.destroy();
        sqlConnection = null;
    }
    if (container) {
        await container.stop();
        container = null;
        console.log('🛑 PostgreSQL container stopped');
    }
}