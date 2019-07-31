/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var {
  Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");

var aedebug = false;
var aedebugFile = null;
try {
  aedebug = Components.classes["@mozilla.org/preferences-service;1"].
  getService(Components.interfaces.nsIPrefBranch).getBoolPref(
    "extensions.attachmentextractor_cont.debug");
  if (aedebug) {
    aedebug = Components.classes['@mozilla.org/network/file-output-stream;1'].
    createInstance(Components.interfaces.nsIFileOutputStream);
    aedebugFile = Components.classes["@mozilla.org/file/directory_service;1"].
    getService(Components.interfaces.nsIProperties).get("ProfD", Components
      .interfaces.nsIFile);
    aedebugFile.append('aec_debug.txt');
  }
} catch (e) {}

var argexpand = (aedebug) ? function(args) {
  var str = "";
  for (var i = 0; i < args.length; i++) {
    if (i > 0) str += ",";
    str += args[i] + "";
  }
  return str;
} : function() {
  return "";
};

var aedump = (aedebug) ? function() {
  var loglevel = 4;
  var errorlevel = (arguments.length > 1) ? arguments[1] : 0;
  if (errorlevel <= loglevel) {
    try {
      var str = (arguments[0] + "").replace(/\n/g, "\r\n");
      aedebug.init(aedebugFile, 0x02 | 0x10, 0664, 0);
      aedebug.write(str, str.length);
      aedebug.close();
    } catch (e) {
      dump("!NOT LOGGED: ");
    }
    dump(arguments[0]);
  }
} : function() {};

/* shortcut object to get & set ae's preferences.*/
function AEPrefs() {
  this.aeBranch = Components.classes["@mozilla.org/preferences-service;1"].
  getService(Components.interfaces.nsIPrefService).getBranch(
    "extensions.attachmentextractor_cont.");
  this.prefService = Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService);
  this.get = function get(pref, branch) {
    var ps = (typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch);
    var type = ps.getPrefType(pref);
    if (type == ps.PREF_BOOL) return ps.getBoolPref(pref);
    if (type == ps.PREF_INT) return ps.getIntPref(pref);
    if (type == ps.PREF_STRING) return ps.getCharPref(pref);
    return null;
  };
  this.getComplex = function getComplex(pref, branch) {
    return ((typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch)).getStringPref(pref);
  };
  this.getFile = function getFile(pref, branch) {
    return this.getComplex(pref, branch);
  };
  this.getRelFile = function getRelFile(pref, branch) {
    return this.getComplex(pref, branch).file;
  };
  this.getRelFileKey = function getRelFile(pref, branch) {
    return this.getComplex(pref, branch).relativeToKey;
  };
  this.set = function set(pref, value, branch) {
    var ps = (typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch);
    var type = ps.getPrefType(pref);
    if (type == ps.PREF_BOOL) return ps.setBoolPref(pref, value);
    if (type == ps.PREF_INT) return ps.setIntPref(pref, value);
    if (type == ps.PREF_STRING) return ps.setCharPref(pref, value);
    return null;
  };
  this.setComplex = function setComplex(pref, value, branch) {
    return ((typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch)).setStringPref(pref, value);
  };
  this.setFile = function getFile(pref, value, branch) {
    return this.setComplex(pref, value, branch);
  }
  this.setRelFile = function setRelFile(pref, value, key, branch) {
    var relFile = Components.classes["@mozilla.org/pref-relativefile;1"]
      .createInstance(Components.interfaces.nsIRelativeFilePref);
    var oldValue = (this.hasUserValue(pref, branch)) ? this.getComplex(pref,
      branch) : null;
    relFile.relativeToKey = key ? key : oldValue.relativeToKey;
    relFile.file = value ? value : oldValue.file;
    return this.setComplex(pref, relFile, branch);
  };
  this.hasUserValue = function hasUserValue(pref, branch) {
    return ((typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch)).prefHasUserValue(pref);
  };
  this.clearUserPref = function clearUserPref(pref, branch) {
    return ((typeof branch == "undefined") ? this.aeBranch : this.prefService
      .getBranch(branch)).clearUserPref(pref);
  };
};