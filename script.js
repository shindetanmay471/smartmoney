let currentUser = localStorage.getItem("loggedInUser");
let transactions = [];

const mainPage = document.querySelector(".main-page");
const loginContainer = document.getElementById("loginContainer");
const registerContainer = document.getElementById("authContainer");
const dashboard = document.getElementById("mainContainer");
const welcomeUser = document.getElementById("welcomeUser");

function showLoginForm() {
  mainPage.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  registerContainer.classList.add("hidden");
}

function showRegisterForm() {
  mainPage.classList.add("hidden");
  loginContainer.classList.add("hidden");
  registerContainer.classList.remove("hidden");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function loadUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function showDashboard(username) {
  currentUser = username;
  localStorage.setItem("loggedInUser", username);
  welcomeUser.textContent = `Welcome, ${username}!`;
  mainPage.classList.add("hidden");
  loginContainer.classList.add("hidden");
  registerContainer.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadUserData();
}

// 🔐 Hash password using SHA-256
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const users = loadUsers();
  if (users[username]) {
    alert("Username already exists!");
    return;
  }

  const hashedPassword = await hashPassword(password);

  users[username] = {
    password: hashedPassword,
    transactions: []
  };

  saveUsers(users);
  alert("Registration successful!");
  showLoginForm();
});

document.getElementById("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const hashedPassword = await hashPassword(password);

  const users = loadUsers();
  if (users[username] && users[username].password === hashedPassword) {
    showDashboard(username);
  } else {
    alert("Invalid credentials!");
  }
});

document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  dashboard.classList.add("hidden");
  mainPage.classList.remove("hidden");
  transactions = [];
  document.getElementById("transactions").innerHTML = "";
  document.getElementById("balance").textContent = "Balance: ₹0.00";
  if (window.pieChart) window.pieChart.destroy();
  document.getElementById("authForm").reset();
  document.getElementById("registrationForm").reset();
});

function loadUserData() {
  const users = loadUsers();
  if (users[currentUser]) {
    transactions = users[currentUser].transactions || [];
    renderTransactions();
    calculateBalance();
    updateChart();
  }
}

function saveUser() {
  const users = loadUsers();
  users[currentUser].transactions = transactions;
  saveUsers(users);
}

document.getElementById("transactionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = document.getElementById("description").value;
  const amount = +document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  if (isNaN(amount) || amount === 0) {
    alert("Enter a valid amount.");
    return;
  }

  transactions.push({ description: desc, amount, category });
  saveUser();
  renderTransactions();
  calculateBalance();
  updateChart();
  e.target.reset();
});

function renderTransactions() {
  const list = document.getElementById("transactions");
  list.innerHTML = "";
  transactions.forEach((transaction, index) => {
    const li = document.createElement("li");
    li.classList.add(transaction.amount < 0 ? "expense" : "income");
    li.innerHTML = `
      ${transaction.description} - ₹${transaction.amount}
      <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
    `;
    list.appendChild(li);
  });
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveUser();
  renderTransactions();
  calculateBalance();
  updateChart();
}

function calculateBalance() {
  const balance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
  document.getElementById("balance").textContent = `Balance: ₹${balance.toFixed(2)}`;
}

function updateChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const categories = {};
  transactions.forEach((t) => {
    if (t.amount < 0) {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const data = {
    labels: Object.keys(categories),
    datasets: [{
      label: "Expenses",
      data: Object.values(categories),
      backgroundColor: [
        "#e74c3c", "#f1c40f", "#8e44ad", "#3498db", "#1abc9c",
        "#9b59b6", "#f39c12", "#e67e22", "#34495e", "#16a085"
      ]
    }]
  };

  if (window.pieChart) window.pieChart.destroy();
  window.pieChart = new Chart(ctx, { type: "pie", data });
}

// Auto-login if session exists
if (currentUser) {
  showDashboard(currentUser);
}
