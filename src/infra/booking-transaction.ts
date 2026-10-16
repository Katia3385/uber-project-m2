import { Knex } from 'knex';
import { RideRepository } from './ride.repository';
import { RiderRepository } from './rider.repository';

export type BookingRepositories = {
    rides: RideRepository;
    riders: RiderRepository;
};

// Exécute un travail dans une transaction PostgreSQL : les repositories reçus partagent la même
// transaction. Si le travail échoue, tout est annulé (rollback) ; sinon tout est validé (commit).
export class BookingTransaction {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async run<T>(work: (repositories: BookingRepositories) => Promise<T>): Promise<T> {
        return this.db.transaction((trx) =>
            work({
                rides: new RideRepository(trx),
                riders: new RiderRepository(trx),
            })
        );
    }
}
