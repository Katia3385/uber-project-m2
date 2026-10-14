import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { RideRepository } from '../../src/infra/ride.repository';
import { Ride } from '../../src/domain/types';

describe('RideRepository Integration', () => {
    let db: Knex;
    let repository: RideRepository;
    let riderId: string;
    let driverId: string;

    beforeAll(async () => {
        db = knex(knexConfig.test);
        repository = new RideRepository(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    // Avant chaque test, on nettoie et on crée un Rider/Driver fictif pour les clés étrangères
    beforeEach(async () => {
        await db('rides').del();
        await db('drivers').del();
        await db('riders').del();

        const [rider] = await db('riders').insert({
            name: 'Test Rider', balance: 100, birthday: '1990-01-01'
        }).returning('id');

        // CORRECTION ICI : isAvailable au lieu de is_available
        const [driver] = await db('drivers').insert({
            name: 'Test Driver', isAvailable: true
        }).returning('id');

        riderId = rider.id;
        driverId = driver.id;
    });

    it('should save a ride into the database', async () => {
        const newRide: Ride = {
            riderId: riderId,
            driverId: driverId,
            status: 'PENDING',
            price: 15.5,
            penalty: 0,
            isDriverOnTheWay: false
        };

        const savedRide = await repository.save(newRide);

        expect(savedRide.id).toBeDefined();
        expect(savedRide.price).toBe(15.5);
    });

    it('should find a ride by id', async () => {
        const newRide: Ride = {
            riderId: riderId,
            driverId: driverId,
            status: 'PENDING',
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false
        };

        const savedRide = await repository.save(newRide);
        const foundRide = await repository.findById(savedRide.id);

        expect(foundRide).toBeDefined();
        expect(foundRide?.id).toBe(savedRide.id);
        expect(foundRide?.status).toBe('PENDING');
    });
});