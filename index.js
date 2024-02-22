const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/flavors_db"
);

//parse the body into JS objects
app.use(express.json());

//log the requests as they come in
app.use(require("morgan")("dev"));

//Define routes

//read flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * FROM flavors;
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

//read single flavor
app.get("/api/flavors/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const SQL = `
        SELECT * FROM flavors WHERE id = $1;
        `;
    const response = await client.query(SQL, [id]);
    const flavor = response.rows[0];

    if (!flavor) {
      return res.status(404).json({ error: "Flavor not found" });
    }

    res.json(flavor);
  } catch (ex) {
    next(ex);
  }
});

//Create flavors

app.post("/api/flavors", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    const SQL = `
         INSERT INTO flavors(name, is_favorite)
         VALUES($1, $2)
         RETURNING *   
        `;
    const response = await client.query(SQL, [name, is_favorite]);
    res.status(201).json(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

//delete flavors

app.delete("/api/flavors/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const SQL = `
            DELETE FROM flavors WHERE id = $1;
        `;
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

//update flavors

app.put("/api/flavors/:id", async (req, res, next) => {
  const { id } = req.params;
  const { name, is_favorite } = req.body;
  try {
    const SQL = `
            UPDATE flavors
            SET name = $1, is_favorite = $2, updated_at = now()
            WHERE id = $3
            RETURNING *
        `;
    const response = await client.query(SQL, [name, is_favorite, id]);

    if (!response.rows[0]) {
      return res.status(404).json({ error: "Flavor not found" });
    }

    res.json(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

const init = async () => {
  try {
    await client.connect();
    console.log("connected to database");

    //Drop the table if it exists
    await client.query("DROP TABLE IF EXISTS flavors");

    //create the flavors table
    let SQL = `
        CREATE TABLE flavors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_favorite BOOLEAN,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP


        );
    `;
    await client.query(SQL);
    console.log("tables created");

    //seed table with flavors

    SQL = `
    INSERT INTO flavors (name, is_favorite) VALUES
            ('Vanilla', true),
            ('Chocolate', false),
            ('Strawberry', true)
    `;
    await client.query(SQL);
    console.log("seeded data");

    //start the server after initializing the database
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

//initialize database
init();
