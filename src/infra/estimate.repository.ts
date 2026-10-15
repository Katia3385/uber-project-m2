import { Knex } from 'knex';
import { Estimate } from '../domain/types';

export class EstimateRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    // La DB génère le token unique (uuid) de l'estimation
    async save(estimate: Estimate): Promise<Estimate> {
        const [savedDbEstimate] = await this.db('estimates')
            .insert({
                rider_id: estimate.riderId,
                price: estimate.price,
                expires_at: estimate.expiresAt,
            })
            .returning('*');

        return this.mapToDomain(savedDbEstimate);
    }

    async findByToken(token: string): Promise<Estimate | undefined> {
        const foundDbEstimate = await this.db('estimates').where({ token }).first();
        return foundDbEstimate ? this.mapToDomain(foundDbEstimate) : undefined;
    }

    async markAsUsed(token: string): Promise<void> {
        await this.db('estimates').where({ token }).update({ used: true });
    }

    private mapToDomain(dbEstimate: any): Estimate {
        return {
            token: dbEstimate.token,
            riderId: dbEstimate.rider_id,
            price: dbEstimate.price,
            expiresAt: dbEstimate.expires_at,
            used: dbEstimate.used,
        };
    }
}
