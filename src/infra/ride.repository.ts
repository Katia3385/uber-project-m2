import { Knex } from 'knex';
import { Ride } from '../domain/types';

export class RideRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async save(ride: Ride): Promise<Ride> {
        // 1. On traduit l'objet TypeScript (camelCase) vers la DB (snake_case)
        const dbRide = {
            rider_id: ride.riderId,
            driver_id: ride.driverId,
            status: ride.status,
            price: ride.price,
            penalty: ride.penalty,
            is_driver_on_the_way: ride.isDriverOnTheWay
        };

        // 2. On insère et on récupère le résultat de la DB
        const [savedDbRide] = await this.db('rides').insert(dbRide).returning('*');

        // 3. On re-traduit le résultat de la DB vers notre objet TypeScript
        return this.mapToDomain(savedDbRide);
    }

    async findById(id: string): Promise<Ride | undefined> {
        const foundDbRide = await this.db('rides').where({ id }).first();
        return foundDbRide ? this.mapToDomain(foundDbRide) : undefined;
    }

    async findPendingByRiderId(riderId: string): Promise<Ride | undefined> {
        const foundDbRide = await this.db('rides').where({ rider_id: riderId, status: 'PENDING' }).first();
        return foundDbRide ? this.mapToDomain(foundDbRide) : undefined;
    }

    // Fonction privée pour traduire snake_case -> camelCase
    private mapToDomain(dbRide: any): Ride {
        return {
            id: dbRide.id,
            riderId: dbRide.rider_id,
            driverId: dbRide.driver_id,
            status: dbRide.status,
            price: dbRide.price,
            penalty: dbRide.penalty,
            isDriverOnTheWay: dbRide.is_driver_on_the_way
        };
    }
}