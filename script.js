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
const qrCodeImage = document.getElementById("qrCodeImage");
const downloadQrBtn = document.getElementById("downloadQrBtn");

// Event Listeners
shortenForm.addEventListener("submit", handleShortenURL);
copyBtn.addEventListener("click", copyToClipboard);
newLinkBtn.addEventListener("click", resetForm);
advancedToggle.addEventListener("click", toggleAdvancedOptions);
refreshLinksBtn.addEventListener("click", loadAllLinks);
downloadQrBtn.addEventListener("click", downloadQrCode);

// Initialize
loadAllLinks();

async function handleShortenURL(e) {
  e.preventDefault();

  const url = urlInput.value.trim();
  const customAlias = customAliasInput.value.trim();
  const expirationHours = parseInt(expirationSelect.value);

  if (!url) {
    showError("Vui lòng nhập một URL");
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
      throw new Error(errorData.error || "Không thể rút gọn URL");
    }

    const data = await response.json();
    displayResult(data);
    showSuccess("Rút gọn URL thành công!");
    loadAllLinks();
  } catch (error) {
    console.error("Lỗi:", error);
    showError(error.message);
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
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "✅ Đã sao chép!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
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
  showSuccess("Đã tải mã QR xuống!");
}

function toggleAdvancedOptions() {
  advancedContent.hidden = !advancedContent.hidden;
  advancedToggle.style.opacity = advancedContent.hidden ? "1" : "0.7";
}

async function loadAllLinks() {
  try {
    const response = await fetch(`${API_BASE}/all`);

    if (!response.ok) {
      throw new Error("Không thể tải danh sách liên kết");
    }

    const links = await response.json();
    displayLinksList(links);
  } catch (error) {
    console.error("Lỗi:", error);
    linksList.innerHTML =
      '<p class="error">Không thể tải danh sách liên kết</p>';
  }
}

function displayLinksList(links) {
  if (links.length === 0) {
    linksList.innerHTML =
      '<p class="empty-state">Chưa có liên kết nào được tạo. Hãy tạo URL rút gọn đầu tiên ở trên!</p>';
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
                <div class="link-header-buttons">
                  <button class="btn-qr-icon" onclick="showQrModal('${link.qr_code}', '${link.id}')" title="Xem mã QR">
                      📱
                  </button>
                  <button class="btn-copy-small" onclick="copyLink('http://localhost:5000/${link.id}')">
                      📋
                  </button>
                </div>
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
                        👆 ${link.clicks} lượt nhấp
                    </span>
                    ${link.expires_at ? `<span class="meta-item">⏰ ${formatExpiry(link.expires_at)}</span>` : ""}
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function showQrModal(qrPath, shortId) {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.className = "qr-modal-overlay";
  modal.innerHTML = `
    <div class="qr-modal">
      <button class="qr-modal-close" onclick="this.closest('.qr-modal-overlay').remove()">✕</button>
      <h3>Mã QR cho ${shortId}</h3>
      <img src="${qrPath}" alt="Mã QR" class="qr-modal-image" />
      <button class="btn btn-primary" onclick="downloadQrFromModal('${qrPath}', '${shortId}')">
        ⬇️ Tải xuống
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal on overlay click
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
  showSuccess("Đã tải mã QR xuống!");
}

function copyLink(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("Đã sao chép liên kết!");
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
    return "Đã hết hạn";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `Hết hạn sau ${hours} giờ`;
  }

  const days = Math.floor(hours / 24);
  return `Hết hạn sau ${days} ngày`;
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
