let tournamentGenerated = false;

let tournamentData = [];
let tournamentHTML = [];

function generateTournament(selectedPlayers) {
    let tournamentType = document.getElementById('tournamentType').value;
    switch (tournamentType) {
        case 'Round Robin':
            generateRoundRobins(selectedPlayers);
            highlightTodaysMatches();
            break;
        case 'Single Elimination':
            generateSingleElimination(selectedPlayers);
            resolveByes();
            highlightTodaysMatches();
            break;
        case 'Double Elimination':
            generateDoubleElimination(selectedPlayers);
            resolveByes();
            highlightTodaysMatches();
            break;
        default:
            alert(tournamentType + ' tournament type is currently not supported!');
            return;
    }
}

function tournamentInfo() {
    const today = new Date().toISOString().slice(0, 10);
    const byTournamentDirector = 'by ' + document.getElementById('yourName').value.trim();
    return `<p id="today" style="text-align: center">${today} ${byTournamentDirector}</p>\n`;
}

function generateSingleElimination(selectedPlayers) {
    const numPlayers = selectedPlayers.length;
    if (numPlayers < 3) {
        alert('Invalid number of players for Single Elimination!\nMust be at least 3.');
        return;
    }

    let html = tournamentInfo();

    const players = [...selectedPlayers].sort(() => generator.random() - 0.5);

    // Ensure the number of participants is a power of 2
    const rounds = Math.ceil(Math.log2(players.length));
    const totalSlots = Math.pow(2, rounds);
    const byes = totalSlots - players.length;

    // Add "BYE" placeholders for empty slots
    for (let i = 0; i < byes; i++) {
        players.push("Bye");
    }
    const length = document.getElementById('matchLengths').value.split(/\s+/)[0] || '5';

    html += `<h5>Single Elimination - ${length} points</h5>\n`;
    // populate the players in the first round
    let matchNumber = 1;
    let matchesPlayed = [];
    const half = players.length / 2;
    html += `<p>\n`;
    for (let i = 0; i < half; i++ ) {
        html += `${players[i]} #${matchNumber}# ${players[players.length - 1 - i]}<br>\n`;
        matchesPlayed.push(matchNumber++);
    }
    html += `</p>\n`;

    // generate the rest of the rounds
    while ( matchesPlayed.length > 1 ) {
        let matchesPlayedLastRound = matchesPlayed;
        matchesPlayed = [];
        html += `<p>\n`;
        for (let i = 0; i < matchesPlayedLastRound.length; i += 2 ) {
            html += `~W${matchesPlayedLastRound[i]}~ _${matchNumber}_ ~W${matchesPlayedLastRound[i+1] || 'Bye'}~<br>\n`;
            matchesPlayed.push(matchNumber++);
        }
        html += `</p>\n`;
    }

    // fill in the players
    let i = 0;
    for ( ; i < numPlayers; i++ ) {
        html = html.replace(`~P${i + 1}~`, players[i]);
    }

    setTournamentData(1, html);
    tournamentGenerated = true;
}

function beautifyTournament(tournament) {
    const showPastMatches = document.getElementById('showPastMatches').checked;
    const showBeautiful = document.getElementById('showBeautiful').checked;
    const showFutureMatches = document.getElementById('showFutureMatches').checked;

    tournamentHTML[tournament] = '';
    if (!showPastMatches || !showFutureMatches) {
        let lines = tournamentData[tournament].split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!showPastMatches && lines[i].match(/(&lt;)|(&gt;)/)) ;
            else if (!showFutureMatches && lines[i].match(/~/)) ;
            else tournamentHTML[tournament] += lines[i] + '\n';
        }
    }
    else {
        tournamentHTML[tournament] = tournamentData[tournament];
    }

    // beautify the tournament
    if (showBeautiful && tournamentHTML[tournament]) {
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/(&lt;)|(&gt;)/g, '🖤');
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/_/g, '💤');
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/#/g, '🎲');
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/~W/g, '🥇');
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/~L/g, '🥈');
        tournamentHTML[tournament] = tournamentHTML[tournament].replace(/~/g, '');
    }

    highlightYourNameInTournament(tournament);
    showTournament(tournament);
}

