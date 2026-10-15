import { describe, expect, it, beforeEach } from "vitest";
import { BlockDriverUsecase } from "../../src/app/block-driver.usecase";

class MockBlockedDriverRepository {
    blocked: { riderId: string; driverId: string }[] = [];

    async block(riderId: string, driverId: string): Promise<void> {
        this.blocked.push({ riderId, driverId });
    }

    async countByRiderId(riderId: string): Promise<number> {
        return this.blocked.filter((b) => b.riderId === riderId).length;
    }
}

describe("BlockDriverUsecase", () => {
    let usecase: BlockDriverUsecase;
    let mockRepo: MockBlockedDriverRepository;

    beforeEach(() => {
        mockRepo = new MockBlockedDriverRepository();
        usecase = new BlockDriverUsecase(mockRepo as any);
    });

    it("should block a driver for a rider", async () => {
        await usecase.execute("rider_1", "driver_1");

        expect(mockRepo.blocked).toEqual([{ riderId: "rider_1", driverId: "driver_1" }]);
    });

    it("should allow a rider to block up to 3 drivers", async () => {
        await usecase.execute("rider_1", "driver_1");
        await usecase.execute("rider_1", "driver_2");
        await usecase.execute("rider_1", "driver_3");

        expect(mockRepo.blocked).toHaveLength(3);
    });

    it("should refuse to block a 4th driver", async () => {
        await usecase.execute("rider_1", "driver_1");
        await usecase.execute("rider_1", "driver_2");
        await usecase.execute("rider_1", "driver_3");

        await expect(usecase.execute("rider_1", "driver_4")).rejects.toThrow("Rider cannot block more than 3 drivers");
        expect(mockRepo.blocked).toHaveLength(3);
    });

    it("should count the limit per rider", async () => {
        await usecase.execute("rider_1", "driver_1");
        await usecase.execute("rider_1", "driver_2");
        await usecase.execute("rider_1", "driver_3");

        await usecase.execute("rider_2", "driver_1");

        expect(mockRepo.blocked).toHaveLength(4);
    });
});
