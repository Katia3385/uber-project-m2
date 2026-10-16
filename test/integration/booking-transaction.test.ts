import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { BookingTransaction } from '../../src/infra/booking-transaction';

describe('BookingTransaction Integration', () => {
    let db: Knex;
    let bookingTransaction: BookingTransaction;
    let riderId: string;

    const newRide = () => ({
        riderId,
        status: 'PENDING',
        price: 10,
        penalty: 0,
        isDriverOnTheWay: false
    });

    beforeAll(async () => {
        db = knex(knexConfig.test);
        bookingTransaction = new BookingTransaction(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    beforeEach(async () => {
        await db('estimates').del();
        await db('blocked_drivers').del();
        await db('rides').del();
        await db('drivers').del();
        await db('riders').del();

        const [rider] = await db('riders').insert({
            name: 'Test Rider', balance: 100, birthday: '1990-01-01'
        }).returning('id');
        riderId = rider.id;
    });

    it('should save the ride and add the loyalty point when everything succeeds', async () => {
        const ride = await bookingTransaction.run(async ({ rides, riders }) => {
            const saved = await rides.save(newRide());
            await riders.addLoyaltyPoint(riderId);
            return saved;
        });

        expect(ride.id).toBeDefined();
        expect(await db('rides').where({ rider_id: riderId })).toHaveLength(1);
        const rider = await db('riders').where({ id: riderId }).first();
        expect(rider.loyalty_points).toBe(1);
    });

    it('should not save the ride when the loyalty point cannot be added', async () => {
        await expect(
            bookingTransaction.run(async ({ rides, riders }) => {
                await rides.save(newRide());
                await riders.addLoyaltyPoint('00000000-0000-0000-0000-000000000000'); // Rider inconnu : le point ne s'ajoute pas
            })
        ).rejects.toThrow('Rider not found');

        expect(await db('rides').where({ rider_id: riderId })).toHaveLength(0);
        const rider = await db('riders').where({ id: riderId }).first();
        expect(rider.loyalty_points).toBe(0);
    });

    it('should not add the loyalty point when saving the ride fails', async () => {
        await expect(
            bookingTransaction.run(async ({ rides, riders }) => {
                await riders.addLoyaltyPoint(riderId);
                await rides.save({ ...newRide(), riderId: '00000000-0000-0000-0000-000000000000' }); // Rider inconnu : la course ne s'enregistre pas
            })
        ).rejects.toThrow();

        const rider = await db('riders').where({ id: riderId }).first();
        expect(rider.loyalty_points).toBe(0);
    });
});
