try {
  var aepfs=Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  aepfs.setBoolPref("extensions.attachmentextractor_cont.debug",aepfs.getBoolPref("extensions.attachmentextractor_cont.debugonstart"));
  aepfs=null;
} catch (e) {}
