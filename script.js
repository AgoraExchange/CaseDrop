const splashScreen = document.getElementById("splashScreen");
const app = document.getElementById("app");
const contactBtn = document.getElementById("contactBtn");
const contactDropdown = document.getElementById("contactDropdown");
const contactList = document.getElementById("contactList");
const emailAllBtn = document.getElementById("emailAllBtn");
const caseForm = document.getElementById("caseForm");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");

/*
 Investigators Emails
*/
const CONTACT_EMAILS = [
  "nico.franco@cagreatamerica.com",
  "jasmine.garcia@cagreatamerica.com",
  "carlos.torres@cagreatamerica.com"
];

/*
  Discord webhook for intake.
  Note: Keeping this in frontend code exposes it publicly.
*/
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1486451893059194943/yrO7PQEPQLzCFqSNuaOPIOqZ-1g4I_dMoLOsOInY4F8FB5xUC_AvmQuxDEUSSsKVSVBI";

function initSplash() {
  window.addEventListener("load", () => {
    setTimeout(() => {
      splashScreen.classList.add("hidden");
      app.classList.remove("hidden");
    }, 2500);
  });
}

function populateContacts() {
  contactList.innerHTML = "";

  CONTACT_EMAILS.forEach((email) => {
    const subject = encodeURIComponent("Case Drop Inquiry");
    const body = encodeURIComponent(
      "Hello,\n\nI am reaching out regarding a Case Drop matter.\n\n"
    );

    const link = document.createElement("a");
    link.className = "contact-link";
    link.href = `mailto:${email}?subject=${subject}&body=${body}`;
    link.textContent = email;

    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    link.appendChild(arrow);

    contactList.appendChild(link);
  });
}

function toggleContactDropdown() {
  const isHidden = contactDropdown.classList.contains("hidden");

  if (isHidden) {
    contactDropdown.classList.remove("hidden");
    contactBtn.setAttribute("aria-expanded", "true");
  } else {
    contactDropdown.classList.add("hidden");
    contactBtn.setAttribute("aria-expanded", "false");
  }
}

function closeContactDropdownOnOutsideClick(event) {
  const wrapper = document.querySelector(".contact-menu-wrapper");
  if (!wrapper.contains(event.target)) {
    contactDropdown.classList.add("hidden");
    contactBtn.setAttribute("aria-expanded", "false");
  }
}

function emailAllContacts() {
  const joined = CONTACT_EMAILS.join(",");
  const subject = encodeURIComponent("Case Drop Inquiry");
  const body = encodeURIComponent("Hello Investigations Team,\n\n");
  window.location.href = `mailto:${joined}?subject=${subject}&body=${body}`;
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

/*
  Severity logic:
  - Red = urgent / immediate / dangerous / active incident
  - Yellow = important but not immediate emergency
  - Green = lower priority / can review later
*/
function determineSeverity(caseType, statement) {
  const text = `${caseType} ${statement}`.toLowerCase();

  const redKeywords = [
    "weapon",
    "gun",
    "knife",
    "fight",
    "fighting",
    "assault",
    "threat",
    "threatening",
    "injury",
    "injured",
    "bleeding",
    "medical emergency",
    "emergency",
    "fire",
    "smoke",
    "active theft",
    "stealing",
    "stolen",
    "break in",
    "breaking in",
    "trespass in progress",
    "urgent",
    "immediately",
    "asap",
    "right now",
    "now",
    "danger",
    "dangerous",
    "harassment",
    "violence",
    "violent",
    "crash",
    "dented",
    "drugs",
    "drug test",
    "drugtest",
    "marijuana,",
    "smoking",
    "suspicious person following",
    "property damage in progress"
  ];

  const yellowKeywords = [
    "suspicious",
    "loitering",
    "argument",
    "damage",
    "damaged",
    "vandalism",
    "time fraud",
    "fraud",
    "speeding",
    "policy violation",
    "employee issue",
    "guest complaint",
    "complaint",
    "disturbance",
    "possible theft",
    "concern",
    "concerning",
    "follow up",
    "needs review",
    "issue",
    "concern",
    "problem"
  ];

  const greenKeywords = [
    "question",
    "minor",
    "low priority",
    "documentation",
    "for review",
    "downtime",
    "when available",
    "not urgent",
    "later",
    "routine"
  ];

  let score = 0;

  // Case type weighting
  if (caseType === "Suspicious Activity") score += 2;
  if (caseType === "Damage to Property") score += 2;
  if (caseType === "Time Fraud") score += 1;
  if (caseType === "Other") score += 0;

  // Keyword weighting
  redKeywords.forEach((word) => {
    if (text.includes(word)) score += 4;
  });

  yellowKeywords.forEach((word) => {
    if (text.includes(word)) score += 2;
  });

  greenKeywords.forEach((word) => {
    if (text.includes(word)) score -= 1;
  });

  if (score >= 6) {
    return {
      label: "High",
      emoji: "🔴",
      color: 0xff3b30
    };
  }

  if (score >= 3) {
    return {
      label: "Medium",
      emoji: "🟡",
      color: 0xffcc00
    };
  }

  return {
    label: "Low",
    emoji: "🟢",
    color: 0x34c759
  };
}

function buildDiscordPayload(data) {
  const timestamp = new Date().toISOString();
  const severity = determineSeverity(data.caseType, data.statement);

  return {
    username: "Case Drop Intake",
    embeds: [
      {
        title: `${severity.emoji} New Case Report Submitted`,
        description: "A new case has been submitted through the Case Drop intake form.",
        color: severity.color,
        fields: [
          {
            name: "Severity",
            value: `${severity.emoji} ${severity.label} Priority`,
            inline: true
          },
          {
            name: "Case Type",
            value: data.caseType || "N/A",
            inline: true
          },
          {
            name: "Reporter Name",
            value: data.reporterName || "N/A",
            inline: true
          },
          {
            name: "Company Email",
            value: data.companyEmail || "N/A",
            inline: true
          },
          {
            name: "Employee ID #",
            value: data.employeeId || "N/A",
            inline: true
          },
          {
            name: "Statement",
            value: data.statement?.trim() || "No statement provided.",
            inline: false
          }
        ],
        footer: {
          text: "Case Drop • Investigations Intake"
        },
        timestamp
      }
    ]
  };
}

async function submitCase(event) {
  event.preventDefault();

  const formData = new FormData(caseForm);
  const data = {
    reporterName: formData.get("reporterName")?.toString().trim(),
    companyEmail: formData.get("companyEmail")?.toString().trim(),
    employeeId: formData.get("employeeId")?.toString().trim(),
    caseType: formData.get("caseType")?.toString().trim(),
    statement: formData.get("statement")?.toString().trim()
  };

  if (
    !data.reporterName ||
    !data.companyEmail ||
    !data.employeeId ||
    !data.caseType ||
    !data.statement
  ) {
    showToast("Fill out all fields before submitting.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const payload = buildDiscordPayload(data);

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}`);
    }

    caseForm.reset();
    showToast("Case submitted successfully.", "success");
  } catch (error) {
    console.error("Case Drop submission error:", error);
    showToast("Could not send the case. Check webhook or browser policy.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Report Case";
  }
}

function bindEvents() {
  contactBtn.addEventListener("click", toggleContactDropdown);
  document.addEventListener("click", closeContactDropdownOnOutsideClick);
  emailAllBtn.addEventListener("click", emailAllContacts);
  caseForm.addEventListener("submit", submitCase);
}

initSplash();
populateContacts();
bindEvents();