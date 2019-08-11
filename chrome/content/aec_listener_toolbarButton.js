var {
  Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");

window.addEventListener("load", function(e) {
  aecButtonStatus.startup();
}, false);
window.addEventListener("unload", function(e) {
  aecButtonStatus.shutdown();
}, false);

var aecButtonStatus = {

  startup: function() {
    this.observerService = Components.classes[
        "@mozilla.org/observer-service;1"]
      .getService(Components.interfaces.nsIObserverService);
    this.observerService.addObserver(this, "mail:updateToolbarItems",
    false);
  },

  shutdown: function() {
    this.observerService.removeObserver(this, "mail:updateToolbarItems");
  },

  observe: function(subject, topic, data) {
    switch (topic) {
      case "mail:updateToolbarItems":
        this.setButtonStatus();
        break;
    }
  },

  setButtonStatus: function() {
    try {
      if (gFolderDisplay.selectedCount < 1) {
        // console.log("AEC gFolderDisplay.selectedCount < 1");
        aecButtonStatus.disableButtons();
      } else {
        aecButtonStatus.enableButtons();
      }
    } catch (e) {
      // console.log("AEC catch error");
      aecButtonStatus.enableButtons();
    }
  },

  enableButtons: function() {
    // console.log("aec ----------------");
    // console.log("aec enableButtons");

    // we MUST use removeAttribute("disabled")
    // setAttribute to false leads to problems in tabbar-toolbar

    let aecToolbarButton = document.getElementById("attachmentextractor-toolbarbutton");
    if (aecToolbarButton)
      aecToolbarButton.removeAttribute("disabled");
  },

  disableButtons: function() {
    // console.log("aec ----------------");
    // console.log("aec disableButtons");

    let aecToolbarButton = document.getElementById("attachmentextractor-toolbarbutton");
    if (aecToolbarButton)
      aecToolbarButton.setAttribute("disabled", true);
  },

}