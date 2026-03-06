const API_BASE = "http://localhost:5000/api";

// DOM Elements
const shortenForm = document.getElementById("shortenForm");
const urlInput = document.getElementById("urlInput");
const customAliasInput = document.getElementById("customAlias");
const expirationSelect = document.getElementById("expiration");
const advancedToggle = document.getElementById("advancedToggle");
const advancedContent = document.getElementById("advancedContent");
const resultSection = document.getElementById("resultSection");
const shortUrlDisplay = document.getElementById("shortUrlDisplay");
const originalUrlDisplay = document.getElementById("originalUrlDisplay");
const copyBtn = document.getElementById("copyBtn");
const newLinkBtn = document.getElementById("newLinkBtn");
const linksList = document.getElementById("linksList");
const refreshLinksBtn = document.getElementById("refreshLinksBtn");
const errorToast = document.getElementById("errorToast");
const successToast = document.getElementById("successToast");

// Event Listeners
shortenForm.addEventListener("submit", handleShortenURL);
copyBtn.addEventListener("click", copyToClipboard);
newLinkBtn.addEventListener("click", resetForm);
advancedToggle.addEventListener("click", toggleAdvancedOptions);
refreshLinksBtn.addEventListener("click", loadAllLinks);

// Initialize
loadAllLinks();

async function handleShortenURL(e) {
  e.preventDefault();

  const url = urlInput.value.trim();
  const customAlias = customAliasInput.value.trim();
  const expirationHours = parseInt(expirationSelect.value);

  if (!url) {
    showError("Please enter a URL");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        custom_alias: customAlias,
        expiration_hours: expirationHours,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to shorten URL");
    }

    const data = await response.json();
    displayResult(data);
    showSuccess("URL shortened successfully!");
    loadAllLinks();
  } catch (error) {
    console.error("Error:", error);
    showError(error.message);
  }
}

function displayResult(data) {
  shortUrlDisplay.value = data.short_url;
  originalUrlDisplay.value = data.original_url;

  const now = new Date().toLocaleString();
  document.getElementById("createdTime").textContent = now;
  document.getElementById("clickCount").textContent = "0";

  resultSection.hidden = false;
  shortenForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function copyToClipboard() {
  const text = shortUrlDisplay.value;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "✅ Copied!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    })
    .catch((err) => {
      showError("Failed to copy to clipboard");
    });
}

function resetForm() {
  shortenForm.reset();
  resultSection.hidden = true;
  customAliasInput.value = "";
  expirationSelect.value = "0";
  if (!advancedContent.hidden) {
    toggleAdvancedOptions();
  }
  urlInput.focus();
}

function toggleAdvancedOptions() {
  advancedContent.hidden = !advancedContent.hidden;
  advancedToggle.style.opacity = advancedContent.hidden ? "1" : "0.7";
}

async function loadAllLinks() {
  try {
    const response = await fetch(`${API_BASE}/all`);

    if (!response.ok) {
      throw new Error("Failed to load links");
    }

    const links = await response.json();
    displayLinksList(links);
  } catch (error) {
    console.error("Error:", error);
    linksList.innerHTML = '<p class="error">Failed to load links</p>';
  }
}

function displayLinksList(links) {
  if (links.length === 0) {
    linksList.innerHTML =
      '<p class="empty-state">No links created yet. Create your first shortened URL above!</p>';
    return;
  }

  linksList.innerHTML = links
    .map(
      (link) => `
        <div class="link-card">
            <div class="link-header">
                <a href="http://localhost:5000/${link.id}" target="_blank" class="short-link">
                    🔗 ${link.id}
                </a>
                <button class="btn-copy-small" onclick="copyLink('http://localhost:5000/${link.id}')">
                    📋
                </button>
            </div>
            <div class="link-body">
                <p class="original-url" title="${link.original_url}">
                    ${link.original_url}
                </p>
                <div class="link-meta">
                    <span class="meta-item">
                        📅 ${formatDate(link.created_at)}
                    </span>
                    <span class="meta-item">
                        👆 ${link.clicks} clicks
                    </span>
                    ${link.expires_at ? `<span class="meta-item">⏰ ${formatExpiry(link.expires_at)}</span>` : ""}
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function copyLink(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("Link copied to clipboard!");
    })
    .catch((err) => {
      showError("Failed to copy link");
    });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatExpiry(expiryString) {
  const expiry = new Date(expiryString);
  const now = new Date();
  const diff = expiry - now;

  if (diff < 0) {
    return "Expired";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `Expires in ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `Expires in ${days}d`;
}

function showError(message) {
  errorToast.textContent = "❌ " + message;
  errorToast.hidden = false;
  setTimeout(() => {
    errorToast.hidden = true;
  }, 4000);
}

function showSuccess(message) {
  successToast.textContent = "✅ " + message;
  successToast.hidden = false;
  setTimeout(() => {
    successToast.hidden = true;
  }, 3000);
}