function showTournament(tournament) {
    let lines = tournamentHTML[tournament].split('\n');

    // add tournament info
    let groupsHTML = lines[0] + '\n';

    // make the different groups/columns
    // <div class="row text-center">
    //     <div class="col-lg-4">
    //         <div id="group1" class="tournament">Group 1</div>
    //     </div>
    // </div>

    groupsHTML += '<div class="row text-center">\n';
    let group = 0;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].match(/(Round Robin)|(Main)|(Consolation)|(Final)/)) {
            if (group > 0) { // close previous group
                groupsHTML += `</div>\n</div>\n`;
            }
            group++;
            groupsHTML += `<div class="col-lg-4">\n<div id="group${group}" class="tournament">\n`;
        }
        groupsHTML += lines[i] + '\n';
    }
    groupsHTML += `</div>\n</div>\n`; // close last group

    document.getElementById('tournament').innerHTML = groupsHTML;
    document.getElementById('tournamentSummary').innerHTML = '';
}

function setTournamentData(tournament, data) {
    tournamentData[tournament] = data;
    tournamentHTML[tournament] = data;
    beautifyTournament(tournament);
}

function generateDoubleElimination(selectedPlayers) {
    const numPlayers = selectedPlayers.length;
    if (numPlayers < 4 || numPlayers > 16) {
        alert('Invalid number of players for Double Elimination!\nMust be between 4 and 16.');
        return;
    }

    let html = tournamentInfo();

    if (numPlayers <= 8)
        html += make8PlayersDoubleElimination();
    else
        html += make16PlayersDoubleElimination();

    const players = [...selectedPlayers].sort(() => generator.random() - 0.5);

    // fill in the players
    let i = 0;
    while (i < numPlayers) {
        html = html.replace(`~P${i + 1}~`, players[i]);
        i++;
    }

    // fill the rest with Byes
    const numPlayersAndByes = numPlayers <= 8 ? 8 : 16;
    while (i < numPlayersAndByes) {
        html = html.replace(`~P${i + 1}~`, 'Bye');
        i++;
    }

    setTournamentData(1, html);
    tournamentGenerated = true;
}

function generateRoundRobins(selectedPlayers) {
    let maximumPlayers = document.getElementById('maximumTournamentPlayers').value;
    if (isNaN(maximumPlayers) || maximumPlayers < 3) {
        alert('Invalid maximum players per group!\nNot a number or less than 3.');
        return;
    }

    let html = tournamentInfo();
    
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

    setTournamentData(1, html);
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

function generateDoubleEliminationTable(lossCounts) {
    // Convert to array and sort by losses ascending
    const sorted = Object.entries(lossCounts)
        .sort((a, b) => a[1] - b[1]);

    let ranking = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
        const [name, losses] = sorted[i];
        // If not the first, and previous wins are same, keep the same rank
        if (i > 0 && sorted[i][1] === sorted[i - 1][1]) {
            ranking.push({ rank: currentRank, name, losses });
        } else {
            currentRank = i + 1;
            ranking.push({ rank: currentRank, name, losses });
        }
    }

    // Build the ranking table
    let rankingTable = '|Rank|   |Losses|\n|:---:|:---:|:---:|\n';
    ranking.forEach(row => {
        if (row.losses < 2) {
            rankingTable += `|${row.rank}|${row.name}|${row.losses}|\n`;
        }
        else {
            rankingTable += `|${row.rank}|~${row.name}~|${row.losses}|\n`;
        }
    });

    return rankingTable;
}

