var {
  Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");

window.addEventListener("load", function(e) {
  aecMenuItemStatus.startup();
}, false);
window.addEventListener("unload", function(e) {
  aecMenuItemStatus.shutdown();
}, false);

var aecMenuItemStatus = {

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
        this.setMenuItemStatus();
        break;
    }
  },

  setMenuItemStatus: function() {
    try {
      if (gFolderDisplay.selectedCount < 1) {
        // console.log("AEC gFolderDisplay.selectedCount < 1");
        aecMenuItemStatus.disableMenuItems();
      } else {
        aecMenuItemStatus.enableMenuItems();
      }
    } catch (e) {
      // console.log("AEC catch error");
      aecMenuItemStatus.enableMenuItems();
    }
  },

  enableMenuItems: function() {
    // console.log("aec ----------------");
    // console.log("aec enableMenuItems");

    // we MUST use removeAttribute("disabled")

    let aecMenuSeparator = document.getElementById("aec-messageMenuPopup-separator");
    if (aecMenuSeparator)
      aecMenuSeparator.removeAttribute("disabled");

    let aecMenuItem = document.getElementById("aec-messageMenuPopup-menu");
    if (aecMenuItem)
      aecMenuItem.removeAttribute("disabled");
    },

  disableMenuItems: function() {
    // console.log("aec ----------------");
    // console.log("aec disableMenuItems");

    let aecMenuSeparator = document.getElementById("aec-messageMenuPopup-separator");
    if (aecMenuSeparator)
      aecMenuSeparator.setAttribute("disabled", true);

      let aecMenuItem = document.getElementById("aec-messageMenuPopup-menu");
    if (aecMenuItem)
      aecMenuItem.setAttribute("disabled", true);
    },

}
