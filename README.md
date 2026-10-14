# Stories 7, 8 et 9

## Story 7 — Scanner Google

La distance ne se calcule plus à la main. Un scanner interroge Google : combien de kilomètres entre deux adresses, et dans quelle ville se trouve chacune. Le prix reste celui des stories précédentes.

« Tour Eiffel, Paris » vers « Louvre, Paris » a donné 3,577 km, les deux adresses dans Paris. Le prix est alors 2 € + 3,577 × 0,50 €.

La ville passe par `@googlemaps/google-maps-services-js`. La distance passe par Routes API, parce que Google refuse l’ancienne Distance Matrix sur un projet récent. Les mètres renvoyés sont divisés par 1 000. La clé est lue dans `GOOGLE_MAPS_API_KEY`. Le fichier `.env` qui la contient est ignoré par git. `.env.example` ne garde que le nom de la variable.

Les tests unitaires utilisent un faux scanner. Ils n’appellent pas Google.

### Dans le code

`DistanceScanner` ne décrit que le besoin du métier. Le use case dépend de cette interface, pas de la classe Google.

```ts
export interface DistanceScanner {
    distanceKm(origin: string, destination: string): Promise<number>;
    cityOf(address: string): Promise<string>;
}
```

Pourquoi : un test peut passer un faux scanner et vérifier le prix sans réseau ni clé. Le jour où Google change d’URL, seul `GoogleDistanceScanner` bouge.

`ScanTripUsecase` traduit la ville en zone. Seule la comparaison `"paris"` décide de `isInsideParis`.

```ts
return {
    distanceKm,
    from: { address: origin, isInsideParis: this.isParis(fromCity) },
    to: { address: destination, isInsideParis: this.isParis(toCity) },
};
```

Pourquoi : le calcul du prix connaît déjà `isInsideParis`. Il n’a pas à savoir ce qu’est une ville Google.

La distance n’utilise pas l’ancienne Distance Matrix. Google la refuse sur un projet récent, donc l’appel part vers Routes API. Les mètres deviennent des kilomètres.

```ts
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
return meters / 1000;
```

Pourquoi `http` est un paramètre du constructeur : le test remplace `post` par un objet qui renvoie `2500` mètres et vérifie que le résultat vaut `2.5`, sans sortir du processus.

La ville reste sur le client du package demandé par l’énoncé. On ne garde que le composant `locality`.

```ts
const city = components.find((component) =>
    component.types.includes(AddressType.locality)
);
return city.long_name;
```

La clé n’est pas écrite dans le code. `createGoogleDistanceScanner` s’arrête si elle manque.

