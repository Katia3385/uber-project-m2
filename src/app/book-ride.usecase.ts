import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";
import { Ride } from "../domain/types";

export class BookRideUsecase {
    private rideRepository: RideRepository;
    private riderRepository: RiderRepository;

    // Le constructeur reçoit les Repositories (Injection de Dépendances)
    constructor(rideRepository: RideRepository, riderRepository: RiderRepository) {
        this.rideRepository = rideRepository;
        this.riderRepository = riderRepository;
    }

    // La méthode devient async car elle doit attendre la réponse de la DB
    async execute(rideData: Omit<Ride, "id">): Promise<Ride> {
        const rider = await this.riderRepository.findById(rideData.riderId);
        if (!rider) throw new Error("Rider not found");

        // Règle : le Rider doit avoir assez de fonds pour réserver la course
        if (rider.balance < rideData.price) {
            throw new Error("Insufficient funds");
        }

        // Règle : tant qu'un Driver n'est pas assigné à sa réservation en cours,
        // le Rider ne peut pas en faire une autre (il doit d'abord l'annuler)
        const awaitingDriverRide = await this.rideRepository.findAwaitingDriverByRiderId(rideData.riderId);
        if (awaitingDriverRide) {
            throw new Error("Rider already has a pending ride");
        }

        // On délègue la sauvegarde au repository.
        // C'est lui qui va parler à PostgreSQL et récupérer l'ID généré.
        const savedRide = await this.rideRepository.save(rideData as Ride);

        return savedRide;
    }
}