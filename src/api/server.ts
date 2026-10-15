import knex from "knex";
import { BookRideUsecase } from "../app/book-ride.usecase";
import { CancelRideUsecase } from "../app/cancel-ride.usecase";
import { GetRideHistoryUsecase } from "../app/get-ride-history.usecase";
import { RideRepository } from "../infra/ride.repository";
import { RiderRepository } from "../infra/rider.repository";
import { SystemClock } from "../infra/system-clock";
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

const app = createApp(
    new BookRideUsecase(rideRepository, riderRepository),
    new CancelRideUsecase(rideRepository, riderRepository, new SystemClock()),
    new GetRideHistoryUsecase(rideRepository),
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`API listening on ${port}`);
});
