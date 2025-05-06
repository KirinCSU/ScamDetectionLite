chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EMAIL_DATA") {
    console.log("Background received email data", message.data);
    checkForScam(message.data).then((result) => {
      chrome.storage.local.set({emailScanResult: result});
      sendResponse(result);
    });
    return true;
  }

  if (message.type === "DROPDOWN_SELECTION") {
    chrome.storage.local.set({ selection: message.selection }, () => {
      console.log("Background received selection: ", message.selection);
    });
    return true;
  }
  
});

async function checkForScam(emailData) {
  const scam = emailData.subject + " " + emailData.body
  const selection = await new Promise((resolve) => {
    chrome.storage.local.get("selection", (data) => {
      resolve(data.selection);
    });
  });
  const result = await modelAPI(scam, selection);
  return result;
}

async function modelAPI(emailData, selection) {
  try {
    const response = await fetch("https://scam-detection-api-ygnb.onrender.com/api/classify_scam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scam: emailData, model: selection }),
    }); 

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("Network response was not OK: " + errorText);
    }

    const prediction = await response.json();
    return prediction;

  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}