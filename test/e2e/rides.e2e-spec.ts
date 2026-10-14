import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/api/app";
import { BookRideUsecase } from "../../src/app/book-ride.usecase";
import { CancelRideUsecase } from "../../src/app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../../src/app/get-ride-history.usecase";
import { Ride, Rider } from "../../src/domain/types";

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
}

describe("Rides API", () => {
    let rides: InMemoryRideRepository;
    let riders: InMemoryRiderRepository;

    beforeEach(() => {
        rides = new InMemoryRideRepository();
        riders = new InMemoryRiderRepository();
        riders.riders.push({
            id: "rider-1",
            name: "Ada",
            balance: 100,
            birthday: "1990-01-01",
        });
    });

    function app() {
        return createApp(
            new BookRideUsecase(rides as never),
            new CancelRideUsecase(rides as never, riders as never),
            new GetRideHistoryUsecase(rides as never),
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
