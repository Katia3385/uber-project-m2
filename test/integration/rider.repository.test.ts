import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import knexConfig from '../../setup-integration-tests/knexfile';
import { RiderRepository } from '../../src/infra/rider.repository';
import { Rider } from '../../src/domain/types';

describe('RiderRepository Integration', () => {
    let db: Knex;
    let repository: RiderRepository;

    beforeAll(async () => {
        // 1. On se connecte à la vraie base de données de test
        db = knex(knexConfig.test);
        // 2. On initialise notre futur Repository avec la connexion
        repository = new RiderRepository(db);
    });

    afterAll(async () => {
        await db.destroy();
    });

    it('should save a rider into the database', async () => {
        const newRider: Rider = {
            name: 'Katia',
            balance: 100,
            birthday: '1995-05-15'
        };

        const savedRider = await repository.save(newRider);

        expect(savedRider.id).toBeDefined();
        expect(savedRider.name).toBe('Katia');
        expect(savedRider.birthday).toBe('1995-05-15');
    });
    it('should find a rider by id', async () => {
        const newRider: Rider = {
            name: 'Jean',
            balance: 50,
            birthday: '1990-01-01'
        };
        const savedRider = await repository.save(newRider);

        const foundRider = await repository.findById(savedRider.id!);

        expect(foundRider).toBeDefined();
        expect(foundRider?.name).toBe('Jean');
        expect(foundRider?.balance).toBe(50);
        expect(foundRider?.birthday).toBe('1990-01-01');
    });
    it('should update the balance of a rider', async () => {
        const savedRider = await repository.save({
            name: 'Lea',
            balance: 100,
            birthday: '1992-03-10'
        });

        await repository.updateBalance(savedRider.id!, 95);

        const foundRider = await repository.findById(savedRider.id!);
        expect(foundRider?.balance).toBe(95);
    });

    it('should create a rider with 0 loyalty points', async () => {
        const savedRider = await repository.save({
            name: 'Nora',
            balance: 20,
            birthday: '1991-02-03'
        });

        expect(savedRider.loyaltyPoints).toBe(0);
    });

    it('should add a loyalty point to a rider', async () => {
        const savedRider = await repository.save({
            name: 'Omar',
            balance: 20,
            birthday: '1991-02-03'
        });

        await repository.addLoyaltyPoint(savedRider.id!);
        await repository.addLoyaltyPoint(savedRider.id!);

        const foundRider = await repository.findById(savedRider.id!);
        expect(foundRider?.loyaltyPoints).toBe(2);
    });

    it('should refuse to add a loyalty point to an unknown rider', async () => {
        await expect(repository.addLoyaltyPoint('00000000-0000-0000-0000-000000000000'))
            .rejects.toThrow('Rider not found');
    });
});