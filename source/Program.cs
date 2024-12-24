using System;
using System.Data;
using System.Globalization;
using System.IO;

namespace bigeloCLI
{
    internal class Program
    {
        private readonly DataTable dataMatchList = new DataTable("Match List");
        private readonly DataTable dataRatingList = new DataTable("Rating List");


        private void MakeDataTables()
        {
            if (dataMatchList == null) return;

            dataMatchList.Columns.Add("Date", typeof(DateTime));
            dataMatchList.Columns.Add("Winner", typeof(String));
            dataMatchList.Columns.Add("Loser", typeof(String));
            dataMatchList.Columns.Add("Change", typeof(Double));
            dataMatchList.Columns.Add("Length", typeof(Int32));

            if (dataRatingList == null) return;

            DataColumn column = dataRatingList.Columns.Add("Name", typeof(String));
            column.Unique = true;

            var dcKey = dataRatingList.Columns["Name"];
            if (dcKey != null) dataRatingList.PrimaryKey = new DataColumn[] { dcKey };

            dataRatingList.Columns.Add("Rating", typeof(Double));
            dataRatingList.Columns.Add("Change", typeof(Double));
            dataRatingList.Columns.Add("Experience", typeof(Int32));
        }


        readonly TextInfo tiTextInfo = CultureInfo.CurrentCulture.TextInfo;

        private void AddMatch(string sMatchRecord)
        {
            string[] fields = sMatchRecord.Split('|');
            if (fields == null) return;
            if (fields.Length != 6) return; // 4 fields are required

            string sDateTime = fields[1].Trim();
            string sWinner = fields[2].Trim();
            string sLoser = fields[3].Trim();
            string sMatchLength = fields[4].Trim();

            sWinner = tiTextInfo.ToTitleCase(sWinner.ToLower());
            sLoser = tiTextInfo.ToTitleCase(sLoser.ToLower());

            if (!int.TryParse(sMatchLength, out int iMatchLength)) return;

            DataRow drToUpdate = dataMatchList.NewRow();
            drToUpdate["Date"] = sDateTime;
            drToUpdate["Winner"] = sWinner;
            drToUpdate["Loser"] = sLoser;
            drToUpdate["Length"] = iMatchLength;
            dataMatchList.Rows.Add(drToUpdate);
        }


