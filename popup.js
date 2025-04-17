// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const valueLabel = document.getElementById("valueLabel");
  const valueInput = document.getElementById("valueInput");
  const baseInput = document.getElementById("vwBaseInput");
  const convertBtn = document.getElementById("convertBtn");
  const toggleBtn = document.getElementById("toggleBtn");
  const resultContainer = document.getElementById("resultContainer");
  const resultSpan = document.getElementById("vwResult");
  const copyBtn = document.getElementById("copyBtn");

  let reverse = false;

  // restore mode/value/base/output
  chrome.storage.local.get(["reverse", "value", "base", "output"], (data) => {
    if (typeof data.reverse === "boolean") reverse = data.reverse;
    updateModeUI();
    if (data.value) valueInput.value = data.value;
    if (data.base) baseInput.value = data.base;
    if (data.output) {
      resultSpan.textContent = data.output;
      resultContainer.classList.remove("hidden");
    }
  });

  function updateModeUI() {
    if (reverse) {
      valueLabel.textContent = "VW value";
      valueInput.placeholder = "Enter vw value";
      convertBtn.textContent = "Convert to PX";
    } else {
      valueLabel.textContent = "Pixels (px)";
      valueInput.placeholder = "Pixels (px)";
      convertBtn.textContent = "Convert to VW";
    }
    resultContainer.classList.add("hidden");
  }

  toggleBtn.addEventListener("click", () => {
    reverse = !reverse;
    chrome.storage.local.set({ reverse });
    updateModeUI();
  });

  convertBtn.addEventListener("click", () => {
    const val = parseFloat(valueInput.value);
    const base = parseFloat(baseInput.value);
    if (isNaN(val) || isNaN(base) || base === 0) return;

    const output = reverse
      ? ((val / 100) * base).toFixed(2).replace(/\.?0+$/, "") + "px"
      : ((val / base) * 100).toFixed(2).replace(/\.?0+$/, "") + "vw";

    resultSpan.textContent = output;
    resultContainer.classList.remove("hidden");

    chrome.storage.local.set({
      value: valueInput.value,
      base: baseInput.value,
      output,
    });
  });

  const copyResult = () =>
    navigator.clipboard.writeText(resultSpan.textContent);

  resultSpan.addEventListener("click", copyResult);
  copyBtn.addEventListener("click", copyResult);
});
