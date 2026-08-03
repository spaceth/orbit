# Orbit

Orbit is a minimal 3D satellite tracker for Thailand spacecraft, built by Spaceth. It lets you see where Thai satellites are above Earth in a visual, interactive, and easy-to-understand way, without needing to open any specialized tracking software.

The site does not “guess” where a satellite is. Instead, it uses real orbital data called **OMM**, then calculates where each satellite should be at the current moment.

## Why OMM instead of TLE?

Orbit previously used **TLE** (Two-Line Element) data. That format is hitting a hard limit: NORAD catalog numbers only fit in five digits, and CelesTrak has announced that those numbers have run out.

As of **2026-07-11**, with the addition of the satellite Saramago, newly cataloged objects receive **6-digit** catalog numbers (100000+). GP data for those objects is **not** available in the legacy TLE format. CelesTrak’s notice and guidance are here: [A New Way to Obtain GP Data](https://celestrak.org/NORAD/documentation/gp-data-formats.php).

Orbit therefore migrated to **OMM** (Orbit Mean-Elements Message) — a structured, future-proof GP format that still feeds the same **SGP4** model, so tracking can keep working as the catalog grows beyond five digits.

## What is OMM?

**OMM** stands for **Orbit Mean-Elements Message**. It is a CCSDS standard for exchanging the same kind of mean orbital elements that were traditionally distributed as Two-Line Element sets (TLE), in a structured, machine-readable JSON (or XML/KVN) format.

An OMM contains important orbital information such as the satellite’s inclination, mean motion, eccentricity, and the epoch that data refers to — plus drag terms used by SGP4.

In simple terms, an OMM is a “latest snapshot” of a satellite’s orbit. From that snapshot, we can use a mathematical model to calculate where the satellite should be a few minutes later, a few hours later, or even at a previous point in time.

Orbit does not store satellite positions as pre-made points. It downloads the latest OMM, then calculates the satellite’s real-time position in the browser.

## How does the site know where a satellite is?

After Orbit gets an OMM, it uses an orbital model called **SGP4** to calculate the satellite’s position.

SGP4 is a long-standing standard Simplified Perturbations model used with mean-element data (historically TLE, now also OMM). Think of it as a classic orbital calculator that is still widely used in satellite tracking today.

This project uses **satellite.js**, a JavaScript library that can read OMM JSON and calculate satellite positions using SGP4.

The process looks roughly like this:

1. The site downloads OMM data for each satellite.
2. satellite.js reads the OMM and turns it into an orbital model.
3. SGP4 calculates the satellite’s position at the current time.
4. The system converts that position into latitude, longitude, altitude, and a 3D position on the globe.
5. The site renders that position as a dot and orbit trail on the 3D Earth.

So, OMM is the starting data, SGP4 is the calculation method, and satellite.js is the tool that makes them usable on the web.

## Where does the OMM data come from?

Orbit gets OMM (GP) data from:

**[CelesTrak](https://celestrak.org/)** (`gp.php` JSON by NORAD catalog number)

However, the site does not let users fetch OMM data for any object they want. Orbit uses an internal API only for Thai satellites included in the project’s satellite list.

On the server side, there is a route that fetches OMM data by NORAD ID, such as THEOS-2, KnackSat-2, THEOS, or Thaicom. Before fetching anything, the system checks whether that NORAD ID is in the allowed list.

This is done so the API does not become an open proxy that anyone can use to fetch random data. It also helps keep the satellite list easy to control.

OMM data is cached for about 1 hour. Satellite orbits do not change every second like stock prices, so caching helps the site load faster and avoids unnecessary API calls.

## Fallback OMM

If the live CelesTrak fetch is unavailable, Orbit falls back to a bundled copy of OMM data stored in the project at `src/data/omm-fallback.json`.

The fallback works at two levels:

1. **Server** — the `/api/omm/[id]` route tries CelesTrak first. If that fails, it returns the bundled OMM for that satellite.
2. **Browser** — if a request to the API route still fails, the client uses the same bundled data so tracking can continue offline or during outages.

The globe and satellite list keep working with fallback data. An error with a **Try again** button appears only when both the live API and the bundled fallback are unavailable.

To refresh the fallback file from CelesTrak (recommended about once a week):

```bash
npm run update-omm-fallback
```

This re-fetches OMMs for every satellite in the project’s registry and updates `src/data/omm-fallback.json`.

## What powers the 3D view?

The 3D Earth and satellite visualization are built with **Three.js**, through **React Three Fiber**.

Three.js is a library for creating 3D graphics on the web. React Three Fiber makes it easier to use Three.js inside a React project.

In Orbit, these tools are used to render the 3D Earth, satellite dots, orbit trails, and camera movement.

The Earth in the scene is not just a plain sphere. It uses land data from Natural Earth, which is turned into a texture and wrapped around the globe. This gives the site a clean, minimal map of land and ocean that fits the overall visual style.

Satellite markers are designed to stay visible whether you zoom in or out. Their size is recalculated so they remain consistent on screen, instead of becoming too tiny when zoomed out or too large when zoomed in.

## What can Orbit do?

Orbit can show multiple Thai satellites at the same time on a 3D Earth. Users can select a satellite to see more details, including its position, altitude, velocity, mission information, launch date, and operator.

Users can also hide or show each satellite individually. This is useful when you only want to focus on certain spacecraft, or when the screen starts looking like someone dropped noodles all over the globe.

When a satellite is selected, the camera smoothly moves to focus on it. When it is deselected, the camera returns to the normal Earth view.

You can deep-link to a satellite with a path such as `/theos-2`. Orbit focuses that satellite, then keeps the address bar on `/` so switching satellites in the session does not remount the globe.

Orbit also supports Light Mode and Dark Mode. The interface and the 3D scene share the same theme system, so the UI and globe stay visually consistent.

## Satellites currently tracked

Orbit starts with Thai satellites that have NORAD IDs and available OMM data, including:

| Satellite  | NORAD ID | Type              |
| ---------- | -------: | ----------------- |
| THEOS-2    |    58016 | Earth Observation |
| KnackSat-2 |    67683 | Education         |
| THEOS      |    33396 | Earth Observation |
| Thaicom 4  |    28786 | Communication     |
| Thaicom 6  |    39500 | Communication     |
| Thaicom 7  |    40141 | Communication     |
| Thaicom 8  |    41552 | Communication     |

### Legacy

Satellites whose primary mission has ended are listed under **Legacy** for reference only. They are not tracked on the globe. The detail view shows launch info and an **End of Mission** date.

| Satellite  | NORAD ID | Type                     |
| ---------- | -------: | ------------------------ |
| KnackSat-1 |    43761 | Education                |
| Napa-1     |    46320 | Military                 |
| BCCSat-1   |    48041 | Education                |
| Napa-2     |    48963 | Military                 |
| LogSat-2   |    62689 | Technology Demonstration |

These lists can be updated from `src/data/satellites.ts` and `src/data/legacy-satellites.ts`.

## Tech stack

Orbit is built with **Next.js**, **React**, **TypeScript**, **Three.js**, **React Three Fiber**, **satellite.js**, and **Tailwind CSS**.

For orbital calculation, it uses satellite.js to read OMM JSON and propagate satellite positions with SGP4.

For the 3D view, it uses Three.js and React Three Fiber.

For data fetching, it uses a Next.js API Route to fetch and cache OMM data from CelesTrak.

For styling, it uses Tailwind CSS and shared theme tokens for Light Mode and Dark Mode.

## Deployment

Orbit is a Next.js project, so it can be run locally with the usual commands:

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
npm run start
```

In short, Orbit is a small web project that connects raw orbital data with a visual 3D experience. It takes structured OMM mean elements and turns them into an interactive globe, so anyone can see where Thai satellites are flying above Earth.
