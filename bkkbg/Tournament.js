let tournamentGenerated = false;

function generateTournament(selectedPlayers) {
    let tournamentType = document.getElementById('tournamentType').value;
    switch (tournamentType) {
        case 'Round Robin':
            generateRoundRobins(selectedPlayers);
            highlightTodaysMatches();
            break;
        case 'Double Elimination':
            generateDoubleElimination(selectedPlayers);
            resolveDoubleEliminationByes();
            highlightTodaysMatches();
            break;
        default:
            alert(tournamentType + ' tournament type is currently not supported!');
            return;
    }
}

function generateDoubleElimination(selectedPlayers) {
    const today = new Date().toISOString().slice(0, 10);
    const byTournamentDirector = 'by ' + document.getElementById('yourName').value.trim();
    let html = `<p id="today" style="text-align: center">${today} ${byTournamentDirector}</p>\n`;

    const numPlayers = selectedPlayers.length;

    if (numPlayers < 4 || numPlayers > 16) {
        alert('Invalid number of players for Double Elimination!\nMust be between 4 and 16.');
        return;
    }

    const numPlayersAndByes = numPlayers <= 8 ? 8 : 16;
    if (numPlayers <= 8)
        html += make8PlayersDoubleElimination();
    else
        html += make16PlayersDoubleElimination();

    const players = [...selectedPlayers].sort(() => generator.random() - 0.5);
    // fill in the players
    let i = 0;
    while (i < numPlayers) {
        html = html.replace(`Player~${i + 1}~`, players[i]);
        i++;
    }
    // fill the rest with Byes
    while (i < numPlayersAndByes) {
        html = html.replace(`Player~${i + 1}~`, 'Bye');
        i++;
    }

    document.getElementById('tournament').innerHTML = html;
    document.getElementById('tournamentSummary').innerHTML = '';
    tournamentGenerated = true;
}

function generateRoundRobins(selectedPlayers) {
    let maximumPlayers = document.getElementById('maximumTournamentPlayers').value;
    if (isNaN(maximumPlayers) || maximumPlayers < 3) {
        alert('Invalid maximum players per group!\nNot a number or less than 3.');
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const byTournamentDirector = 'by ' + document.getElementById('yourName').value.trim();
    let html = `<p id="today" style="text-align: center">${today} ${byTournamentDirector}</p>\n`;
    
    const players = [...selectedPlayers].sort(() => generator.random() - 0.5);
    let tournamentPlayer = players.length;

    let groups = Math.floor(tournamentPlayer / maximumPlayers);
    if (groups * maximumPlayers < tournamentPlayer) groups += 1;

    let groupPlayers = Math.ceil(tournamentPlayer / groups);

    // read matchLengths input and create array of lengths (one per group)
    const matchLengthsInput = document.getElementById('matchLengths').value.trim();
    const matchLengths = matchLengthsInput ? matchLengthsInput.split(/\s+/).map(s => {
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : s;
    }) : [];

    let start = 0;
    let remainingPlayers = tournamentPlayer;
    let remainingGroups = groups;
    for (let group = 1; group < groups + 1; group++) {
        let end = start + groupPlayers;
        if (group === groups) end = tournamentPlayer + 1; 
        const idx = group - 1;
        const length = matchLengths[idx] !== undefined ? matchLengths[idx] : '';
        html += generateRoundRobinTournament(group, players.slice(start, end), length);

        start += groupPlayers;

        remainingPlayers -= groupPlayers;
        remainingGroups -= 1;
        groupPlayers = Math.ceil(remainingPlayers / remainingGroups);
    }

    document.getElementById('tournament').innerHTML = html;
    document.getElementById('tournamentSummary').innerHTML = '';
    tournamentGenerated = true;
}

function generateRoundRobinTournament(groupName, selectedPlayers, length) {
    const rounds = [];
    const players = [...selectedPlayers].sort(() => generator.random() - 0.5);
    if (players.length % 2 !== 0) {
        players.push('Bye');
    }
    const numRounds = players.length - 1;
    const half = players.length / 2;

    for (let round = 0; round < numRounds; round++) {
        const matches = [];
        for (let i = 0; i < half; i++) {
            const home = players[i];
            const away = players[players.length - 1 - i];
            if (home !== 'Bye' && away !== 'Bye') {
                matches.push(`${home} <-> ${away}`);
            }
        }
        rounds.push(matches);
        // Rotate players except the first one
        players.splice(1, 0, players.pop());
    }

    // generate the HTML for the tournament
    let html = `<h5>Round Robin ${groupName} - ${length} points</h5>\n`;
    rounds.forEach((matches, i) => {
        html += `<p>\n`;
        matches.forEach(match => {
            html += `${match}<br>\n`;
        });
        html += `</p>\n`;
    });

    return html;
}

function generateRankingTable(winCounts) {
    // Convert to array and sort by wins descending
    const sorted = Object.entries(winCounts)
        .sort((a, b) => b[1] - a[1]);

    let ranking = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
        const [name, wins] = sorted[i];
        // If not the first, and previous wins are same, keep the same rank
        if (i > 0 && sorted[i][1] === sorted[i - 1][1]) {
            ranking.push({ rank: currentRank, name, wins });
        } else {
            currentRank = i + 1;
            ranking.push({ rank: currentRank, name, wins });
        }
    }

    // Build the ranking table
    let rankingTable = '|Rank|   |Wins|\n|:---:|:---:|:---:|\n';
    ranking.forEach(row => {
        rankingTable += `|${row.rank}|${row.name}|${row.wins}|\n`;
    });

    return rankingTable;
}

