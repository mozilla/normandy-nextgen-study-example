# Normandy NextGen Study Example

Demonstrates how to make a 2019-style Normandy add-on study

# Development

```
yarn install --frozen-lockfile
yarn build
```

A built add-on will be placed in `./web-ext-artifacts/`.

For this add-on to work, it must be used in a version of Firefox with the
Normandy studies web extension available. Additionally, it must be run on a
pre-release build, such as Nightly, Dev-Edition, or an unbranded build, and
the preference `extensions.legacy.enabled` must be set to true.

To manually add a study to Normandy's database, to test this add-on without
involving a Normandy server, use the code below:

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
