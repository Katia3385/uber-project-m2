import { AddressType, Client } from "@googlemaps/google-maps-services-js";
import { DistanceScanner } from "../domain/distance-scanner";

const ROUTES_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

type RouteHttp = {
    post(url: string, init: { headers: Record<string, string>; body: string }): Promise<{
        ok: boolean;
        json(): Promise<unknown>;
    }>;
};

const routesHttp: RouteHttp = {
    post(url, init) {
        return fetch(url, { method: "POST", headers: init.headers, body: init.body });
    },
};

export class GoogleDistanceScanner implements DistanceScanner {
    private client: Client;
    private apiKey: string;
    private http: RouteHttp;

    constructor(client: Client, apiKey: string, http: RouteHttp = routesHttp) {
        this.client = client;
        this.apiKey = apiKey;
        this.http = http;
    }

    async distanceKm(origin: string, destination: string): Promise<number> {
        // Distance Matrix (Legacy) est refusée sur un projet récent. Routes API la remplace.
        const response = await this.http.post(ROUTES_MATRIX_URL, {
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": this.apiKey,
                "X-Goog-FieldMask": "distanceMeters,condition",
            },
            body: JSON.stringify({
                origins: [{ waypoint: { address: origin } }],
                destinations: [{ waypoint: { address: destination } }],
                travelMode: "DRIVE",
            }),
        });

        const data: unknown = await response.json();
        const row = Array.isArray(data) ? data[0] : data;
        const meters = row && typeof row === "object" && "distanceMeters" in row
            ? row.distanceMeters
            : undefined;
        if (!response.ok || typeof meters !== "number") {
            const message = row && typeof row === "object" && "error" in row
                ? (row.error as { message?: string } | undefined)?.message
                : undefined;
            throw new Error(message ?? "Google distance not found");
        }

        return meters / 1000;
    }

    async cityOf(address: string): Promise<string> {
        const response = await this.client.geocode({
            params: {
                address,
                key: this.apiKey,
            },
        });

        const components = response.data.results[0]?.address_components ?? [];
        const city = components.find((component) => component.types.includes(AddressType.locality));
        if (!city) {
            throw new Error("Google city not found");
        }

        return city.long_name;
    }
}

export function createGoogleDistanceScanner(): GoogleDistanceScanner {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_MAPS_API_KEY is missing");
    }

    return new GoogleDistanceScanner(new Client(), apiKey);
}