```ts
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing");
}
```

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/domain/distance-scanner.ts` | Le contrat : `distanceKm` et `cityOf`. Le reste du code dépend de ça, pas de Google. |
| `src/app/scan-trip.usecase.ts` | Appelle le scanner, puis met `isInsideParis` à vrai seulement si la ville est Paris. |
| `src/infra/google-distance-scanner.ts` | La vraie implémentation : geocoding pour la ville, Routes API pour la distance. |
| `.env` | La clé API. Ignoré par git. |
| `.env.example` | Le nom de la variable, sans la clé. |
| `test/unit/scan-trip.usecase.test.ts` | Faux scanner : Tour Eiffel vers Lyon, 10 km, Paris vers l’extérieur, prix 15 €. |
| `test/unit/google-distance-scanner.test.ts` | Faux Google : 2 500 m deviennent 2,5 km, la ville lue est Paris, et sans clé le démarrage est refusé. |

## Story 8 — API HTTP

Réserver, annuler et consulter l’historique s’appellent par HTTP. Un client envoie une requête, l’API renvoie le résultat du use case.

| Route | Use case | Résultat |
|---|---|---|
| `POST /rides` | `BookRideUsecase` | 201 et la course enregistrée, avec son id |
| `POST /rides/:rideId/cancel` | `CancelRideUsecase` | 200, `{ status: "CANCELLED", penalty }` |
| `GET /riders/:riderId/rides` | `GetRideHistoryUsecase` | 200 et les courses de ce rider, avec le nom du driver |

`GET /` liste ces trois adresses. Une course ou un rider inconnu renvoie 404. Une course déjà annulée renvoie 409.

`npm start` écoute le port 3000. La base est `uber_test` sur le port 5436 : .

Les tests de bout en bout appellent les trois routes avec Supertest. Les courses restent en mémoire, sans PostgreSQL ni Google. Ils vérifient la réservation, l’historique avec le driver, l’annulation à 5 € quand le driver est en chemin, et le 404 si la course n’existe pas.

### Dans le code

`createApp` reçoit les use cases. La route ne contient pas la règle, elle appelle `execute`.

```ts
export function createApp(
    bookRide: BookRideUsecase,
    cancelRide: CancelRideUsecase,
    rideHistory: GetRideHistoryUsecase,
) {
```

Pourquoi : le test e2e construit les mêmes use cases avec des dépôts en mémoire. Il vérifie le HTTP sans démarrer PostgreSQL. `server.ts` est le seul fichier qui ouvre Knex, sur le port 5436.

Réserver envoie le corps tel quel et répond 201, le code d’une ressource créée.

```ts
app.post("/rides", async (req, res, next) => {
    try {
        const ride = await bookRide.execute(req.body);
        res.status(201).json(ride);
    } catch (error) {
        next(error);
    }
});
```

Annuler lit l’id dans l’URL et le rider dans le corps. `String(...)` évite un paramètre tableau qu’Express peut renvoyer.

```ts
const result = await cancelRide.execute(
    String(req.body.riderId),
    String(req.params.rideId),
);
res.status(200).json(result);
```

Le use case lève une erreur avec un message précis. Le middleware du bas choisit le statut HTTP à partir de ce message, pour que chaque route n’ait pas son propre `if`.

```ts
const status = message === "Ride not found" || message === "Rider not found"
    ? 404
    : message === "Ride already cancelled"
        ? 409
        : 500;
res.status(status).json({ error: message });
```

Pourquoi 409 pour une course déjà annulée : la course existe, mais l’action n’est plus acceptable. 404 est réservé à une course ou un rider absent.

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/api/app.ts` | Construit Express et branche chaque route sur un use case. Les use cases sont reçus en paramètre. |
| `src/api/server.ts` | Démarre l’API, crée les dépôts Knex et leur passe les trois use cases. |
| `test/e2e/rides.e2e-spec.ts` | Réservation, historique, annulation et course inconnue, à travers HTTP. |

## Story 9 — Heures de pointe

Entre 8 h et 9 h, et entre 18 h et 20 h, le prix total augmente de 50 %. L'heure de début est comprise, l'heure de fin ne l'est pas : 8 h 30 et 19 h comptent, 9 h et 20 h ne comptent pas.

Cette hausse s'ajoute aux autres tarifs. Noël double d'abord le trajet, UberX ajoute ensuite 5 €, puis les heures de pointe multiplient ce total par 1,5. Exemple : 7 € le 25 décembre à 8 h 30 en UberX fait (7 × 2 + 5) × 1,5 = 28,50 €.

L'heure vient de l'horloge déjà injectée dans `CalculatePriceUsecase`. Les tests fixent cette heure avec `FakeClock`, sans dépendre de l'heure réelle.

### Dans le code

L’horloge est reçue dans le constructeur. Le use case n’appelle pas `new Date()`.

```ts
constructor(clock: Clock) {
    this.clock = clock;
}
const today = this.clock.now();
```

Pourquoi : le test fixe `new Date("2023-06-15T08:30:00")` dans un `FakeClock`. À 2 h du matin le lendemain, le même test attend encore 10,50 €.

Les trois majorations s’écrivent l’une après l’autre sur `totalPrice`. Les heures de pointe sont en dernier.

```ts
if (today.getMonth() === 11 && today.getDate() === 25) {
    totalPrice = totalPrice * 2;
}
if (isUberX && !isBirthday) {
    totalPrice += 5;
}
if (this.isPeakHour(today)) {
    totalPrice = totalPrice * 1.5;
}
```

Pourquoi cet ordre : « +50 % sur le prix total » et « cumulable ». Le `× 1,5` voit déjà le double de Noël et les 5 € UberX. Pour 7 € le 25 décembre à 8 h 30 en UberX : `(7 × 2 + 5) × 1,5 = 28,50`.

La plage se lit sur l’heure locale. 8 h est dedans, 9 h est dehors. Même chose de 18 h à 20 h.

```ts
private isPeakHour(date: Date): boolean {
    const hour = date.getHours();
    return (hour >= 8 && hour < 9) || (hour >= 18 && hour < 20);
}
```

Pourquoi `< 9` et `< 20` : « entre 8 h et 9 h » est l’heure qui commence à 8 h. À 9 h 00 pile, la pointe du matin est finie.

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/app/calculate-price.usecase.ts` | Multiplie le total par 1,5 pendant les deux plages. |
| `test/unit/calculate-price.usecase.test.ts` | 8 h 30 et 19 h valent 10,50 €. Noël et UberX se cumulent à 28,50 €. |
