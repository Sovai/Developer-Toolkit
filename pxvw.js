document.addEventListener("DOMContentLoaded", () => {
  const pageTitle = document.getElementById("pageTitle");
  const valueLabel = document.getElementById("valueLabel");
  const valueInput = document.getElementById("valueInput");
  const baseLabel = document.getElementById("baseLabel");
  const baseInput = document.getElementById("baseInput");
  const baseInputContainer = document.getElementById("baseInputContainer");
  const convertBtn = document.getElementById("convertBtn");
  const toggleBtn = document.getElementById("toggleBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultContainer = document.getElementById("resultContainer");
  const resultSpan = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");
  const pxvwModeBtn = document.getElementById("pxvwModeBtn");
  const rempxModeBtn = document.getElementById("rempxModeBtn");
  const tailwindModeBtn = document.getElementById("tailwindModeBtn");
  const tailwindContainer = document.getElementById("tailwindContainer");
  const tailwindSearch = document.getElementById("tailwindSearch");
  const tailwindResults = document.getElementById("tailwindResults");
  const spacingTabBtn = document.getElementById("spacingTabBtn");
  const fontTabBtn = document.getElementById("fontTabBtn");

  let currentMode = "rempx"; // "pxvw", "rempx", or "tailwind"
  let reverse = false;
  let tailwindCategory = "spacing"; // "spacing" or "font"

  // Tailwind data
  const tailwindSpacing = [
    { class: "0", pixels: "0px", notes: "" },
    { class: "0.5", pixels: "2px", notes: "" },
    { class: "1", pixels: "4px", notes: "" },
    { class: "1.5", pixels: "6px", notes: "" },
    { class: "2", pixels: "8px", notes: "" },
    { class: "2.5", pixels: "10px", notes: "" },
    { class: "3", pixels: "12px", notes: "" },
    { class: "3.5", pixels: "14px", notes: "" },
    { class: "4", pixels: "16px", notes: "1rem" },
    { class: "5", pixels: "20px", notes: "" },
    { class: "6", pixels: "24px", notes: "" },
    { class: "7", pixels: "28px", notes: "" },
    { class: "8", pixels: "32px", notes: "2rem" },
    { class: "9", pixels: "36px", notes: "" },
    { class: "10", pixels: "40px", notes: "" },
    { class: "11", pixels: "44px", notes: "" },
    { class: "12", pixels: "48px", notes: "" },
    { class: "14", pixels: "56px", notes: "" },
    { class: "16", pixels: "64px", notes: "4rem" },
    { class: "20", pixels: "80px", notes: "" },
    { class: "24", pixels: "96px", notes: "" },
    { class: "28", pixels: "112px", notes: "" },
    { class: "32", pixels: "128px", notes: "" },
    { class: "36", pixels: "144px", notes: "" },
    { class: "40", pixels: "160px", notes: "" },
    { class: "44", pixels: "176px", notes: "" },
    { class: "48", pixels: "192px", notes: "" },
    { class: "52", pixels: "208px", notes: "" },
    { class: "56", pixels: "224px", notes: "" },
    { class: "60", pixels: "240px", notes: "" },
    { class: "64", pixels: "256px", notes: "" },
    { class: "72", pixels: "288px", notes: "" },
    { class: "80", pixels: "320px", notes: "" },
    { class: "96", pixels: "384px", notes: "" }
  ];

  const tailwindFontSizes = [
    { class: "text-xs", pixels: "12px", notes: "Line height: 1rem (16px)" },
    { class: "text-sm", pixels: "14px", notes: "Line height: 1.25rem (20px)" },
    { class: "text-base", pixels: "16px", notes: "Line height: 1.5rem (24px)" },
    { class: "text-lg", pixels: "18px", notes: "Line height: 1.75rem (28px)" },
    { class: "text-xl", pixels: "20px", notes: "Line height: 1.75rem (28px)" },
    { class: "text-2xl", pixels: "24px", notes: "Line height: 2rem (32px)" },
    { class: "text-3xl", pixels: "30px", notes: "Line height: 2.25rem (36px)" },
    { class: "text-4xl", pixels: "36px", notes: "Line height: 2.5rem (40px)" },
    { class: "text-5xl", pixels: "48px", notes: "Line height: 1" },
    { class: "text-6xl", pixels: "60px", notes: "Line height: 1" },
    { class: "text-7xl", pixels: "72px", notes: "Line height: 1" },
    { class: "text-8xl", pixels: "96px", notes: "Line height: 1" },
    { class: "text-9xl", pixels: "128px", notes: "Line height: 1" }
  ];

  // Conversion functions
  const toVW = (px, base) =>
    ((px / base) * 100).toFixed(2).replace(/\.?0+$/, "") + "vw";

  const toPX = (vw, base) =>
    ((vw / 100) * base).toFixed(2).replace(/\.?0+$/, "") + "px";

  const toREM = (px, base = 16) =>
    (px / base).toFixed(3).replace(/\.?0+$/, "") + "rem";

  const remToPX = (rem, base = 16) =>
    (rem * base).toFixed(2).replace(/\.?0+$/, "") + "px";

  function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function updateModeUI() {
    // Update mode buttons
    pxvwModeBtn.classList.toggle("active", currentMode === "pxvw");
    rempxModeBtn.classList.toggle("active", currentMode === "rempx");
    tailwindModeBtn.classList.toggle("active", currentMode === "tailwind");

    if (currentMode === "tailwind") {
      pageTitle.textContent = "Tailwind CSS Reference";
      baseInputContainer.style.display = "none";
      valueInput.parentElement.style.display = "none";
      tailwindContainer.style.display = "block";
      renderTailwindResults();
    } else {
      baseInputContainer.style.display = "block";
      valueInput.parentElement.style.display = "block";
      tailwindContainer.style.display = "none";

      if (currentMode === "pxvw") {
        pageTitle.textContent = "PX ↔ VW Converter";

        if (reverse) {
          valueLabel.textContent = "VW value";
          valueInput.placeholder = "Enter vw value";
          convertBtn.textContent = "Convert to PX";
          baseLabel.textContent = "Viewport Width (px)";
          baseInput.placeholder = "Viewport width (px)";
        } else {
          valueLabel.textContent = "Pixels (px)";
          valueInput.placeholder = "Pixels (px)";
          convertBtn.textContent = "Convert to VW";
          baseLabel.textContent = "Viewport Width (px)";
          baseInput.placeholder = "Viewport width (px)";
        }
      } else {
        pageTitle.textContent = "REM ↔ PX Converter";

        if (reverse) {
          valueLabel.textContent = "REM value";
          valueInput.placeholder = "Enter rem value";
          convertBtn.textContent = "Convert to PX";
          baseLabel.textContent = "Base Font Size (px)";
          baseInput.placeholder = "Base font size (default: 16px)";
          if (!baseInput.value) baseInput.value = "16";
        } else {
          valueLabel.textContent = "Pixels (px)";
          valueInput.placeholder = "Pixels (px)";
          convertBtn.textContent = "Convert to REM";
          baseLabel.textContent = "Base Font Size (px)";
          baseInput.placeholder = "Base font size (default: 16px)";
          if (!baseInput.value) baseInput.value = "16";
        }
      }
    }
  }  function calculate() {
    const val = parseFloat(valueInput.value);
    const base = parseFloat(baseInput.value);

    if (isNaN(val) || (currentMode === "pxvw" && (isNaN(base) || base === 0))) {
      resultContainer.classList.add("hidden");
      return;
    }

    // For REM mode, use default base of 16 if not provided
    const effectiveBase = currentMode === "rempx" && isNaN(base) ? 16 : base;

    let output;
    if (currentMode === "pxvw") {
      output = reverse ? toPX(val, effectiveBase) : toVW(val, effectiveBase);
    } else {
      output = reverse ? remToPX(val, effectiveBase) : toREM(val, effectiveBase);
    }

    resultSpan.textContent = output;
    resultContainer.classList.remove("hidden");

    // Save state
    chrome.storage.local.set({
      converter_mode: currentMode,
      converter_reverse: reverse,
      converter_value: valueInput.value,
      converter_base: baseInput.value,
      converter_output: output,
    });
  }

  // Tailwind functions
  function renderTailwindResults(searchTerm = "") {
    const data = tailwindCategory === "spacing" ? tailwindSpacing : tailwindFontSizes;
    const filtered = data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return item.class.toLowerCase().includes(searchLower) ||
             item.pixels.toLowerCase().includes(searchLower) ||
             item.notes.toLowerCase().includes(searchLower);
    });

    spacingTabBtn.classList.toggle("active", tailwindCategory === "spacing");
    fontTabBtn.classList.toggle("active", tailwindCategory === "font");

    if (filtered.length === 0) {
      tailwindResults.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    tailwindResults.innerHTML = filtered.map(item => `
      <div class="tailwind-item" data-class="${item.class}">
        <div>
          <span class="tailwind-class">${item.class}</span>
          ${item.notes ? `<span class="tailwind-note">${item.notes}</span>` : ''}
        </div>
        <span class="tailwind-value">${item.pixels}</span>
      </div>
    `).join('');

    // Add click event listeners to all items
    tailwindResults.querySelectorAll('.tailwind-item').forEach(item => {
      item.addEventListener('click', () => {
        const className = item.dataset.class;
        copyTailwindClass(className);
      });
    });
  }

  function copyTailwindClass(className) {
    navigator.clipboard.writeText(className);
    // Visual feedback could be added here
  }

  function searchTailwind() {
    const searchTerm = tailwindSearch.value;
    renderTailwindResults(searchTerm);
  }

  // Restore state
  chrome.storage.local.get(
    ["converter_mode", "converter_reverse", "converter_value", "converter_base", "converter_output"],
    (data) => {
      if (data.converter_mode) currentMode = data.converter_mode;
      if (typeof data.converter_reverse === "boolean") reverse = data.converter_reverse;
      updateModeUI();
      if (data.converter_value) valueInput.value = data.converter_value;
      if (data.converter_base) baseInput.value = data.converter_base;
      if (data.converter_output) {
        resultSpan.textContent = data.converter_output;
        resultContainer.classList.remove("hidden");
      }
    }
  );

  // Mode switching
  pxvwModeBtn.addEventListener("click", () => {
    if (currentMode !== "pxvw") {
      currentMode = "pxvw";
      reverse = false;
      valueInput.value = "";
      baseInput.value = "";
      resultContainer.classList.add("hidden");
      chrome.storage.local.set({ converter_mode: currentMode, converter_reverse: reverse });
      updateModeUI();
    }
  });

  rempxModeBtn.addEventListener("click", () => {
    if (currentMode !== "rempx") {
      currentMode = "rempx";
      reverse = false;
      valueInput.value = "";
      baseInput.value = "16";
      resultContainer.classList.add("hidden");
      chrome.storage.local.set({ converter_mode: currentMode, converter_reverse: reverse });
      updateModeUI();
    }
  });

  toggleBtn.addEventListener("click", () => {
    reverse = !reverse;
    chrome.storage.local.set({ converter_reverse: reverse });
    updateModeUI();
    calculate();
  });

  clearBtn.addEventListener("click", () => {
    valueInput.value = "";
    if (currentMode === "rempx") {
      baseInput.value = "16";
    } else {
      baseInput.value = "";
    }

    // Set result to 0 + current unit
    let unit;
    if (currentMode === "pxvw") {
      unit = reverse ? "px" : "vw";
    } else {
      unit = reverse ? "px" : "rem";
    }

    resultSpan.textContent = `0${unit}`;
    resultContainer.classList.remove("hidden");

    chrome.storage.local.set({
      converter_value: "",
      converter_base: currentMode === "rempx" ? "16" : "",
      converter_output: `0${unit}`,
    });
  });

  // Tailwind mode event listener
  tailwindModeBtn.addEventListener("click", () => {
    if (currentMode !== "tailwind") {
      currentMode = "tailwind";
      resultContainer.classList.add("hidden");
      chrome.storage.local.set({ converter_mode: currentMode });
      updateModeUI();
    }
  });

  // Tailwind category switching
  spacingTabBtn.addEventListener("click", () => {
    if (tailwindCategory !== "spacing") {
      tailwindCategory = "spacing";
      renderTailwindResults(tailwindSearch.value);
    }
  });

  fontTabBtn.addEventListener("click", () => {
    if (tailwindCategory !== "font") {
      tailwindCategory = "font";
      renderTailwindResults(tailwindSearch.value);
    }
  });

  // Tailwind search
  tailwindSearch.addEventListener("input", searchTailwind);

  convertBtn.addEventListener("click", calculate);

  const copyAndSelect = () => {
    selectText(resultSpan);
    navigator.clipboard.writeText(resultSpan.textContent);
  };

  resultSpan.addEventListener("click", copyAndSelect);
  copyBtn.addEventListener("click", copyAndSelect);

  // Auto-calculate on input
  valueInput.addEventListener("input", calculate);
  baseInput.addEventListener("input", calculate);
});