function generateTournamentSummary() {
    const tournamentDiv = document.getElementById('tournament');
    const summaryDiv = document.getElementById('tournamentSummary');
    if (!tournamentDiv || !summaryDiv) return;

    const lines = tournamentDiv.innerText.split('\n');
    let winCounts = {};

    let roundRobinSummary = '### Tournament Summary\n\n';
    let roundRobin = 0;
    lines.forEach(line => {
        if(line.match(/Round Robin/)) {
            if (Object.keys(winCounts).length > 0) {
                roundRobinSummary += `\n##### Round Robin ${roundRobin}\n\n`;
                roundRobinSummary += generateRankingTable(winCounts);
                winCounts = {};
            }
            roundRobin++;
        }
        const match = line.match(/^\s*(.+?)\s*<\s*(\d+)\s*>\s*(.+)\s*$/);
        if (match) {
            const length = match[2].trim();

            if (length !== '0') { // ignore Byes
                const winner = match[1].trim();
                const loser = match[3].trim();
                winCounts[winner] = (winCounts[winner] || 0) + 1;
                winCounts[loser] = winCounts[loser] || 0;
            }
        }
    });
    if (Object.keys(winCounts).length > 0) {
        roundRobinSummary += generateRankingTable(winCounts);
    }

    summaryDiv.innerHTML = marked.parse(roundRobinSummary);
}

