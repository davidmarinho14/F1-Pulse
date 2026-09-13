const API_BASE = "https://api.jolpi.ca/ergast/f1";

const seasonSelect = document.getElementById("season");
const loadSeasonButton = document.getElementById("load-season");

const driversList = document.getElementById("drivers-list");
const constructorsList = document.getElementById("constructors-list");
const racesList = document.getElementById("races-list");

const currentRound = document.getElementById("current-round");
const driverCount = document.getElementById("driver-count");
const currentSeason = document.getElementById("current-season");

const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");

const driverSearch = document.getElementById("driver-search");
const searchDriverButton = document.getElementById("search-driver");
const driverResult = document.getElementById("driver-result");

let currentDrivers = [];


/* =========================
   API REQUEST
========================= */

async function fetchAPI(endpoint) {
    const response = await fetch(`${API_BASE}/${endpoint}`);

    if (!response.ok) {
        throw new Error("Erro ao consultar a API.");
    }

    return response.json();
}


/* =========================
   LOAD SEASON
========================= */

async function loadSeason() {
    const season = seasonSelect.value;

    hideError();

    currentSeason.textContent = season;

    driversList.innerHTML = '<div class="loading">Loading drivers...</div>';
    constructorsList.innerHTML = '<div class="loading">Loading teams...</div>';
    racesList.innerHTML = '<div class="loading">Loading races...</div>';

    try {
        const [driversData, constructorsData, racesData] = await Promise.all([
            fetchAPI(`${season}/driverstandings/`),
            fetchAPI(`${season}/constructorstandings/`),
            fetchAPI(`${season}/races/`)
        ]);

        const driversStandings =
            driversData.MRData.StandingsTable.StandingsLists[0];

        const drivers =
            driversStandings.DriverStandings || [];

        const constructorsStandings =
            constructorsData.MRData.StandingsTable.StandingsLists[0];

        const constructors =
            constructorsStandings.ConstructorStandings || [];

        const races =
            racesData.MRData.RaceTable.Races || [];

        currentDrivers = drivers;

        currentRound.textContent =
            driversStandings.round || "--";

        driverCount.textContent =
            drivers.length;

        renderDrivers(drivers);
        renderConstructors(constructors);
        renderRaces(races);

    } catch (error) {
        console.error(error);

        showError();

        driversList.innerHTML = "";
        constructorsList.innerHTML = "";
        racesList.innerHTML = "";
    }
}


/* =========================
   DRIVERS
========================= */

function renderDrivers(drivers) {
    if (drivers.length === 0) {
        driversList.innerHTML =
            '<div class="loading">No drivers found.</div>';

        return;
    }

    driversList.innerHTML = drivers.map(driver => {

        const name =
            `${driver.Driver.givenName} ${driver.Driver.familyName}`;

        const team =
            driver.Constructors?.[0]?.name || "Unknown team";

        return `
            <div class="driver-card position-${driver.position}">

                <div class="driver-position">
                    ${driver.position}
                </div>

                <div>
                    <div class="driver-name">
                        ${name}
                    </div>

                    <div class="driver-team">
                        ${team}
                    </div>
                </div>

                <div class="driver-team">
                    ${driver.Driver.nationality}
                </div>

                <div class="driver-points">
                    ${driver.points} PTS
                </div>

            </div>
        `;
    }).join("");
}


/* =========================
   CONSTRUCTORS
========================= */

function renderConstructors(constructors) {
    if (constructors.length === 0) {
        constructorsList.innerHTML =
            '<div class="loading">No teams found.</div>';

        return;
    }

    constructorsList.innerHTML = constructors.map(team => {

        return `
            <div class="constructor-card">

                <div>
                    <div class="constructor-name">
                        ${team.position}. ${team.Constructor.name}
                    </div>

                    <div class="driver-team">
                        ${team.Constructor.nationality}
                    </div>
                </div>

                <div class="constructor-points">
                    ${team.points} PTS
                </div>

            </div>
        `;
    }).join("");
}


/* =========================
   RACES
========================= */

function renderRaces(races) {
    if (races.length === 0) {
        racesList.innerHTML =
            '<div class="loading">No races found.</div>';

        return;
    }

    racesList.innerHTML = races.map(race => {

        const date = new Date(race.date);

        const formattedDate =
            date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        return `
            <div class="race-card">

                <div class="race-round">
                    ROUND ${race.round}
                </div>

                <div class="race-name">
                    ${race.raceName}
                </div>

                <div class="race-date">
                    ${formattedDate}
                </div>

            </div>
        `;
    }).join("");
}


/* =========================
   DRIVER SEARCH
========================= */

async function searchDriver() {

    const search = driverSearch.value.trim().toLowerCase();

    if (!search) {
        driverResult.innerHTML = "";
        return;
    }

    const driver = currentDrivers.find(driver => {

        const fullName =
            `${driver.Driver.givenName} ${driver.Driver.familyName}`
            .toLowerCase();

        return fullName.includes(search);
    });

    if (!driver) {
        driverResult.innerHTML = `
            <div class="search-result-card">
                <h3>Driver not found</h3>
                <p>
                    Try searching for a driver from the current championship.
                </p>
            </div>
        `;

        return;
    }

    try {

        const season = seasonSelect.value;
        const driverId = driver.Driver.driverId;

        const data = await fetchAPI(
            `${season}/drivers/${driverId}/driverstandings/`
        );

        const standings =
            data.MRData.StandingsTable.StandingsLists[0];

        const result =
            standings.DriverStandings[0];

        const name =
            `${result.Driver.givenName} ${result.Driver.familyName}`;

        const team =
            result.Constructors?.[0]?.name || "Unknown team";

        driverResult.innerHTML = `
            <div class="search-result-card">

                <h3>${name}</h3>

                <p>
                    Team: ${team}
                </p>

                <p>
                    Nationality: ${result.Driver.nationality}
                </p>

                <p>
                    Championship position:
                    ${result.position}
                </p>

                <p>
                    Points:
                    ${result.points}
                </p>

                <p>
                    Wins:
                    ${result.wins}
                </p>

            </div>
        `;

    } catch (error) {

        console.error(error);

        driverResult.innerHTML = `
            <div class="search-result-card">
                <h3>Search error</h3>
                <p>
                    We couldn't retrieve this driver's information.
                </p>
            </div>
        `;
    }
}


/* =========================
   ERROR HANDLING
========================= */

function showError() {
    errorMessage.classList.remove("hidden");
}

function hideError() {
    errorMessage.classList.add("hidden");
}


/* =========================
   EVENTS
========================= */

loadSeasonButton.addEventListener("click", loadSeason);

seasonSelect.addEventListener("change", loadSeason);

searchDriverButton.addEventListener("click", searchDriver);

driverSearch.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchDriver();
    }

});

retryButton.addEventListener("click", loadSeason);


/* =========================
   INITIAL LOAD
========================= */

loadSeason();