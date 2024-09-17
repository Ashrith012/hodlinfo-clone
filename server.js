const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3600;

// Create a database connection
const db = new sqlite3.Database('hodlinfo.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to SQLite database.');

  // Create the crypto_data table if it doesn't already exist
  db.run(`
    CREATE TABLE IF NOT EXISTS crypto_dataNew (
      id INTEGER PRIMARY KEY,
      name TEXT,
      last DECIMAL,
      buy DECIMAL,
      sell DECIMAL,
      volume DECIMAL,
      base_unit TEXT
    )
  `, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Table crypto_data created successfully.');
  });
});

// Fetch top 100 cryptocurrencies from WazirX API and store them in the SQLite database
// async function fetchCryptoData() {
//   try {
//     // Fetch the cryptocurrency data from WazirX API
//     const response = await axios.get('https://api.wazirx.com/api/v2/tickers');

//     if (response.status === 200 && response.data) {
//       const data = response.data;
//       console.log('Data keys==========', Object.keys(data));
//       // Select the top 10 cryptocurrencies
//       const top10 = Object.entries(data).slice(0, 10);

//       // Insert data into SQLite database
//       db.serialize(() => {
//         // Clear the table before inserting new data
//         db.run(`DELETE FROM crypto_data`);

//         const stmt = db.prepare("INSERT INTO crypto_data (name, last, buy, sell, volume, base_unit) VALUES (?, ?, ?, ?, ?, ?)");
//         top10.forEach(([key, value]) => {
//           stmt.run(
//             key,               // name of the crypto
//             value.last,         // last price
//             value.buy,          // buy price
//             value.sell,         // sell price
//             value.volume,       // volume
//             value.base_unit     // base unit
//           );
//         });
//         stmt.finalize();
//       });

//       console.log('Crypto data fetched and stored successfully!');
//     } else {
//       console.error('Error fetching data:', response.status, response.statusText);
//     }
//   } catch (error) {
//     console.error('Error fetching data:', error);
//   }
// }

async function fetchCryptoData() {
  try {
    // Fetch the cryptocurrency data from WazirX API
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');

    if (response.status === 200 && response.data) {
      const data = response.data;

      // Convert the data object to an array of entries and sort by volume (or any other criterion)
      const sortedData = Object.entries(data).sort(([, a], [, b]) => {
        return parseFloat(b.volume) - parseFloat(a.volume); // Sort by volume in descending order
      });

      // Log the sorted keys for verification
      console.log('Top 10 sorted keys by volume:', sortedData.slice(0, 10).map(([key]) => key));

      // Select the top 10 cryptocurrencies
      const top10 = sortedData.slice(0, 10);

      // Insert data into SQLite database
      db.serialize(() => {
        // Clear the table before inserting new data
        db.run(`DELETE FROM crypto_dataNew`);

        const stmt = db.prepare("INSERT INTO crypto_dataNew (name, last, buy, sell, volume, base_unit) VALUES (?, ?, ?, ?, ?, ?)");
        top10.forEach(([key, value]) => {
          stmt.run(
            key,               // name of the crypto
            value.last,         // last price
            value.buy,          // buy price
            value.sell,         // sell price
            value.volume,       // volume
            value.base_unit     // base unit
          );
        });
        stmt.finalize();
      });

      console.log('Crypto data fetched and stored successfully!');
    } else {
      console.error('Error fetching data:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}


// Fetch data from the SQLite database and send it as JSON in response
app.get('/api/getTop10', async (req, res) => {
  try {
    db.all('SELECT * FROM crypto_dataNew', (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error fetching data');
      } else {
        res.json(rows); 
        console.log("printing ID======",rows) // Send the data as JSON response
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data');
  }
});

// Serve static files (HTML, CSS, etc.) from the public folder
app.use(express.static('public'));

// Start the server and fetch data on startup
(async () => {
  await fetchCryptoData();  // Fetch the crypto data once the server starts

  // Set an interval to refresh the data every 10 minutes (600000 ms)
  setInterval(fetchCryptoData, 600000);

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
