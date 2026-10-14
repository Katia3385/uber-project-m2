import { Knex } from 'knex';
import { Driver } from '../domain/types';

export class DriverRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async save(driver: Driver): Promise<Driver> {
        // On insère dans la table 'drivers' et on demande à la DB de nous renvoyer l'objet créé (avec l'ID)
        const [savedDriver] = await this.db('drivers').insert(driver).returning('*');
        return savedDriver;
    }

    async findById(id: string): Promise<Driver | undefined> {
        const foundDriver = await this.db('drivers').where({ id }).first();
        return foundDriver;
    }
}
