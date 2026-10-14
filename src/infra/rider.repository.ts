import { Knex } from 'knex';
import { Rider } from '../domain/types';

export class RiderRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async save(rider: Rider): Promise<Rider> {
        // On insère dans la table 'riders' et on demande à la DB de nous renvoyer l'objet créé (avec l'ID)
        const [savedRider] = await this.db('riders').insert(rider).returning('*');
        return savedRider;
    }
    async findById(id: string): Promise<Rider | undefined> {
        const foundRider = await this.db('riders').where({ id }).first();
        return foundRider;
    }
}