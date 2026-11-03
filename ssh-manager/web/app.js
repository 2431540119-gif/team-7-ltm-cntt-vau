"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const serverListEl = document.getElementById("server-list");
  const addServerFormEl = document.getElementById("add-server-form");
  const btnShowAdd = document.getElementById("btn-show-add");
  const btnCancelAdd = document.getElementById("btn-cancel-add");
  const btnSaveServer = document.getElementById("btn-save-server");

  const execForm = document.getElementById("exec-form");
  const execHost = document.getElementById("exec-host");
  const execPort = document.getElementById("exec-port");
  const execUser = document.getElementById("exec-user");
  const execPass = document.getElementById("exec-pass");
  const execCommand = document.getElementById("exec-command");
  const btnExec = document.getElementById("btn-exec");
  const terminalOutput = document.getElementById("terminal-output");
  const btnClearTerm = document.getElementById("btn-clear-term");

  const historyTbody = document.getElementById("history-tbody");
  const btnRefreshHistory = document.getElementById("btn-refresh-history");

  // Load Servers
  async function loadServers() {
    try {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Lỗi tải server");
      const servers = await res.json();
      renderServers(servers);
    } catch (err) {
      serverListEl.innerHTML = `<p class="empty-state text-danger">Không thể tải server: ${err.message}</p>`;
    }
  }

  function renderServers(servers) {
    if (!servers || servers.length === 0) {
      serverListEl.innerHTML = `
        <div class="empty-state">
          <p>Chưa có server nào được lưu.</p>
          <button id="btn-quick-sample" class="btn btn-secondary btn-sm" style="margin-top:0.5rem">
            + Thêm Server mẫu (localhost:2222)
          </button>
        </div>`;
      const btnQuickSample = document.getElementById("btn-quick-sample");
      if (btnQuickSample) {
        btnQuickSample.addEventListener("click", () => {
          saveServer("Local Demo Server", "127.0.0.1", 2222, "demo");
        });
      }
      return;
    }

    serverListEl.innerHTML = "";
    servers.forEach((srv) => {
      const item = document.createElement("div");
      item.className = "server-item";
      item.innerHTML = `
        <div class="server-info">
          <h4>${escapeHtml(srv.name)}</h4>
          <p>${escapeHtml(srv.user ? srv.user + "@" : "")}${escapeHtml(srv.host)}:${srv.port}</p>
        </div>
        <div class="server-actions">
          <button class="btn btn-primary btn-sm btn-select-srv">Nạp thông tin</button>
          <button class="btn btn-secondary btn-sm btn-test-srv">Kiểm tra SSH</button>
          <button class="btn btn-danger btn-sm btn-delete-srv">Xóa</button>
        </div>
      `;

      item.querySelector(".btn-select-srv").addEventListener("click", () => {
        execHost.value = srv.host;
        execPort.value = srv.port;
        execUser.value = srv.user || "";
        execPass.value = srv.password || "";
        execPass.focus();
        appendTerminal(`> Đã chọn server [${srv.name}] (${srv.host}:${srv.port})\n`);
      });

      item.querySelector(".btn-test-srv").addEventListener("click", async (event) => {
        const password = srv.password ||
          (execHost.value === srv.host &&
            String(execPort.value) === String(srv.port) &&
            execUser.value === (srv.user || "")
            ? execPass.value
            : "");
        if (!password) {
          execHost.value = srv.host;
          execPort.value = srv.port;
          execUser.value = srv.user || "";
          execPass.focus();
          appendTerminal(`❌ Chưa có mật khẩu cho [${srv.name}]. Đã nạp thông tin; nhập mật khẩu rồi bấm Kiểm tra SSH lần nữa.\n`);
          return;
        }

        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Đang kiểm tra...";
        appendTerminal(`\n> Kiểm tra SSH [${srv.name}] (${srv.host}:${srv.port})...\n`);
        try {
          const res = await fetch("/api/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: srv.host,
              port: srv.port,
              user: srv.user,
              password,
            }),
          });
          const body = await res.text();
          let data;
          try {
            data = JSON.parse(body);
          } catch (err) {
            throw new Error(body || `Backend trả về phản hồi không hợp lệ (HTTP ${res.status})`);
          }

          if (res.ok && data.success) {
            appendTerminal(`✅ Kết nối SSH thành công. Đăng nhập thành công với user: ${data.output}\n`);
          } else {
            appendTerminal(`❌ Không kết nối được (HTTP ${res.status}):\n${data.error || `Backend trả về lỗi HTTP ${res.status}`}\n`);
          }
        } catch (err) {
          appendTerminal(`❌ LỖI GỌI API: ${err.message}\n`);
        } finally {
          button.disabled = false;
          button.textContent = "Kiểm tra SSH";
        }
      });

      item.querySelector(".btn-delete-srv").addEventListener("click", async () => {
        if (confirm(`Bạn có chắc muốn xóa server "${srv.name}"?`)) {
          await deleteServer(srv.name);
        }
      });

      serverListEl.appendChild(item);
    });
  }

  // Add / Save Server
  btnShowAdd.addEventListener("click", () => {
    addServerFormEl.classList.toggle("hidden");
  });
  btnCancelAdd.addEventListener("click", () => {
    addServerFormEl.classList.add("hidden");
  });

  btnSaveServer.addEventListener("click", async () => {
    const name = document.getElementById("server-name").value.trim();
    const host = document.getElementById("server-host").value.trim();
    const port = parseInt(document.getElementById("server-port").value, 10) || 22;
    const user = document.getElementById("server-user").value.trim();
    const password = document.getElementById("server-password").value;

    if (!host) {
      alert("Vui lòng nhập Host / IP!");
      return;
    }

    const saved = await saveServer(name || `${host}:${port}`, host, port, user, password);
    if (saved) {
      document.getElementById("server-name").value = "";
      document.getElementById("server-host").value = "";
      document.getElementById("server-user").value = "";
      document.getElementById("server-password").value = "";
      addServerFormEl.classList.add("hidden");
    }
  });

  async function saveServer(name, host, port, user, password = "") {
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, host, port, user, password }),
      });
      if (!res.ok) throw new Error(await responseError(res, "Lỗi khi lưu server"));
      const updated = await res.json();
      renderServers(updated);
      return true;
    } catch (err) {
      alert("Lỗi: " + err.message);
      return false;
    }
  }

  async function responseError(res, fallback) {
    const body = await res.text();
    try {
      const data = JSON.parse(body);
      if (data.error) return data.error;
    } catch (err) {
      if (!body) return `${fallback} (HTTP ${res.status})`;
    }
    return body || `${fallback} (HTTP ${res.status})`;
  }

  async function deleteServer(name) {
    try {
      const res = await fetch(`/api/servers?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await responseError(res, "Lỗi khi xóa server"));
      const updated = await res.json();
      renderServers(updated);
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  }

  // Execute Command
  execForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const host = execHost.value.trim();
    const port = parseInt(execPort.value, 10) || 22;
    const user = execUser.value.trim();
    const password = execPass.value;
    const command = execCommand.value.trim();

    if (!host || !user || !command) {
      appendTerminal("❌ LỖI: Vui lòng nhập Host, User và Lệnh thực thi.\n");
      return;
    }
    if (!password) {
      appendTerminal("❌ LỖI: Chưa nhập mật khẩu SSH. Hãy nhập mật khẩu hoặc thêm mật khẩu khi lưu server.\n");
      return;
    }

    btnExec.disabled = true;
    btnExec.textContent = "Đang chạy...";
    appendTerminal(`\n$ [${user}@${host}:${port}] ${command}\n⏳ Đang kết nối SSH và thực thi lệnh...\n`);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port, user, password, command }),
      });

      const body = await res.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch (err) {
        throw new Error(body || `Backend trả về phản hồi không hợp lệ (HTTP ${res.status})`);
      }

      if (res.ok && data.success) {
        appendTerminal(data.output || "(Lệnh thực thi thành công không có output)\n");
      } else {
        appendTerminal(`❌ LỖI (HTTP ${res.status}):\n${data.error || `Backend trả về lỗi HTTP ${res.status}`}\n`);
      }
    } catch (err) {
      appendTerminal(`❌ LỖI GỌI API: ${err.message}\n`);
    } finally {
      btnExec.disabled = false;
      btnExec.textContent = "Chạy Lệnh 🚀";
      loadHistory();
    }
  });

  // Quick Command Chips
  document.querySelectorAll(".btn-chip[data-cmd]").forEach((chip) => {
    chip.addEventListener("click", () => {
      execCommand.value = chip.dataset.cmd;
      execCommand.focus();
    });
  });

  // Terminal Helpers
  function appendTerminal(text) {
    if (terminalOutput.textContent.startsWith("$ Chờ lệnh")) {
      terminalOutput.textContent = "";
    }
    terminalOutput.textContent += text;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  btnClearTerm.addEventListener("click", () => {
    terminalOutput.textContent = "$ Sẵn sàng.\n";
  });

  // History
  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const history = await res.json();
      renderHistory(history);
    } catch (err) {
      console.warn("Lỗi tải lịch sử:", err);
    }
  }

  function renderHistory(history) {
    if (!history || history.length === 0) {
      historyTbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Chưa có lệnh nào được chạy trong phiên này.</td></tr>`;
      return;
    }

    historyTbody.innerHTML = "";
    history.forEach((h) => {
      const timeStr = new Date(h.timestamp).toLocaleTimeString();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${timeStr}</td>
        <td><code>${escapeHtml(h.server)}</code></td>
        <td><code>${escapeHtml(h.command)}</code></td>
        <td>
          <span class="badge-status ${h.success ? "success" : "error"}">
            ${h.success ? "Thành công" : "Thất bại"}
          </span>
        </td>
      `;
      historyTbody.appendChild(tr);
    });
  }

  btnRefreshHistory.addEventListener("click", loadHistory);

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial load
  loadServers();
  loadHistory();
});
