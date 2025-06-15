Chart.defaults.color = 'white';  // default text color
Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.0)';  // don't show the default grid
Chart.defaults.plugins.legend.labels.color = '#61e7ff';

let rankingChart;
let hiddenStates;
let defaultHiddenStates = {
    'ratingList': [true, false],
    'matchesPlayed': [false, false],
    'percentMatchesWon': [false, false],
    'rangliste': [false, false, true],
    'playerInfo': [false, false],
};

// If the Ranking chart already exists, destroy it before creating a new one
function destroyRankingChart(message) {
    if (rankingChart) {
        rankingChart.destroy();
        rankingChart = null;
    }
    document.getElementById('rankingChartCanvas').height = 0;
    document.getElementById('rankingChartMessage').innerText = message;
}

// Dynamically adjust canvas height based on the number of players
function optimizeChartCanvasHeight(rankingChartCanvas, numberOfPlayers) {
    const heightPerPlayer = 20; // Height per player in pixels
    const additionalHeight = 100;
    const minHeight = additionalHeight + heightPerPlayer; // Minimum height for the canvas
    const calculatedHeight = Math.max(numberOfPlayers * heightPerPlayer + additionalHeight, minHeight);

    document.getElementById(rankingChartCanvas).height = calculatedHeight;
}

// Remember the hidden state of the datasets and set them again
function setRememberedHiddenStates() {
    const rankingListSelection = document.getElementById('rankingListSelection').value;
    if(manuallyChangedChart) {
        hiddenStates = defaultHiddenStates[rankingListSelection];
        manuallyChangedChart = false;
    }
    else hiddenStates = rankingChart?.data?.datasets.map((_, index) => !rankingChart.isDatasetVisible(index)) || defaultHiddenStates[rankingListSelection];
}

// Function to create or update the Matches chart
function updateMatchesPlayedChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    let matchesPlayedRankingList =  document.getElementById('rankingListSelection').value === 'matchesPlayed';
    const players = matchesPlayedRankingList ?
                    Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].matchesPlayed - matchListSummary[a].matchesPlayed) :
                    Object.keys(matchListSummary).sort((a, b) => (matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed)-(matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed));
    if (players.length < 1) return;
    const matchesWon = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesWon):
                        players.map(player => 100*matchListSummary[player].matchesWon/matchListSummary[player].matchesPlayed);
    const matchesLost = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesLost):
                        players.map(player => 100*matchListSummary[player].matchesLost/matchListSummary[player].matchesPlayed);

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart if it doesn't exist
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: matchesWon,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    position: 'top', // Move the axis label to the top
                    title: {
                        display: true,
                        text: 'Matches',
                    },
                    ticks: {
                        callback: function(value) {  // Show only whole numbers
                            return Number.isInteger(value) ? value : null;
                        }
                    },                            
                    grid: { color: 'rgba(255, 255, 0, 0.3)' },
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// Function to create or update the Ranglisten chart
function updateRanglistenChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].punkte - matchListSummary[a].punkte);
    if (players.length < 1) return;
    const punkteWon = players.map(player => matchListSummary[player].punkteWon);
    const punkteBonus = players.map(player => matchListSummary[player].punkteBonus);
    const punkteLost = players.map(player => matchListSummary[player].punkteLost);

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: punkteWon,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Bonus',
                    hidden: hiddenStates[1],
                    data: punkteBonus,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[2],
                    data: punkteLost,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    title: {
                        display: true,
                        text: 'Punkte',
                    },
                    ticks: {
                        callback: function(value) {  // Show only whole numbers
                            return Number.isInteger(value) ? value : null;
                        }
                    },                            
                    grid: { color: 'rgba(255, 255, 0, 0.3)' },
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

function updatePlayerInfoChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => (matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed)-(matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed));
    if (players.length < 1) return;
    const matchesWon = players.map(player => 100*matchListSummary[player].matchesLost/matchListSummary[player].matchesPlayed);
    const matchesLost = players.map(player => 100*matchListSummary[player].matchesWon/matchListSummary[player].matchesPlayed);

    // Move the selected player to the top of the list and show the real percentage won/lost
    const selectedPlayer = document.getElementById('playerName').value;
    if (players.includes(selectedPlayer)) {
        const selectedPlayerIndex = players.indexOf(selectedPlayer);
        players.splice(selectedPlayerIndex, 1); // Remove the selected player
        players.unshift(selectedPlayer); // Add the selected player to the top
        matchesWon.splice(selectedPlayerIndex, 1);
        matchesLost.splice(selectedPlayerIndex, 1);
        matchesWon.unshift(matchListSummary[selectedPlayer].matchesWon / matchListSummary[selectedPlayer].matchesPlayed * 100);
        matchesLost.unshift(matchListSummary[selectedPlayer].matchesLost / matchListSummary[selectedPlayer].matchesPlayed * 100);
    }
    else {
        destroyRankingChart(selectedPlayer + " didn't play...");
        return;
    }

    setRememberedHiddenStates();
    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart if it doesn't exist
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Won',
                    hidden: hiddenStates[0],
                    data: matchesWon,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: true,
                    position: 'top', // Move the axis label to the top
                    title: {
                        display: true,
                        text: '% Matches Won',
                    },
                    ticks: {
                        callback: function(value) {  // Show only whole numbers
                            return Number.isInteger(value) ? value : null;
                        }
                    },                            
                    grid: { color: 'rgba(255, 255, 0, 0.3)' },
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

let ratingListPlayInterval = setInterval(playRatingList, 200);

let remainingReplayTimes = 0;
function startPlayingRatingList() {
    remainingReplayTimes = document.getElementById('replayTimes').value;
}

function resetPlayingRatingList() {
    remainingReplayTimes = 0;
    rankingListSelectionManuallyChanged();
}

function playRatingList() {
    if (remainingReplayTimes > 0) {
        adjustExpectedRatingList(matchList);
        createRatingListRankingList('rankingSummary', ratingSummary);
        updateRatingListChart(ratingSummary);
        remainingReplayTimes--;
        document.getElementById('replayPlayButton').innerText = `▶︎ ${remainingReplayTimes}`;
    }
    else {
        document.getElementById('replayPlayButton').innerText = `▶︎`;
    }
}

// Function to create or update the Ranglisten chart
function updateRatingListChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].futureRating - matchListSummary[a].futureRating);
    if (players.length < 1) return;
    const rating = players.map(player => Math.round(matchListSummary[player].rating));
    const futureRating = players.map(player => Math.round(matchListSummary[player].futureRating));
    
    // Only destroy and recreate the chart if the number of players changed
    if (remainingReplayTimes < 1 || manuallyChangedChart || !rankingChart || rankingChart.data.labels.length !== players.length) {
        setRememberedHiddenStates();
        destroyRankingChart('');
        optimizeChartCanvasHeight('rankingChartCanvas', players.length);
    }
    else if (rankingChart) {
        // Update data and labels if chart exists
        rankingChart.data.labels = players;
        rankingChart.data.datasets[0].data = rating;
        rankingChart.data.datasets[1].data = futureRating;
        rankingChart.update();
        return;
    }


    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Current Rating',
                    hidden: hiddenStates[0],
                    data: rating,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Future Rating',
                    hidden: hiddenStates[1],
                    data: futureRating,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            xMin: 1800, // Y-axis value where the line starts
                            xMax: 1800, // Y-axis value where the line ends
                            borderColor: 'rgba(255, 0, 0, 0.7)',
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    beginAtZero: false,
                    position: 'top',
                    title: {
                        display: true,
                        text: 'ELO Points',
                    },
                    ticks: {
                        callback: function(value) {  // Show only whole numbers
                            return Number.isInteger(value) ? value : null;
                        }
                    },                            
                    grid: { color: 'rgba(255, 255, 0, 0.3)' },
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

