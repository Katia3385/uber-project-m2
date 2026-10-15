import { BlockedDriverRepository } from "../infra/blocked-driver.repository";

export class UnblockDriverUsecase {
    private blockedDriverRepository: BlockedDriverRepository;

    constructor(blockedDriverRepository: BlockedDriverRepository) {
        this.blockedDriverRepository = blockedDriverRepository;
    }

    // Règle : le Rider peut débloquer un Driver
    async execute(riderId: string, driverId: string): Promise<void> {
        await this.blockedDriverRepository.unblock(riderId, driverId);
    }
}
