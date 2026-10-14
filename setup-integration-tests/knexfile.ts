import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
    test: {
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 5433,
            user: 'postgres',
            password: 'secret',
            database: 'uber_test',
        },
        migrations: {
            directory:   './setup-integration-tests/migrations',
        },
    },
};

export default config;