function generateTournamentSummary() {
    const tournamentDiv = document.getElementById('tournament');
    const summaryDiv = document.getElementById('tournamentSummary');
    if (!tournamentDiv || !summaryDiv) return;

    const lines = tournamentDiv.innerText.split('\n');
    let winCounts = {};
    let lossCounts = {};

    let tournamentSummary = '### Tournament Summary\n\n';
    let roundRobin = 0;
    lines.forEach(line => {
        if(line.match(/Round Robin/)) {
            if (Object.keys(winCounts).length > 0) {
                tournamentSummary += `\n##### Round Robin ${roundRobin}\n\n`;
                tournamentSummary += generateRankingTable(winCounts);
                winCounts = {};
                lossCounts = {};
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
                lossCounts[winner] = lossCounts[winner] || 0;
                lossCounts[loser] = (lossCounts[loser] || 0) + 1;
            }
        }
    });
    if (Object.keys(winCounts).length > 0) {
        if (roundRobin > 0) {
            tournamentSummary += `\n##### Round Robin ${roundRobin}\n\n`;
            tournamentSummary += generateRankingTable(winCounts);
        }
        else {
            tournamentSummary += generateDoubleEliminationTable(lossCounts);
        }
    }

    summaryDiv.innerHTML = marked.parse(tournamentSummary);
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
            const doubleEliminationMatchRegex = new RegExp(`^(${winner}|${loser}) #(\\d+)# (${winner}|${loser})\\b`, 'i');

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

                    // Consider only the last played matches if we are in the Final round
                    if (j < tournamentLines.length - 5 || i > todaysMatches.length - 2) {
                        tournamentLines[j] = tournamentLines[j].replace(
                            doubleEliminationMatchRegex,
                            `<span style="color: green;">${winner}</span> < ${matchLength} > <span style="color: red;">${loser}</span>`
                        );
                    }

                    // Replace Loser and Winner references in the rest of the tournament
                    const winnerRegex = new RegExp(`~W${matchNumber}~`, 'g');
                    const loserRegex = new RegExp(`~L${matchNumber}~`, 'g');
                    for (let k = 0; k < tournamentLines.length; k++) { 
                        if (!tournamentLines[k].includes("Bye") && tournamentLines[k][0] === '<') continue; // skip HTML tags - info and completed matches
                        tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                        tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                        if (!tournamentLines[k].includes("~")) { // replace future matches with current matches if there is no placeholder
                            tournamentLines[k] = tournamentLines[k].replace(/_/g, '#');
                        }
                    }
                    break; // Exit the inner loop once a match is found and replaced
                }
            }
        }
    }

    html = tournamentLines.join('\n');
    tournamentDiv.innerHTML = html;
}

function resolveByes() {
    const tournamentLines = tournamentData[1].split('\n');
    // fix the Byes
    const doubleEliminationMatchRegex = new RegExp(`^(.+) [#_](\\d+)[#_] (.+)\\b`, 'i');
    for (var j = 0; j < tournamentLines.length; j++) {
        if (tournamentLines[j].includes('Bye')) {
            if (tournamentLines[j].match(doubleEliminationMatchRegex)) {
                const playerA = tournamentLines[j].match(doubleEliminationMatchRegex)[1]; // Get player A
                const matchNumber = tournamentLines[j].match(doubleEliminationMatchRegex)[2]; // Get the match number
                let playerB = tournamentLines[j].match(doubleEliminationMatchRegex)[3]; // Get player B
                
                playerB = playerB.slice(0, -3);  // TODO: fix this hack to remove <br
                
                const winner = playerA === 'Bye' ? playerB : playerA;
                const loser = 'Bye';

                tournamentLines[j] = tournamentLines[j].replace(
                    doubleEliminationMatchRegex,
                    `<span style="color: green;">${winner}</span> < 0 > <span style="color: gray;">${loser}</span><br`
                );

                const winnerRegex = new RegExp(`~W${matchNumber}~`, 'g');
                const loserRegex = new RegExp(`~L${matchNumber}~`, 'g');
                for (let k = 0; k < tournamentLines.length; k++) { 
                    tournamentLines[k] = tournamentLines[k].replace(winnerRegex, winner);
                    tournamentLines[k] = tournamentLines[k].replace(loserRegex, loser);
                    if (!tournamentLines[k].includes("~")) { // replace future matches with current matches if there is no placeholder
                        tournamentLines[k] = tournamentLines[k].replace(/_/g, '#');
                    }
                }
            }
        }
    }

    setTournamentData(1, tournamentLines.join('\n'));
}

