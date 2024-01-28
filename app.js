const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dataBasePath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Data Base Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1 Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
      SELECT 
        player_id AS playerId,
        player_name AS playerName
      FROM
        player_details;`;
  const players = await db.all(getPlayerQuery);
  response.send(players);
});

//API 2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
      SELECT 
        player_id AS playerId,
        player_name AS playerName
      FROM
        player_details
      WHERE
        player_id = ${playerId};`;
  const players = await db.get(getPlayerQuery);
  response.send(players);
});

//API 3 Updates the details of a specific player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
      SELECT 
        match_id AS matchId,
        match,
        year
      FROM
        match_details
      WHERE
        match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

//API 5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
      SELECT 
        match_details.match_id AS matchId,
        match_details.match,
        match_details.year
      FROM
        player_details NATURAL JOIN (
          match_details NATURAL JOIN player_match_score
          )
      WHERE
        player_details.player_id = ${playerId};`;
  const matches = await db.all(getMatchesQuery);
  response.send(matches);
});

//API 6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `
      SELECT 
        player_id AS playerId,
        player_details.player_name AS playerName
      FROM
          match_details NATURAL JOIN (
              player_match_score NATURAL JOIN player_details)
      WHERE
        match_details.match_id = ${matchId};`;
  const matches = await db.all(getMatchesQuery);
  response.send(matches);
});

//API 7 Returns the statistics of the total score, fours, sixes
//of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
      SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  //   console.log(playerId);
  const players = await db.get(getPlayersQuery);

  response.send(players);
});

module.exports = app;
