// Dynamically set API base URL
const API_BASE = window.API_BASE || "/api";

// Cache & Debounce
let linksCache = null;
let debounceTimer = null;

// Debounce function
function debounce(func, delay) {
  return function (...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
}

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
const qrCodeImage = document.getElementById("qrCodeImage");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const darkModeToggle = document.getElementById("darkModeToggle");

// Dark Mode Setup
function initDarkMode() {
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "true") {
    document.body.classList.add("dark-mode");
    updateThemeIcon();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  darkModeToggle.querySelector(".theme-icon").textContent = isDarkMode
    ? "☀️"
    : "🌙";
}

// Loading State
function showLoading() {
  loadingOverlay.hidden = false;
}

function hideLoading() {
  loadingOverlay.hidden = true;
}

// Event Listeners
shortenForm.addEventListener("submit", handleShortenURL);
copyBtn.addEventListener("click", copyToClipboard);
newLinkBtn.addEventListener("click", resetForm);
advancedToggle.addEventListener("click", toggleAdvancedOptions);
refreshLinksBtn.addEventListener("click", () => {
  linksCache = null;
  loadAllLinks();
});
downloadQrBtn.addEventListener("click", downloadQrCode);
darkModeToggle.addEventListener("click", toggleDarkMode);

// Initialize
initDarkMode();
loadAllLinks();

// URL Input validation with debounce
const validateAndOptimize = debounce(() => {
  const url = urlInput.value.trim();
  if (url && !url.startsWith("http")) {
    urlInput.value = "https://" + url;
  }
}, 300);

urlInput.addEventListener("input", validateAndOptimize);

async function handleShortenURL(e) {
  e.preventDefault();

  const url = urlInput.value.trim();
  const customAlias = customAliasInput.value.trim();
  const expirationHours = parseInt(expirationSelect.value);

  if (!url) {
    showError("Vui lòng nhập một URL");
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        custom_alias: customAlias,
        expire_hours: expirationHours,
      }),
    });

    if (!response.ok) {
      let errorMsg = "Không thể rút gọn URL";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    displayResult(data);
    showSuccess("Rút gọn URL thành công! 🎉");
    linksCache = null; // Invalidate cache
    loadAllLinks();
  } catch (error) {
    console.error("Lỗi:", error);
    showError(error.message || "Có lỗi xảy ra. Vui lòng thử lại!");
  } finally {
    hideLoading();
  }
}

