import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { BlockedDriverRepository } from '../../src/infra/blocked-driver.repository';

describe('BlockedDriverRepository Integration', () => {
    let db: Knex;
    let repository: BlockedDriverRepository;
    let riderId: string;
    let driverId: string;
    let otherDriverId: string;

    beforeAll(async () => {
        db = knex(knexConfig.test);
        repository = new BlockedDriverRepository(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    // Avant chaque test, on crée un Rider et deux Drivers pour les clés étrangères
    beforeEach(async () => {
        await db('blocked_drivers').del();
        await db('rides').del();
        await db('drivers').del();
        await db('riders').del();

        const [rider] = await db('riders').insert({
            name: 'Test Rider', balance: 100, birthday: '1990-01-01'
        }).returning('id');
        const [driver] = await db('drivers').insert({ name: 'Driver 1', isAvailable: true }).returning('id');
        const [otherDriver] = await db('drivers').insert({ name: 'Driver 2', isAvailable: true }).returning('id');

        riderId = rider.id;
        driverId = driver.id;
        otherDriverId = otherDriver.id;
    });

    it('should block a driver for a rider', async () => {
        await repository.block(riderId, driverId);

        expect(await repository.isBlocked(riderId, driverId)).toBe(true);
    });

    it('should not consider a driver as blocked by default', async () => {
        expect(await repository.isBlocked(riderId, driverId)).toBe(false);
    });

    it('should count the drivers blocked by a rider', async () => {
        await repository.block(riderId, driverId);
        await repository.block(riderId, otherDriverId);

        expect(await repository.countByRiderId(riderId)).toBe(2);
    });

    it('should unblock a driver', async () => {
        await repository.block(riderId, driverId);

        await repository.unblock(riderId, driverId);

        expect(await repository.isBlocked(riderId, driverId)).toBe(false);
        expect(await repository.countByRiderId(riderId)).toBe(0);
    });
});
