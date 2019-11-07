function makeEl(type, attrs = {}, ...children) {
  const el = document.createElement(type);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  for (const child of children) {
    if (child instanceof Element) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(child.toString()));
    }
  }
  return el;
}

async function main() {
  console.log("Getting basic extension information");
  const manifest = browser.runtime.getManifest();
  document
    .querySelector("#extension-data")
    .appendChild(
      makeEl(
        "p",
        {},
        `This extension is `,
        makeEl("code", {}, browser.runtime.id),
        " version ",
        makeEl("code", {}, manifest.version),
        ".",
      ),
    );

  console.log("Getting compatibility information");
  try {
    if (!browser.normandyAddonStudy) {
      document
        .querySelector("#study-data")
        .appendChild(
          makeEl(
            "p",
            { class: "error" },
            "Normandy APIs are not accessible. are you sure you are using a compatible version of Firefox?",
          ),
        );
    }
  } catch (err) {
    document
      .querySelector("#study-data")
      .appendChild(
        makeEl(
          "p",
          { class: "error" },
          "Could not load compatibility information:",
          err,
        ),
      );
    throw err;
  }

  console.log("getting study information");
  let study;
  try {
    study = await browser.normandyAddonStudy.getStudy();

    if (study) {
      // We have a study. Show it
      document
        .querySelector("#study-data")
        .appendChild(
          makeEl("pre", {}, makeEl("code", {}, JSON.stringify(study, null, 4))),
        );
      document
        .querySelector("#branch-indicator")
        .style.setProperty("background-color", study.branch);
    } else {
      document
        .querySelector("#study-data")
        .appendChild(
          makeEl(
            "p",
            { class: "error" },
            "No study associated with this extension. ",
            "Are you sure you installed this extension via a Normandy add-on study?",
          ),
        );
      document
        .querySelector("#study-data")
        .appendChild(
          makeEl(
            "p",
            {},
            "To test this add-on without involving a Normandy server, run the code below in the Browser Console:",
          ),
        );
      document.querySelector("#study-data").appendChild(
        makeEl(
          "pre",
          {},
          makeEl(
            "code",
            {},
            `const { AddonStudies } = ChromeUtils.import(
  "resource://normandy/lib/AddonStudies.jsm",
);
await AddonStudies.add(${JSON.stringify(
              {
                recipeId: 42,
                slug: "test",
                userFacingName: manifest.name,
                userFacingDescription: manifest.description,
                branch: "red",
                active: true,
                addonId: browser.runtime.id,
                addonUrl: `https://example.com/${browser.runtime.id}-foo.xpi`,
                addonVersion: manifest.version,
                extensionApiId: 1,
                extensionHash: "badhash",
                hashAlgorithm: "sha256",
                studyStartDate: new Date(),
                studyEndDate: null,
              },
              null,
              4,
            )});`,
          ),
        ),
      );
      document
        .querySelector("#study-data")
        .appendChild(
          makeEl("p", {}, "Then reload this page or the add-on itself."),
        );
    }
  } catch (err) {
    document
      .querySelector("#study-data")
      .appendChild(
        makeEl(
          "p",
          { class: "error" },
          "Could not load study information:",
          err,
        ),
      );
    throw err;
  }

  console.log("getting client metadata");
  try {
    const metadata = await browser.normandyAddonStudy.getClientMetadata();
    if (metadata) {
      document
        .querySelector("#client-data")
        .appendChild(
          makeEl(
            "pre",
            {},
            makeEl("code", {}, JSON.stringify(metadata, null, 4)),
          ),
        );
    } else {
      document
        .querySelector("#client-data")
        .appendChild(
          makeEl(
            "p",
            { class: "error" },
            "No client metadata returned. This is a bug.",
          ),
        );
    }
  } catch (err) {
    console.error("Error getting client metadata", err);
    document
      .querySelector("#client-data")
      .appendChild(
        makeEl("p", { class: "error" }, "Could not load client metadata:", err),
      );
    throw err;
  }

  const endStudyDiv = document.querySelector("#end-study");
  if (study && study.ended) {
    endStudyDiv.innerHTML = "";
    endStudyDiv.append(makeEl("p", {}, "The study has already ended."));
  } else if (!study) {
    endStudyDiv.innerHTML = "";
    endStudyDiv.append(makeEl("p", { class: "error" }, "No study found"));
  }

  const form = document.querySelector("#end-study form");
  const endingLog = document.querySelector("#end-study .log");

  function logEndEvent(...messages) {
    endingLog.appendChild(makeEl("li", {}, new Date(), ...messages));
  }

  browser.normandyAddonStudy.onUnenroll.addListener(async reason => {
    logEndEvent("Received ending notification with reason: ", reason);
    const delaySec = 10;
    logEndEvent(`Delaying for ${delaySec} seconds`);
    await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
    logEndEvent("Done delaying");
  });

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const reasonEl = form.querySelector("[name=reason]");
    const reason = reasonEl.value;
    reasonEl.value = "";
    logEndEvent("Ending study for reason: ", reason);
    browser.normandyAddonStudy.endStudy(reason);
  });
}

main();
