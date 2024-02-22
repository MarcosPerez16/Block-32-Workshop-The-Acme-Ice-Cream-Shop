const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/flavors_db"
);

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
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();

    //start the server after initializing the database
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
};

init();
