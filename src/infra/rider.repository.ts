import { Knex } from 'knex';
import { format } from 'date-fns';
import { Rider } from '../domain/types';

export class RiderRepository {
    private db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    async save(rider: Rider): Promise<Rider> {
        // On insère dans la table 'riders' et on demande à la DB de nous renvoyer l'objet créé (avec l'ID)
        const [savedRider] = await this.db('riders').insert(rider).returning('*');
        return this.mapToDomain(savedRider);
    }
    async findById(id: string): Promise<Rider | undefined> {
        const foundRider = await this.db('riders').where({ id }).first();
        return foundRider ? this.mapToDomain(foundRider) : undefined;
    }

    async updateBalance(id: string, balance: number): Promise<void> {
        await this.db('riders').where({ id }).update({ balance });
    }

    // Postgres renvoie la colonne `date` sous forme d'objet Date : on la remet en chaîne YYYY-MM-DD,
    // comme le promet le type Rider.
    private mapToDomain(dbRider: any): Rider {
        return {
            ...dbRider,
            birthday: format(dbRider.birthday, 'yyyy-MM-dd'),
        };
    }
}
