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

        const [driver] = await db('drivers').insert({
            name: 'Test Driver', isAvailable: true
        }).returning('id');

        //  On affirme que l'ID est bien présent après l'insertion
        riderId = rider.id!;
        driverId = driver.id!;
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
        // Le '!' est déjà bien présent ici, c'est parfait
        const foundRide = await repository.findById(savedRide.id!);

        expect(foundRide).toBeDefined();
        expect(foundRide?.id).toBe(savedRide.id);
        expect(foundRide?.status).toBe('PENDING');
    });

    it('should find ride history for a rider with driver names', async () => {
        // GIVEN : Un rider et deux courses (une avec un driver, une sans driver annulé)
        const ride1 = await repository.save({
            riderId: riderId,
            driverId: driverId,
            status: 'COMPLETED',
            price: 15.5,
            penalty: 0,
            isDriverOnTheWay: false
        });

        const ride2 = await repository.save({
            riderId: riderId,
            driverId: null, // Course annulée avant qu'un driver ne soit assigné
            status: 'CANCELLED',
            price: 0,
            penalty: 0,
            isDriverOnTheWay: false
        });

        // WHEN : On demande l'historique de ce rider
        const history = await repository.findHistoryByRiderId(riderId);

        // THEN : On doit retrouver les 2 courses avec les noms des drivers
        expect(history).toHaveLength(2);

        //  On ajoute '!' après ride1.id et ride2.id
        // car TypeScript sait que 'id' est optionnel dans le type Ride,
        // mais nous savons qu'il vient d'être généré par le save().
        const completedRide = history.find(r => r.rideId === ride1.id!);
        expect(completedRide).toBeDefined();
        expect(completedRide?.driverName).toBe('Test Driver'); // Vient de la jointure !
        expect(completedRide?.price).toBe(15.5);

        const cancelledRide = history.find(r => r.rideId === ride2.id!);
        expect(cancelledRide).toBeDefined();
        expect(cancelledRide?.driverName).toBe('Aucun driver'); // Le repo doit gérer le null
    });
});