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

  const toVW = (px, base) =>
    ((px / base) * 100).toFixed(2).replace(/\.?0+$/, "") + "vw";

  const toPX = (vw, base) =>
    ((vw / 100) * base).toFixed(2).replace(/\.?0+$/, "") + "px";

  function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

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
  }

  function calculate() {
    const val = parseFloat(valueInput.value);
    const base = parseFloat(baseInput.value);
    if (isNaN(val) || isNaN(base) || base === 0) {
      resultContainer.classList.add("hidden");
      return;
    }
    const output = reverse ? toPX(val, base) : toVW(val, base);
    resultSpan.textContent = output;
    resultContainer.classList.remove("hidden");
    chrome.storage.local.set({
      reverse,
      value: valueInput.value,
      base: baseInput.value,
      output,
    });
  }

  // restore state
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

  toggleBtn.addEventListener("click", () => {
    reverse = !reverse;
    chrome.storage.local.set({ reverse });
    updateModeUI();
    calculate();
  });

  convertBtn.addEventListener("click", calculate);

  const copyAndSelect = () => {
    selectText(resultSpan);
    navigator.clipboard.writeText(resultSpan.textContent);
  };

  resultSpan.addEventListener("click", copyAndSelect);
  copyBtn.addEventListener("click", copyAndSelect);
});
