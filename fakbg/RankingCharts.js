Chart.defaults.color = 'white';  // default text color
Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.0)';  // don't show the default grid
Chart.defaults.plugins.legend.labels.color = '#61e7ff';

let rankingChart;
let hiddenStates;
let defaultHiddenStates = {
    'ratingList': [false, false],
    'matchesPlayed': [false, false],
    'highScores': [false, false, false],
    'lowScores': [false, false, false],
    'percentMatchesWon': [false, false],
    'rangliste': [false, false, true],
    'playerInfoPercent': [false, false],
    'playerInfoMatches': [false, false],
};

// default colors
const wonForeColor = 'rgba(75, 192, 192, 1)';
const wonBackColor = 'rgba(75, 192, 192, 0.2)';

const lostForeColor = 'rgba(255, 99, 132, 1)';
const lostBackColor = 'rgba(255, 99, 132, 0.2)';

const gridColor = { color: 'rgba(255, 255, 0, 0.3)' };
const middleLineColor = 'rgba(255, 0, 0, 1)';
const playerLineColor = 'rgba(255, 255, 0, 1)';


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
    document.getElementById(rankingChartCanvas).height = Math.max(numberOfPlayers * heightPerPlayer + additionalHeight, minHeight);
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
                    Object.keys(matchListSummary).sort((a, b) => matchListSummary[b].matchesPlayed - matchListSummary[a].matchesPlayed || matchListSummary[b].matchesWon - matchListSummary[a].matchesWon) :
                    Object.keys(matchListSummary).sort((a, b) => (matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed)-(matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed));
    
    if (players.length < 1) return;
    
    const matchesWon = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesWon):
                        players.map(player => 100*matchListSummary[player].matchesWon/matchListSummary[player].matchesPlayed);
    
    const matchesLost = matchesPlayedRankingList ?
                        players.map(player => matchListSummary[player].matchesLost):
                        players.map(player => 100*matchListSummary[player].matchesLost/matchListSummary[player].matchesPlayed);

    const chartTitle = matchesPlayedRankingList ? 'Matches Played' : '% Matches Won';

    const yourName = document.getElementById('yourName').value.trim();
    const playerValue = matchesPlayedRankingList ? 0 : 100*matchListSummary[yourName]?.matchesWon/matchListSummary[yourName]?.matchesPlayed;

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
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            if (matchesPlayedRankingList) { // show the real matches won/lost   
                                const totalMatches = context.chart.data.datasets
                                    .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                                return [` ${totalMatches} matches`, ` ${context.dataset.label} ${context.raw}`];
                            }
                            return [` ${context.dataset.label} ${context.raw.toFixed(1)}%`, ` of matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },
                ...(matchesPlayedRankingList ? {} : {
                    annotation: {
                        annotations: {
                            fiftyPercentLine: {
                                type: 'line',
                                xMin: 50, // Y-axis value where the line starts
                                xMax: 50, // Y-axis value where the line ends
                                borderColor: middleLineColor,
                                borderDash: [5, 5],
                                borderWidth: 2,
                            },
                            playerValueLine: {
                                type: 'line',
                                display: playerValue,
                                xMin: playerValue, // Y-axis value where the line starts
                                xMax: playerValue, // Y-axis value where the line ends
                                borderColor: playerLineColor,
                                borderDash: [5, 5],
                                borderWidth: 2,
                            }
                        }
                    }
                })                    
            },
            scales: {
                x: {
                    title: {
                        text: chartTitle,
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
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
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
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
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            const totalPunkte = context.chart.data.datasets
                                .filter(ds => ds.label !== 'Lost')
                                .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                            return [` ${totalPunkte.toLocaleString()} Punkte`, ` ${context.dataset.label} ${context.raw.toLocaleString()}`];
                        }
                    }
                },
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    title: {
                        text: 'Punkte',
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
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

function updatePlayerInfoPercentChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => {
        const diff = matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed - matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed;
        if (diff !== 0 ) return diff;
        return matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed > 0.5 ? 
               matchListSummary[a].matchesWon - matchListSummary[b].matchesWon :
               matchListSummary[b].matchesLost - matchListSummary[a].matchesLost;
    });
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
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex;
                            if (rank === 0) {
                                return `${context[0].label}`;
                            }
                            return ` #${rank} Opponent ${context[0].label}`;
                        },
                        label: function(context) {
                            return [` ${selectedPlayer} ${context.dataset.label} ${context.raw.toFixed(1)}%`, ` of matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },                
                annotation: {
                    annotations: {
                        fiftyPercentLine: {
                            type: 'line',
                            xMin: 50, // Y-axis value where the line starts
                            xMax: 50, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            xMin: matchesWon[0], // Y-axis value where the line starts
                            xMax: matchesWon[0], // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: selectedPlayer + "'s % Matches",
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
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

// update the Player Info chart based on the Matches
function updatePlayerInfoMatchesChart(matchListSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(matchListSummary).sort((a, b) => {
        const diff = matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed - matchListSummary[b].matchesWon/matchListSummary[b].matchesPlayed;
        if (diff !== 0 ) return diff;
        return matchListSummary[a].matchesWon/matchListSummary[a].matchesPlayed > 0.5 ? 
               matchListSummary[a].matchesWon - matchListSummary[b].matchesWon :
               matchListSummary[b].matchesLost - matchListSummary[a].matchesLost;
    });
    if (players.length < 1) return;

    // Calculate the percentage of matches won/lost for each player, note that it is seem from the opponents perspective
    const matchesWon = players.map(player => matchListSummary[player].matchesLost);
    const matchesLost = players.map(player => matchListSummary[player].matchesWon);

    // Move the selected player to the top of the list and show the real percentage won/lost
    const selectedPlayer = document.getElementById('playerName').value;
    if (players.includes(selectedPlayer)) {
        const selectedPlayerIndex = players.indexOf(selectedPlayer);
        players.splice(selectedPlayerIndex, 1); // Remove the selected player
        matchesWon.splice(selectedPlayerIndex, 1);
        matchesLost.splice(selectedPlayerIndex, 1);
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
                    backgroundColor: wonBackColor,
                    borderColor: wonForeColor,
                    borderWidth: 1
                },
                {
                    label: 'Lost',
                    hidden: hiddenStates[1],
                    data: matchesLost,
                    backgroundColor: lostBackColor,
                    borderColor: lostForeColor,
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} Opponent ${context[0].label}`;
                        },
                        label: function(context) {
                            const totalMatches = context.chart.data.datasets
                                .reduce((sum, ds) => sum + Number(ds.data[context.dataIndex] || 0), 0);
                            return [` ${selectedPlayer} ${context.dataset.label} ${context.raw}`, ` of ${totalMatches} matches`];
                        }
                    }
                },
                legend: { position: 'bottom' },
            },
            scales: {
                x: {
                    title: {
                        text: selectedPlayer + "'s Matches",
                        display: true,
                    },
                    beginAtZero: true,
                    stacked: true,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
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

function wholeNumbersOnly(value) {
    return Number.isInteger(value) ? value.toLocaleString() : null;
}

setInterval(playRatingList, 200);

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
    const yourName = document.getElementById('yourName').value.trim();

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

        const playerValue = Math.round(matchListSummary[yourName]?.futureRating);
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMin = playerValue;
        rankingChart.options.plugins.annotation.annotations.playerValueLine.xMax = playerValue;
        rankingChart.update();
        return;
    }

    const playerValue = Math.round(matchListSummary[yourName]?.futureRating);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Current Rating',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[0],
                    data: rating,
                    borderColor: 'lime',
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
                {
                    label: 'Future Rating',
                    hidden: hiddenStates[1],
                    data: futureRating,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.dataset.label} ${context.raw.toLocaleString()} Elo`;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            xMin: 1800, // Y-axis value where the line starts
                            xMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            xMin: playerValue, // Y-axis value where the line starts
                            xMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: 'Elo Points',
                        display: true,
                    },
                    beginAtZero: false,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
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
    for (let i = progressList.length-1; i > 1; i--) {
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
        if (!playerProgress[entry.player]) {
            playerProgress[entry.player] = [];
        }
        else {
            // add a NaN entry if the player didn't play for more than xxx days to create a gap in the chart
            const currentDate = new Date(entry.date);
            const previousEntry = playerProgress[entry.player][playerProgress[entry.player].length - 1];
            const previousDate = new Date(previousEntry.date);
            const differentDays = Math.abs(currentDate.getTime() - previousDate.getTime()) / 86400000;
            if (differentDays > 181) {
                playerProgress[entry.player].push({ matchNumber: entry.match, date: entry.date, rating: NaN });
            }
        }

        playerProgress[entry.player].push({ matchNumber: entry.match, date: entry.date, rating: entry.rating });
    });

    // Prepare datasets for Chart.js
    // Sort players by their last rating (highest first)
    const sortedPlayers = Object.keys(playerProgress).sort((a, b) => {
        const aLast = playerProgress[a][playerProgress[a].length - 1].rating;
        const bLast = playerProgress[b][playerProgress[b].length - 1].rating;
        return bLast - aLast;
    });

    // get your current player value
    const yourName = document.getElementById('yourName').value.trim();
    const playerValue = Math.round(playerProgress[yourName]?.[playerProgress[yourName].length-1].rating);

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
                spanGaps: false,
                tension: 0.2,
                pointRadius: 0,
                pointBorderWidth: 0,
                pointHoverRadius: 18,
                pointHitRadius: 24,
                borderWidth: 1,
            };
        });

    const playerAnnotations = {};
    const activeSortedPlayers = sortedPlayers.filter(player => activePlayers.has(player));

    // create the aannotations for the players who played in the last 14 days
    activeSortedPlayers.forEach((player, idx) => {
        const lastPlayedDate = playerProgress[player][playerProgress[player].length - 1].date;
        const daysSinceLastPlayed = Math.floor((new Date() - new Date(lastPlayedDate)) / (1000 * 60 * 60 * 24));
        if (daysSinceLastPlayed > 14) return;

        const lastRating = playerProgress[player][playerProgress[player].length - 1].rating;
        
        playerAnnotations[`player_${idx}`] = {
            type: 'label',
            xValue: lastMatchInTimeSpan + 2,
            yValue: lastRating + 5,
            position: 'start',
            content: [player],
            color: datasets[idx].borderColor,
            font: { size: 12 },
            padding: 2,
            borderRadius: 4
        };
    });

    destroyRankingChart('');
    document.getElementById('rankingChartCanvas').height = window.innerHeight * 0.6 + sortedPlayers.length * 10; // Adjust height based on number of players

    rankingChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return ` Current #${context[0].dataset.label}`;
                        },
                        label: function(context) {
                            const elo = context.parsed.y.toFixed(1);
                            const matchNumber = context.parsed.x;
                            const date = progressList.find(entry => entry.match === matchNumber)?.date || '';
                            return [` ${parseFloat(elo).toLocaleString()} Elo`, ` ${date}`];
                        }

                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    clip: false,
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            yMin: 1800, // Y-axis value where the line starts
                            yMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            yMin: playerValue, // Y-axis value where the line starts
                            yMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        ...playerAnnotations,
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Match Number',
                        display: true,
                    },
                    position: 'top',
                    type: 'linear',
                    min: firstMatchInTimeSpan,
                    max: lastMatchInTimeSpan,
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor
                },
                y: {
                    position: 'right',
                    beginAtZero: false,
                    grid: gridColor
                },
            }
        }
    });
}

