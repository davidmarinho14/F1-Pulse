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
let loadedSeason = null;
let seasonRequest = 0;
let searchRequest = 0;
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));


/* =========================
   API REQUEST
========================= */

async function fetchAPI(endpoint) {
    const response = await fetch(`${API_BASE}/${endpoint}`, { signal: AbortSignal.timeout(15000) });

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
    const request = ++seasonRequest;
    ++searchRequest;
    loadedSeason = null;
    currentDrivers = [];
    driverResult.innerHTML = "";
    driverCount.textContent = "--";
    currentRound.textContent = "--";
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

        if (request !== seasonRequest) return;
        const driversStandings =
            driversData.MRData.StandingsTable.StandingsLists[0];

        const drivers =
            driversStandings?.DriverStandings || [];

        const constructorsStandings =
            constructorsData.MRData.StandingsTable.StandingsLists[0];

        const constructors =
            constructorsStandings?.ConstructorStandings || [];

        const races =
            racesData.MRData.RaceTable.Races || [];

        currentDrivers = drivers;
        loadedSeason = season;

        currentRound.textContent =
            driversStandings?.round || "--";

        driverCount.textContent =
            drivers.length;

        renderDrivers(drivers);
        renderConstructors(constructors);
        renderRaces(races);

    } catch (error) {
        if (request !== seasonRequest) return;
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
            <div class="driver-card position-${escapeHTML(driver.position)}">

                <div class="driver-position">
                    ${escapeHTML(driver.position)}
                </div>

                <div>
                    <div class="driver-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="driver-team">
                        ${escapeHTML(team)}
                    </div>
                </div>

                <div class="driver-team">
                    ${escapeHTML(driver.Driver.nationality)}
                </div>

                <div class="driver-points">
                    ${escapeHTML(driver.points)} PTS
                </div>
                <button class="favorite-button" data-save="${escapeHTML(driver.Driver.driverId)}">Salvar favorito</button>

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
                        ${escapeHTML(team.position)}. ${escapeHTML(team.Constructor.name)}
                    </div>

                    <div class="driver-team">
                        ${escapeHTML(team.Constructor.nationality)}
                    </div>
                </div>

                <div class="constructor-points">
                    ${escapeHTML(team.points)} PTS
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

        const date = new Date(race.date + "T12:00:00");

        const formattedDate =
            date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        return `
            <div class="race-card">

                <div class="race-round">
                    ROUND ${escapeHTML(race.round)}
                </div>

                <div class="race-name">
                    ${escapeHTML(race.raceName)}
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

    const search = driverSearch.value.trim().toLowerCase().slice(0, 100);
    const request = ++searchRequest;
    const season = seasonSelect.value;
    let found = false;

    if (!search) {
        driverResult.innerHTML = "";
        return;
    }

    if (loadedSeason !== season) {
        driverResult.textContent = "Carregue a temporada antes de buscar.";
        void recordSearch(search, season, false);
        return;
    }
    const driver = currentDrivers.find(driver => {

        const fullName =
            `${driver.Driver.givenName} ${driver.Driver.familyName}`
            .toLowerCase();

        return fullName.includes(search);
    });

    if (!driver) {
        void recordSearch(search, season, false);
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

        driverResult.textContent = "Buscando piloto...";
        const driverId = driver.Driver.driverId;

        const data = await fetchAPI(
            `${season}/drivers/${encodeURIComponent(driverId)}/driverstandings/`
        );

        if (request !== searchRequest) return;
        const standings =
            data.MRData.StandingsTable.StandingsLists[0];

        const result =
            standings?.DriverStandings?.[0];

        if (!result) throw new Error("Piloto sem classificação");
        found = true;
        const name =
            `${result.Driver.givenName} ${result.Driver.familyName}`;

        const team =
            result.Constructors?.[0]?.name || "Unknown team";

        driverResult.innerHTML = `
            <div class="search-result-card">

                <h3>${escapeHTML(name)}</h3>

                <p>
                    Team: ${escapeHTML(team)}
                </p>

                <p>
                    Nationality: ${escapeHTML(result.Driver.nationality)}
                </p>

                <p>
                    Championship position:
                    ${escapeHTML(result.position)}
                </p>

                <p>
                    Points:
                    ${escapeHTML(result.points)}
                </p>

                <p>
                    Wins:
                    ${escapeHTML(result.wins)}
                </p>
                <button class="favorite-button" data-save="${escapeHTML(result.Driver.driverId)}">Salvar favorito</button>

            </div>
        `;

    } catch (error) {
        if (request !== searchRequest) return;
        console.error(error);

        driverResult.innerHTML = `
            <div class="search-result-card">
                <h3>Search error</h3>
                <p>
                    We couldn't retrieve this driver's information.
                </p>
            </div>
        `;
    } finally {
        void recordSearch(search, season, found);
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