import { BlockedDriverRepository } from "../infra/blocked-driver.repository";

const MAX_BLOCKED_DRIVERS = 3;

export class BlockDriverUsecase {
    private blockedDriverRepository: BlockedDriverRepository;

    constructor(blockedDriverRepository: BlockedDriverRepository) {
        this.blockedDriverRepository = blockedDriverRepository;
    }

    async execute(riderId: string, driverId: string): Promise<void> {
        // Règle : un Rider peut bloquer jusqu'à 3 Drivers
        const blockedCount = await this.blockedDriverRepository.countByRiderId(riderId);
        if (blockedCount >= MAX_BLOCKED_DRIVERS) {
            throw new Error("Rider cannot block more than 3 drivers");
        }

        await this.blockedDriverRepository.block(riderId, driverId);
    }
}
