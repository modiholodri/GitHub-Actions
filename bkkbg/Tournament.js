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

    let html = '';
    rounds.forEach((matches, i) => {
        html += `<h5>Round ${i + 1}</h5><ul>`;
        matches.forEach(match => {
            html += `<li>${match}</li>`;
        });
        html += '</ul>';
    });

    document.getElementById('tournament').innerHTML = html;
}