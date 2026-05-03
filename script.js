// =============================================
//  CryptoDash — script.js (BEGINNER VERSION)
//  Simple JavaScript — no complex stuff!
// =============================================

// ── GLOBAL VARIABLES ──
let allCoins = [];           // stores all coins from API
let currency = "usd";       // current currency (usd or inr)
let symbol   = "$";         // current symbol ($ or ₹)
const INR_RATE = 83.5;      // 1 USD = 83.5 INR

// =============================================
//  WHEN PAGE LOADS — decide what to run
// =============================================
window.onload = function() {

  // Read saved currency from localStorage
  let saved = localStorage.getItem("currency");
  if (saved === "inr") {
    currency = "inr";
    symbol   = "₹";
  }

  // Home page
  if (document.getElementById("coin-list")) {
    fetchCoins();
  }

  // Detail page
  if (document.getElementById("detail-box")) {
    showCoinDetail();
  }

  // Portfolio page
  if (document.getElementById("portfolio-list")) {
    showPortfolio();
  }

  // Highlight active nav link
  highlightNav();

  // Update currency buttons look
  updateCurrencyButtons();
}

// =============================================
//  FETCH COINS FROM API
// =============================================
async function fetchCoins() {

  // Show loading text
  document.getElementById("coin-list").innerHTML = "<p style='color:#aaa;padding:20px'>Loading coins...</p>";

  try {
    // Call the API
    let response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1");
    let data     = await response.json();

    // Save coins to our global variable
    allCoins = data;

    // Show coins on page
    showCoins(allCoins);

    // Update hero stats
    updateStats();

  } catch (error) {
    // If API fails, show simulated data
    allCoins = getFakeData();
    showCoins(allCoins);
    updateStats();
    document.getElementById("coin-list").insertAdjacentHTML("beforebegin",
      "<p style='color:#ff4d6d;padding:10px 32px'>⚠️ Could not load live data. Showing sample data.</p>"
    );
  }
}

// =============================================
//  SHOW COINS ON HOME PAGE
// =============================================
function showCoins(coins) {
  let list = document.getElementById("coin-list");

  // If no coins found
  if (coins.length === 0) {
    list.innerHTML = "<p style='color:#aaa;padding:20px'>No coins found!</p>";
    return;
  }

  // Build HTML for each coin
  let html = "";

  for (let i = 0; i < coins.length; i++) {
    let coin   = coins[i];
    let price  = coin.current_price;
    let change = coin.price_change_percentage_24h.toFixed(2);

    // Convert to INR if needed
    if (currency === "inr") {
      price = price * INR_RATE;
    }

    // Is price going up or down?
    let changeColor = change > 0 ? "#00e676" : "#ff4d6d";
    let arrow       = change > 0 ? "▲" : "▼";

    html += `
      <div class="coin-row" onclick="goToDetail('${coin.id}')">
        <span class="rank">${coin.market_cap_rank}</span>
        <span class="coin-name">
          <strong>${coin.name}</strong>
          <small>${coin.symbol.toUpperCase()}</small>
        </span>
        <span class="price">${symbol}${formatPrice(price)}</span>
        <span style="color:${changeColor}; font-weight:600;">
          ${arrow} ${Math.abs(change)}%
        </span>
        <button class="add-btn" onclick="event.stopPropagation(); addToPortfolio('${coin.id}', '${coin.name}', '${coin.symbol.toUpperCase()}', ${coin.current_price})">
          + Add
        </button>
      </div>
    `;
  }

  list.innerHTML = html;
}

// =============================================
//  SEARCH COINS
// =============================================
function searchCoins() {
  let input    = document.getElementById("search-input").value.toLowerCase();
  let filtered = [];

  for (let i = 0; i < allCoins.length; i++) {
    let coin = allCoins[i];
    if (coin.name.toLowerCase().includes(input) || coin.symbol.toLowerCase().includes(input)) {
      filtered.push(coin);
    }
  }

  showCoins(filtered);
}

// =============================================
//  SORT COINS
// =============================================
function sortCoins() {
  let sortValue = document.getElementById("sort-select").value;
  let sorted    = [...allCoins]; // copy the array

  if (sortValue === "price-high") {
    sorted.sort(function(a, b) { return b.current_price - a.current_price; });
  } else if (sortValue === "price-low") {
    sorted.sort(function(a, b) { return a.current_price - b.current_price; });
  } else if (sortValue === "change-high") {
    sorted.sort(function(a, b) { return b.price_change_percentage_24h - a.price_change_percentage_24h; });
  } else {
    sorted.sort(function(a, b) { return a.market_cap_rank - b.market_cap_rank; });
  }

  showCoins(sorted);
}

