import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { EstimateRepository } from '../../src/infra/estimate.repository';

describe('EstimateRepository Integration', () => {
    let db: Knex;
    let repository: EstimateRepository;
    let riderId: string;

    beforeAll(async () => {
        db = knex(knexConfig.test);
        repository = new EstimateRepository(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    // Avant chaque test, on crée un Rider pour la clé étrangère
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

    it('should save an estimate and generate a unique token', async () => {
        const expiresAt = new Date('2026-12-01T10:05:00.000Z');

        const saved = await repository.save({ riderId, price: 12.5, expiresAt });
        const other = await repository.save({ riderId, price: 12.5, expiresAt });

        expect(saved.token).toBeDefined();
        expect(saved.token).not.toBe(other.token);
        expect(saved.price).toBe(12.5);
        expect(saved.expiresAt).toEqual(expiresAt);
    });

    it('should find an estimate by its token', async () => {
        const saved = await repository.save({ riderId, price: 7, expiresAt: new Date('2026-12-01T10:05:00.000Z') });

        const found = await repository.findByToken(saved.token!);

        expect(found?.token).toBe(saved.token);
        expect(found?.riderId).toBe(riderId);
        expect(found?.price).toBe(7);
        expect(found?.expiresAt).toEqual(new Date('2026-12-01T10:05:00.000Z'));
    });

    it('should return undefined for an unknown token', async () => {
        const found = await repository.findByToken('00000000-0000-0000-0000-000000000000');

        expect(found).toBeUndefined();
    });

    it('should create an estimate as not used', async () => {
        const saved = await repository.save({ riderId, price: 7, expiresAt: new Date('2026-12-01T10:05:00.000Z') });

        expect(saved.used).toBe(false);
    });

    it('should mark an estimate as used', async () => {
        const saved = await repository.save({ riderId, price: 7, expiresAt: new Date('2026-12-01T10:05:00.000Z') });

        await repository.markAsUsed(saved.token!);

        const found = await repository.findByToken(saved.token!);
        expect(found?.used).toBe(true);
    });
});
