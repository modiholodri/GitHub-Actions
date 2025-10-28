// load the settings once the DOM is ready
document.addEventListener('DOMContentLoaded', loadSettings);

// Save the settings when the button is clicked
document.getElementById('saveSettingsButton').addEventListener('click', () => {
    saveSettings();
});

// Save settings to localStorage before the page is unloaded
window.addEventListener('beforeunload', saveSettings);

// load the toggle settings of a specific toggle element
function loadToggleSetting(elementName) {
    const toggleState = localStorage.getItem(elementName + 'State') || 'expanded';
    const element = document.getElementById(elementName);
    toggleState === 'expanded' ? element.classList.add('show') : element.classList.remove('show');
}

function loadCheckedSetting(elementName, defaultValue) {
    const checked = localStorage.getItem(elementName) || defaultValue;
    document.getElementById(elementName).checked = checked == 'true';
}

function loadValueSetting(elementName, defaultValue) {
    const value = localStorage.getItem(elementName) || defaultValue;
    document.getElementById(elementName).value = value;
}

// Load settings from localStorage
function loadSettings() {
    loadToggleSetting('matchReportForm');

    loadToggleSetting('tournamentManagement');

    // Tournament Management
    loadCheckedSetting('showPastMatches', 'true');
    loadCheckedSetting('showBeautiful', 'true');
    loadCheckedSetting('showFutureMatches', 'false');

    loadValueSetting('debugMode', '');
    loadValueSetting('tournamentType', 'Double Elimination');
    loadValueSetting('maximumTournamentPlayers', '7');
    loadValueSetting('matchLengths', '5 5 5 5 5');

    loadToggleSetting('ratingList');
    loadToggleSetting('rankingLists');

    // Ranking List Selection
    loadValueSetting('rankingListSelection', 'matchesPlayed');

    // Player Name Selection
    loadValueSetting('yourName', '');
    // Players List Selection (multi-select)
    // loaded after the Frequent Players have been fetched

    // Expand/Collapse the Player Name Selection depending on the Ranking List Selection
    const playerNameSelection = document.getElementById("playerNameSelection");
    playerNameSelection.style.display = rankingListSelection === "playerInfoPercent" || rankingListSelection === "playerInfoMatches" ? "flex" : "none";

    // Expand/Collapse the Replay section depending on the Ranking List Selection
    const replaySection = document.getElementById("replaySection");
    replaySection.style.display = rankingListSelection === "ratingList" ? "flex" : "none"; // Hide the element

    // Interval Selection
    loadValueSetting('intervalSelection', 'Daily');

    loadToggleSetting('rankingChart');
    loadToggleSetting('rankingSummary');
    loadToggleSetting('matchList');
    loadToggleSetting('importantInfo');

    // Club Selection
    const clubSelectionElement = document.getElementById('clubSelection');
    let clubSelection = localStorage.getItem('clubSelection');
    if (clubSelection === null) {
        clubSelection = (clubSelectionElement && clubSelectionElement.options && clubSelectionElement.options.length > 0)
            ? clubSelectionElement.options[0].value
            : '';
    }
    clubSelectionElement.value = clubSelection;
}

// save the settings of a toggle element to localStorage
function saveToggleSetting(elementName) {
    const matchReportFormCollapsed = document.getElementById(elementName).classList.contains('show') ? 'expanded' : 'collapsed';
    localStorage.setItem(elementName + 'State', matchReportFormCollapsed);
}

// save the value of a specific element to localStorage
function saveValueSetting(elementName) {
    const rankingListSelection = document.getElementById(elementName).value;
    localStorage.setItem(elementName, rankingListSelection);
}

// save the value of a specific element to localStorage
function saveCheckedSetting(elementName) {
    const checked = document.getElementById(elementName).checked;
    localStorage.setItem(elementName, checked);
}

// Save settings to localStorage
function saveSettings() {
    saveToggleSetting('matchReportForm');

    saveToggleSetting('tournamentManagement');
    
    saveCheckedSetting('showPastMatches');
    saveCheckedSetting('showBeautiful');
    saveCheckedSetting('showFutureMatches');

    saveValueSetting('debugMode');
    saveValueSetting('tournamentType');
    saveValueSetting('maximumTournamentPlayers')
    saveValueSetting('matchLengths');
    // Save selected players from multi-select with id 'playersList'
    const playersListEl = document.getElementById('playersList');
    if (playersListEl) {
        const selectedValues = Array.from(playersListEl.selectedOptions).map(opt => opt.value);
        localStorage.setItem('playersListSelection', JSON.stringify(selectedValues));
    }

    saveToggleSetting('ratingList');
    saveToggleSetting('rankingLists');

    saveValueSetting('rankingListSelection');
    saveValueSetting('yourName');
    saveValueSetting('intervalSelection');

    saveToggleSetting('rankingChart');
    saveToggleSetting('rankingSummary');
    saveToggleSetting('matchList');
    saveToggleSetting('importantInfo');

    saveValueSetting('clubSelection');
}