// Function to create or update the Scores chart
function updateScoresChart(scoresSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const rankingListSelection = document.getElementById('rankingListSelection').value;
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart

    let players;
    if (rankingListSelection === 'highScores') {
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[b].highScore - scoresSummary[a].highScore);
    } else if (rankingListSelection === 'lowScores') {
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[a].lowScore - scoresSummary[b].lowScore);
    } else {
        players = Object.keys(scoresSummary).sort((a, b) => scoresSummary[b].currentScore - scoresSummary[a].currentScore);
    }
    if (players.length < 1) return;

    const highScore = players.map(player => Math.round(scoresSummary[player].highScore));
    const currentScore = players.map(player => Math.round(scoresSummary[player].currentScore));
    const lowScore = players.map(player => Math.round(scoresSummary[player].lowScore));
    const playerValue = Math.round(scoresSummary[yourName]?.currentScore);

    // Only destroy and recreate the chart if the number of players changed
    if (remainingReplayTimes < 1 || manuallyChangedChart || !rankingChart || rankingChart.data.labels.length !== players.length) {
        setRememberedHiddenStates();
        destroyRankingChart('');
        optimizeChartCanvasHeight('rankingChartCanvas', players.length);
    }
    else if (rankingChart) {
        // Update data and labels if chart exists
        rankingChart.data.labels = players;
        rankingChart.data.datasets[0].data = highScore;
        rankingChart.data.datasets[1].data = currentScore;
        rankingChart.data.datasets[2].data = lowScore;
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
                    label: 'Low',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[2],
                    data: lowScore,
                    borderColor: 'red',
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
                {
                    label: 'Current',
                    hidden: hiddenStates[1],
                    data: currentScore,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'High',
                    type: 'scatter',
                    pointStyle: 'star',
                    hidden: hiddenStates[0],
                    data: highScore,
                    borderColor: 'lime',
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            return ` ${context.dataset.label} ${parseFloat(context.raw).toLocaleString()} Elo`;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        startingEloLine: {
                            type: 'line',
                            xMin: 1800, // Y-axis value where the line starts
                            xMax: 1800, // Y-axis value where the line ends
                            borderColor: middleLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        },
                        playerValueLine: {
                            type: 'line',
                            display: playerValue,
                            xMin: playerValue, // Y-axis value where the line starts
                            xMax: playerValue, // Y-axis value where the line ends
                            borderColor: playerLineColor,
                            borderDash: [5, 5],
                            borderWidth: 2,
                        }
                    }
                }                    
            },
            scales: {
                x: {
                    title: {
                        text: 'Elo Points',
                        display: true,
                    },
                    beginAtZero: false,
                    position: 'top',
                    ticks: {
                        callback: wholeNumbersOnly
                    },                            
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

// Function to create or update the Streak chart
function updateStreakChart(rankingSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');
    const yourName = document.getElementById('yourName').value.trim();

    // Extract data for the chart
    const rankingListSelection = document.getElementById('rankingListSelection').value;

    let players, streak, title, playerValue;
    
    if (rankingListSelection === 'currentStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[b].currentStreak - rankingSummary[a].currentStreak || rankingSummary[b].matchesPlayed - rankingSummary[a].matchesPlayed);
        streak = players.map(player => rankingSummary[player].currentStreak);
        playerValue = rankingSummary[yourName]?.currentStreak;
        title = "Current Streak";
    } 
    else if (rankingListSelection === 'longestWinningStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[b].longestWon - rankingSummary[a].longestWon || rankingSummary[a].matchesPlayed - rankingSummary[b].matchesPlayed);
        streak = players.map(player => rankingSummary[player].longestWon);
        playerValue = rankingSummary[yourName]?.longestWon;
        title = "Longest Winning Streak";
    } 
    else if (rankingListSelection === 'longestLosingStreak') {
        players = Object.keys(rankingSummary).sort((a, b) => rankingSummary[a].longestLost - rankingSummary[b].longestLost || rankingSummary[a].matchesPlayed - rankingSummary[b].matchesPlayed);
        streak = players.map(player => rankingSummary[player].longestLost);
        playerValue = rankingSummary[yourName]?.longestLost;
        setRememberedHiddenStates();
        title = "Longest Losing Streak";
    }
    else return;
    
    if (players.length < 1) return;

    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    const chartOptions = {
        indexAxis: 'y', // Set the chart to horizontal
        responsive: true,
        maintainAspectRatio: false, // Allow the chart to resize freely
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(context) {
                        const rank = context[0].dataIndex + 1;
                        return ` #${rank} ${context[0].label}`;
                    },
                    label: function(context) {
                        return `${context.dataset.label} ${context.raw}`;
                    }
                }
            },
            legend: { position: 'bottom' },
            annotation: {
                annotations: {
                    zeroLine: {
                        type: 'line',
                        xMin: 0, // Y-axis value where the line starts
                        xMax: 0, // Y-axis value where the line ends
                        borderColor: middleLineColor,
                        borderDash: [5, 5],
                        borderWidth: 2,
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    text: 'Matches',
                    display: true,
                },
                beginAtZero: true,
                position: 'top',
                ticks: {
                    callback: wholeNumbersOnly
                },
                grid: gridColor,
            },
            x2: {
                position: 'bottom',
                ticks: {
                    callback: wholeNumbersOnly
                },
                afterDataLimits(scale) {
                    const xScale = scale.chart.scales.x;
                    if (xScale) {
                        scale.min = xScale.min;
                        scale.max = xScale.max;
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: { autoSkip: false } // show all the names
            }
        }
    };

    // Only add annotations if yourName is found in rankingSummary
    if (rankingSummary[yourName]) {
        chartOptions.plugins.annotation = {
            annotations: {
                zeroLine: {
                    type: 'line',
                    xMin: 0, // Y-axis value where the line starts
                    xMax: 0, // Y-axis value where the line ends
                    borderColor: middleLineColor,
                    borderDash: [5, 5],
                    borderWidth: 2,
                },
                playerValueLine: {
                    type: 'line',
                    xMin: playerValue, // Y-axis value where the line starts
                    xMax: playerValue, // Y-axis value where the line ends
                    borderColor: playerLineColor,
                    borderDash: [5, 5],
                    borderWidth: 2,
                }
            }
        };
    }

    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: title,
                    data: streak,
                    backgroundColor: function(context) {
                                        const value = context.raw; // Get the raw data value
                                        if (value > 0) return wonBackColor;
                                        else           return lostBackColor;
                                    },
                    borderColor: function(context) {
                                    const value = context.raw; // Get the raw data value
                                    if (value > 0) return wonForeColor;
                                    else           return lostForeColor;
                                },
                    borderWidth: 1
                },
            ]
        },
        options: chartOptions
    });
}