var todaysMatches = [];
// Get todays matches
function highlightTodaysMatches() {
    const tournamentDiv = document.getElementById('tournament');
    const tournamentLines = tournamentDiv.innerHTML.split('\n');
    for (var i = 0; i < todaysMatches.length; i++) {
        if (todaysMatches[i].length > 0) {
            const matchInfo = todaysMatches[i].split('|');
            const winner = matchInfo[2];
            const loser = matchInfo[3];
            const matchLength = matchInfo[4];

            const roundRobinMatchRegex = new RegExp(`\\b(${winner}|${loser}) &lt;-&gt; (${winner}|${loser})\\b`, 'i');
            const doubleEliminationMatchRegex = new RegExp(`\\b(${winner}|${loser}) #(\\d+)# (${winner}|${loser})\\b`, 'i');

            for (var j = 0; j < tournamentLines.length; j++) {
                if (tournamentLines[j][0] === '<') continue; // skip HTML tags - info and completed matches
                
                if (tournamentLines[j].match(roundRobinMatchRegex)) { // Round Robin match
                    tournamentLines[j] = tournamentLines[j].replace(
                        roundRobinMatchRegex,
                        `<span style="color: green;">${winner}</span> < ${matchLength} > <span style="color: red;">${loser}</span>`
                    );
                    break; // Exit the inner loop once a match is found and replaced
                }
                else if (tournamentLines[j].match(doubleEliminationMatchRegex)) { // Double Elimination match
                    const matchNumber = tournamentLines[j].match(doubleEliminationMatchRegex)[2]; // Get the match number
                    tournamentLines[j] = tournamentLines[j].replace(
                        doubleEliminationMatchRegex,
                        `<span style="color: green;">${winner}</span> < ${matchLength} > <span style="color: red;">${loser}</span>`
                    );

                    i = 0; // start from the beginning again to replace all references

                    // Replace Loser and Winner references in the rest of the tournament
                    const winnerRegex = new RegExp(`Winner~${matchNumber}~`, 'g');
                    const loserRegex = new RegExp(`Loser~${matchNumber}~`, 'g');
                    for (let k = 0; k < tournamentLines.length; k++) { 
                        if (tournamentLines[k][0] === '<') continue; // skip HTML tags - info and completed matches
                        tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                        tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                    }
                    break; // Exit the inner loop once a match is found and replaced
                }

            }
        }
    }

    html = tournamentLines.join('\n');
    tournamentDiv.innerHTML = html;
}

function resolveDoubleEliminationByes() {
    const tournamentDiv = document.getElementById('tournament');
    const tournamentLines = tournamentDiv.innerHTML.split('\n');
    // fix the Byes
    const doubleEliminationMatchRegex = new RegExp(`\\b(.+) #(\\d+)# (.+)\\b`, 'i');
    for (var j = 0; j < tournamentLines.length; j++) {
        if (tournamentLines[j].includes('Bye')) {
            if (tournamentLines[j].match(doubleEliminationMatchRegex)) {
                const playerA = tournamentLines[j].match(doubleEliminationMatchRegex)[1]; // Get player A
                const matchNumber = tournamentLines[j].match(doubleEliminationMatchRegex)[2]; // Get the match number
                let playerB = tournamentLines[j].match(doubleEliminationMatchRegex)[3]; // Get player B
                playerB = playerB.slice(0, -3);
                const winner = playerA === 'Bye' ? playerB : playerA;
                const loser = 'Bye';

                tournamentLines[j] = tournamentLines[j].replace(
                    doubleEliminationMatchRegex,
                    `<span style="color: green;">${winner}</span> < 0 > <span style="color: gray;">${loser}</span><br`
                );

                const winnerRegex = new RegExp(`Winner~${matchNumber}~`, 'g');
                const loserRegex = new RegExp(`Loser~${matchNumber}~`, 'g');
                for (let k = 0; k < tournamentLines.length; k++) { 
                    tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                    tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                }
            }
        }
    }
    html = tournamentLines.join('\n');
    tournamentDiv.innerHTML = html;
}

function make8PlayersDoubleElimination() {
    let html = '<h5>Double Elimination</h5>\n';
    // Main Bracket
    html += '<h5>Main - 5 points</h5>\n';
    html += `<p>\n`;
    html += `Player~1~ #1# Player~8~<br>\n`;
    html += `Player~4~ #2# Player~5~<br>\n`;
    html += `Player~3~ #3# Player~6~<br>\n`;
    html += `Player~2~ #4# Player~7~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~1~ #7# Winner~2~<br>\n`;
    html += `Winner~3~ #8# Winner~4~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~7~ #11# Winner~8~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += '<h5>Consolation - 3 points</h5>\n';
    html += `<p>\n`;
    html += `Loser~1~ #5# Loser~2~<br>\n`;
    html += `Loser~3~ #6# Loser~4~<br>\n`;
    html += `</p><p>\n`;
    html += `Loser~8~ #9# Winner~5~<br>\n`;
    html += `Loser~7~ #10# Winner~6~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~9~ #12# Winner~10~<br>\n`;
    html += `</p><p>\n`;
    html += `Loser~11~ #13# Winner~12~<br>\n`;
    html += `</p>\n`;
    // Final
    html += '<h5>Final - 5 points</h5>\n';
    html += `<p>\n`;
    html += `Winner~11~ #14# Winner~13~<br>\n`;
    html += `</p>\n`;
    return html;
}

