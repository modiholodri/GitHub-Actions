let tournamentGenerated = false;

function generateRoundRobinTournament(selectedPlayers) {
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
                matches.push(`${home} vs ${away}`);
            }
        }
        rounds.push(matches);
        // Rotate players except the first one
        players.splice(1, 0, players.pop());
    }

    // generate the HTML for the tournament
    const today = new Date().toISOString().slice(0, 10);
    let html = `<h5>Tournament ${today}</h5>\n`;
    rounds.forEach((matches, i) => {
        html += `<p>\n`;
        matches.forEach(match => {
            html += `R${i + 1}: ${match}<br>\n`;
        });
        html += `</p>\n`;
    });

    document.getElementById('tournament').innerHTML = html;
    tournamentGenerated = true;
}

// Start a new tournament after Start Tournament button is clicked
document.getElementById('tournamentManagement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!tournamentGenerated) {
        alert('Generate the tournament first!\nWarning: Do that only if you are sure you want to overwrite the existing tournament!!!');
        return;
    }
    uploadTournament();
});

function generateRankingTable() {
    const tournamentDiv = document.getElementById('tournament');
    const summaryDiv = document.getElementById('tournamentSummary');
    if (!tournamentDiv || !summaryDiv) return;

    const lines = tournamentDiv.innerText.split('\n');
    const winCounts = {};

    lines.forEach(line => {
        const match = line.match(/R\d+:\s*(.+?)\s*->\s*(.+?)\s*\(\d+\)/);
        if (match) {
            const winner = match[1].trim();
            winCounts[winner] = (winCounts[winner] || 0) + 1;
            // Loser is match[2], but not needed for win count
        }
    });

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

    summaryDiv.innerHTML = marked.parse(rankingTable);;
}

async function uploadTournament() {
    // Tournament HTML
    let tournamentHTML = document.getElementById('tournament').innerHTML;

    alert('Starting a new tournament!\n' + tournamentHTML);
    
    const repoName = document.getElementById('clubSelection').value;

    await refreshRunsStatus();
    setSubmissionStatus(`Starting tournament...`);
    setRunsInfo('Hold on a sec...');
    previousRunID = latestRunID;
    if ( latestRunStatus === 'Submitting' || latestRunStatus === 'Queued' || latestRunStatus === 'In Progress') {
        setSubmissionStatus('Another submission in progress.\nTry again in a few seconds...');
        anotherSubmissionActive = true;
        // document.getElementById("start_tournament").disabled = true;
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
        // document.getElementById("submit").disabled = true;
    } 
    catch (error) { 
        // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
        alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
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
            generateRankingTable();
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
            const matchRegex = new RegExp(`\\b(${winner}|${loser}).+vs.+(${winner}|${loser})\\b`, 'i');
            for (var j = 0; j < tournamentLines.length; j++) {
                if (tournamentLines[j].match(matchRegex)) {
                    tournamentLines[j] = tournamentLines[j].replace(
                        matchRegex,
                        `<span style="color: green;">${winner}</span> -> <span style="color: red;">${loser}</span> (${matchLength})`
                    );
                    break; // Exit the inner loop once a match is found and replaced
                }
            }
        }
    }
    html = tournamentLines.join('\n');
    tournamentDiv.innerHTML = html;
}

// Get todays matches
function getTodaysMatches(matchRecords) {
    const today = new Date().toISOString().slice(0, 10);
    todaysMatches = [];
    for (var i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            const matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            if (matchDate === today) {
                todaysMatches.push(matchRecords[i]);
            }
            else {
                break; // since the list is in reverse chronological order, we can stop once we reach a different date
            }
        }
    }
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

// Example usage:
const generator = new LCG(Date.now()); // Initialize with current time as seed

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
