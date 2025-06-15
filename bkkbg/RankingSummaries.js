// Rating List
function createRatingListRankingList(summaryElement, rankingSummary) {
    let ratingListList = '|   |   |% Won|% Fut|Rat|fRat|Matches|Result|\n|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalMatchesPlayed = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].futureRating - a[1].futureRating)) {
        const futureRating = Math.round(stats.futureRating);
        totalMatchesPlayed += stats.matchesPlayed;
        ratingListList += `|${rank++}|${player}|${stats.percentMatchesWon}|${stats.expectedMatchesWon}|${stats.rating}|${futureRating}|${stats.matchesPlayed}|${stats.matchesWon} - ${stats.matchesLost}|\n`;    
    }   
    ratingListList += `||∑|||||${totalMatchesPlayed/2}||\n`;    

    document.getElementById(summaryElement).innerHTML = marked.parse(ratingListList);
}

// Player Info
function createPlayerInfoList(summaryElement, playerSummary, vipPlayerName) {
    let opponentsList = '';
    let vipPlayer = '';
    const opponents = {};
    let vipPlayerMatchesPlayed = 0;

    const vipRating = playerRating[vipPlayerName].rating;
    const matchLengthRoot = Math.sqrt(Number(document.getElementById('matchLength').value));


    for (const [player, stats] of Object.entries(playerSummary).sort()) {
        if (player === vipPlayerName) {
            const winPercentage = Math.round(stats.matchesWon*100/stats.matchesPlayed);
            const winningProbability = Math.round(100 * (1 / (1 + Math.pow(10, -(vipRating - initialRating) * matchLengthRoot / 2000))));
            vipPlayerMatchesPlayed = stats.matchesPlayed;
            vipPlayer += `|${player}|${stats.matchesWon} - ${stats.matchesLost}|${winPercentage}|${winningProbability}|${playerRating[player].rating}|${stats.matchesPlayed}|\n`;    
        }
        else {
            opponents[player] = stats;
        }
    }   

    let opponentsRating = 0;
    for (const [player, stats] of Object.entries(opponents).sort((a,b) => (a[1].matchesWon/a[1].matchesPlayed)-(b[1].matchesWon/b[1].matchesPlayed))) {
        const winPercentage = Math.round(stats.matchesLost * 100 / stats.matchesPlayed);
        const winningProbability = Math.round(100 * (1 / (1 + Math.pow(10, -(vipRating - playerRating[player].rating) * matchLengthRoot / 2000))));
        opponentsRating += Number(playerRating[player].rating) * stats.matchesPlayed;
        opponentsList += `|${stats.matchesLost} - ${stats.matchesWon}|${player}|${winPercentage}|${winningProbability}|${playerRating[player].rating}|${stats.matchesPlayed}|\n`;
    }

    let playerInfoList = '|   |    |% Won|% Exp|Rat|Matches|\n|:---:|:---:|:---:|:---:|:---:|:---:|\n';
    playerInfoList += vipPlayer;
    playerInfoList += `|--------|--------|--------|------|-----|---------|\n`;
    playerInfoList += opponentsList;

    const opponentsMeanRating = Math.round(opponentsRating / vipPlayerMatchesPlayed);
    playerInfoList += `||x̄|||${opponentsMeanRating}||\n`;

    document.getElementById(summaryElement).innerHTML = marked.parse(playerInfoList);
}

// Percent Matches Won
function createPercentMatchesWonRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |% Won|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => (b[1].matchesWon/b[1].matchesPlayed)-(a[1].matchesWon/a[1].matchesPlayed))) {
        const winPercentage = Math.round(stats.matchesWon*100/stats.matchesPlayed);
        rankingList += `|${rank++}|${player}|${winPercentage}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Current Streak
function createCurrentStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Current Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].currentStreak-a[1].currentStreak)) {
        rankingList += `|${rank++}|${player}|${stats.currentStreak}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}


// Longest Winning Streak
function createLongestWinningStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Winning Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].longestWon-a[1].longestWon)) {
        rankingList += `|${rank++}|${player}|${stats.longestWon}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Longest Losing Streak
function createLongestLosingStreakRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Losing Streak|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].longestLost-a[1].longestLost)) {
        rankingList += `|${rank++}|${player}|${stats.longestLost}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Matches Played
function createMatchesPlayedRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Matches|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalMatchesPlayed = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].matchesPlayed-a[1].matchesPlayed)) {
        totalMatchesPlayed += stats.matchesPlayed;
        rankingList += `|${rank++}|${player}|${stats.matchesPlayed}|${stats.matchesWon} - ${stats.matchesLost}|\n`;
    }   
    rankingList += `||∑|${totalMatchesPlayed/2}||\n`;    
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Last Time Active Ranking List
function createLastTimeActiveRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Idle Days|Date|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => a[1].lastDateActive>b[1].lastDateActive ? -1 : 1)) {
        let today = new Date();
        let lastDateActive = new Date(stats.lastDateActive);
        let timeInMS = today.getTime() - lastDateActive.getTime();
        const inactiveDays = Math.ceil(timeInMS / (1000 * 60 * 60 * 24)) - 1;

        rankingList += `|${rank++}|${player}|${inactiveDays}|${stats.lastDateActive}|\n`;
    }   
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Rangliste Ranking List
function createRanglisteRankingList(summaryElement, rankingSummary) {
    let rankingList = '|   |   |Punkte|Result|\n|:---:|:---:|:---:|:---:|\n';

    let rank = 1;
    let totalPunkte = 0;
    for (const [player, stats] of Object.entries(rankingSummary).sort((a,b) => b[1].punkte-a[1].punkte)) {
        totalPunkte += stats.punkte;
        rankingList += `|${rank++}|${player}|${stats.punkte}|${stats.punkteMatchesWon} - ${stats.punkteMatchesLost}|\n`;
    }   
    rankingList += `||∑|${totalPunkte}||\n`;
    document.getElementById(summaryElement).innerHTML = marked.parse(rankingList);
}

// Rangliste Ranking List
function createPlayerProgressList(summaryElement, playerProgressList) {
    let progressList = '|#|Date|Player|Rating|\n|:---:|:---:|:---:|:---:|\n';
    let counter = 2;

    for (const entry of playerProgressList) {
        progressList += `|${Math.floor(counter/2)} ${counter%2?'L':'w'}|${entry.date}|${entry.player}|${Math.round(entry.rating)}|\n`;
        counter++;
    }
    document.getElementById(summaryElement).innerHTML = marked.parse(progressList);
}