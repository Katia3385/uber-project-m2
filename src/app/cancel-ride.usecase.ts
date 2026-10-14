import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";

export class CancelRideUsecase {
    private rideRepository: RideRepository;
    private riderRepository: RiderRepository;

    // Le constructeur reçoit maintenant les Repositories (Injection de Dépendances)
    constructor(rideRepository: RideRepository, riderRepository: RiderRepository) {
        this.rideRepository = rideRepository;
        this.riderRepository = riderRepository;
    }

    // La méthode devient async car on attend des réponses de la base de données
    async execute(riderId: string, rideId: string): Promise<{ status: string; penalty: number }> {

        // 1. On récupère les données depuis la DB
        const ride = await this.rideRepository.findById(rideId);
        const rider = await this.riderRepository.findById(riderId);

        // Sécurité : si la course ou le rider n'existe pas
        if (!ride) throw new Error("Ride not found");
        if (!rider) throw new Error("Rider not found");

        // 2. Règle : On vérifie d'abord si la course n'est pas déjà annulée
        if (ride.status === "CANCELLED") {
            throw new Error("Ride already cancelled");
        }

        let penalty = 0;

        // 3. Règle : Vérification de l'anniversaire
        // On compare la date d'aujourd'hui (YYYY-MM-DD) avec la date d'anniversaire du rider
        const today = new Date().toISOString().split('T')[0];
        const isBirthday = rider.birthday === today;

        // 4. Calcul de la pénalité
        if (isBirthday) {
            penalty = 0; // Cadeau d'anniversaire !
        } else if (ride.isDriverOnTheWay) {
            penalty = 5; // Le driver est en chemin
        }

        // On retourne l'objet de succès
        return {
            status: "CANCELLED",
            penalty: penalty
        };
    }
}