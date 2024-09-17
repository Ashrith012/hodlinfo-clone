document.addEventListener('DOMContentLoaded', () => {
    fetchCryptoData();
});

async function fetchCryptoData() {
    try {
        // Fetch the cryptocurrency data from your backend API (assuming '/api/crypto' returns the top 10)
        const response = await fetch('/api/crypto');
        const data = await response.json();

        // Grab the table body element where the crypto data will be displayed
        const tableBody = document.querySelector('#crypto-table');
        tableBody.innerHTML = ''; // Clear any existing rows

        let bestPrice = 0;

        // Loop through the top 10 cryptos returned by the API
        data.forEach((crypto, index) => {
            const row = document.createElement('tr');

            // Extract data for each cryptocurrency (replace these fields with your actual API structure)
            const lastPrice = parseFloat(crypto.last);
            const buyPrice = parseFloat(crypto.buy);
            const sellPrice = parseFloat(crypto.sell);
            const platform = crypto.name;
            const difference = ((buyPrice - lastPrice) / lastPrice) * 100;
            const savings = Math.abs(difference * lastPrice / 100); // Sample savings calculation

            // Check for the highest price for 'Best Price to Trade'
            if (lastPrice > bestPrice) {
                bestPrice = lastPrice;
            }

            // Create a row and populate it with data
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${platform}</td>
                <td>₹ ${lastPrice.toLocaleString()}</td>
                <td>₹ ${buyPrice.toLocaleString()} / ₹ ${sellPrice.toLocaleString()}</td>
                <td>${difference.toFixed(2)} %</td>
                <td>₹ ${savings.toLocaleString()}</td>
            `;

            // Append the row to the table body
            tableBody.appendChild(row);
        });

        // Update the 'Best Price to Trade' section in the header
        document.getElementById('best-price').textContent = bestPrice.toLocaleString();
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error);
    }
}
