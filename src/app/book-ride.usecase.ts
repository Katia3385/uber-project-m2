import { RideRepository } from "../infra/ride.repository";
import { Ride } from "../domain/types";

export class BookRideUsecase {
    private rideRepository: RideRepository;

    // Le constructeur reçoit maintenant le Repository
    constructor(rideRepository: RideRepository) {
        this.rideRepository = rideRepository;
    }

    // La méthode devient async car elle doit attendre la réponse de la DB
    async execute(rideData: Omit<Ride, "id">): Promise<Ride> {
        // On délègue la sauvegarde au repository.
        // C'est lui qui va parler à PostgreSQL et récupérer l'ID généré.
        const savedRide = await this.rideRepository.save(rideData as Ride);

        return savedRide;
    }
}