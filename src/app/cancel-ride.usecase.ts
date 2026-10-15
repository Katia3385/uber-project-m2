import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";
import { Clock } from "../domain/clock";

export class CancelRideUsecase {
    private rideRepository: RideRepository;
    private riderRepository: RiderRepository;
    private clock: Clock;

    // Le constructeur reçoit les Repositories et l'horloge (Injection de Dépendances)
    constructor(rideRepository: RideRepository, riderRepository: RiderRepository, clock: Clock) {
        this.rideRepository = rideRepository;
        this.riderRepository = riderRepository;
        this.clock = clock;
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
        // On compare le jour et le mois d'aujourd'hui (MM-DD) avec ceux de la naissance du rider :
        // l'année de naissance ne compte pas
        const todayMonthDay = this.clock.now().toISOString().slice(5, 10);
        const isBirthday = rider.birthday.slice(5, 10) === todayMonthDay;

        // 4. Calcul de la pénalité
        if (isBirthday) {
            penalty = 0; // Cadeau d'anniversaire !
        } else if (ride.isDriverOnTheWay) {
            penalty = 5; // Le driver est en chemin
        }

        // 5. On enregistre l'annulation, puis on débite la pénalité du solde du Rider
        await this.rideRepository.update(rideId, { status: "CANCELLED", penalty });
        if (penalty > 0) {
            await this.riderRepository.updateBalance(riderId, rider.balance - penalty);
        }

        // On retourne l'objet de succès
        return {
            status: "CANCELLED",
            penalty: penalty
        };
    }
}