const express = require("express");
const cors = require("cors");
const db = require("../connect");
const ridesRoute = express.Router();

ridesRoute.use(cors());
ridesRoute.use(express.json());

ridesRoute.get("/read", (req, res) => {
  const sql = `SELECT 
            r.rideID, r.rideName, r.capacity, r.openingTime, r.closingTime, 
            r.rideType, r.rideDesc, r.imageFileName, 
            concat(e.Fname, ' ', e.Lname ) AS technician 
        FROM rides r
        LEFT JOIN employee e ON r.technician = e.ssn
        `;
  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    res.json({ result });
  });
});

// Insert a new ride
ridesRoute.post('/create', (req, res) => {
  // Extract ride details from request body
  const { rideName, rideType, capacity, openingTime, closingTime, technician } = req.body;

  // Basic validation
  if (!rideName || !capacity || !openingTime || !closingTime) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Insert query
  const query = `
    INSERT INTO Rides (rideName, rideType, capacity, openingTime, closingTime, technician, imageFileName)
    VALUES (?, ?, ?, ?, ?, ?, 'under-construction.webp')
  `;

  // Execute query with callback
  db.execute(query, [rideName, rideType, capacity, openingTime, closingTime, technician], (error, results) => {
    if (error) {
      console.error("Error inserting ride:", error);
      return res.status(500).json({ error: "Failed to insert ride" });
    }

    // Return success response
    res.status(201).json({ message: "Ride inserted successfully", rideID: results.insertId });
  });
});

ridesRoute.delete("/:rideID", (req, res) => {
  const { rideID } = req.params;
  const query = "DELETE FROM rides WHERE rideID = ?";
  db.query(query, [rideID], (err) => {
      if (err) {
          console.error("Error deleting ride:", err);
          res.status(500).send("Error deleting ride");
      } else {
          res.send("Ride deleted successfully");
      }
  });
});

ridesRoute.put('/:id', (req, res) => {
  const { rideName, rideType, capacity, openingTime, closingTime, technician } = req.body;
  db.query(
      'UPDATE Rides SET rideName = ?, rideType = ?, capacity = ?, openingTime = ?, closingTime = ?, technician = ?, WHERE rideID = ?',
      [ rideName, rideType, capacity, openingTime, closingTime, technician, req.params.id],
      (err) => {
          if (err) throw err;
      }
  );
});

ridesRoute.get("/top-rides", (req, res) => {
  const query = `
      SELECT rideName, rideType, capacity, SUM(visitCount) as popularityScore 
      FROM rides r join ridevisit rv on r.rideID = rv.rideID 
	    GROUP BY rv.rideID
      ORDER BY popularityScore DESC
      LIMIT 5
  `;
  db.query(query, (err, result) => {
      if (err) {
          console.error("Error fetching top rides:", err);
          res.status(500).send("Error fetching top rides");
      } else {
          res.json( {result} );
      }
  });
});


module.exports = ridesRoute;

