try {
  if (typeof Cc == "undefined") var Cc = Components.classes;
  if (typeof Ci == "undefined") var Ci = Components.interfaces;
  if (typeof Cr == "undefined") var Cr = Components.results;
} catch (e) {}

try {
  var aepfs=Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
  aepfs.setBoolPref("extensions.attachmentextractor_cont.debug",aepfs.getBoolPref("extensions.attachmentextractor_cont.debugonstart"));
  aepfs=null;
} catch (e) {}
