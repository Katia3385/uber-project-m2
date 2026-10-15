import { Knex } from 'knex';

export class BlockedDriverRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async block(riderId: string, driverId: string): Promise<void> {
        await this.db('blocked_drivers').insert({ rider_id: riderId, driver_id: driverId });
    }

    async unblock(riderId: string, driverId: string): Promise<void> {
        await this.db('blocked_drivers').where({ rider_id: riderId, driver_id: driverId }).del();
    }

    async isBlocked(riderId: string, driverId: string): Promise<boolean> {
        const found = await this.db('blocked_drivers').where({ rider_id: riderId, driver_id: driverId }).first();
        return found !== undefined;
    }

    async countByRiderId(riderId: string): Promise<number> {
        const [{ count }] = await this.db('blocked_drivers').where({ rider_id: riderId }).count('* as count');
        return Number(count);
    }
}
