// --- import pg and create client ---

const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory_db"
);

// --- import express and store in app ---

const express = require("express");
const app = express();

// --- init function

const init = async () => {
  // --- connect client to database ---

  await client.connect();

  // --- query tables and seed data ---

  const SQL = `DROP TABLE IF EXISTS departments CASCADE;
               DROP TABLE IF EXISTS employees;
                    CREATE TABLE departments (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR(50)
                    );
                    CREATE TABLE employees (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR(30),
                            created_at TIMESTAMP DEFAULT now(), 
                            updated_at TIMESTAMP DEFAULT now(),
                            department_id INTEGER REFERENCES departments(id)
                    );
                    INSERT INTO departments (name) VALUES ('security');
                    INSERT INTO departments (name) VALUES ('sales');
                    INSERT INTO departments (name) VALUES  ('return');
                    INSERT INTO departments (name) VALUES ('electronics');
                    INSERT INTO employees (name, department_id) VALUES ('nathaniel', 3);
                    INSERT INTO employees (name, department_id) VALUES ('sharon', 4);
                    INSERT INTO employees (name, department_id) VALUES ('chinedu', 1);
                    INSERT INTO employees (name, department_id) VALUES ('bryce', 2);
                        `;
  await client.query(SQL);
  console.log("data seeded");

  // --- create port and listener ---

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

// invoke init

init();

// --- JSON parsing and logging ---

app.use(express.json());
app.use(require("morgan")("dev"));

// --- CRUD SECTION ---

// ~~~ read ~~~

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//  ~~~ read ~~~

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//  ~~~ create ~~~

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//  ~~~ delete ~~~

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees 
                 WHERE id =$1 
                 RETURNING *`;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(404);
  } catch (error) {
    next(error);
  }
});

//  ~~~ update ~~~

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE employees 
                 SET name=$1, created_at=now(), updated_at=now(), department_id=$2
                 WHERE id=$3
                 RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
