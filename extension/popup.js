document.addEventListener("DOMContentLoaded", () => {
  const inputText = document.getElementById("inputText");
  const checkButton = document.getElementById("checkButton");
  const resultDiv = document.getElementById("result");
  const scamBar = document.getElementById("scamBar");
  const detectionModel = document.getElementById("detectionModel");
  const spinner = document.getElementById("loadingSpinner");

  chrome.storage.local.get("selectedModel", (data) => {
    if (data.selectedModel) {
      detectionModel.value = data.selectedModel;

      chrome.runtime.sendMessage({
        type: "DROPDOWN_SELECTION",
        selection: data.selectedModel
      }, (response) => {
        console.log("Background acknowledged restored selection:", response);
      });
    }
  });

  detectionModel.addEventListener("change", (e) => {
    const selected = e.target.value;
    chrome.storage.local.set({ selectedModel: selected });
    chrome.runtime.sendMessage({
      type: "DROPDOWN_SELECTION",
      selection: selected
    }, (response) => {
      console.log("Background acknowledged new selection:", response);
    });
  });

  document.getElementById("detectionModel").addEventListener("change", (e) => {
    const selected = e.target.value;
    chrome.storage.local.set({ selectedModel: selected });
  });

  checkButton.addEventListener("click", () => {
    const text = inputText.value.trim();
    if (!text) {
      resultDiv.textContent = "Please input some text.";
      return;
    }

    spinner.classList.remove("hidden");
    resultDiv.textContent = "Checking...";
    scamBar.style.width = "0%";

    chrome.runtime.sendMessage({ type: "EMAIL_DATA", data: { subject: "", body: text } }, (response) => {
      spinner.classList.add("hidden");

      if (response) {
        const score = response.spam_score;
        const percent = Math.round(score * 100);
        resultDiv.textContent = `Scam Likelihood: ${percent}%`;

        let color = "#4caf50";
        if (score > 0.66) {
          color = "#f44336";
        } else if (score > 0.33) {
          color = "#ff9800";
        }

        scamBar.style.width = `${percent}%`;
        scamBar.style.background = color;
      } else {
        resultDiv.textContent = "Error: Invalid response.";
        scamBar.style.width = "0%";
        scamBar.style.background = "#ccc";
        console.error("Invalid response from background:", response);
      }
    });
  });
});