// =============================================
//  UPDATE HERO STATS
// =============================================
function updateStats() {
  // Find BTC and ETH
  let btc = null;
  let eth = null;

  for (let i = 0; i < allCoins.length; i++) {
    if (allCoins[i].symbol === "btc") btc = allCoins[i];
    if (allCoins[i].symbol === "eth") eth = allCoins[i];
  }

  let btcEl = document.getElementById("btc-price");
  let ethEl = document.getElementById("eth-price");
  let totEl = document.getElementById("total-coins");

  if (btcEl && btc) {
    let price = currency === "inr" ? btc.current_price * INR_RATE : btc.current_price;
    btcEl.textContent = symbol + formatPrice(price);
  }
  if (ethEl && eth) {
    let price = currency === "inr" ? eth.current_price * INR_RATE : eth.current_price;
    ethEl.textContent = symbol + formatPrice(price);
  }
  if (totEl) {
    totEl.textContent = allCoins.length + " coins";
  }
}

// =============================================
//  GO TO DETAIL PAGE
// =============================================
function goToDetail(coinId) {
  // Save which coin was clicked
  localStorage.setItem("selectedCoin", coinId);
  window.location.href = "detail.html";
}

// =============================================
//  SHOW COIN DETAIL PAGE
// =============================================
async function showCoinDetail() {
  // Get which coin was saved
  let coinId = localStorage.getItem("selectedCoin");

  if (!coinId) {
    window.location.href = "index.html";
    return;
  }

  try {
    // Fetch that one coin
    let response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + coinId);
    let data     = await response.json();
    let coin     = data[0];

    // Save coin for buy form
    localStorage.setItem("detailCoin", JSON.stringify({
      id:     coin.id,
      name:   coin.name,
      symbol: coin.symbol.toUpperCase(),
      price:  coin.current_price
    }));

    // Calculate display price
    let price  = currency === "inr" ? coin.current_price * INR_RATE : coin.current_price;
    let change = coin.price_change_percentage_24h.toFixed(2);
    let isUp   = change > 0;

    // Fill in the page
    document.getElementById("d-name").textContent   = coin.name;
    document.getElementById("d-symbol").textContent = coin.symbol.toUpperCase();
    document.getElementById("d-rank").textContent   = "Rank #" + coin.market_cap_rank;
    document.getElementById("d-price").textContent  = symbol + formatPrice(price);

    let changeEl = document.getElementById("d-change");
    changeEl.textContent = (isUp ? "▲ +" : "▼ ") + change + "% (24h)";
    changeEl.style.color = isUp ? "#00e676" : "#ff4d6d";

    document.getElementById("d-mcap").textContent   = symbol + formatLarge(coin.market_cap * (currency === "inr" ? INR_RATE : 1));
    document.getElementById("d-supply").textContent = formatLarge(coin.circulating_supply) + " " + coin.symbol.toUpperCase();

    // Draw chart
    drawChart(coinId, coin.current_price);

  } catch (error) {
    document.getElementById("detail-box").innerHTML = "<p style='color:#ff4d6d'>Could not load coin. <a href='index.html' style='color:#00d2ff'>Go back</a></p>";
  }
}

// =============================================
//  DRAW 7-DAY CHART
// =============================================
async function drawChart(coinId, currentPrice) {
  let labels = [];
  let prices = [];

  try {
    let response = await fetch("https://api.coingecko.com/api/v3/coins/" + coinId + "/market_chart?vs_currency=usd&days=7");
    let data     = await response.json();

    // Take every 12th point (so we get ~14 points)
    let step = Math.floor(data.prices.length / 14) || 1;

    for (let i = 0; i < data.prices.length; i += step) {
      let point = data.prices[i];
      let date  = new Date(point[0]);
      labels.push(date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
      let p = currency === "inr" ? point[1] * INR_RATE : point[1];
      prices.push(parseFloat(p.toFixed(2)));
    }

  } catch (error) {
    // Fake 7 day data if chart API fails
    let p = currentPrice * 0.93;
    for (let i = 1; i <= 7; i++) {
      p = p * (1 + (Math.random() - 0.45) * 0.04);
      prices.push(parseFloat(p.toFixed(2)));
      labels.push("Day " + i);
    }
    prices.push(currentPrice);
    labels.push("Now");
  }

  // Draw chart using Chart.js
  let canvas  = document.getElementById("priceChart");
  let isUp    = prices[prices.length - 1] >= prices[0];
  let color   = isUp ? "#00e676" : "#ff4d6d";

  new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label:           "Price",
        data:            prices,
        borderColor:     color,
        backgroundColor: color + "22",
        borderWidth:     2,
        pointRadius:     3,
        fill:            true,
        tension:         0.4
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#6b7a99" }, grid: { color: "#1e2d45" } },
        y: { ticks: { color: "#6b7a99" }, grid: { color: "#1e2d45" } }
      }
    }
  });
}