function make8PlayersDoubleElimination() {
    let html = '<h5>Double Elimination</h5>\n';
    // Main Bracket
    html += '<h5>Main - 5 points</h5>\n';
    html += `<p>\n`;
    html += `~P1~ #1# ~P8~<br>\n`;
    html += `~P4~ #2# ~P5~<br>\n`;
    html += `~P3~ #3# ~P6~<br>\n`;
    html += `~P2~ #4# ~P7~<br>\n`;
    html += `</p><p>\n`;
    html += `~W1~ _7_ ~W2~<br>\n`;
    html += `~W3~ _8_ ~W4~<br>\n`;
    html += `</p><p>\n`;
    html += `~W7~ _11_ ~W8~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += '<h5>Consolation - 3 points</h5>\n';
    html += `<p>\n`;
    html += `~L1~ _5_ ~L2~<br>\n`;
    html += `~L3~ _6_ ~L4~<br>\n`;
    html += `</p><p>\n`;
    html += `~L8~ _9_ ~W5~<br>\n`;
    html += `~L7~ _10_ ~W6~<br>\n`;
    html += `</p><p>\n`;
    html += `~W9~ _12_ ~W10~<br>\n`;
    html += `</p><p>\n`;
    html += `~L11~ _13_ ~W12~<br>\n`;
    html += `</p>\n`;
    // Final
    html += '<h5>Final - 5 points</h5>\n';
    html += `<p>\n`;
    html += `~W11~ _14_ ~W13~<br>\n`;
    html += `</p>\n`;
    return html;
}

function make16PlayersDoubleElimination() {
    let html = '<h5>Double Elimination</h5>\n';
    // Main Bracket
    html += '<h5>Main - 5 points</h5>\n';
    html += `<p>\n`;
    html += `~P1~ #1# ~P16~<br>\n`;
    html += `~P8~ #2# ~P9~<br>\n`;
    html += `~P4~ #3# ~P13~<br>\n`;
    html += `~P12~ #4# ~P5~<br>\n`;
    html += `~P2~ #5# ~P15~<br>\n`;
    html += `~P10~ #6# ~P7~<br>\n`;
    html += `~P3~ #7# ~P14~<br>\n`;
    html += `~P11~ #8# ~P6~<br>\n`;
    html += `</p><p>\n`;
    html += `~W1~ _13_ ~W2~<br>\n`;
    html += `~W3~ _14_ ~W4~<br>\n`;
    html += `~W5~ _15_ ~W6~<br>\n`;
    html += `~W7~ _16_ ~W8~<br>\n`;
    html += `</p><p>\n`;
    html += `~W13~ _21_ ~W14~<br>\n`;
    html += `~W15~ _22_ ~W16~<br>\n`;
    html += `</p><p>\n`;
    html += `~W21~ _25_ ~W22~<br>\n`;
    html += `</p>\n`;
    // Consolation Bracket
    html += '<h5>Consolation - 3 points</h5>\n';
    html += `<p>\n`;
    html += `~L1~ _9_ ~L2~<br>\n`;
    html += `~L3~ _10_ ~L4~<br>\n`;
    html += `~L5~ _11_ ~L6~<br>\n`;
    html += `~L7~ _12_ ~L8~<br>\n`;
    html += `</p><p>\n`;
    html += `~L16~ _17_ ~W9~<br>\n`;
    html += `~L15~ _18_ ~W10~<br>\n`;
    html += `~L14~ _19_ ~W11~<br>\n`;
    html += `~L13~ _20_ ~W12~<br>\n`;
    html += `</p><p>\n`;
    html += `~W17~ _23_ ~W18~<br>\n`;
    html += `~W19~ _24_ ~W20~<br>\n`;
    html += `</p><p>\n`;
    html += `~L22~ _26_ ~W23~<br>\n`;
    html += `~W24~ _27_ ~L21~<br>\n`;
    html += `</p><p>\n`;
    html += `~W26~ _28_ ~W27~<br>\n`;
    html += `</p><p>\n`;
    html += `~L27~ _29_ ~W28~<br>\n`;
    html += `</p>\n`;
    // Final
    html += '<h5>Final - 5 points</h5>\n';
    html += `<p>\n`;
    html += `~W25~ _30_ ~W29~<br>\n`;
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
document.getElementById('freezeTournamentButton').addEventListener('click', function () {
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

    let tournamentHTML = tournamentData[1];

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
        document.getElementById("freezeTournamentButton").disabled = true;
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
        document.getElementById("freezeTournamentButton").disabled = true;
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
            // document.getElementById('tournament').innerHTML = fileContent.replace(/\\n/g, '\n');
            setTournamentData(1, fileContent.replace(/\\n/g, '\n'));
            getTodaysMatches(matchRecords);
            highlightTodaysMatches();
            generateTournamentSummary();
        } else {
            console.log('Failed to fetch Last Tournament!');
        }
    })
    .catch(error => console.error('Error:', error));
}

function highlightYourNameInTournament(tournament) {
    const yourName = document.getElementById('yourName').value.trim();
    if (!yourName) {
        return;
    }

    // Use regex to match yourName as a whole word, case-insensitive
    const regex = new RegExp(`\\b(${yourName})\\b`, 'gi');
    tournamentHTML[tournament] = tournamentHTML[tournament].replace(
        regex,
        `<span style="background-color: blue;">${yourName}</span>`
    );
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
                if (matchLength > 2) todaysMatches.push(matchRecords[i]); // try to get rid of short matches played before the tournament
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
