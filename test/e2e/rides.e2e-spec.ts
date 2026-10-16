import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../../src/app/get-ride-history.usecase";
import { Ride, Rider } from "../../src/domain/types";
import { Clock } from "../../src/domain/clock";
import { CalculatePriceUsecase } from "../../src/app/calculate-price.usecase";
import { EstimateRideUsecase } from "../../src/app/estimate-ride.usecase";
import { BookRideFromEstimateUsecase } from "../../src/app/book-ride-from-estimate.usecase";
import { InMemoryEstimateRepository, StubScanTrip, inMemoryTransaction } from "./support/estimate-fakes";

class FakeClock implements Clock {
    now(): Date {
        return new Date("2023-06-15");
    }
}

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
        return this.rides.find(
            (ride) => ride.riderId === riderId && ride.status === "PENDING" && !ride.driverId,
        );
    }

    async findHistoryByRiderId(riderId: string) {
        return this.rides
            .filter((ride) => ride.riderId === riderId)
            .map((ride) => ({
                rideId: ride.id,
                status: ride.status,
                price: ride.price,
                driverName: ride.driverId ? "Test Driver" : "Aucun driver",
            }));
    }
}

class InMemoryRiderRepository {
    riders: Rider[] = [];

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
    blocked: { riderId: string; driverId: string }[] = [];

    async isBlocked(riderId: string, driverId: string): Promise<boolean> {
        return this.blocked.some((b) => b.riderId === riderId && b.driverId === driverId);
    }
}

describe("Rides API", () => {
    let rides: InMemoryRideRepository;
    let riders: InMemoryRiderRepository;
    let blockedDrivers: InMemoryBlockedDriverRepository;

    beforeEach(() => {
        rides = new InMemoryRideRepository();
        riders = new InMemoryRiderRepository();
        blockedDrivers = new InMemoryBlockedDriverRepository();
        riders.riders.push({
            id: "rider-1",
            name: "Ada",
            balance: 100,
            birthday: "1990-01-01",
        });
    });

    function app() {
        const clock = new FakeClock();
        const estimates = new InMemoryEstimateRepository();
        const bookRide = new BookRideUsecase(rides as never, riders as never, blockedDrivers as never, inMemoryTransaction(rides, riders) as never);

        return createApp(
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
    }

    it("books a ride", async () => {
        const response = await request(app()).post("/rides").send({
            riderId: "rider-1",
            status: "PENDING",
            price: 15.5,
            penalty: 0,
            isDriverOnTheWay: false,
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            id: "ride-1",
            riderId: "rider-1",
            price: 15.5,
            status: "PENDING",
        });
    });

    it("returns 402 when the rider does not have enough funds", async () => {
        const response = await request(app()).post("/rides").send({
            riderId: "rider-1",
            status: "PENDING",
            price: 500,
            penalty: 0,
            isDriverOnTheWay: false,
        });

        expect(response.status).toBe(402);
        expect(response.body).toEqual({ error: "Insufficient funds" });
    });

    it("returns 404 when the rider who books does not exist", async () => {
        const response = await request(app()).post("/rides").send({
            riderId: "unknown",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false,
        });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Rider not found" });
    });

    it("returns 409 when a previous ride still has no driver", async () => {
        const booking = {
            riderId: "rider-1",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false,
        };
        const server = app();
        await request(server).post("/rides").send(booking);

        const response = await request(server).post("/rides").send(booking);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "Rider already has a pending ride" });
    });

    it("returns 403 when the rider booked with a driver they blocked", async () => {
        blockedDrivers.blocked.push({ riderId: "rider-1", driverId: "driver-1" });

        const response = await request(app()).post("/rides").send({
            riderId: "rider-1",
            driverId: "driver-1",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: false,
        });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({ error: "Driver is blocked" });
    });

    it("lists the rider history with the driver", async () => {
        await request(app()).post("/rides").send({
            riderId: "rider-1",
            driverId: "driver-1",
            status: "PENDING",
            price: 15.5,
            penalty: 0,
            isDriverOnTheWay: false,
        });

        const response = await request(app()).get("/riders/rider-1/rides");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                rideId: "ride-1",
                status: "PENDING",
                price: 15.5,
                driverName: "Test Driver",
            },
        ]);
    });

    it("cancels a ride and returns the penalty when the driver is on the way", async () => {
        await request(app()).post("/rides").send({
            riderId: "rider-1",
            status: "PENDING",
            price: 10,
            penalty: 0,
            isDriverOnTheWay: true,
        });

        const response = await request(app()).post("/rides/ride-1/cancel").send({
            riderId: "rider-1",
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "CANCELLED", penalty: 5 });
    });

    it("returns 404 when the ride to cancel does not exist", async () => {
        const response = await request(app()).post("/rides/missing/cancel").send({
            riderId: "rider-1",
        });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Ride not found" });
    });
});