// =============================================
//  BUY COIN (from detail page)
// =============================================
function updateBuyTotal() {
  let coin  = JSON.parse(localStorage.getItem("detailCoin"));
  let qty   = parseFloat(document.getElementById("buy-qty").value);
  let el    = document.getElementById("buy-total");

  if (!qty || qty <= 0 || !coin) {
    el.textContent = "";
    return;
  }

  let price = currency === "inr" ? coin.price * INR_RATE : coin.price;
  el.textContent = "Total: " + symbol + formatPrice(price * qty);
}

function buyCoin() {
  let coin = JSON.parse(localStorage.getItem("detailCoin"));
  let qty  = parseFloat(document.getElementById("buy-qty").value);

  if (!coin) return;
  if (!qty || qty <= 0) {
    alert("Please enter a valid quantity!");
    return;
  }

  // Read existing portfolio
  let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

  // Add new entry
  portfolio.push({
    id:     coin.id,
    name:   coin.name,
    symbol: coin.symbol,
    price:  coin.price,
    qty:    qty,
    date:   new Date().toLocaleDateString()
  });

  // Save back
  localStorage.setItem("portfolio", JSON.stringify(portfolio));

  showToast("✅ " + qty + " " + coin.name + " added to portfolio!");

  setTimeout(function() {
    window.location.href = "portfolio.html";
  }, 1200);
}

// =============================================
//  ADD TO PORTFOLIO (from home page)
// =============================================
function addToPortfolio(id, name, sym, priceUsd) {
  let qty = prompt("How many " + name + " (" + sym + ") to add?");

  if (!qty || isNaN(qty) || parseFloat(qty) <= 0) return;

  let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];

  portfolio.push({
    id:     id,
    name:   name,
    symbol: sym,
    price:  priceUsd,
    qty:    parseFloat(qty),
    date:   new Date().toLocaleDateString()
  });

  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  showToast("✅ " + name + " added to portfolio!");
}