function updatePlayerProgressChart(progressList) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // figure out the time span to display and the active players in that time span
    // the time span is defined by the selected option in the time span selection dropdown
    let timeSpanRegex = new RegExp (document.getElementById("timeSpanSelection").value);
    let foundTimeSpan = false;
    let lastMatchInTimeSpan = 1000;
    let firstMatchInTimeSpan = 0;
    let activePlayers = new Set(); 
    for (var i = progressList.length-1; i > 1; i--) {
        if (timeSpanRegex.test(progressList[i].date)) {
            if (!foundTimeSpan) {
                lastMatchInTimeSpan = progressList[i].match;
                foundTimeSpan = true;
            }
            activePlayers.add(progressList[i].player); 
        }
        else if (foundTimeSpan) {
            firstMatchInTimeSpan = progressList[i].match;
            break;
        }
    }

    // Group progress by player
    const playerProgress = {};
    progressList.forEach(entry => {
        if (!playerProgress[entry.player]) playerProgress[entry.player] = [];
        playerProgress[entry.player].push({ matchNumber: entry.match, rating: entry.rating });
    });

    // Prepare datasets for Chart.js
    // Sort players by their last rating (highest first)
    const sortedPlayers = Object.keys(playerProgress).sort((a, b) => {
        const aLast = playerProgress[a][playerProgress[a].length - 1].rating;
        const bLast = playerProgress[b][playerProgress[b].length - 1].rating;
        return bLast - aLast;
    });

    // Only include datasets for players active in the selected time span
    const datasets = sortedPlayers
        .filter(player => activePlayers.has(player))
        .map((player, idx) => {
            let data = [];
            playerProgress[player].forEach(entry => {
                data.push({x: Number(entry.matchNumber), y: entry.rating});
            });

            // Assign a color (simple palette)
            const colors = [
                'rgba(255,0,0,1)',      // bright red
                'rgba(0,0,255,1)',      // bright blue
                'rgba(255,215,0,1)',    // gold
                'rgba(128,0,255,1)',    // vivid purple
                'rgba(255,140,0,1)',    // deep orange
                'rgba(0,255,0,1)',      // bright green
                'rgba(255,20,147,1)',   // deep pink
                'rgba(75,0,130,1)',     // indigo
                'rgba(0,0,139,1)',      // dark blue
                'rgba(255,69,0,1)',     // red-orange
                'rgba(139,0,0,1)',      // dark red
                'rgba(0,206,209,1)',    // dark turquoise
                'rgba(128,128,0,1)',    // olive
                'rgba(220,20,60,1)',    // crimson
                'rgba(0,128,0,1)',      // dark green
                'rgba(0,255,255,1)',    // cyan
                'rgba(255,255,0,1)'     // yellow
            ];
            const color = colors[idx % colors.length];

            // Rank starts at 1
            const rank = idx + 1;
            return {
                label: rank + " " + player,
                hidden: false,
                data: data,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.2)'),
                fill: false,
                spanGaps: true,
                tension: 0.2,
                pointRadius: 0,
                pointBorderWidth: 0,
                pointHoverRadius: 18,
                pointHitRadius: 24
            };
        });

    destroyRankingChart('');
    document.getElementById('rankingChartCanvas').height = window.innerHeight * 0.6 + sortedPlayers.length * 10; // Adjust height based on number of players

    rankingChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: firstMatchInTimeSpan,
                    max: lastMatchInTimeSpan,
                    title: {
                        display: true,
                        text: 'Match Number'
                    },
                    ticks: {
                        callback: function(value) {  // Show only whole numbers
                            return Number.isInteger(value) ? value : null;
                        }
                    },                            
                    grid: { color: 'rgba(255, 255, 0, 0.3)' }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(255, 255, 0, 0.3)' }
                }
            }
        }
    });
}
