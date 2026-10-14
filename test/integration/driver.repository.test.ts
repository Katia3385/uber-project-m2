import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { DriverRepository } from '../../src/infra/driver.repository';
import { Driver } from '../../src/domain/types';

describe('DriverRepository Integration', () => {
    let db: Knex;
    let repository: DriverRepository;

    beforeAll(async () => {
        // 1. On se connecte à la vraie base de données de test
        db = knex(knexConfig.test);
        // 2. On initialise notre futur Repository
        repository = new DriverRepository(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    it('should save a driver into the database', async () => {
        const newDriver: Driver = {
            name: 'Pierre',
            isAvailable: true,
            currentLocation: 'Paris'
        };

        const savedDriver = await repository.save(newDriver);

        expect(savedDriver.id).toBeDefined();
        expect(savedDriver.name).toBe('Pierre');
        expect(savedDriver.isAvailable).toBe(true);
    });
    it('should find a driver by id', async () => {
        const newDriver: Driver = {
            name: 'Marc',
            isAvailable: false,
            currentLocation: 'Lyon'
        };
        const savedDriver = await repository.save(newDriver);

        const foundDriver = await repository.findById(savedDriver.id);

        expect(foundDriver).toBeDefined();
        expect(foundDriver?.name).toBe('Marc');
        expect(foundDriver?.isAvailable).toBe(false);
    });
});