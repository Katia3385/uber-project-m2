import { RideRepository } from "../infra/ride.repository";

export class GetRideHistoryUsecase {
    private rideRepository: RideRepository;

    // Le constructeur reçoit le Repository (Injection de Dépendances)
    constructor(rideRepository: RideRepository) {
        this.rideRepository = rideRepository;
    }

    // La méthode exécute la logique et retourne l'historique
    async execute(riderId: string): Promise<any[]> {
        // On délègue le travail au repository qui a déjà fait la jointure SQL
        const history = await this.rideRepository.findHistoryByRiderId(riderId);

        return history;
    }
}