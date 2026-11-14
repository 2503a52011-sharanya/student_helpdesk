const API = "/api";
let token = localStorage.getItem("cc_token") || "";
let currentUser = JSON.parse(localStorage.getItem("cc_user") || "null");
let selectedRole = "student";
let allQueries = [];

const $ = id => document.getElementById(id);
const authView = $("authView"), appView = $("appView");
function toast(message, bad = false) {
  const el = $("toast"); el.textContent = message; el.style.background = bad ? "#a63e4a" : "#17233b";
  el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2800);
}
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(API + path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function saveSession(data) {
  token = data.token; currentUser = data.user;
  localStorage.setItem("cc_token", token); localStorage.setItem("cc_user", JSON.stringify(currentUser));
  showApp();
}
function showAuth() { authView.classList.remove("hidden"); appView.classList.add("hidden"); }
function showApp() {
  authView.classList.add("hidden"); appView.classList.remove("hidden");
  $("profileName").textContent = currentUser.name; $("profileRole").textContent = currentUser.role + " account";
  $("avatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("welcomeTitle").textContent = `Hello, ${currentUser.name.split(" ")[0]}!`;
  document.querySelectorAll(".student-only").forEach(el => el.classList.toggle("hidden", currentUser.role !== "student"));
  $("navQueries").textContent = currentUser.role === "student" ? "My queries" : "All queries";
  $("listHeading").textContent = currentUser.role === "student" ? "My queries" : "All student queries";
  navigate("dashboard"); loadDashboard();
}
function navigate(page) {
  if (page === "new" && currentUser.role !== "student") page = "queries";
  document.querySelectorAll(".page").forEach(el => el.classList.add("hidden"));
  $(`${page}Page`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  $("pageTitle").textContent = page === "new" ? "Raise a query" : page === "queries" ? "Query management" : "Overview";
  if (page === "queries") loadQueries();
}
document.querySelectorAll(".role-option").forEach(btn => btn.addEventListener("click", () => {
  selectedRole = btn.dataset.role;
  document.querySelectorAll(".role-option").forEach(b => b.classList.toggle("active", b === btn));
  $("authSubtitle").textContent = selectedRole === "student" ? "Access your student helpdesk workspace." : "Manage student queries and provide support.";
}));
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  try { saveSession(await api("/auth/login", { method: "POST", body: JSON.stringify({ email: $("loginEmail").value, password: $("loginPassword").value, role: selectedRole }) })); }
  catch (err) { toast(err.message, true); }
});
$("showRegister").addEventListener("click", () => {
  $("loginForm").classList.add("hidden"); $("registerForm").classList.remove("hidden");
  $("authTitle").textContent = "Create your student account"; $("authSubtitle").textContent = "Join CampusCare to get the support you need.";
  $("authToggle").innerHTML = 'Already have an account? <button id="showLogin">Sign in</button>';
  $("showLogin").addEventListener("click", showLoginForm);
});
function showLoginForm() {
  $("registerForm").classList.add("hidden"); $("loginForm").classList.remove("hidden");
  $("authTitle").textContent = "Sign in to your account"; $("authSubtitle").textContent = "Access your helpdesk workspace.";
  $("authToggle").innerHTML = 'New to CampusCare? <button id="showRegister">Create an account</button>';
  $("showRegister").addEventListener("click", () => {
    $("loginForm").classList.add("hidden"); $("registerForm").classList.remove("hidden");
    $("authTitle").textContent = "Create your student account";
    $("authToggle").innerHTML = 'Already have an account? <button id="showLogin">Sign in</button>';
    $("showLogin").addEventListener("click", showLoginForm);
  });
}
$("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const data = await api("/auth/register", {
      method: "POST", body: JSON.stringify({
        name: $("regName").value, email: $("regEmail").value, department: $("regDepartment").value, password: $("regPassword").value
      })
    });
    saveSession(data); toast("Your account has been created.");
  } catch (err) { toast(err.message, true); }
});
$("logoutBtn").addEventListener("click", () => {
  token = ""; currentUser = null; localStorage.removeItem("cc_token"); localStorage.removeItem("cc_user"); showAuth();
});
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.goto)));