// =============================================
//  SHOW PORTFOLIO PAGE
// =============================================
function showPortfolio() {
  let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
  let list      = document.getElementById("portfolio-list");
  let totalEl   = document.getElementById("portfolio-total");
  let countEl   = document.getElementById("portfolio-count");

  if (portfolio.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;color:#6b7a99;">
        <p style="font-size:16px;">📭 No coins yet!</p>
        <p><a href="index.html" style="color:#00d2ff;">Browse coins</a> and add some.</p>
      </div>
    `;
    if (totalEl) totalEl.textContent = symbol + "0.00";
    if (countEl) countEl.textContent = "0 holdings";
    return;
  }

  let totalValue = 0;
  let chartLabels = [];
  let chartValues = [];
  let html = "";

  for (let i = 0; i < portfolio.length; i++) {
    let item  = portfolio[i];
    let price = currency === "inr" ? item.price * INR_RATE : item.price;
    let value = price * item.qty;
    totalValue += value;

    chartLabels.push(item.symbol);
    chartValues.push(value.toFixed(2));

    html += `
      <div class="ptable-row">
        <div>
          <strong>${item.name}</strong>
          <small style="display:block;color:#6b7a99;">${item.symbol}</small>
        </div>
        <div>${item.qty}</div>
        <div>${symbol}${formatPrice(price)}</div>
        <div>${symbol}${formatPrice(value)}</div>
        <button class="remove-btn" onclick="removeCoin(${i})">Remove</button>
      </div>
    `;
  }

  list.innerHTML = html;
  if (totalEl) totalEl.textContent = symbol + formatPrice(totalValue);
  if (countEl) countEl.textContent = portfolio.length + " holdings";

  // Draw doughnut chart
  let canvas = document.getElementById("portfolioChart");
  if (canvas && chartValues.length > 0) {
    let colors = ["#00d2ff","#7b61ff","#00e676","#ffd600","#ff4d6d","#ff9100","#40c4ff"];
    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels:   chartLabels,
        datasets: [{
          data:            chartValues,
          backgroundColor: colors,
          borderColor:     "#161d2e",
          borderWidth:     3
        }]
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels:   { color: "#e8eaf0", font: { size: 12 } }
          }
        }
      }
    });
  }
}

// =============================================
//  REMOVE COIN FROM PORTFOLIO
// =============================================
function removeCoin(index) {
  let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
  portfolio.splice(index, 1);
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  showPortfolio();
  showToast("🗑️ Coin removed!");
}

function clearPortfolio() {
  if (!confirm("Clear entire portfolio?")) return;
  localStorage.removeItem("portfolio");
  showPortfolio();
}

// =============================================
//  CURRENCY TOGGLE
// =============================================
function setCurrency(cur) {
  currency = cur;
  symbol   = cur === "inr" ? "₹" : "$";
  localStorage.setItem("currency", currency);
  updateCurrencyButtons();

  // Reload whichever page is open
  if (document.getElementById("coin-list"))      showCoins(allCoins);
  if (document.getElementById("coin-list"))      updateStats();
  if (document.getElementById("detail-box"))     showCoinDetail();
  if (document.getElementById("portfolio-list")) showPortfolio();
}

function updateCurrencyButtons() {
  let usdBtn = document.getElementById("usd-btn");
  let inrBtn = document.getElementById("inr-btn");
  if (!usdBtn || !inrBtn) return;

  if (currency === "usd") {
    usdBtn.classList.add("active");
    inrBtn.classList.remove("active");
  } else {
    inrBtn.classList.add("active");
    usdBtn.classList.remove("active");
  }
}

// =============================================
//  HELPER FUNCTIONS
// =============================================

// Format price nicely
function formatPrice(num) {
  if (num >= 1000)   return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (num >= 1)      return num.toFixed(2);
  if (num >= 0.01)   return num.toFixed(4);
  return num.toFixed(6);
}

// Format large numbers (e.g. 1,200,000 → 1.2M)
function formatLarge(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9)  return (num / 1e9).toFixed(2)  + "B";
  if (num >= 1e6)  return (num / 1e6).toFixed(2)  + "M";
  return num.toFixed(0);
}

// Show toast notification
function showToast(message) {
  let toast     = document.createElement("div");
  toast.className   = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

// Highlight active nav link
function highlightNav() {
  let page  = window.location.pathname.split("/").pop() || "index.html";
  let links = document.querySelectorAll(".nav-links a");
  for (let i = 0; i < links.length; i++) {
    if (links[i].getAttribute("href") === page) {
      links[i].classList.add("active");
    }
  }
}

// =============================================
//  FAKE DATA (if API fails completely)
// =============================================
function getFakeData() {
  return [
    { id:"bitcoin",     name:"Bitcoin",   symbol:"btc",  market_cap_rank:1,  current_price:84231, price_change_percentage_24h:2.34,  market_cap:1654000000000, circulating_supply:19700000 },
    { id:"ethereum",    name:"Ethereum",  symbol:"eth",  market_cap_rank:2,  current_price:3241,  price_change_percentage_24h:1.56,  market_cap:389000000000,  circulating_supply:120200000 },
    { id:"tether",      name:"Tether",    symbol:"usdt", market_cap_rank:3,  current_price:1.00,  price_change_percentage_24h:0.01,  market_cap:102000000000,  circulating_supply:102000000000 },
    { id:"binancecoin", name:"BNB",       symbol:"bnb",  market_cap_rank:4,  current_price:412,   price_change_percentage_24h:-0.89, market_cap:62000000000,   circulating_supply:153700000 },
    { id:"solana",      name:"Solana",    symbol:"sol",  market_cap_rank:5,  current_price:178,   price_change_percentage_24h:3.21,  market_cap:81000000000,   circulating_supply:455000000 },
    { id:"ripple",      name:"XRP",       symbol:"xrp",  market_cap_rank:6,  current_price:0.62,  price_change_percentage_24h:1.12,  market_cap:33000000000,   circulating_supply:54200000000 },
    { id:"dogecoin",    name:"Dogecoin",  symbol:"doge", market_cap_rank:7,  current_price:0.14,  price_change_percentage_24h:-2.45, market_cap:20000000000,   circulating_supply:143200000000 },
    { id:"cardano",     name:"Cardano",   symbol:"ada",  market_cap_rank:8,  current_price:0.48,  price_change_percentage_24h:0.78,  market_cap:17000000000,   circulating_supply:35400000000 },
  ];
}
