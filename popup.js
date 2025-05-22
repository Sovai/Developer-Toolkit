document.addEventListener("DOMContentLoaded", () => {
  const timestampInput = document.getElementById("timestampInput");
  const formatSelect = document.getElementById("formatSelect");
  const customFormatContainer = document.getElementById(
    "customFormatContainer"
  );
  const customFormatInput = document.getElementById("customFormatInput");
  const useLocalTimezone = document.getElementById("useLocalTimezone");
  const customTimezoneContainer = document.getElementById(
    "customTimezoneContainer"
  );
  const timezoneSelect = document.getElementById("timezoneSelect");
  const convertBtn = document.getElementById("convertBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultContainer = document.getElementById("resultContainer");
  const resultsTable = document.getElementById("resultsTable");
  const copyBtn = document.getElementById("copyBtn");

  // Show/hide custom format input based on selection
  formatSelect.addEventListener("change", () => {
    customFormatContainer.classList.toggle(
      "hidden",
      formatSelect.value !== "custom"
    );
  });

  // Show/hide custom timezone selection based on checkbox
  useLocalTimezone.addEventListener("change", () => {
    customTimezoneContainer.classList.toggle(
      "hidden",
      useLocalTimezone.checked
    );
  });

  // Try to set the default timezone option based on user's timezone
  function setDefaultTimezoneOption() {
    // Get user's timezone offset in minutes
    const offsetMinutes = new Date().getTimezoneOffset();
    // Convert to hours and format with sign and padding
    const offsetHours = -offsetMinutes / 60; // Negate because getTimezoneOffset is opposite of UTC+/-
    const sign = offsetHours >= 0 ? "+" : "-";
    const absHours = Math.abs(offsetHours);
    const hours = Math.floor(absHours).toString().padStart(2, "0");
    const minutes = Math.round((absHours - Math.floor(absHours)) * 60)
      .toString()
      .padStart(2, "0");
    const formattedOffset = `${sign}${hours}:${minutes}`;

    // Find and select the option
    for (const option of timezoneSelect.options) {
      if (option.value === formattedOffset) {
        option.selected = true;
        break;
      }
    }
  }

  setDefaultTimezoneOption();

  // Parse different timestamp formats
  function parseTimestamp(input) {
    input = input.trim();

    // Skip empty lines
    if (!input) return null;

    let timestamp;

    // Try parsing as Unix timestamp (seconds or milliseconds)
    if (/^\d+$/.test(input)) {
      const num = parseInt(input, 10);
      // If it's seconds (10 digits or less), convert to milliseconds
      timestamp = num < 10000000000 ? new Date(num * 1000) : new Date(num);
      if (!isNaN(timestamp.getTime())) return timestamp;
    }

    // Try parsing as ISO date or any other format JS Date can handle
    timestamp = new Date(input);
    if (!isNaN(timestamp.getTime())) return timestamp;

    return "Invalid timestamp";
  }

  // Apply timezone offset to date
  function applyTimezone(date, timezoneOffset) {
    if (date === "Invalid timestamp" || useLocalTimezone.checked) return date;

    // Parse the offset string (+08:00 format)
    const match = timezoneOffset.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return date;

    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const offsetMinutes = sign * (hours * 60 + minutes);

    // Get the UTC time of the date
    const utc = new Date(date.getTime() + date.getTimezoneOffset() * 60000);

    // Apply the custom timezone offset
    return new Date(utc.getTime() + offsetMinutes * 60000);
  }

  // Format a timestamp based on the selected format
  function formatTimestamp(timestamp, format, timezoneOffset) {
    if (timestamp === "Invalid timestamp") return "Invalid timestamp";

    // Apply timezone if needed
    const adjustedTime = applyTimezone(timestamp, timezoneOffset);
    if (adjustedTime === "Invalid timestamp") return "Invalid timestamp";

    // Common formatting functions
    const padZero = (num) => num.toString().padStart(2, "0");
    const year = adjustedTime.getFullYear();
    const month = padZero(adjustedTime.getMonth() + 1);
    const day = padZero(adjustedTime.getDate());
    const hours = padZero(adjustedTime.getHours());
    const minutes = padZero(adjustedTime.getMinutes());
    const seconds = padZero(adjustedTime.getSeconds());
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][adjustedTime.getDay()];
    const shortDayOfWeek = dayOfWeek.substring(0, 3);

    const tzInfo = useLocalTimezone.checked ? "" : ` (UTC${timezoneOffset})`;

    switch (format) {
      case "default":
        return adjustedTime.toLocaleString() + tzInfo;
      case "iso":
        return adjustedTime.toISOString();
      case "date":
        return `${year}-${month}-${day}${tzInfo}`;
      case "time":
        return `${hours}:${minutes}:${seconds}${tzInfo}`;
      case "datetime-day":
        return `${year}-${month}-${day} (${shortDayOfWeek}) ${hours}:${minutes}:${seconds}${tzInfo}`;
      case "custom":
        let customFormat = customFormatInput.value;
        // Simple custom formatter that replaces tokens
        const formattedDate = customFormat
          .replace(/YYYY/g, year)
          .replace(/MM/g, month)
          .replace(/DD/g, day)
          .replace(/HH/g, hours)
          .replace(/mm/g, minutes)
          .replace(/ss/g, seconds)
          .replace(/DAY/g, dayOfWeek)
          .replace(/DDD/g, shortDayOfWeek);
        return formattedDate + tzInfo;
      default:
        return adjustedTime.toLocaleString() + tzInfo;
    }
  }

  // Process timestamps and update results
  function processTimestamps() {
    const lines = timestampInput.value.split("\n");
    const format = formatSelect.value;
    const timezone = timezoneSelect.value;

    // Clear previous results
    resultsTable.innerHTML = "";

    // Process each line
    const results = [];
    lines.forEach((line) => {
      if (!line.trim()) return;

      const timestamp = parseTimestamp(line);
      const formattedTime = formatTimestamp(timestamp, format, timezone);

      // Create result row
      const row = document.createElement("div");
      row.className = "result-row";

      const original = document.createElement("div");
      original.className = "timestamp-original";
      original.textContent = line.trim();

      const formatted = document.createElement("div");
      formatted.className = "timestamp-formatted";
      formatted.textContent = formattedTime;

      const copyRowBtn = document.createElement("button");
      copyRowBtn.className = "copy-row-btn";
      copyRowBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" /></svg>`;
      copyRowBtn.title = "Copy formatted timestamp";
      copyRowBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(formattedTime);
      });

      row.appendChild(original);
      row.appendChild(formatted);
      row.appendChild(copyRowBtn);
      resultsTable.appendChild(row);

      results.push({
        original: line.trim(),
        formatted: formattedTime,
      });
    });

    // Show results if we have any
    if (results.length > 0) {
      resultContainer.classList.remove("hidden");

      // Save state for next session
      chrome.storage.local.set({
        input: timestampInput.value,
        format: formatSelect.value,
        customFormat: customFormatInput.value,
        useLocalTimezone: useLocalTimezone.checked,
        timezone: timezoneSelect.value,
        results,
      });
    } else {
      resultContainer.classList.add("hidden");
    }
  }

  // Process timestamps as user types with debounce
  let debounceTimer;
  timestampInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processTimestamps, 500); // 500ms debounce
  });

  // Set up button event handlers
  convertBtn.addEventListener("click", processTimestamps);

  clearBtn.addEventListener("click", () => {
    timestampInput.value = "";
    resultsTable.innerHTML = "";
    resultContainer.classList.add("hidden");
    chrome.storage.local.set({
      input: "",
      results: [],
    });
  });

  // Copy all results to clipboard
  copyBtn.addEventListener("click", () => {
    const rows = resultsTable.querySelectorAll(".result-row");
    let text = "";

    rows.forEach((row) => {
      const original = row.querySelector(".timestamp-original").textContent;
      const formatted = row.querySelector(".timestamp-formatted").textContent;
      text += `${original} -> ${formatted}\n`;
    });

    navigator.clipboard.writeText(text);
  });

  // Restore previous state
  chrome.storage.local.get(
    ["input", "format", "customFormat", "useLocalTimezone", "timezone"],
    (data) => {
      if (data.input) timestampInput.value = data.input;
      if (data.format) {
        formatSelect.value = data.format;
        customFormatContainer.classList.toggle(
          "hidden",
          data.format !== "custom"
        );
      }
      if (data.customFormat) customFormatInput.value = data.customFormat;
      if (typeof data.useLocalTimezone === "boolean") {
        useLocalTimezone.checked = data.useLocalTimezone;
        customTimezoneContainer.classList.toggle(
          "hidden",
          data.useLocalTimezone
        );
      }
      if (data.timezone) {
        for (const option of timezoneSelect.options) {
          if (option.value === data.timezone) {
            option.selected = true;
            break;
          }
        }
      }

      // Process any saved input
      if (data.input) processTimestamps();
    }
  );

  // Add example placeholder
  if (!timestampInput.value) {
    const now = new Date();
    const examples = [
      Math.floor(now.getTime() / 1000), // Unix seconds
      now.getTime(), // Unix milliseconds
      now.toISOString(), // ISO format
    ];
    timestampInput.placeholder = `Enter timestamps (one per line), examples:\n${examples.join(
      "\n"
    )}`;
  }
});