function statusClass(status) { return status.toLowerCase().replace(" ", "-"); }
function dateText(date) { return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function queryCard(q) {
  const person = currentUser.role === "faculty" ? `<span>◉ ${escapeHtml(q.studentName)}</span>` : "";
  return `<article class="query-card"><div class="query-main"><div class="query-meta"><span>${escapeHtml(q.category)}</span><span>•</span><span>${dateText(q.createdAt)}</span>${person}</div><div class="query-title">${escapeHtml(q.title)}</div><div class="query-desc">${escapeHtml(q.description)}</div></div><div class="query-side"><span class="status ${statusClass(q.status)}">${escapeHtml(q.status)}</span><button class="view-btn" data-open="${q._id}">View details →</button></div></article>`;
}
function escapeHtml(s = "") { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
async function loadQueries() {
  try {
    const data = await api("/queries"); allQueries = data.queries;
    renderQueries();
  } catch (err) { toast(err.message, true); }
}
function renderQueries() {
  const search = ($("searchInput").value || "").toLowerCase(), status = $("statusFilter").value, category = $("categoryFilter").value;
  const filtered = allQueries.filter(q => (!status || q.status === status) && (!category || q.category === category) &&
    (`${q.title} ${q.description} ${q.studentName}`.toLowerCase().includes(search)));
  $("allQueries").innerHTML = filtered.length ? filtered.map(queryCard).join("") : `<div class="empty-state"><strong>No queries found</strong>Try changing your filters or raise a new query.</div>`;
  attachDetailButtons();
}
["searchInput", "statusFilter", "categoryFilter"].forEach(id => $(id).addEventListener("input", renderQueries));
async function loadDashboard() {
  try {
    const [qdata] = await Promise.all([api("/queries")]); allQueries = qdata.queries;
    if (currentUser.role === "faculty") {
      const stats = await api("/queries/stats");
      $("statsGrid").innerHTML = stat("Total queries", stats.total, "▤") + stat("Pending", stats.pending, "◷") + stat("In progress", stats.inProgress, "↻") + stat("Resolved", stats.resolved, "✓");
      $("recentQueries").innerHTML = `<div class="stat-card"><div class="stat-top">Average resolution time</div><div class="stat-number">${stats.averageResolutionHours} hrs</div><div class="stat-note">Based on resolved queries</div></div><p class="stat-note">Closed queries: ${stats.closed}</p>`;
    } else {
      const counts = { total: allQueries.length, pending: 0, progress: 0, resolved: 0 };
      allQueries.forEach(q => { if (q.status === "Pending") counts.pending++; if (q.status === "In Progress") counts.progress++; if (q.status === "Resolved" || q.status === "Closed") counts.resolved++; });
      $("statsGrid").innerHTML = stat("Total queries", counts.total, "▤") + stat("Pending", counts.pending, "◷") + stat("In progress", counts.progress, "↻") + stat("Resolved", counts.resolved, "✓");
      $("recentQueries").innerHTML = allQueries.length ? allQueries.slice(0, 4).map(queryCard).join("") : `<div class="empty-state"><strong>No queries yet</strong>Raise your first query and track it here.</div>`;
      attachDetailButtons();
    }
  } catch (err) { toast(err.message, true); }
}
function stat(label, value, icon) { return `<div class="stat-card"><div class="stat-top">${label}<span class="stat-icon">${icon}</span></div><div class="stat-number">${value}</div><div class="stat-note">Updated just now</div></div>`; }
$("queryForm").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await api("/queries", { method: "POST", body: JSON.stringify({ category: $("queryCategory").value, title: $("queryTitle").value, description: $("queryDescription").value }) });
    $("queryForm").reset(); toast("Your query has been submitted."); navigate("dashboard"); loadDashboard();
  } catch (err) { toast(err.message, true); }
});
function attachDetailButtons() {
  document.querySelectorAll("[data-open]").forEach(btn => btn.addEventListener("click", () => openDetail(btn.dataset.open)));
}
async function openDetail(id) {
  try {
    const { query: q } = await api(`/queries/${id}`);
    const replies = (q.replies || []).map(r => `<div class="reply-item"><strong>${escapeHtml(r.facultyName)} · ${dateText(r.createdAt)}</strong><p>${escapeHtml(r.message)}</p></div>`).join("") || `<p class="stat-note">No replies yet.</p>`;
    let controls = "";
    if (currentUser.role === "faculty") {
      controls = `<div class="faculty-tools"><select id="detailStatus"><option ${q.status === "Pending" ? "selected" : ""}>Pending</option><option ${q.status === "In Progress" ? "selected" : ""}>In Progress</option><option ${q.status === "Resolved" ? "selected" : ""}>Resolved</option></select><button class="primary-btn compact" id="updateStatus">Update status</button></div><div class="reply-box"><label>Write a reply<textarea id="replyMessage" rows="3" placeholder="Type your response to the student..."></textarea></label><button class="primary-btn compact" id="sendReply">Send reply →</button></div>`;
    } else if (q.status === "Resolved") {
      controls = `<button class="primary-btn compact" id="closeQuery">Mark as closed</button>`;
    } else if (q.status === "Pending") {
      controls = `<button class="view-btn" id="deleteQuery">Delete pending query</button>`;
    }
    $("modalContent").innerHTML = `<div class="query-meta"><span>${escapeHtml(q.category)}</span><span>•</span><span>${dateText(q.createdAt)}</span><span class="status ${statusClass(q.status)}">${escapeHtml(q.status)}</span></div><h2 class="detail-title">${escapeHtml(q.title)}</h2><p class="stat-note">Raised by ${escapeHtml(q.studentName)}</p><div class="detail-description">${escapeHtml(q.description)}</div><h3 style="font:800 14px Manrope;margin:22px 0 12px">Conversation & replies</h3>${replies}${controls}`;
    $("detailModal").classList.remove("hidden");
    if (currentUser.role === "faculty") {
      $("updateStatus").onclick = async () => { try { await api(`/queries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: $("detailStatus").value }) }); toast("Status updated."); closeModal(); loadDashboard(); loadQueries(); } catch (e) { toast(e.message, true); } };
      $("sendReply").onclick = async () => { try { await api(`/queries/${id}/replies`, { method: "POST", body: JSON.stringify({ message: $("replyMessage").value }) }); toast("Reply sent."); openDetail(id); loadDashboard(); loadQueries(); } catch (e) { toast(e.message, true); } };
    } else {
      if ($("closeQuery")) $("closeQuery").onclick = async () => { try { await api(`/queries/${id}/close`, { method: "PATCH" }); toast("Query closed."); closeModal(); loadDashboard(); } catch (e) { toast(e.message, true); } };
      if ($("deleteQuery")) $("deleteQuery").onclick = async () => { if (!confirm("Delete this pending query?")) return; try { await api(`/queries/${id}`, { method: "DELETE" }); toast("Query deleted."); closeModal(); loadDashboard(); } catch (e) { toast(e.message, true); } };
    }
  } catch (err) { toast(err.message, true); }
}
function closeModal() { $("detailModal").classList.add("hidden"); }
$("closeModal").addEventListener("click", closeModal);
$("detailModal").addEventListener("click", e => { if (e.target === $("detailModal")) closeModal(); });
(async function init() {
  if (token && currentUser) {
    try { const data = await api("/auth/me"); currentUser = data.user; localStorage.setItem("cc_user", JSON.stringify(currentUser)); showApp(); }
    catch (e) { token = ""; currentUser = null; localStorage.removeItem("cc_token"); localStorage.removeItem("cc_user"); showAuth(); }
  } else showAuth();
})();
