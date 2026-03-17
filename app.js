import { firebaseConfig } from "./firebase-config.js";

const defaultRows = [
  {
    id: crypto.randomUUID(),
    date: "",
    vehicle: "Train",
    route: "",
    transport: 0,
    hotel: 0,
    meals: 0,
    work: "",
    serviceType: "",
    proofs: [],
  },
  {
    id: crypto.randomUUID(),
    date: "",
    vehicle: "Auto",
    route: "",
    transport: 0,
    hotel: 0,
    meals: 0,
    work: "",
    serviceType: "",
    proofs: [],
  },
];

const state = {
  user: null,
  firebaseReady: false,
  auth: null,
  db: null,
  rows: structuredClone(defaultRows),
  reports: [],
  currentReportId: null,
};

const elements = {
  authPanel: document.querySelector("#authPanel"),
  sheetPanel: document.querySelector("#sheetPanel"),
  firebaseStatus: document.querySelector("#firebaseStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  signupButton: document.querySelector("#signupButton"),
  authMessage: document.querySelector("#authMessage"),
  companyName: document.querySelector("#companyName"),
  employeeName: document.querySelector("#employeeName"),
  employeePosition: document.querySelector("#employeePosition"),
  employeeCity: document.querySelector("#employeeCity"),
  reportMonth: document.querySelector("#reportMonth"),
  reportNote: document.querySelector("#reportNote"),
  cashAdvance: document.querySelector("#cashAdvance"),
  expenseTableBody: document.querySelector("#expenseTableBody"),
  transportTotal: document.querySelector("#transportTotal"),
  hotelTotal: document.querySelector("#hotelTotal"),
  mealsTotal: document.querySelector("#mealsTotal"),
  grandTotal: document.querySelector("#grandTotal"),
  summarySubtotal: document.querySelector("#summarySubtotal"),
  summaryClaim: document.querySelector("#summaryClaim"),
  saveReportButton: document.querySelector("#saveReportButton"),
  newRowButton: document.querySelector("#newRowButton"),
  downloadButton: document.querySelector("#downloadButton"),
  refreshReportsButton: document.querySelector("#refreshReportsButton"),
  savedReportsList: document.querySelector("#savedReportsList"),
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

let html2pdfLoader = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "expense-report";
}

async function loadHtml2Pdf() {
  if (window.html2pdf) {
    return window.html2pdf;
  }

  if (!html2pdfLoader) {
    html2pdfLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve(window.html2pdf);
      script.onerror = () => reject(new Error("Unable to load PDF library."));
      document.head.appendChild(script);
    });
  }

  return html2pdfLoader;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));
  if (!images.length) {
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        }),
    ),
  );
}

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => typeof value === "string" && value.trim() !== "");
}

async function initializeFirebase() {
  if (!hasFirebaseConfig()) {
    elements.firebaseStatus.textContent = "System setup pending";
    elements.authMessage.textContent = "Sign-in and storage setup is required before login is available.";
    return;
  }

  const [
    { initializeApp },
    authModule,
    firestoreModule,
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
  ]);

  const app = initializeApp(firebaseConfig);

  state.auth = authModule.getAuth(app);
  state.db = firestoreModule.getFirestore(app);
  state.firebaseReady = true;
  elements.firebaseStatus.textContent = "System ready";
  elements.firebaseStatus.classList.add("ready");

  authModule.onAuthStateChanged(state.auth, async (user) => {
    state.user = user;
    toggleAuthenticatedView(Boolean(user));

    if (user) {
      elements.authMessage.textContent = "";
      elements.authEmail.value = user.email ?? "";
      elements.employeeName.value = user.displayName ?? elements.employeeName.value;
      await loadReports();
    } else {
      state.reports = [];
      state.currentReportId = null;
      renderSavedReports();
    }
  });

  elements.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value.trim();

    try {
      await authModule.signInWithEmailAndPassword(state.auth, email, password);
      elements.authMessage.textContent = "Logged in.";
    } catch (error) {
      elements.authMessage.textContent = error.message;
    }
  });

  elements.signupButton.addEventListener("click", async () => {
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value.trim();

    try {
      await authModule.createUserWithEmailAndPassword(state.auth, email, password);
      elements.authMessage.textContent = "Account created.";
    } catch (error) {
      elements.authMessage.textContent = error.message;
    }
  });

  elements.logoutButton.addEventListener("click", async () => {
    await authModule.signOut(state.auth);
  });

  state.authModule = authModule;
  state.firestoreModule = firestoreModule;
}