function make16PlayersDoubleElimination() {
    let html = '<h5>Double Elimination</h5>\n';
    // Main Bracket
    html += '<h5>Main - 5 points</h5>\n';
    html += `<p>\n`;
    html += `Player~1~ #1# Player~16~<br>\n`;
    html += `Player~8~ #2# Player~9~<br>\n`;
    html += `Player~4~ #3# Player~13~<br>\n`;
    html += `Player~12~ #4# Player~5~<br>\n`;
    html += `Player~2~ #5# Player~15~<br>\n`;
    html += `Player~10~ #6# Player~7~<br>\n`;
    html += `Player~3~ #7# Player~14~<br>\n`;
    html += `Player~11~ #8# Player~6~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~1~ #13# Winner~2~<br>\n`;
    html += `Winner~3~ #14# Winner~4~<br>\n`;
    html += `Winner~5~ #15# Winner~6~<br>\n`;
    html += `Winner~7~ #16# Winner~8~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~13~ #21# Winner~14~<br>\n`;
    html += `Winner~15~ #22# Winner~16~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~21~ #25# Winner~22~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += '<h5>Consolation - 3 points</h5>\n';
    html += `<p>\n`;
    html += `Loser~1~ #9# Loser~2~<br>\n`;
    html += `Loser~3~ #10# Loser~4~<br>\n`;
    html += `Loser~5~ #11# Loser~6~<br>\n`;
    html += `Loser~7~ #12# Loser~8~<br>\n`;
    html += `</p><p>\n`;
    html += `Loser~16~ #17# Winner~9~<br>\n`;
    html += `Loser~15~ #18# Winner~10~<br>\n`;
    html += `Loser~14~ #19# Winner~11~<br>\n`;
    html += `Loser~13~ #20# Winner~12~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~17~ #23# Winner~18~<br>\n`;
    html += `Winner~19~ #24# Winner~20~<br>\n`;
    html += `</p><p>\n`;
    html += `Loser~22~ #26# Winner~23~<br>\n`;
    html += `Winner~24~ #27# Loser~21~<br>\n`;
    html += `</p><p>\n`;
    html += `Winner~26~ #28# Winner~27~<br>\n`;
    html += `</p><p>\n`;
    html += `Loser~27~ #29# Winner~28~<br>\n`;
    html += `</p>\n`;
    // Final
    html += '<h5>Final - 5 points</h5>\n';
    html += `<p>\n`;
    html += `Winner~25~ #30# Winner~29~<br>\n`;
    html += `</p>\n`;
    return html;
}

// Start a new tournament after the Start button is clicked
document.getElementById('tournamentManagement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!tournamentGenerated) {
        alert('Generate the tournament first!\nWarning: Do that only if you are sure you want to overwrite the existing tournament!!!');
        return;
    }
    uploadTournament();
});

// Finish the tournament after Finish button is clicked
document.getElementById('finishTournamentButton').addEventListener('click', function () {
    if (tournamentGenerated) {
        alert('Cannot finish a generated tournament!');
        return;
    }
    uploadTournament();
});

