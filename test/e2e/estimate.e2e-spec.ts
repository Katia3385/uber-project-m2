import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../../src/app/get-ride-history.usecase";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { EstimateRideUsecase } from "../../src/app/estimate-ride.usecase";
import { BookRideFromEstimateUsecase } from "../../src/app/book-ride-from-estimate.usecase";
import { Ride, Rider } from "../../src/domain/types";
import { InMemoryEstimateRepository, StubScanTrip, TestClock, inMemoryTransaction } from "./support/estimate-fakes";

class InMemoryRideRepository {
    rides: Ride[] = [];

    async save(ride: Ride): Promise<Ride> {
        const saved = { ...ride, id: `ride-${this.rides.length + 1}` };
        this.rides.push(saved);
        return saved;
    }

    async findById(id: string): Promise<Ride | undefined> {
        return this.rides.find((ride) => ride.id === id);
    }

    async update(id: string, changes: { status: string; penalty: number }): Promise<void> {
        const ride = this.rides.find((r) => r.id === id);
        if (ride) Object.assign(ride, changes);
    }

    async findAwaitingDriverByRiderId(riderId: string): Promise<Ride | undefined> {
        return this.rides.find((r) => r.riderId === riderId && r.status === "PENDING" && !r.driverId);
    }

    async findHistoryByRiderId(_riderId: string) {
        return [];
    }
}

class InMemoryRiderRepository {
    riders: Rider[] = [{ id: "rider-1", name: "Ada", balance: 100, birthday: "1990-01-01" }];

    async findById(id: string): Promise<Rider | undefined> {
        return this.riders.find((rider) => rider.id === id);
    }

    async updateBalance(id: string, balance: number): Promise<void> {
        const rider = this.riders.find((r) => r.id === id);
        if (rider) rider.balance = balance;
    }

    async addLoyaltyPoint(id: string): Promise<void> {
        const rider = this.riders.find((r) => r.id === id);
        if (rider) rider.loyaltyPoints = (rider.loyaltyPoints ?? 0) + 1;
    }
}

class InMemoryBlockedDriverRepository {
    async isBlocked(): Promise<boolean> {
        return false;
    }
}

describe("Estimate API", () => {
    let rides: InMemoryRideRepository;
    let clock: TestClock;
    let server: ReturnType<typeof createApp>;

    beforeEach(() => {
        rides = new InMemoryRideRepository();
        clock = new TestClock();
        const riders = new InMemoryRiderRepository();
        const estimates = new InMemoryEstimateRepository();
        const bookRide = new BookRideUsecase(rides as never, riders as never, new InMemoryBlockedDriverRepository() as never, inMemoryTransaction(rides, riders) as never);

        server = createApp(
            bookRide,
            new CancelRideUsecase(rides as never, riders as never, clock),
            new GetRideHistoryUsecase(rides as never),
            new EstimateRideUsecase(
                new StubScanTrip() as never,
                new CalculatePriceUsecase(clock),
                riders as never,
                estimates as never,
                clock,
            ),
            new BookRideFromEstimateUsecase(estimates as never, bookRide, clock),
        );
    });

    async function estimate() {
        return request(server).post("/rides/estimate").send({
            riderId: "rider-1",
            from: "Tour Eiffel",
            to: "Louvre",
        });
    }

    it("POST /rides/estimate returns 200 with the price, the token and expiresAt", async () => {
        const response = await estimate();

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            price: 7,
            token: "token-1",
            expiresAt: "2023-06-15T12:05:00.000Z",
        });
    });

    it("POST /rides/estimate without from/to returns 400", async () => {
        const response = await request(server).post("/rides/estimate").send({ riderId: "rider-1" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "from and to are required" });
    });

    it("POST /rides/book with a valid token returns 201 and creates the ride", async () => {
        const { body } = await estimate();

        const response = await request(server).post("/rides/book").send({ token: body.token });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ id: "ride-1", riderId: "rider-1", status: "PENDING" });
        expect(rides.rides).toHaveLength(1);
    });

    it("POST /rides/book with an expired token returns 410", async () => {
        const { body } = await estimate();
        clock.advanceMinutes(6);

        const response = await request(server).post("/rides/book").send({ token: body.token });

        expect(response.status).toBe(410);
        expect(response.body).toEqual({ error: "Estimate expired" });
        expect(rides.rides).toHaveLength(0);
    });

    it("POST /rides/book with an invalid token returns 404", async () => {
        const response = await request(server).post("/rides/book").send({ token: "unknown" });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Estimate not found" });
    });

    it("POST /rides/book with an already used token returns 409", async () => {
        const { body } = await estimate();
        await request(server).post("/rides/book").send({ token: body.token });

        const response = await request(server).post("/rides/book").send({ token: body.token });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "Estimate already used" });
    });

    it("books a ride whose price matches the estimated price", async () => {
        const { body } = await estimate();

        const response = await request(server).post("/rides/book").send({ token: body.token });

        expect(response.body.price).toBe(body.price);
        expect(rides.rides[0].price).toBe(7);
    });
});
