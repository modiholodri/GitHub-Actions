let tournamentGenerated = false;

function generateRoundRobinTournament(selectedPlayers) {
    const rounds = [];
    const players = [...selectedPlayers].sort(() => Math.random() - 0.5);
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
        highlightYourNameInTournament();
    } 
    catch (error) { 
        // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
        alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
    }
});

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
            highlightYourNameInTournament();
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
        `<span style="background-color: yellow;">$1</span>`
    );
    tournamentGenerated = false;
}