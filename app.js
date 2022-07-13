const express = require("express");
const app = express();

const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let database = null;
app.use(express.json());
const intiliazeServerAndDatabase = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`database Error:${e.message}`);
    process.exit(1);
  }
};
intiliazeServerAndDatabase();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
       *
    FROM 
       state
    `;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSingleQuery = `
        SELECT 
        *
        FROM 
            state
          WHERE 
          state_id=${stateId}  
        `;
  const singleArray = await database.get(getSingleQuery);
  response.send(convertStateDbObjectToResponseObject(singleArray));
});
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await database.get(getDistrictsQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletequery = `
    DELETE FROM 
    district
    WHERE district_id=${districtId}
  `;
  await database.run(deletequery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updatequery = `
        UPDATE 
        district
        SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        WHERE 
        district_id=${districtId}
    `;
  await database.run(updatequery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statistics = `
     SELECT 
     SUM(cases) as  totalCases,
     SUM(cured) as  totalCured,
     SUM(active) as totalActive,
     SUM(deaths) as totalDeaths
     FROM 
     district
     WHERE state_id=${stateId}
     `;
  const query = await database.get(statistics);
  response.send(query);
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query1 = `
  SELECT 
  state_name as stateName
  FROM 
  district
  NATURAL JOIN state
  WHERE district_id=${districtId}
  `;
  const statename = await database.get(query1);
  response.send(statename);
});

module.exports = app;
