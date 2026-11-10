# Orbit

Orbit is a 3D satellite tracker for Thailand’s spacecraft, built by Spaceth. It shows where those satellites are above Earth, in the browser, without a separate tracking program.

The site starts from a real orbit snapshot called an **OMM**, then calculates where each satellite should be at the time on the clock.

## Why OMM instead of TLE?

A **TLE** (Two-Line Element set) is that same snapshot written as two fixed lines of numbers, like an old paper form where every box has a set width. The public catalog number, the **NORAD ID**, only had room for five digits on that form.

CelesTrak has said those five-digit numbers ran out. From **2026-07-11**, when the satellite Saramago was added, newly cataloged objects get **6-digit** numbers (100000 and up). Their orbit data is no longer published as a TLE. The notice is [A New Way to Obtain GP Data](https://celestrak.org/NORAD/documentation/gp-data-formats.php).

An **OMM** (Orbit Mean-Elements Message) is the same snapshot with a label on every number, usually as JSON. The catalog number can grow, and the calculator stays the same: **SGP4**. CelesTrak calls this family of data **GP** (general perturbations). OMM is the labeled way to write a GP snapshot.

## What is an OMM?

Think of an OMM as a snapshot of a satellite’s orbit, taken at one moment. The snapshot is not a list of future positions. It is the shape of the path, plus where the satellite was along that path when the snapshot was taken.

From that snapshot, a calculator can run the orbit forward or backward: a few minutes from now, tomorrow, or earlier today. Orbit downloads the latest snapshot and does that calculation in the browser. The **Download OMM** button on a satellite saves the record the site is using.

### What a record looks like

CelesTrak sends one JSON object per satellite. This is a real THEOS-2 record from 7 September 2026, shortened to the fields Orbit reads. Live numbers change. The labels do not.

```json
{
  "OBJECT_NAME": "THEOS-2 (T2V)",
  "OBJECT_ID": "2023-155A",
  "EPOCH": "2026-09-07T21:46:27.062688",
  "MEAN_MOTION": 14.81706045,
  "ECCENTRICITY": 0.00015312,
  "INCLINATION": 97.881,
  "RA_OF_ASC_NODE": 320.6123,
  "ARG_OF_PERICENTER": 90.3925,
  "MEAN_ANOMALY": 269.7463,
  "BSTAR": 0.000067931,
  "MEAN_MOTION_DOT": 0.00000483,
  "MEAN_MOTION_DDOT": 0,
  "NORAD_CAT_ID": 58016,
  "REV_AT_EPOCH": 15767,
  "CLASSIFICATION_TYPE": "U",
  "ELEMENT_SET_NO": 999,
  "EPHEMERIS_TYPE": 0
}
```

The bundled copy in `src/data/omm-fallback.json` is the same record with shorter names (`meanMotion`, `inclination`, and so on).

### How to read it

**OBJECT_NAME** and **NORAD_CAT_ID** are the name and the catalog number. `58016` is THEOS-2’s card number in the public catalog. **OBJECT_ID** `2023-155A` is the international designator: launched in 2023, the 155th launch of that year, piece A of that launch.

**EPOCH** is the time on the snapshot. Every other number describes the orbit at that instant. SGP4 then carries the snapshot to “now,” or to whatever time the timeline is showing.

**MEAN_MOTION** `14.817` is how many laps the satellite makes in one day. Divide 24 hours by that number and the lap is about 97 minutes. A satellite close to Earth laps quickly. One that seems to hang over one spot on Earth laps about once a day.

**ECCENTRICITY** `0.00015` says how stretched the oval is. Zero is a perfect circle. This orbit is almost round, like a coin that is only slightly out of round. The closest and farthest points are nearly the same height.

**INCLINATION** `97.881` degrees is the tilt of that oval against the equator. Zero would fly along the equator and never see the poles. Ninety would pass over the poles. A little past ninety, like this, is the usual tilt for an Earth-watching satellite: each lap crosses almost every latitude, and the tilt is chosen so the sunlight on the ground looks similar from one pass to the next.

**RA_OF_ASC_NODE** `320.6123` degrees says which way the tilted oval is turned. Picture a hoop stood almost upright around the Earth. This number spins the hoop until the place where the satellite crosses the equator going north lines up with that direction.

**ARG_OF_PERICENTER** `90.3925` degrees says where, along the oval, the closest point to Earth sits. **MEAN_ANOMALY** `269.7463` degrees says how far around the lap the satellite was when the snapshot was taken. Zero means “at the closest point.” 180 means “at the farthest.” 270 means about three quarters of the way around, which is where THEOS-2 was in this snapshot.

**BSTAR** stands in for air drag. A few hundred kilometers up there is still a thin trace of air, and it slowly tugs on the satellite. **MEAN_MOTION_DOT** says how the lap rate is changing because of that tug. **MEAN_MOTION_DDOT** is a finer correction and is usually zero.

**REV_AT_EPOCH** `15767` is the lap count on the snapshot: THEOS-2 had gone around Earth that many times.

**CLASSIFICATION_TYPE** `U` means unclassified. **EPHEMERIS_TYPE** `0` means “use the usual SGP4 calculator.” **ELEMENT_SET_NO** is which update of the file this is.

## How the site gets a position from that snapshot

**SGP4** takes the snapshot and a time, and estimates where the satellite should be. The air, the Sun, and the Moon keep nudging the real satellite, so a snapshot from today stays close and a snapshot from months ago has drifted. That is why Orbit prefers a fresh OMM and keeps a spare copy for when the network fails.

**satellite.js** is the JavaScript library that reads the JSON and runs SGP4.

1. The site downloads an OMM for each satellite.
2. satellite.js turns that record into an orbit model.
3. SGP4 estimates the position at the time on the clock.
4. Orbit turns that position into latitude, longitude, height, speed, and a point in the 3D scene.
5. The point is drawn on the Earth, with a line for the path.

OMM is the snapshot. SGP4 is the calculator. satellite.js runs that calculator in the browser.

## Where the OMM comes from

Orbit loads GP data from **[CelesTrak](https://celestrak.org/)** (`gp.php`, JSON, looked up by NORAD ID).

The server route is `/api/omm/[id]`. It only fetches IDs that are in the project’s satellite list, so the route stays limited to those spacecraft. A fresh record is kept for about an hour. An orbit snapshot is still useful an hour later, and the cache keeps the page from asking CelesTrak on every visit.

If CelesTrak is unreachable, Orbit uses the copy in `src/data/omm-fallback.json`.

1. The server tries CelesTrak first, then returns the bundled record for that satellite.
2. If the browser cannot reach the server route, it uses the same bundled record, so the globe can keep moving offline.

An error with **Try again** appears when both the live record and the bundled copy are missing. To refresh the bundled file from CelesTrak, about once a week:

```bash
npm run update-omm-fallback
```

## The 3D Earth

The globe is drawn with **Three.js**, through **React Three Fiber**. Three.js is the tool that puts 3D shapes on a web page. React Three Fiber lets those shapes live inside the React interface, the same way the panels and buttons do.

The land comes from Natural Earth: coastlines as a shape, ocean as the sphere under them, with no country borders. Small islands are left out so the globe loads quickly. A selected satellite brings the camera in. Leaving it returns the camera to the whole Earth.

## Ground view

Space view looks down at Earth. Ground view is the other camera, next to the language switch: you stand on the surface and look up.

Picture standing outside with a camera. Overhead is up, compass north is north, and your right hand points east. The view opens facing north, a little above the horizon. Dragging grabs the sky, so the stars stay under the pointer. The scroll wheel widens or narrows the view. Under the horizon, the ground is a plain sphere. The land shape stays in Space view.

Choosing a listed place, or **My location**, in Space view turns the globe so that point is in the center. Dragging the globe lets you look around again.

A selected satellite uses the same SGP4 position as in Space view. The camera turns toward it and keeps it centered as the clock moves. Dragging the sky lets go. Selecting the satellite again takes hold again. The time control moves the sky, the Moon, the satellites, and the trails together, like scrubbing one video.

### Where you stand

The location box starts closed. Places are grouped in `src/data/cities.json`:

| Group | Places |
| --- | --- |
| City | Bangkok, Los Angeles (Griffith Observatory), London (Greenwich), Tokyo (National Astronomical Observatory of Japan), Hawaii (Keck Observatory), Canaveral (Vehicle Assembly Building) |
| NARIT | Princess Sirindhorn AstroPark, Thai National Telescope, Thai National Radio Telescope, Nakhon Ratchasima, Songkhla, Khon Kaen, Chachoengsao |
| GISTDA | Space Krenovation Park |
| Dark Sky Area | Pailin Astro Park, Dara Cuisine Phuket |
| Commercial | NB Space |

**My location** asks the browser where you are. Latitude and longitude you type stay in this browser.

### Where the sky comes from

The stars are the ones a person can see on a clear dark night, down to magnitude 6. Magnitude is the old brightness scale: smaller numbers are brighter, and 6 is about the faintest the eye can pick out without a telescope. The catalog is **XHIP**, the Extended Hipparcos Compilation (Anderson & Francis, 2012), as published in Olaf Frohn’s [d3-celestial](https://github.com/ofrohn/d3-celestial). Constellation lines are the IAU figures, with Frohn’s line adjustments, from the same project. Orbit keeps a compact copy in `src/data/skymap.json`.

Each star is stored as right ascension and declination, which are longitude and latitude on the sky, drawn for the year 2000. Each frame, satellite.js supplies Greenwich sidereal time — star time, which runs a little faster than a wall clock because of how the Earth orbits the Sun — and turns that map into the same Earth-fixed frame the satellites already use. The sky and the satellites then share one clock.

The Moon is a simpler geocentric position in `src/lib/moon.ts`, already in that Earth-fixed frame, so it shows in both views.

## What you can do

Several Thai satellites can be on the globe at once. Select one for its position, height, speed, mission, launch date, and operator. Hide the ones you want out of the way.

The timeline scrubs about three days behind and ahead of now, and can play faster than real time. Pass prediction lists the next three days from the place you picked: date, rise time, highest elevation, and how long the satellite stays up. Choosing a pass jumps the clock to the rise. The count reads T− before the satellite climbs above the horizon and T+ after, with the compass direction as it rises and as it sets. A satellite that never sets says it is always above you. The list can be saved as CSV.

**My Satellites**, stored only in this browser, tracks any catalog object from a NORAD ID or a TLE, with the same OMM feed. You can rename it, and click a NORAD ID to copy it.

A path such as `/theos-2` opens that satellite. The address then stays on `/`, so picking another satellite does not reload the globe.

## Satellites currently tracked

Orbit starts with Thai satellites that have a NORAD ID and an OMM:

| Satellite         | NORAD ID | Type              |
| ----------------- | -------: | ----------------- |
| THEOS-2           |    58016 | Earth Observation |
| GISTDA CubeSat-1  |   100471 | Earth Observation |
| KnackSat-2        |    67683 | Education         |
| THEOS             |    33396 | Earth Observation |
| Thaicom 4         |    28786 | Communication     |
| Thaicom 6         |    39500 | Communication     |
| Thaicom 7         |    40141 | Communication     |
| Thaicom 8         |    41552 | Communication     |

### Changelog

- **2026-11-10** — Add ground places: Los Angeles at Griffith Observatory, London at Greenwich, Tokyo at the National Astronomical Observatory of Japan, Hawaii at Keck Observatory, and Canaveral at the Vehicle Assembly Building, plus Dara Cuisine Phuket under Dark Sky Area and a Commercial group with NB Space. Choosing a place or My location in Space view turns the globe so that point is centered. See **Ground view**.
- **2026-11-09** — The location control stays available in Space view, and the chosen place is marked on the globe. Pass prediction uses SGP4 for the next 3 days from that place. Choosing a pass jumps the simulation to the rise. The list can be saved as CSV, and the OMM record can be downloaded beside the prediction button.
- **2026-11-08** — Add a Ground view next to the language switch. The camera stands at a listed place, the browser location, or typed coordinates, and keeps a selected satellite centered until the sky is dragged. Stars to magnitude 6 come from XHIP, and the constellation lines are the IAU figures from d3-celestial. See **Ground view**.
- **2026-11-07** — Add My Satellites, stored only in this browser. Enter a NORAD ID or a TLE to track any catalog object, rename it, and click a NORAD ID to copy it.
- **2026-10-19** — Simplify the interface. Time controls start closed, on desktop and on a phone. In Orbit can collapse.
- **2026-10-06** — Draw Earth from a simplified land shape instead of a country texture, so coastlines stay clear when zoomed in and the globe loads faster.
- **2026-09-10** — GISTDA’s site, on 10 September 2026, confirmed GISTDA CubeSat-1 (Cube-1). Tracking stays on NORAD ID **100471**.
- **2026-09-08** — GISTDA CubeSat-1 NORAD ID updated from **100466** (`2026-195B` / OBJECT B) to **100471** (`2026-195G` / OBJECT G), matching the public catalog for that launch.

### Legacy

Satellites whose main mission has ended are under **Legacy**, for reference. They are left off the globe. The detail view shows launch info and an **End of Mission** date.

| Satellite  | NORAD ID | Type                     |
| ---------- | -------: | ------------------------ |
| KnackSat-1 |    43761 | Education                |
| Napa-1     |    46320 | Military                 |
| BCCSat-1   |    48041 | Education                |
| Napa-2     |    48963 | Military                 |
| LogSat-2   |    62689 | Technology Demonstration |

Update these lists in `src/data/satellites.ts` and `src/data/legacy-satellites.ts`.

## Data sources

These are the sources behind the globe, the sky, and the satellite list. A license is named when the publisher states one.

**[CelesTrak](https://celestrak.org/)** supplies the GP orbit snapshots, as OMM JSON, and the bundled copy in `src/data/omm-fallback.json` comes from the same feed. CelesTrak does not publish a named data license. Its stated aim is to keep the data freely available, and reuse follows the [usage policy](https://celestrak.org/usage-policy.php): download only the records you need, and not more often than the data is updated.

**[Natural Earth](https://www.naturalearthdata.com/)** 1:10m land, through the [world-atlas](https://github.com/topojson/world-atlas) file `land-10m.json`, is the coastline mesh in `public/data/land-mesh.bin`. Natural Earth is in the **public domain**. [Terms of use](https://www.naturalearthdata.com/about/terms-of-use/). Credit is not required.

**XHIP**, the Extended Hipparcos Compilation (Anderson & Francis, 2012, VizieR [V/137D](https://cdsarc.cds.unistra.fr/viz-bin/cat/V/137D)), supplies the stars to magnitude 6. Orbit uses the copy published in [d3-celestial](https://github.com/ofrohn/d3-celestial) as `stars.6.json`, kept in `src/data/skymap.json`. [VizieR](https://vizier.cds.unistra.fr/viz-bin/cite/J/A+A/612/A1) says catalogue data are free to use in a scientific context when the original authors and the paper are cited. Cite Anderson, E. & Francis, C. 2012, Astronomy Letters, 38, 331. The d3-celestial project that packages the file is **BSD-3-Clause**.

**IAU constellation figures**, with line adjustments by Olaf Frohn, supply the constellation lines in the same `src/data/skymap.json`. The copy is d3-celestial’s `constellations.lines.json`, from the [IAU constellation page](https://www.iau.org/public/themes/constellations/). That page does not state a separate data license. The d3-celestial packaging is **BSD-3-Clause**.

The **Moon** is not a downloaded catalog. `src/lib/moon.ts` computes a low-precision position from published formulas in the style of Jean Meeus, *Astronomical Algorithms*. The book is copyrighted. Orbit ships the calculation, not an ephemeris file.

The **place list** in `src/data/cities.json` is compiled for Orbit from the published coordinates of those sites. **My location** uses the position the browser reports. The **satellite registry**, including the Thai and English descriptions, is written for Orbit in `src/data/satellites.ts`, `src/data/legacy-satellites.ts`, `src/data/future-satellites.ts`, and `src/data/satellite-i18n.ts`.

## Tech stack

**Next.js** is the site framework: the pages, and the server route that fetches OMM data. **React** is the interface. **TypeScript** is the language. **Three.js** and **React Three Fiber** draw the globe. **satellite.js** runs SGP4. **Tailwind CSS** styles the panels.

## Run it

```bash
npm install
npm run dev
```

For production:

```bash
npm run build
npm run start
```

Orbit takes a labeled orbit snapshot and turns it into a globe you can turn, scrub, and stand on, so anyone can see where Thai satellites are above Earth.
