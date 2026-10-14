# Stories 7 et 8

## Story 7 — Scanner Google

La distance ne se calcule plus à la main. Un scanner interroge Google : combien de kilomètres entre deux adresses, et dans quelle ville se trouve chacune. Le prix reste celui des stories précédentes.

« Tour Eiffel, Paris » vers « Louvre, Paris » a donné 3,577 km, les deux adresses dans Paris. Le prix est alors 2 € + 3,577 × 0,50 €.

La ville passe par `@googlemaps/google-maps-services-js`. La distance passe par Routes API, parce que Google refuse l’ancienne Distance Matrix sur un projet récent. Les mètres renvoyés sont divisés par 1 000. La clé est lue dans `GOOGLE_MAPS_API_KEY`. Le fichier `.env` qui la contient est ignoré par git. `.env.example` ne garde que le nom de la variable.

Les tests unitaires utilisent un faux scanner. Ils n’appellent pas Google.

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

`npm start` écoute le port 3000. La base est `uber_test` sur le port 5436 : le port 5433 est déjà pris par un autre PostgreSQL.

Les tests de bout en bout appellent les trois routes avec Supertest. Les courses restent en mémoire, sans PostgreSQL ni Google. Ils vérifient la réservation, l’historique avec le driver, l’annulation à 5 € quand le driver est en chemin, et le 404 si la course n’existe pas.

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

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/app/calculate-price.usecase.ts` | Multiplie le total par 1,5 pendant les deux plages. |
| `test/unit/calculate-price.usecase.test.ts` | 8 h 30 et 19 h valent 10,50 €. Noël et UberX se cumulent à 28,50 €. |
