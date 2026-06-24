# Orbit

Orbit is a minimal 3D satellite tracker for Thailand spacecraft, built by Spaceth. It lets you see where Thai satellites are above Earth in a visual, interactive, and easy-to-understand way, without needing to open any specialized tracking software.

The site does not “guess” where a satellite is. Instead, it uses real orbital data called **TLE**, then calculates where each satellite should be at the current moment.

## What is TLE?

**TLE** stands for **Two-Line Element**. It is a compact text format that describes a satellite’s orbit using two lines of data.

At first glance, a TLE may look like a strange block of numbers from the Cold War era. But inside, it contains important orbital information, such as the satellite’s inclination, orbital speed, orbital shape, and the exact time that data refers to.

In simple terms, a TLE is like a “latest snapshot” of a satellite’s orbit. From that snapshot, we can use a mathematical model to calculate where the satellite should be a few minutes later, a few hours later, or even at a previous point in time.

Orbit does not store satellite positions as pre-made points. It downloads the latest TLE, then calculates the satellite’s real-time position in the browser.

## How does the site know where a satellite is?

After Orbit gets a TLE, it uses an orbital model called **SGP4** to calculate the satellite’s position.

SGP4 is a long-standing standard model used with TLE data. Think of it as a classic orbital calculator that is still widely used in satellite tracking today.

This project uses **satellite.js**, a JavaScript library that can read TLE data and calculate satellite positions using SGP4.

The process looks roughly like this:

1. The site downloads TLE data for each satellite.
2. satellite.js reads the TLE and turns it into an orbital model.
3. SGP4 calculates the satellite’s position at the current time.
4. The system converts that position into latitude, longitude, altitude, and a 3D position on the globe.
5. The site renders that position as a dot and orbit trail on the 3D Earth.

So, TLE is the starting data, SGP4 is the calculation method, and satellite.js is the tool that makes them usable on the web.

## Where does the TLE data come from?

Orbit gets TLE data through an API from:

**tle.ivanstanojevic.me**

However, the site does not let users fetch TLE data for any object they want. Orbit uses an internal API only for Thai satellites included in the project’s satellite list.

On the server side, there is a route that fetches TLE data by NORAD ID, such as THEOS-2, KnackSat-2, THEOS, or Thaicom. Before fetching anything, the system checks whether that NORAD ID is in the allowed list.

This is done so the API does not become an open proxy that anyone can use to fetch random data. It also helps keep the satellite list easy to control.

TLE data is cached for about 1 hour. Satellite orbits do not change every second like stock prices, so caching helps the site load faster and avoids unnecessary API calls.

## Fallback TLE

If the live TLE API is unavailable, Orbit falls back to a bundled copy of TLE data stored in the project at `src/data/tle-fallback.json`.

The fallback works at two levels:

1. **Server** — the `/api/tle/[id]` route tries the live API first. If that fails, it returns the bundled TLE for that satellite.
2. **Browser** — if a request to the API route still fails, the client uses the same bundled data so tracking can continue offline or during outages.

The globe and satellite list keep working with fallback data. An error with a **Try again** button appears only when both the live API and the bundled fallback are unavailable.

To refresh the fallback file from the same API (recommended about once a week):

```bash
npm run update-tle-fallback
```

This re-fetches TLEs for every satellite in the project’s registry and updates `src/data/tle-fallback.json`.

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

Orbit also supports Light Mode and Dark Mode. The interface and the 3D scene share the same theme system, so the UI and globe stay visually consistent.

## Satellites currently tracked

Orbit starts with Thai satellites that have NORAD IDs and available TLE data, including:

| Satellite  | NORAD ID | Type              |
| ---------- | -------: | ----------------- |
| THEOS-2    |    58016 | Earth Observation |
| KnackSat-2 |    67683 | Education         |
| THEOS      |    33396 | Earth Observation |
| Thaicom 4  |    28786 | Communication     |
| Thaicom 6  |    39500 | Communication     |
| Thaicom 7  |    40141 | Communication     |
| Thaicom 8  |    41552 | Communication     |
| Napa-2     |    48963 | Military          |

This list can be updated from the main satellite data file. Once a NORAD ID and basic metadata are added, the API and UI will follow automatically.

## Tech stack

Orbit is built with **Next.js**, **React**, **TypeScript**, **Three.js**, **React Three Fiber**, **satellite.js**, and **Tailwind CSS**.

For orbital calculation, it uses satellite.js to read TLE data and propagate satellite positions with SGP4.

For the 3D view, it uses Three.js and React Three Fiber.

For data fetching, it uses a Next.js API Route to fetch and cache TLE data.

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

In short, Orbit is a small web project that connects raw orbital data with a visual 3D experience. It takes something that normally lives inside a dry TLE file and turns it into an interactive globe, so anyone can see where Thai satellites are flying above Earth.
