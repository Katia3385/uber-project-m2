import knex from "knex";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../app/get-ride-history.usecase";
import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";
import { BlockedDriverRepository } from "../infra/blocked-driver.repository";
import { SystemClock } from "../infra/system-clock";
import { BookingTransaction } from "../infra/booking-transaction";
import { EstimateRepository } from "../infra/estimate.repository";
import { createGoogleDistanceScanner } from "../infra/google-distance-scanner";
import { ScanTripUsecase } from "../app/scan-trip.usecase";
import { CalculatePriceUsecase } from "../app/calculate-price.usecase";
import { EstimateRideUsecase } from "../app/estimate-ride.usecase";
import { BookRideFromEstimateUsecase } from "../app/book-ride-from-estimate.usecase";
import knexConfig from "../../setup-integration-tests/knexfile";
import { createApp } from "./app";

// 5433 est déjà pris par un autre PostgreSQL, dont le mot de passe n'est pas celui du projet.
const db = knex({
    ...knexConfig.test,
    connection: {
        host: "127.0.0.1",
        port: Number(process.env.DB_PORT ?? 5436),
        user: "postgres",
        password: "secret",
        database: "uber_test",
    },
});
const rideRepository = new RideRepository(db);
const riderRepository = new RiderRepository(db);
const blockedDriverRepository = new BlockedDriverRepository(db);

const clock = new SystemClock();
const estimateRepository = new EstimateRepository(db);
const bookRide = new BookRideUsecase(rideRepository, riderRepository, blockedDriverRepository, new BookingTransaction(db));

const app = createApp(
    bookRide,
    new CancelRideUsecase(rideRepository, riderRepository, clock),
    new GetRideHistoryUsecase(rideRepository),
    new EstimateRideUsecase(
        new ScanTripUsecase(createGoogleDistanceScanner()),
        new CalculatePriceUsecase(clock),
        riderRepository,
        estimateRepository,
        clock,
    ),
    new BookRideFromEstimateUsecase(estimateRepository, bookRide, clock),
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`API listening on ${port}`);
});
