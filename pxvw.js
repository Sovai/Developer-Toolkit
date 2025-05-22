document.addEventListener("DOMContentLoaded", () => {
  const valueLabel = document.getElementById("valueLabel");
  const valueInput = document.getElementById("valueInput");
  const baseInput = document.getElementById("vwBaseInput");
  const convertBtn = document.getElementById("convertBtn");
  const toggleBtn = document.getElementById("toggleBtn");
  const clearBtn = document.getElementById("clearBtn");
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
      pxvw_reverse: reverse,
      pxvw_value: valueInput.value,
      pxvw_base: baseInput.value,
      pxvw_output: output,
    });
  }

  // restore state
  chrome.storage.local.get(
    ["pxvw_reverse", "pxvw_value", "pxvw_base", "pxvw_output"],
    (data) => {
      if (typeof data.pxvw_reverse === "boolean") reverse = data.pxvw_reverse;
      updateModeUI();
      if (data.pxvw_value) valueInput.value = data.pxvw_value;
      if (data.pxvw_base) baseInput.value = data.pxvw_base;
      if (data.pxvw_output) {
        resultSpan.textContent = data.pxvw_output;
        resultContainer.classList.remove("hidden");
      }
    }
  );

  toggleBtn.addEventListener("click", () => {
    reverse = !reverse;
    chrome.storage.local.set({ pxvw_reverse: reverse });
    updateModeUI();
    calculate();
  });

  clearBtn.addEventListener("click", () => {
    // reset input
    valueInput.value = "";
    baseInput.value = "";

    // set result to 0 + current unit
    const unit = reverse ? "px" : "vw";
    resultSpan.textContent = `0${unit}`;
    resultContainer.classList.remove("hidden");
    // persist clear
    chrome.storage.local.set({
      pxvw_value: "",
      pxvw_base: "",
      pxvw_output: `0${unit}`,
    });
  });

  convertBtn.addEventListener("click", calculate);

  const copyAndSelect = () => {
    selectText(resultSpan);
    navigator.clipboard.writeText(resultSpan.textContent);
  };

  resultSpan.addEventListener("click", copyAndSelect);
  copyBtn.addEventListener("click", copyAndSelect);
});