function toggleAuthenticatedView(isAuthenticated) {
  elements.authPanel.classList.toggle("hidden", isAuthenticated);
  elements.sheetPanel.classList.toggle("hidden", !isAuthenticated);
  elements.logoutButton.classList.toggle("hidden", !isAuthenticated);
}

function addRow(row = null) {
  state.rows.push(
    row ?? {
      id: crypto.randomUUID(),
      date: "",
      vehicle: "Auto",
      route: "",
      transport: 0,
      hotel: 0,
      meals: 0,
      work: "",
      serviceType: "",
      proofs: [],
    },
  );
  renderRows();
}

function updateRow(id, key, value) {
  state.rows = state.rows.map((row) => (row.id === id ? { ...row, [key]: value } : row));
}

function removeRow(id) {
  state.rows = state.rows.filter((row) => row.id !== id);
  renderRows();
}

function parseAmount(value) {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function rowTotal(row) {
  return parseAmount(row.transport) + parseAmount(row.hotel) + parseAmount(row.meals);
}

function reportPayload() {
  const subtotal = state.rows.reduce((sum, row) => sum + rowTotal(row), 0);
  const cashAdvance = parseAmount(elements.cashAdvance.value);

  return {
    companyName: elements.companyName.value.trim(),
    employeeName: elements.employeeName.value.trim(),
    position: elements.employeePosition.value.trim(),
    city: elements.employeeCity.value.trim(),
    reportMonth: elements.reportMonth.value,
    note: elements.reportNote.value.trim(),
    cashAdvance,
    subtotal,
    totalClaim: subtotal - cashAdvance,
    rows: state.rows.map((row) => ({
      ...row,
      proofs: [],
      proofCount: Array.isArray(row.proofs) ? row.proofs.length : 0,
      proofNames: Array.isArray(row.proofs) ? row.proofs.map((proof) => proof.name) : [],
    })),
    updatedAt: new Date().toISOString(),
    userEmail: state.user?.email ?? "",
  };
}

function loadReportIntoForm(report) {
  state.currentReportId = report.id;
  elements.companyName.value = report.companyName ?? "SCENTMATIC";
  elements.employeeName.value = report.employeeName ?? "";
  elements.employeePosition.value = report.position ?? "";
  elements.employeeCity.value = report.city ?? "";
  elements.reportMonth.value = report.reportMonth ?? "";
  elements.reportNote.value = report.note ?? "";
  elements.cashAdvance.value = report.cashAdvance ?? 0;
  state.rows =
    Array.isArray(report.rows) && report.rows.length > 0
      ? report.rows.map((row) => ({ ...row, proofs: Array.isArray(row.proofs) ? row.proofs : [] }))
      : structuredClone(defaultRows);
  renderRows();
}

async function saveReport() {
  if (!state.firebaseReady || !state.user) {
    return;
  }

  const { doc, setDoc, collection } = state.firestoreModule;
  const payload = reportPayload();
  const reportRef =
    state.currentReportId
      ? doc(state.db, "users", state.user.uid, "reports", state.currentReportId)
      : doc(collection(state.db, "users", state.user.uid, "reports"));

  await setDoc(reportRef, payload, { merge: true });
  state.currentReportId = reportRef.id;
  await loadReports();
}

async function loadReports() {
  if (!state.firebaseReady || !state.user) {
    return;
  }

  const { collection, getDocs, orderBy, query } = state.firestoreModule;
  const reportsQuery = query(
    collection(state.db, "users", state.user.uid, "reports"),
    orderBy("updatedAt", "desc"),
  );
  const snapshot = await getDocs(reportsQuery);
  state.reports = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
  renderSavedReports();
}

async function deleteReport(id) {
  if (!state.firebaseReady || !state.user) {
    return;
  }

  const { deleteDoc, doc } = state.firestoreModule;
  await deleteDoc(doc(state.db, "users", state.user.uid, "reports", id));

  if (state.currentReportId === id) {
    resetForm();
  }

  await loadReports();
}

function resetForm() {
  state.currentReportId = null;
  elements.companyName.value = "SCENTMATIC";
  elements.employeeName.value = "";
  elements.employeePosition.value = "";
  elements.employeeCity.value = "";
  elements.reportMonth.value = "";
  elements.reportNote.value = "";
  elements.cashAdvance.value = 0;
  state.rows = structuredClone(defaultRows);
  renderRows();
}

function renderRows() {
  elements.expenseTableBody.innerHTML = "";

  state.rows.forEach((row) => {
    const proofCount = Array.isArray(row.proofs) ? row.proofs.length : 0;
    const proofSlotsLeft = Math.max(0, 3 - proofCount);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="date" value="${escapeHtml(row.date ?? "")}" data-id="${row.id}" data-key="date" /></td>
      <td>
        <select data-id="${row.id}" data-key="vehicle">
          ${["Train", "Auto", "Bus", "Cab", "Flight", "Other"]
            .map((vehicle) => `<option value="${vehicle}" ${row.vehicle === vehicle ? "selected" : ""}>${vehicle}</option>`)
            .join("")}
        </select>
      </td>
      <td><textarea class="cell-textarea route-textarea" rows="2" placeholder="Travel route" data-id="${row.id}" data-key="route">${escapeHtml(row.route ?? "")}</textarea></td>
      <td><input type="number" min="0" step="0.01" value="${row.transport ?? 0}" data-id="${row.id}" data-key="transport" /></td>
      <td><input type="number" min="0" step="0.01" value="${row.hotel ?? 0}" data-id="${row.id}" data-key="hotel" /></td>
      <td><input type="number" min="0" step="0.01" value="${row.meals ?? 0}" data-id="${row.id}" data-key="meals" /></td>
      <td><input type="text" value="${escapeHtml(row.work ?? "")}" placeholder="Client or location" data-id="${row.id}" data-key="work" /></td>
      <td><input type="text" value="${escapeHtml(row.serviceType ?? "")}" placeholder="Service type" data-id="${row.id}" data-key="serviceType" /></td>
      <td class="amount-cell" data-total-id="${row.id}">${money.format(rowTotal(row))}</td>
      <td class="proof-cell">
        <label class="proof-button">
          <input type="file" accept="image/*" multiple data-proof-id="${row.id}" ${proofSlotsLeft === 0 ? "disabled" : ""} />
          ${proofSlotsLeft === 0 ? "Limit reached" : "Add proof"}
        </label>
        <div class="proof-meta">${proofCount}/3 proofs</div>
      </td>
      <td class="row-action"><button type="button" class="danger-button" data-delete-id="${row.id}">Delete</button></td>
    `;
    elements.expenseTableBody.appendChild(tr);
  });

  updateTotals();
}

function updateTotals() {
  const transportTotal = state.rows.reduce((sum, row) => sum + parseAmount(row.transport), 0);
  const hotelTotal = state.rows.reduce((sum, row) => sum + parseAmount(row.hotel), 0);
  const mealsTotal = state.rows.reduce((sum, row) => sum + parseAmount(row.meals), 0);
  const subtotal = transportTotal + hotelTotal + mealsTotal;
  const totalClaim = subtotal - parseAmount(elements.cashAdvance.value);

  elements.transportTotal.textContent = money.format(transportTotal);
  elements.hotelTotal.textContent = money.format(hotelTotal);
  elements.mealsTotal.textContent = money.format(mealsTotal);
  elements.grandTotal.textContent = money.format(subtotal);
  elements.summarySubtotal.textContent = money.format(subtotal);
  elements.summaryClaim.textContent = money.format(totalClaim);
}

function renderSavedReports() {
  elements.savedReportsList.innerHTML = "";

  if (!state.reports.length) {
    elements.savedReportsList.innerHTML =
      '<div class="report-card"><div><h4>No reports yet</h4><p class="muted">Your saved reports will appear here.</p></div></div>';
    return;
  }

  state.reports.forEach((report) => {
    const wrapper = document.createElement("article");
    wrapper.className = "report-card";
    wrapper.innerHTML = `
      <div>
        <h4>${escapeHtml(report.employeeName || "Untitled report")}</h4>
        <div class="report-meta">
          <span>${escapeHtml(report.reportMonth || "No month")}</span>
          <span>${escapeHtml(report.city || "No city")}</span>
          <span>${money.format(report.totalClaim ?? report.subtotal ?? 0)}</span>
        </div>
      </div>
      <div class="report-card-actions">
        <button type="button" class="ghost-button" data-load-id="${report.id}">Open</button>
        <button type="button" class="danger-button" data-remove-id="${report.id}">Delete</button>
      </div>
    `;
    elements.savedReportsList.appendChild(wrapper);
  });

  document.querySelectorAll("[data-load-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const report = state.reports.find((item) => item.id === button.dataset.loadId);
      if (report) {
        loadReportIntoForm(report);
      }
    });
  });

  document.querySelectorAll("[data-remove-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteReport(button.dataset.removeId);
    });
  });
}

async function downloadCurrentReport() {
  const report = reportPayload();
  const filename = `${slugify(report.employeeName || report.companyName || "expense-report")}.pdf`;
  const rowsMarkup = state.rows
    .map(
      (row) => `
        <tr>
          <td class="cell-yellow">${escapeHtml(row.date || "")}</td>
          <td class="cell-yellow">${escapeHtml(row.vehicle || "")}</td>
          <td class="cell-yellow">${escapeHtml(row.route || "")}</td>
          <td class="cell-yellow amount">${money.format(parseAmount(row.transport))}</td>
          <td class="cell-yellow amount">${money.format(parseAmount(row.hotel))}</td>
          <td class="cell-yellow amount">${money.format(parseAmount(row.meals))}</td>
          <td class="cell-gray">${escapeHtml(row.work || "")}</td>
          <td class="cell-gray">${escapeHtml(row.serviceType || "")}</td>
          <td class="cell-orange amount">${money.format(rowTotal(row))}</td>
        </tr>
      `,
    )
    .join("");

  const proofSections = state.rows
    .filter((row) => Array.isArray(row.proofs) && row.proofs.length > 0)
    .map(
      (row, index) => `
        <section class="proof-block">
          <h3>Proof ${index + 1}: ${escapeHtml(row.route || row.work || row.serviceType || "Expense row")}</h3>
          <div class="proof-grid">
            ${row.proofs
              .map(
                (proof) => `
                  <figure class="proof-item">
                    <img src="${proof.dataUrl}" alt="${escapeHtml(proof.name)}" />
                    <figcaption>${escapeHtml(proof.name)}</figcaption>
                  </figure>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");

  try {
    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      elements.authMessage.textContent = "Allow pop-ups to export the PDF.";
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(filename)}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, sans-serif; color: #2e2419; background: #ffffff; }
            .page { padding: 16px; }
            .sheet { border: 1px solid #b8a98b; }
            .top { display: grid; grid-template-columns: 180px 1fr 220px; }
            .top > div { padding: 10px 12px; border-right: 1px solid #b8a98b; border-bottom: 1px solid #b8a98b; text-align: center; }
            .top > div:last-child { border-right: 0; }
            .brand { color: #4b71af; font-size: 28px; font-family: Georgia, serif; font-weight: 700; }
            .office { background: #f6c794; color: #7e4d17; }
            .employee { background: #f7e9af; padding: 12px; border-bottom: 1px solid #b8a98b; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 18px; }
            .employee strong { display: inline-block; min-width: 110px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #b8a98b; padding: 8px 6px; font-size: 12px; vertical-align: top; word-break: break-word; }
            th { background: #ececec; color: #d8841c; }
            .cell-yellow { background: #faf6bf; }
            .cell-gray { background: #e7e7e7; }
            .cell-orange { background: #ffd1ab; font-weight: 700; }
            .amount { text-align: right; }
            .summary { display: grid; grid-template-columns: 1fr 280px; gap: 16px; padding: 12px; border-top: 1px solid #b8a98b; }
            .note { border: 1px solid #b8a98b; min-height: 110px; padding: 10px; }
            .totals { border: 1px solid #b8a98b; background: #fff6cf; }
            .totals div { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #b8a98b; }
            .totals div:last-child { border-bottom: 0; background: #ffe39f; font-weight: 700; }
            .proofs { margin-top: 18px; }
            .proof-block { margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid; }
            .proof-block h3 { margin: 0 0 10px; font-size: 14px; }
            .proof-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .proof-item { margin: 0; border: 1px solid #d8ccb7; padding: 8px; }
            .proof-item img { width: 100%; max-height: 300px; object-fit: contain; display: block; background: #fff8ef; }
            .proof-item figcaption { margin-top: 6px; font-size: 11px; color: #705d46; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="sheet">
              <div class="top">
                <div class="brand">${escapeHtml(report.companyName || "Company")}</div>
                <div><strong>EXPENSES REPORT</strong></div>
                <div class="office">FOR OFFICE USE ONLY</div>
              </div>
              <div class="employee">
                <div><strong>Name:</strong> ${escapeHtml(report.employeeName)}</div>
                <div><strong>Position:</strong> ${escapeHtml(report.position)}</div>
                <div><strong>City:</strong> ${escapeHtml(report.city)}</div>
                <div><strong>Report Month:</strong> ${escapeHtml(report.reportMonth)}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>From Where to Where</th>
                    <th>Transport</th>
                    <th>Hotel</th>
                    <th>Meals</th>
                    <th>Where Work</th>
                    <th>Service Type</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>${rowsMarkup}</tbody>
              </table>
              <div class="summary">
                <div class="note"><strong>Note:</strong><br />${escapeHtml(report.note).replaceAll("\n", "<br />")}</div>
                <div class="totals">
                  <div><span>SubTotal</span><strong>${money.format(report.subtotal)}</strong></div>
                  <div><span>Cash Advance</span><strong>${money.format(report.cashAdvance)}</strong></div>
                  <div><span>Total Claim</span><strong>${money.format(report.totalClaim)}</strong></div>
                </div>
              </div>
            </div>
            ${proofSections ? `<section class="proofs"><h2>Expense Proofs</h2>${proofSections}</section>` : ""}
          </div>
          <script>
            const waitForImages = () => Promise.all(
              Array.from(document.images).map((img) => new Promise((resolve) => {
                if (img.complete) {
                  resolve();
                  return;
                }
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              }))
            );
            window.addEventListener('load', async () => {
              await waitForImages();
              setTimeout(() => {
                window.focus();
                window.print();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    elements.authMessage.textContent = "Use the print dialog and choose 'Save as PDF' to save the full report with media.";
  } catch (error) {
    elements.authMessage.textContent = error.message || "Unable to generate PDF.";
  }
}

async function attachProofs(rowId, fileList) {
  const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    return;
  }

  const currentRow = state.rows.find((row) => row.id === rowId);
  const existingProofs = Array.isArray(currentRow?.proofs) ? currentRow.proofs : [];
  const remainingSlots = 3 - existingProofs.length;

  if (remainingSlots <= 0) {
    elements.authMessage.textContent = "Each row can have a maximum of 3 proofs.";
    return;
  }

  const selectedFiles = files.slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    elements.authMessage.textContent = "Only the first 3 proofs are kept for each row.";
  } else {
    elements.authMessage.textContent = "";
  }

  const proofs = await Promise.all(
    selectedFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );

  state.rows = state.rows.map((row) =>
    row.id === rowId ? { ...row, proofs: [...(row.proofs ?? []), ...proofs] } : row,
  );
  renderRows();
}

elements.authForm.addEventListener("submit", (event) => {
  if (state.firebaseReady) {
    return;
  }

  event.preventDefault();
  elements.authMessage.textContent = "Sign-in is not available until system setup is complete.";
});

elements.signupButton.addEventListener("click", () => {
  if (state.firebaseReady) {
    return;
  }

  elements.authMessage.textContent = "Account creation is not available until system setup is complete.";
});

elements.expenseTableBody.addEventListener("input", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  const { id, key } = target.dataset;

  if (!id || !key) {
    return;
  }

  const value = ["transport", "hotel", "meals"].includes(key) ? parseAmount(target.value) : target.value;
  updateRow(id, key, value);

  const row = state.rows.find((item) => item.id === id);
  const totalCell = document.querySelector(`[data-total-id="${id}"]`);
  if (row && totalCell) {
    totalCell.textContent = money.format(rowTotal(row));
  }

  updateTotals();
});

elements.expenseTableBody.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const rowId = target.dataset.proofId;
  if (!rowId || target.type !== "file") {
    return;
  }

  try {
    await attachProofs(rowId, target.files);
  } catch (error) {
    elements.authMessage.textContent = "Unable to read proof file.";
  }
});

elements.expenseTableBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const deleteId = target.dataset.deleteId;
  if (deleteId) {
    removeRow(deleteId);
  }
});

elements.newRowButton.addEventListener("click", () => addRow());
elements.saveReportButton.addEventListener("click", async () => {
  try {
    await saveReport();
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
});
elements.refreshReportsButton.addEventListener("click", async () => {
  try {
    await loadReports();
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
});
elements.downloadButton.addEventListener("click", downloadCurrentReport);
elements.cashAdvance.addEventListener("input", updateTotals);

renderRows();
renderSavedReports();
toggleAuthenticatedView(false);
initializeFirebase().catch((error) => {
  elements.firebaseStatus.textContent = "System error";
  elements.authMessage.textContent = error.message;
});
