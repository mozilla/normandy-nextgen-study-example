# Normandy NextGen Study Example

Demonstrates how to make a 2019-style Normandy add-on study.

There are three _variants_ of the add-on provided: "a", "b", and "c". Each is
identical except for its add-on ID. This is to test different study branches
having different XPIs. The add-on ID is shown in the UI of the add-on, in
order to distinguish different XPIs.

## Usage of the add-on

When installed correctly, the add-on places a green puzzle piece browser
action in the top right of the browser. Clicking this icon will open a page
with details about the add-on's operation. It should show several things.

1. In the header, there should be a color square. The color of the square
   corresponds to the branch name of the enrolled study. For example, if the
   branch's name is "red", then the square will be red.

2. The extension ID. This is useful to verify that the client installed the
   appropriate add-on for the branch, in the case that the study has a
   different add-on per branch.

3. The full study metadata, as JSON. This includes all available local
   metadata about this study, including the add-on installed, the branch
   name, and the study's description.

4. The client metadata, which consists of the Firefox version (i.e.
   `69.0a1`), update channel (i.e. "Nightly"), and the Telemetry client ID,
   usually a UUID.

5. A set of controls to end the study. There is a textbox to enter a reason,
   and a button to end the study. Upon clicking the button, the add-on will
   request that the study be ended, and then listen to events provided by the
   Normandy system. The events are logged in the space below the button. The
   add-on then requests a 10 second delay. In a real study this delay could
   be used to open a tab or send final telemetry. During these 10 seconds,
   the study should be listed as ended in about:studies, and the add-on
   should be visible in about:addons. After the delay is over, the add-on
   will be uninstalled and the page will close.

## Installing the Add-on

For this add-on to work, it must be used in a version of Firefox with the
Normandy Studies web-extension APIs available. These should be available in
Firefox 69 or above, starting with Nightly 2019-06-28. Additionally, it must
be run on a pre-release build, such as Nightly, Dev-Edition, or an unbranded
build, and the preference `extensions.legacy.enabled` must be set to true.

This add-on assume it was installed by Normandy as a part of a study. To
manually add a study to Normandy's database, to test this add-on without
involving a Normandy server, use the code below. This step can be done before
or after the add-on is installed.

Note that if the add-on is not present when the browser starts up, the study
will automatically end.

```js
const { AddonStudies } = ChromeUtils.import(
  "resource://normandy/lib/AddonStudies.jsm"
);
await AddonStudies.add({
  recipeId: 42,
  slug: "test",
  userFacingName: "Test",
  userFacingDescription: "Description",
  branch: "red",
  active: true,
  addonId: "normandy-nextgen-study-example@mozilla.org",
  addonUrl:
    "https://example.com/normandy-nextgen-study-example@mozilla.org-signed.xpi",
  addonVersion: "0.1.0",
  extensionApiId: 1,
  extensionHash: "badhash",
  hashAlgorithm: "sha256",
  studyStartDate: new Date(),
  studyEndDate: null
});
```

## Development

```bash
yarn install
yarn build
```

Several built add-ons will be placed in `./web-ext-artifacts/`. Each is
nearly identical except for the extension ID, which includes the name of the
variant built. The variants are "a", "b", and "c". Nothing changes about the
add-on in each variant except the ID.
