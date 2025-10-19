let oneSecondInterval = setInterval(showSubmissionStatus, 1000);

let newSubmission = false;
let anotherSubmissionActive = false;
let previousRunID = '';

let latestRunID = '';
let latestRunConclusion = '';
let latestRunStatus = '';
let latestRunUpdatedAt = '';

// show the submission status when a submission is going on
function showSubmissionStatus() {
    // show the status of a new submission until the status is Completed
    if (newSubmission) {
        refreshRunsStatus();
        if (latestRunID !== previousRunID) {
            setRunsInfo(`${latestRunStatus} -> ${latestRunConclusion}`);
            if (latestRunStatus === 'Completed') {
                fetchRatingList();
                fetchMatchList();
                newSubmission = false;
                document.getElementById("submit").disabled = false;
                document.getElementById("startTournamentButton").disabled = false;
                document.getElementById("freezeTournamentButton").disabled = false;
            }
        }
    }

    // show the status of other submissions until the submission is Completed
    if (anotherSubmissionActive) {
        refreshRunsStatus();
        setRunsInfo(`${latestRunID}: ${latestRunStatus} -> ${latestRunConclusion}`);
        if (latestRunStatus === 'Completed') {
            anotherSubmissionActive = false;
            document.getElementById("submit").disabled = false;
            document.getElementById("startTournamentButton").disabled = false;
            document.getElementById("freezeTournamentButton").disabled = false;
        }
    }
}

// Submit a match report
document.getElementById('matchReportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // get the winner name
    let winnerName = document.getElementById('winnerName').value;
    if (winnerName === 'Select') winnerName = document.getElementById('winnerNameTyped').value;
    
    // get the loser name
    let loserName = document.getElementById('loserName').value;
    if (loserName === 'Select') loserName = document.getElementById('loserNameTyped').value;
    
    // get the match length
    let matchLength = document.getElementById('matchLengthTyped').value;
    if (matchLength === '') matchLength = document.getElementById('matchLength').value;

    const repoName = document.getElementById('clubSelection').value;

    if (!winnerName) {
        alert('Select or edit the Winner name!');
    }
    else if (!loserName) {
        alert('Select or edit the Loser name!');
    }
    else if (!githubToken) {
        alert('Add a valid GitHub token!');
    }
    else {
        await refreshRunsStatus();
        setSubmissionStatus(`Submitting match...\n ${winnerName} > ${loserName} -> ${matchLength}`);
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
                    event_type: 'match_report', 
                    client_payload: { 
                        winner_name: `${winnerName}`,
                        loser_name:  `${loserName}`, 
                        match_length: `${matchLength}`
                    } 
                })
            });

            newSubmission = true;
            document.getElementById("submit").disabled = true;
            document.getElementById("startTournamentButton").disabled = true;
            document.getElementById("freezeTournamentButton").disabled = true;

            // reset the inputs
            document.getElementById('winnerName').value = 'Select or edit';
            document.getElementById('winnerNameTyped').value = '';
            
            document.getElementById('loserName').value = 'Select or edit';
            document.getElementById('loserNameTyped').value = '';
        } 
        catch (error) { 
            // Error triggering GitHub Action: Failed to execute 'json' on 'Response': Unexpected end of JSON input
            alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
        }
    }
});

// Fetch the Runs Status
async function  refreshRunsStatus() {
    const repoName = document.getElementById('clubSelection').value;

    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=1&timestamp=${Date.now()}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const workflowRuns = data.workflow_runs;

        // ${run.id} ${run.name} ${run.status} ${run.conclusion} ${run.created_at} ${run.updated_at} ${run.jobs_url}`
        if (!workflowRuns || workflowRuns.length === 0) {
            latestRunID = 'xxx';
            latestRunStatus = 'No Runs';
            latestRunConclusion = 'N/A';
            latestRunUpdatedAt = formatTimestamp(new Date());
            return;
        }
        
        latestRunID = workflowRuns[0].id;
        latestRunStatus = toTitleCase(workflowRuns[0].status.replaceAll('_', ' '));
        latestRunUpdatedAt = formatTimestamp(workflowRuns[0].updated_at);
        latestRunConclusion = workflowRuns[0].conclusion ? toTitleCase(workflowRuns[0].conclusion.toUpperCase()) : 'Wait...';;
    } 
    catch (error) { 
        alert('Error triggering GitHub Action: ' + error.message); // Handle error (e.g., notify user, retry, etc.)
    }
}

// Format the UTC time stamp in a nicer way
const formatTimestamp = (timestamp)=> {
    const datetime = new Date(timestamp)
    const dateString = datetime.toISOString().split('T')[0];
    const timeString = datetime.toTimeString().split(' ')[0];
    return `${dateString} ${timeString}`;
}

// Set the last Runs Info
function setRunsInfo (runsInfo) {
    document.getElementById("runsInfo").innerText = runsInfo;
    if (runsInfo.includes('Success')) {
        setSubmissionStatus(document.getElementById("submissionStatus").innerText.replace('Submitting', 'Submitted'));
    }
    document.getElementById("runsInfo").style.color = runsInfo.includes('Success') ? 'green' : runsInfo.includes('Failure') ? 'red' : 'white';
}

// Set the Submission Status
function setSubmissionStatus (submissionStatus) {
    document.getElementById("submissionStatus").innerText = submissionStatus;
}

// Convert a string to Title Case
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

// Clear the Submission Status
function clearSubmissionStatus() {
    document.getElementById('submissionStatus').innerHTML = '';
    document.getElementById('runsInfo').innerHTML = '';
}

// Update the Submission Status
document.getElementById("updateSubmissionStatus").addEventListener("click", async () => {
    await refreshRunsStatus();
    setSubmissionStatus(`Last Submission:\n${latestRunID}: ${latestRunUpdatedAt}`);
    setRunsInfo(`${latestRunStatus} -> ${latestRunConclusion}`);
});