async function uploadTournament() {
    // Remove blue background spans before uploading
    let tournamentDiv = document.createElement('div');
    tournamentDiv.innerHTML = document.getElementById('tournament').innerHTML;
    // Remove all <span style="background-color: blue;">...</span>
    tournamentDiv.querySelectorAll('span[style="background-color: blue;"]').forEach(span => {
        span.replaceWith(document.createTextNode(span.textContent));
    });

    let tournamentHTML = tournamentDiv.innerHTML;

    const repoName = document.getElementById('clubSelection').value;

    await refreshRunsStatus();
    setSubmissionStatus(`Uploading tournament...`);
    setRunsInfo('Hold on a sec...');
    previousRunID = latestRunID;
    if ( latestRunStatus === 'Submitting' || latestRunStatus === 'Queued' || latestRunStatus === 'In Progress') {
        setSubmissionStatus('Another submission in progress.\nTry again in a few seconds...');
        anotherSubmissionActive = true;
        document.getElementById("submit").disabled = true;
        document.getElementById("startTournamentButton").disabled = true;
        document.getElementById("finishTournamentButton").disabled = true;
    }
    else try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({ 
                event_type: 'start_tournament', 
                client_payload: { 
                    tournament_html: `${tournamentHTML}`,
                } 
            })
        });

        newSubmission = true;
        document.getElementById("submit").disabled = true;
        document.getElementById("startTournamentButton").disabled = true;
        document.getElementById("finishTournamentButton").disabled = true;
    } 
    catch (error) { 
        // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
        alert('Error uploading the tournament: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
    }
}

// Fetch the last tournament
function fetchLastTournament() {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/Tournament.html?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(window.atob( data.content ));
            document.getElementById('tournament').innerHTML = fileContent.replace(/\\n/g, '\n');
            getTodaysMatches(matchRecords);
            highlightTodaysMatches();
            highlightYourNameInTournament();
            generateTournamentSummary();
        } else {
            console.log('Failed to fetch Last Tournament!');
        }
    })
    .catch(error => console.error('Error:', error));
}

function highlightYourNameInTournament() {
    const yourName = document.getElementById('yourName').value.trim();
    const tournamentDiv = document.getElementById('tournament');
    if (!tournamentDiv || !yourName) {
        tournamentGenerated = false;
        return;
    }

    // Use regex to match yourName as a whole word, case-insensitive
    const regex = new RegExp(`\\b(${yourName})\\b`, 'gi');
    tournamentDiv.innerHTML = tournamentDiv.innerHTML.replace(
        regex,
        `<span style="background-color: blue;">${yourName}</span>`
    );
    tournamentGenerated = false;
}

// Get todays matches
function getTodaysMatches(matchRecords) {
    const today = new Date().toISOString().slice(0, 10);
    todaysMatches = [];
    for (var i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            const matchLength = matchInfo[4];
            if (matchDate === today) {
                if (matchLength > 4) todaysMatches.push(matchRecords[i]); // try to get rid of short matches played before the tournament
            }
            else {
                break; // since the list is in reverse chronological order, we can stop once we reach a different date
            }
        }
    }
    todaysMatches.reverse(); // reverse to maintain original order
}

// Linear Congruential Generator (LCG) for pseudo-random number generation
class LCG {
    constructor(seed) {
        this.seed = seed;
        // Optimal parameters for a 32-bit LCG (from Numerical Recipes)
        this.m = Math.pow(2, 31); // Modulus
        this.a = 1103515245;      // Multiplier
        this.c = 12345;           // Increment
    }

    // Generates the next pseudo-random integer
    next() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed;
    }

    // Generates a pseudo-random float between 0 (inclusive) and 1 (exclusive)
    random() {
        return this.next() / this.m;
    }

    // Generates a pseudo-random integer within a specified range [min, max]
    randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}

const generator = new LCG(Date.now()); // Initialize with current time as seed

// Example usage:
// console.log("Next pseudo-random integer:", generator.next());
// console.log("Pseudo-random float (0-1):", generator.random());
// console.log("Pseudo-random integer (1-10):", generator.randomInt(1, 10));

// Fisher-Yates Shuffle using the LCG
function fisherYatesShuffle(arr) {
    let n = arr.length;
    for (let i = n - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr;
}

// Example usage
// let array = [1, 2, 3, 4, 5];
// let shuffledArray = fisherYatesShuffle(array);
// console.log(shuffledArray);
