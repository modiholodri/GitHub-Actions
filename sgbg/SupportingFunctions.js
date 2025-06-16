// Populate Time Span List
function populateTimeSpanSelectionList(matchRecords) {
    let interval = document.getElementById("intervalSelection").value;
    const weekday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const intervalLengths = {"Daily":10, "Monthly":7, "Quarterly":7, "Yearly":4, "ET":0};
    const selectedIntervalLength = intervalLengths[interval];

    var matchDays = 0;
    var matchTimeSpanOptions = '';

    let lastMatchID = -1;
    let lastQuarter = -1;
    let timeSpanSuffix = '';
    let matchIdRegex = '';
    let timeSpanPrefix = '';
    for (var i = matchRecords.length-1; i > 1; i--) {
        if (matchRecords[i].length > 0) {
            var matchInfo = matchRecords[i].split('|');
            const matchDate = matchInfo[1];
            const matchID = matchDate.substring(0,selectedIntervalLength);
            if (matchID != lastMatchID) {
                matchDays++;
                const datetime = new Date(matchDate);

                matchIdRegex = '^' + matchID;
                timeSpanPrefix = matchID;
                if (interval === "Daily") {
                    timeSpanSuffix = `${weekday[datetime.getDay()]}`;
                }
                else if (interval === "Monthly") {
                    timeSpanPrefix = matchID.substring(0,4); // just show the year
                    timeSpanSuffix = `${month[datetime.getMonth()]}`;
                }
                else if (interval === "Quarterly") {
                    let quarter = Math.round(datetime.getMonth() / 4) + 1;
                    if (quarter === lastQuarter) continue;
                    lastQuarter = quarter;
                    timeSpanPrefix = matchID.substring(0,4); // just show the year
                    timeSpanSuffix = `Q${quarter}`;

                    // Extract year and quarter from the date string (yyyy-mm-dd)
                    switch (quarter) {
                        case 1: matchIdRegex = '^' + timeSpanPrefix + '-0[1-3]'; break;
                        case 2: matchIdRegex = '^' + timeSpanPrefix + '-0[4-6]'; break;
                        case 3: matchIdRegex = '^' + timeSpanPrefix + '-0[7-9]'; break;
                        case 4: matchIdRegex = '^' + timeSpanPrefix + '-1[0-2]'; break;
                    }
                }
                matchTimeSpanOptions += `<option class="centered" value="${matchIdRegex}">${timeSpanPrefix} ${timeSpanSuffix}</option>\n`;
            }
            lastMatchID = matchID;
        }
    }
    document.getElementById("timeSpanSelection").innerHTML = matchTimeSpanOptions;

    return matchDays;
}

function populateClubSelection() {
    let clubRepoOptions = '';
    clubRepos.forEach(club => {
        clubRepoOptions += `<option class="centered" value="${club.repo}">${club.name}</option>\n`;
    });
    document.getElementById('clubSelection').innerHTML = clubRepoOptions;
}

function selectDefaultPlayer() {
    const yourName = document.getElementById('yourName').value;
    if (yourName) {
        const playerOptions = document.getElementById("playerName").options;
        for (let i = 0; i < playerOptions.length; i++) {
            if (playerOptions[i].value === yourName) {
                playerOptions[i].selected = true;
                break;
            }
        }
        if ( document.getElementById('rankingListSelection').value === 'playerInfo') {
            playerSelectionChanged();
        }
    }
}

// Fetch the Frequent Players
function fetchFrequentPlayers() {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/FrequentPlayers.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob( data.content )));

            var frequentPlayers = fileContent.split("\n");
            var playerOptions = '<option class="centered" value="Select">Select</option>\n';

            for (var i = 0; i < frequentPlayers.length; i++) {
                if (frequentPlayers[i].length > 0) {
                    playerOptions += `<option class="centered" value="${frequentPlayers[i]}">${frequentPlayers[i]}</option>\n`;
                }
            }
            document.getElementById("winnerName").innerHTML = playerOptions;
            document.getElementById("loserName").innerHTML = playerOptions;
            document.getElementById("playerName").innerHTML = playerOptions;
            selectDefaultPlayer();
        } else {
            console.log('Failed to fetch Frequent Players!');
        }
    })
    .catch(error => console.error('Error:', error));
}

// Synchronously fetch the RatingList markdown file and return its content
function fetchMarkDownFromRepoSync(fileName, elementName) {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}.md?timestamp=${Date.now()}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // false for synchronous request
    xhr.setRequestHeader('Authorization', `token ${githubToken}`);
    xhr.send(null);

    if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob(data.content)));
            document.getElementById(elementName).innerHTML = marked.parse(fileContent);
            return fileContent;
        }
    }
    console.log(`Failed to fetch file ${fileName}.md!`);
    return '';
}

// Fetch a markdown file from the repository
function fetchMarkDownFromRepo(fileName, elementName) {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            const fileContent = decodeURIComponent(escape(window.atob( data.content )));
            document.getElementById(elementName).innerHTML = marked.parse(fileContent);
            return fileContent;
        } else {
            console.log(`Failed to fetch file ${fileName}.md!`);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Refresh the Backgammon Club Title
function refreshWebPageTitle () {
    var sel = document.getElementById('clubSelection');
    document.getElementById('webPageTitle').innerText = sel.options[sel.selectedIndex].text;
    document.title = sel.options[sel.selectedIndex].text;
}

// Fetch the Match List
function fetchMatchList() {
    const repoName = document.getElementById('clubSelection').value;
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/MatchList.md?timestamp=${Date.now()}`;

    const options = {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => {
        if (data.content) {
            totalMatchList = decodeURIComponent(escape(window.atob( data.content )));

            matchRecords = totalMatchList.split("\n");
            
            if (populateTimeSpanSelectionList(matchRecords) > 0) {
                if(populatePlayedTimeSpanMatchList()) {
                    rankingListSelectionChanged();
                }
            }
        } else {
            console.log('Failed to fetch Match List!');
        }
    })
    .catch(error => console.error('Error:', error));

    rankingListSelectionChanged();
}