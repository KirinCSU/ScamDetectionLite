(function () {
  console.log("Email Scam Detector Content Script Loaded");

  let lastScannedEmail = "";
  let lastSubjectText = "";
  let stabilityTimer = null;
  let stabilityCheckTimer = null;

  function startMonitoringEmail() {
    if (stabilityTimer) clearTimeout(stabilityTimer);
    if (stabilityCheckTimer) clearInterval(stabilityCheckTimer);

    stabilityCheckTimer = setInterval(() => {
      const subjectElement = document.querySelector("h2.hP");
      const senderElement = document.querySelector("span.gD");

      if (!subjectElement || !senderElement) return;

      const currentSubjectText = subjectElement.innerText;
      const currentSenderText = senderElement.innerText;
      const currentEmailId = currentSubjectText + currentSenderText;

      if (currentSubjectText !== lastSubjectText) {
        lastSubjectText = currentSubjectText;
        return;
      }

      clearInterval(stabilityCheckTimer);

      if (currentEmailId === lastScannedEmail) return;

      lastScannedEmail = currentEmailId;

      const emailData = {
        subject: subjectElement.innerText,
        sender: senderElement.innerText,
        body: document.body.innerText,
      };

      showLoadingSpinner(); 

      chrome.runtime.sendMessage({ type: "EMAIL_DATA", data: emailData }, (response) => {
        hideLoadingSpinner(); 

        if (response && typeof response.spam_score === "number") {
          updateScamBar(response.spam_score);
        } else {
          updateScamBar(null); 
        }
      });
    }, 500);
  }

  function updateScamBar(score) {
    const bar = document.getElementById("scam-progress-bar");
    const label = document.getElementById("scam-percentage-label");

    if (!bar || !label) return;

    if (typeof score !== "number") {
      bar.style.width = "0%";
      bar.style.background = "#ccc";
      label.textContent = "Error";
      return;
    }

    const percentage = Math.round(score * 100);
    bar.style.width = percentage + "%";
    label.textContent = `${percentage}%`;

    let color = "#4caf50";
    if (score > 0.66) color = "#f44336";
    else if (score > 0.33) color = "#ff9800";

    bar.style.background = color;
  }

  function showLoadingSpinner() {
    const spinner = document.getElementById("scam-loading-spinner");
    const label = document.getElementById("scam-percentage-label");
    if (spinner) spinner.style.display = "inline-block";
    if (label) label.textContent = "Checking...";
  }

  function hideLoadingSpinner() {
    const spinner = document.getElementById("scam-loading-spinner");
    if (spinner) spinner.style.display = "none";
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        startMonitoringEmail();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const observer2 = new MutationObserver(() => {
    const subjectElement = document.querySelector("h2.hP");

    if (subjectElement && !document.getElementById("scam-progress-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.id = "scam-progress-wrapper";
      wrapper.style.marginTop = "12px";
      wrapper.style.fontFamily = "Arial, sans-serif";

      const labelRow = document.createElement("div");
      labelRow.style.display = "flex";
      labelRow.style.alignItems = "center";
      labelRow.style.gap = "8px";

      const label = document.createElement("div");
      label.textContent = "Scam Likelihood";
      label.style.fontSize = "14px";
      label.style.fontWeight = "bold";
      label.style.marginBottom = "4px";

      const barRow = document.createElement("div");
      barRow.style.display = "flex";
      barRow.style.alignItems = "center";
      barRow.style.gap = "8px";

      const barContainer = document.createElement("div");
      barContainer.style.flexGrow = "1";
      barContainer.style.height = "10px";
      barContainer.style.background = "#ccc";
      barContainer.style.borderRadius = "5px";
      barContainer.style.overflow = "hidden";

      const bar = document.createElement("div");
      bar.id = "scam-progress-bar";
      bar.style.width = "0%";
      bar.style.height = "100%";
      bar.style.background = "#f44336";
      bar.style.transition = "width 0.5s";

      const percentLabel = document.createElement("span");
      percentLabel.id = "scam-percentage-label";
      percentLabel.textContent = "–";
      percentLabel.style.minWidth = "40px";
      percentLabel.style.fontSize = "13px";

      const spinner = document.createElement("div");
      spinner.id = "scam-loading-spinner";
      spinner.style.border = "3px solid #f3f3f3";
      spinner.style.borderTop = "3px solid #4CAF50";
      spinner.style.borderRadius = "50%";
      spinner.style.width = "14px";
      spinner.style.height = "14px";
      spinner.style.animation = "spin 1s linear infinite";
      spinner.style.display = "none";

      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      labelRow.appendChild(label);
      labelRow.appendChild(percentLabel);
      labelRow.appendChild(spinner);

      barContainer.appendChild(bar);
      barRow.appendChild(barContainer);
      
      wrapper.appendChild(labelRow);
      wrapper.appendChild(barRow);

      subjectElement.parentNode.insertBefore(wrapper, subjectElement.nextSibling);
    }
  });

  observer2.observe(document.body, { childList: true, subtree: true });

  startMonitoringEmail();
})();