function displayResult(data) {
  shortUrlDisplay.value = data.short_url;
  originalUrlDisplay.value = data.original_url;

  const now = new Date().toLocaleString("vi-VN");
  document.getElementById("createdTime").textContent = now;
  document.getElementById("clickCount").textContent = "0";

  // Display QR code
  if (data.qr_code) {
    qrCodeImage.src = data.qr_code;
    qrCodeImage.style.display = "block";
  }

  // Store the short ID for download
  window.currentQrPath = data.qr_code;
  window.currentShortId = data.short_id;

  resultSection.hidden = false;
  shortenForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function copyToClipboard() {
  const text = shortUrlDisplay.value;
  if (!text) {
    showError("Không có URL để sao chép");
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="copy-icon">✅</span>';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    })
    .catch((err) => {
      showError("Không thể sao chép vào bộ nhớ tạm");
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
  qrCodeImage.src = "";
  window.currentQrPath = null;
  window.currentShortId = null;
  urlInput.focus();
}

function downloadQrCode() {
  if (!window.currentQrPath || !window.currentShortId) {
    showError("Không có mã QR để tải xuống");
    return;
  }

  const link = document.createElement("a");
  link.href = window.currentQrPath;
  link.download = `qr-${window.currentShortId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showSuccess("Đã tải mã QR xuống! ⬇️");
}

function toggleAdvancedOptions() {
  advancedContent.hidden = !advancedContent.hidden;
  advancedToggle.style.opacity = advancedContent.hidden ? "1" : "0.7";
}

async function loadAllLinks() {
  try {
    // Use cache if available
    if (linksCache) {
      displayLinksList(linksCache);
      return;
    }

    const response = await fetch(`${API_BASE}/all`);

    if (!response.ok) {
      let errorMsg = "Không thể tải danh sách liên kết";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const links = await response.json();
    linksCache = links; // Cache the results
    displayLinksList(links);
  } catch (error) {
    console.error("Lỗi:", error);
    if (linksCache) {
      // Show cached data if available
      displayLinksList(linksCache);
      showError("⚠️ Đang hiển thị dữ liệu từ bộ nhớ cache");
    } else {
      linksList.innerHTML =
        '<p class="empty-state">❌ Không thể tải danh sách liên kết. Vui lòng thử lại!</p>';
    }
  }
}

function displayLinksList(links) {
  if (links.length === 0) {
    linksList.innerHTML =
      '<p class="empty-state">📭 Chưa có liên kết nào được tạo. Hãy tạo URL rút gọn đầu tiên của bạn ở trên!</p>';
    return;
  }

  // Create table structure
  const table = document.createElement("table");
  table.className = "links-table";

  // Create table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>🔗 URL Ngắn</th>
      <th>📌 URL Gốc</th>
      <th>👆 Lượt Nhấp</th>
      <th>📅 Ngày Tạo</th>
      <th>⏰ Hạn Sử Dụng</th>
      <th>⚙️ Hành Động</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");
  links.forEach((link) => {
    const tr = document.createElement("tr");
    const expiryText = link.expires_at
      ? formatExpiry(link.expires_at)
      : "Không giới hạn";
    tr.innerHTML = `
      <td>
        <a href="${link.short_url}" target="_blank" class="table-short-link">
          ${link.id}
        </a>
      </td>
      <td class="table-original-url" title="${link.original_url}">
        ${link.original_url}
      </td>
      <td>
        <strong>${link.clicks}</strong>
      </td>
      <td>
        ${formatDate(link.created_at)}
      </td>
      <td>
        <span style="color: ${getExpiryColor(link.expires_at)};">
          ${expiryText}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-btn btn-copy-small" onclick="copyLink(getShortUrl('${link.id}'))" title="Sao chép liên kết">
            📋
          </button>
          <button class="action-btn btn-qr-icon" onclick="showQrModal('${link.qr_code}', '${link.id}')" title="Xem mã QR">
            📱
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  linksList.innerHTML = "";
  linksList.appendChild(table);
}

function getExpiryColor(expiresAt) {
  if (!expiresAt) return "#10b981";

  const expiry = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = (expiry - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) return "#ef4444"; // Red - expired
  if (hoursLeft < 24) return "#f59e0b"; // Amber - expiring soon
  return "#10b981"; // Green - valid
}

function showQrModal(qrPath, shortId) {
  const modal = document.createElement("div");
  modal.className = "qr-modal-overlay";
  modal.innerHTML = `
    <div class="qr-modal">
      <button class="qr-modal-close" onclick="this.closest('.qr-modal-overlay').remove()">✕</button>
      <h3>📱 Mã QR cho ${shortId}</h3>
      <img src="${qrPath}" alt="Mã QR" class="qr-modal-image" />
      <button class="btn btn-primary btn-block" onclick="downloadQrFromModal('${qrPath}', '${shortId}')">
        ⬇️ Tải xuống
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function downloadQrFromModal(qrPath, shortId) {
  const link = document.createElement("a");
  link.href = qrPath;
  link.download = `qr-${shortId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showSuccess("Đã tải mã QR xuống! 📥");
}

function copyLink(text) {
  if (!text) {
    showError("Liên kết không hợp lệ");
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("Đã sao chép liên kết! ✅");
    })
    .catch((err) => {
      showError("Không thể sao chép liên kết");
    });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("vi-VN") +
    " " +
    date.toLocaleTimeString("vi-VN", {
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
    return "❌ Đã hết hạn";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `⏰ ${hours} giờ`;
  }

  const days = Math.floor(hours / 24);
  return `⏰ ${days} ngày`;
}

function showError(message) {
  errorToast.textContent = message;
  errorToast.hidden = false;
  setTimeout(() => {
    errorToast.hidden = true;
  }, 4000);
}

function showSuccess(message) {
  successToast.textContent = message;
  successToast.hidden = false;
  setTimeout(() => {
    successToast.hidden = true;
  }, 3000);
}

function getShortUrl(shortId) {
  if (!shortId || typeof shortId !== "string") {
    console.error("Invalid shortId:", shortId);
    return null;
  }
  return "https://api-rut-gon.onrender.com/" + encodeURIComponent(shortId);
}