// Function to create or update the Last Active chart
function updateLastActiveChart(rankingSummary) {
    const ctx = document.getElementById('rankingChartCanvas').getContext('2d');

    // Extract data for the chart
    const players = Object.keys(rankingSummary).sort((a, b) => new Date(rankingSummary[b].lastDateActive) - new Date(rankingSummary[a].lastDateActive));
    const lastDatesActive = players.map(player => new Date(rankingSummary[player].lastDateActive));
    
    if (players.length < 1) return;

    destroyRankingChart('');
    optimizeChartCanvasHeight('rankingChartCanvas', players.length);

    // Create the chart
    rankingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: players, // Player names
            datasets: [
                {
                    label: 'Last Active Date',
                    data: lastDatesActive,
                    backgroundColor: wonBackColor,
                    borderColor: playerLineColor,
                    pointHoverRadius: 18,
                    pointHitRadius: 24,
                    borderWidth: 1,
                },
            ]
        },
        options: {
            indexAxis: 'y', // Set the chart to horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow the chart to resize freely
            plugins: {
                legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return ` #${rank} ${context.dataset.label} ${context.raw}`;
                    }
                }
            },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const rank = context[0].dataIndex + 1;
                            return ` #${rank} ${context[0].label}`;
                        },
                        label: function(context) {
                            const date = new Date(context.raw);
                            const today = new Date();
                            const diffTime = Math.abs(today - date);
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            const diffDaysString = diffDays === 0 ? 'today' : (diffDays === 1 ? '1 day ago' : `${diffDays} days ago`);
                            return [` ${diffDaysString}`, ` ${date.toISOString().split('T')[0]}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        text: 'Date',
                        display: true,
                    },
                    position: 'top',
                    ticks: {
                        callback: function(value) {
                            return new Date(value).toISOString().split('T')[0];
                        }
                    },
                    grid: gridColor,
                },
                x2: {
                    position: 'bottom',
                    ticks: {
                        callback: function(value) {
                            return new Date(value).toISOString().split('T')[0];
                        }
                    },
                    afterDataLimits(scale) {
                        const xScale = scale.chart.scales.x;
                        if (xScale) {
                            scale.min = xScale.min;
                            scale.max = xScale.max;
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { autoSkip: false } // show all the names
                }
            }
        }
    });
}

