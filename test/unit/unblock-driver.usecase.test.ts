import { describe, expect, it } from "vitest";
import { UnblockDriverUsecase } from "../../src/app/unblock-driver.usecase";

class MockBlockedDriverRepository {
    unblocked: { riderId: string; driverId: string }[] = [];

    async unblock(riderId: string, driverId: string): Promise<void> {
        this.unblocked.push({ riderId, driverId });
    }
}

describe("UnblockDriverUsecase", () => {
    it("should unblock a driver for a rider", async () => {
        const mockRepo = new MockBlockedDriverRepository();
        const usecase = new UnblockDriverUsecase(mockRepo as any);

        await usecase.execute("rider_1", "driver_1");

        expect(mockRepo.unblocked).toEqual([{ riderId: "rider_1", driverId: "driver_1" }]);
    });
});