        void LoadMatchList()
        {
            if (File.Exists("Match List.md"))
            {
                FileStream fsMatchList = new FileStream("Match List.md", FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                StreamReader srMatchList = new StreamReader(fsMatchList);

                if (!srMatchList.EndOfStream)
                {
                    dataMatchList.BeginLoadData();
                    var sMatchRecord = srMatchList.ReadLine();
                    while (sMatchRecord != null)
                    {
                        AddMatch(sMatchRecord);
                        sMatchRecord = srMatchList.ReadLine();
                    }
                    dataMatchList.EndLoadData();
                }
                dataMatchList.AcceptChanges();
            }
        }


        private DataRow AddPlayer(string sPlayer)
        {
            DataRow drPlayer = dataRatingList.NewRow();
            drPlayer["Name"] = sPlayer;
            drPlayer["Rating"] = 1800;
            drPlayer["Change"] = 0;
            drPlayer["Experience"] = 0;
            dataRatingList.Rows.Add(drPlayer);

            return drPlayer;
        }


        private DataRow GetPlayer(string sPlayer)
        {
            DataRow drPlayer = dataRatingList.Rows.Find(sPlayer) ?? AddPlayer(sPlayer);
            return drPlayer;
        }


        private void CalculateRatingList()
        {
            foreach (DataRow drPlayer in dataRatingList.Rows)
            {
                drPlayer.SetField("Rating", 1800);
            }

            dataRatingList.BeginLoadData();
            foreach (DataRow drMatchRecord in dataMatchList.Rows)
            {
                string sWinner = (string)drMatchRecord["Winner"];
                string sLoser = (string)drMatchRecord["Loser"];

                if (sWinner != sLoser)
                {
                    DateTime dtMatchDate = (DateTime)drMatchRecord["Date"];
                    int iMatchLength = (int)drMatchRecord["Length"];

                    DataRow drWinner = GetPlayer(sWinner);
                    DataRow drLoser = GetPlayer(sLoser);

                    double dWinnerRating = (double)drWinner["Rating"];
                    int iWinnerExperience = (int)drWinner["Experience"];
                    double dLoserRating = (double)drLoser["Rating"];
                    int iLoserExperience = (int)drLoser["Experience"];

                    // Here, P is the probability of player 1 winning the match and S is the number of rating points at stake. These are given by:
                    // P = 1 / (1 + 10^(-(A-B) × √N / 2000))
                    // S = 4 × √N

                    double dLengthRoot = Math.Sqrt(iMatchLength);
                    double dRatingPointsAtStake = 4 * dLengthRoot;
                    double dWinningProbability = 1.0 / (1.0 + Math.Pow(10.0, -(dWinnerRating - dLoserRating) * dLengthRoot / 2000.0));

                    // If player 1 rated A wins a match up to N points against player 2 rated B, the rating of player 1 with W points and then the rating of player 2 drops with W points, where:
                    // W = (1 − P) × S

                    double dRatingDifference = (1.0 - dWinningProbability) * dRatingPointsAtStake;

                    dWinnerRating += dRatingDifference;
                    dLoserRating -= dRatingDifference;

                    drWinner["Rating"] = dWinnerRating;
                    drWinner["Change"] = dRatingDifference;
                    drWinner["Experience"] = iWinnerExperience + iMatchLength;

                    drLoser["Rating"] = dLoserRating;
                    drLoser["Change"] = -dRatingDifference;
                    drLoser["Experience"] = iLoserExperience + iMatchLength;
                }
            }
            dataRatingList.EndLoadData();
        }


        private void SaveRatingList()
        {
            StreamWriter swRatingList = new StreamWriter("README.md");

            dataRatingList.DefaultView.Sort = "Rating DESC";
            DataTable dataSortedRatingList = dataRatingList.DefaultView.ToTable();

            swRatingList.WriteLine("| |Name|Rating|+/-|Exp|");
            swRatingList.WriteLine("|-|:--:|:----:|:-:|:-:|");

            int iRank = 1;
            foreach (DataRow drPlayer in dataSortedRatingList.Rows)
            {
                string sPlayerName = (string)drPlayer["Name"];
                if (sPlayerName != null)
                {
                    string sPlayerRating = String.Format("|{0}|{1}|{2:N0}|{3:+0.#;-#.#}|{4}|", iRank++, sPlayerName,
                                                        (double)drPlayer["Rating"],
                                                        (double)drPlayer["Change"],
                                                        (int)drPlayer["Experience"]);
                    swRatingList.WriteLine(sPlayerRating);
                }
            }

            swRatingList.WriteLine();
            swRatingList.WriteLine(" ");
            swRatingList.WriteLine();
            swRatingList.WriteLine("## Reporting");
            swRatingList.WriteLine();
            swRatingList.WriteLine("Frequent players are included in dropdown menus to ease the match reporting.");
            swRatingList.WriteLine("When a player, who is not included in dropdown menus is involved, the name of the player has to be typed in.");
            swRatingList.WriteLine();
            swRatingList.WriteLine("- Report Match:  is used for matches between players that are normally present during the Saturday sessions.");
            swRatingList.WriteLine("Matches are reported using dropdown menus for the winner/loser name and the match length.");
            swRatingList.WriteLine("- Report New Player Match:  is used for matches with a player not in the dropdown menus, for example, when a new player joins.");
            swRatingList.WriteLine("Matches are reported using dropdown menus or editing the name manual for the winner/loser name and the match length.");
            swRatingList.WriteLine();
            swRatingList.WriteLine("To report any of the two match types go to Actions, select the match type, click on RUN WORKFLOW.");
            swRatingList.WriteLine("Select or type in the Winner, the Loser and the Match Length.");
            swRatingList.WriteLine("Click on RUN WORKFLOW again to submit the match report.");
            swRatingList.WriteLine();
            swRatingList.WriteLine("The rating list will be updated after around 30 seconds.");
            swRatingList.WriteLine();
            swRatingList.WriteLine("### Reporting Guidelines");
            swRatingList.WriteLine();
            swRatingList.WriteLine("Only the winner reports the result of a match.");
            swRatingList.WriteLine("A match counts only for the rating if it is a live played match (no money play or chouettes)");
            swRatingList.WriteLine("with both players agreeing beforehand that it will count for the rating.");
            swRatingList.WriteLine();
            swRatingList.WriteLine("- The winner chooses his name, for a new player: type in your name.");
            swRatingList.WriteLine("- The winner chooses the name of his opponent, for a new player: type in the name of the opponent.");
            swRatingList.WriteLine("- The winner chooses the length of the match.");
            swRatingList.WriteLine("- The winner clicks on RUN WORKFLOW (submit).");
            swRatingList.Flush();
            swRatingList.Close();
        }


        static void Main()
        {
            var bigeloCLI = new Program();
            bigeloCLI.MakeDataTables();
            bigeloCLI.LoadMatchList();
            bigeloCLI.CalculateRatingList();
            bigeloCLI.SaveRatingList();
        }
    }
}