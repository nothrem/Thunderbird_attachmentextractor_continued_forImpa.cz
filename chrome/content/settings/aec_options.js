// global AEC preferences
var AECprefs = Cc["@mozilla.org/preferences-service;1"]
  .getService(Ci.nsIPrefBranch);

// global var filenamepatternbox to be frequently used in aec_options.xul
var filenamepatternbox = document.getElementById('filenamepattern');

if ("undefined" == typeof(wdw_aecConfiguration)) {
  var {
    MailServices
  } = ChromeUtils.import("resource:///modules/MailServices.jsm");
  var {
    Services
  } = ChromeUtils.import("resource://gre/modules/Services.jsm");

  try {
    var filemaker = new AttachmentFileMaker(null, null, null);
    var exampleDate = new Date();
  } catch (e) {}

  var wdw_aecConfiguration = {

    aecInitConfiguration: function() {
      wdw_aecConfiguration.loadInitialPane();

      // enableFields in general pane
      wdw_aecConfiguration.enableField(document.getElementById(
        'afterextractpolicydetach'), 'afterextractpolicydetachmode');
      wdw_aecConfiguration.enableField(document.getElementById(
        'savepathmru'), 'savepathmrucount');
      wdw_aecConfiguration.enableField(document.getElementById(
        'afterextractendlaunch'), ['afterextractendlaunchapplication',
        'afterextractendlaunchapplicationbutton'
      ]);

      // enableFields in filenamepattern pane
      wdw_aecConfiguration.enableField(document.getElementById(
        'afterextractsavemessage'), ['fnpsavemessage',
        'fnpsavemessagecountpattern'
      ]);

      // enableFields in auto pane
      // the different elements have to be en-/disabled in the following function
      wdw_aecConfiguration.enableAutoPaneFields();

      // enableFields in advanced pane
      wdw_aecConfiguration.enableField(document.getElementById('iep0false'),
        'excludepatterns');
      wdw_aecConfiguration.enableField(document.getElementById('iep1true'),
        'includepatterns');
      wdw_aecConfiguration.enableField(document.getElementById(
        'extractmode1'), ['setdatetoemail', 'minimumsize']);
      wdw_aecConfiguration.enableField(document.getElementById(
        'sentreturnreceipt'), ['override']);
      wdw_aecConfiguration.enableField(document.getElementById('reportgen'),
        ['reportname', 'reportgenthumbnail', 'reportgencssfile',
          'reportgencssfilebutton', 'reportgenembedcss'
        ]);

      document.getElementById('filenamepattern_exampledate').value =
        exampleDate.toLocaleString();
      wdw_aecConfiguration.updateexamplefilename(filenamepatternbox);

      wdw_aecConfiguration.showTab();
    },

    enableAutoPaneFields: function() {
      let autoextract = document.getElementById('autoextract');
      // enable or disable simply all elements in groupbox 'autoextractoptions'
      let autoextractoptions = document.getElementById(
      'autoextractoptions');
      if (autoextractoptions.hasChildNodes()) {
        // get all child and deeper nodes by simply using the TagNames '*'
        let nodeList = autoextractoptions.getElementsByTagName('*');
        for (let i = 0; i < nodeList.length; i++) {
          // we can only en-/disable node elements with an ID
          if (nodeList[i].id) {
            wdw_aecConfiguration.enableField(document.getElementById(
              'autoextract'), nodeList[i].id);
          }
        }
      }
      // enable or disable different child elements if autoextract option is enabled
      if (autoextract.checked) {
        wdw_aecConfiguration.enableField(document.getElementById(
          'autotriggeronly'), 'autotriggertag');
        wdw_aecConfiguration.enableField(document.getElementById(
          'autodetach'), 'autodetachmode');
        wdw_aecConfiguration.enableField(document.getElementById(
          'autosavemessage'), ['autofnpsavemessage',
          'autofnpsavemessagecountpattern'
        ]);
        wdw_aecConfiguration.enableField(document.getElementById(
          'autoendlaunch'), ['autoendlaunchapplication',
          'autoendlaunchapplicationbutton'
        ]);
      }
    },

    enableField: function(aCheckbox, fieldID) {
      let field = null;
      if (fieldID instanceof Array) {
        if (fieldID.length > 0) field = document.getElementById(fieldID
          .shift());
      } else field = document.getElementById(fieldID);
      if (!field) return;

      if ((aCheckbox.localName == "radio" && aCheckbox.selected) ||
        (aCheckbox.localName == "checkbox" && aCheckbox.checked)) {
        if (field.localName == "radiogroup") field.disabled = false;
        field.removeAttribute("disabled");
      } else {
        if (field.localName == "radiogroup") field.disabled = true;
        field.setAttribute("disabled", "true");
      }
      if (fieldID instanceof Array) wdw_aecConfiguration.enableField(
        aCheckbox, fieldID);
    },

    showPane: function(paneID) {
      if (!paneID) {
        return;
      }

      let pane = document.getElementById(paneID);
      if (!pane) {
        return;
      }
      document.getElementById("aec-selector").value = paneID;

      let currentlySelected = document.getElementById("aec-paneDeck")
        .querySelector("#aec-paneDeck > prefpane[selected]");
      if (currentlySelected) {
        if (currentlySelected == pane) {
          return;
        }
        currentlySelected.removeAttribute("selected");
      }

      pane.setAttribute("selected", "true");
      pane.dispatchEvent(new CustomEvent("paneSelected", {
        bubbles: true
      }));

      document.documentElement.setAttribute("lastSelected", paneID);
      Services.xulStore.persist(document.documentElement, "lastSelected");
    },

    loadInitialPane: function() {
      if (document.documentElement.hasAttribute("lastSelected")) {
        wdw_aecConfiguration.showPane(document.documentElement.getAttribute(
          "lastSelected"));
      } else {
        wdw_aecConfiguration.showPane("aec-generalPane");;
      }
    },

    showTab: function() {
      if (window.arguments) {
        if (window.arguments[0].showTab) {
          wdw_aecConfiguration.showPane(window.arguments[0].showTab);
        }
      }
    },

    showDetachWarning: function(radiobox) {
      if (!radiobox.selected) return;
      let amessage = document.getElementById("aestrbundle").getString(
        "ConfirmDetachSettingDialogMessage");
      alert(amessage);
    },

    showAutoDetachWarning: function(checkbox) {
      if (!checkbox.checked) return;
      let amessage = document.getElementById("aestrbundle").getString(
        "ConfirmAutoDetachSettingDialogMessage");
      alert(amessage);
    },

    setComplexPref: function(prefname, value) {
      if (AECprefs.setStringPref) {
        AECprefs.setStringPref(prefname, value);
      } else {
        let str = Cc["@mozilla.org/supports-string;1"]
          .createInstance(Ci.nsISupportsString);
        str.data = value;
        AECprefs.setComplexValue(prefname, Ci.nsISupportsString, str);
      }
    },

    getComplexPref: function(prefname) {
      let value;
      if (AECprefs.getStringPref)
        value = AECprefs.getStringPref(prefname);
      else
        value = AECprefs.getComplexValue(prefname, Ci.nsISupportsString)
        .data;
      return value;
    },

    browseForFolder: function(prefname) {
      let pref = wdw_aecConfiguration.getComplexPref(prefname);
      let nsIFilePicker = Ci.nsIFilePicker;
      let fp = Cc["@mozilla.org/filepicker;1"].
        createInstance(nsIFilePicker);
      let windowTitle =
        document.getElementById("aestrbundle").getString(
          "FolderPickerDialogTitle");
      try {
        fp.init(window, windowTitle, Ci.nsIFilePicker.modeGetFolder);
        try {
          if (pref) {
            let localFile = Cc["@mozilla.org/file/local;1"].createInstance(
              Ci.nsIFile);
            localFile.initWithPath(pref);
            fp.displayDirectory = localFile;
          }
        } catch (e) {
          aedump(e, 1);
        }
        fp.open(r => {
          if (r != Ci.nsIFilePicker.returnOK || !fp.file) {
            return;
          }
          wdw_aecConfiguration.setComplexPref(prefname, fp.file.path);
        });
      } catch (e) {
        aedump(e, 0);
      }
    },

    browseForSuggestfolder(pref_el_id) {
      let pref = document.getElementById(pref_el_id);
      let nsIFilePicker = Ci.nsIFilePicker;
      let fp = Cc["@mozilla.org/filepicker;1"]
      .createInstance(nsIFilePicker);
      let windowTitle =
        document.getElementById("aestrbundle").getString(
          "FolderPickerDialogTitle");
      try {
        fp.init(window, windowTitle, Ci.nsIFilePicker.modeGetFolder);
        try {
          if (pref) {
            let localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci
              .nsIFile);
            localFile.initWithPath(pref);
            fp.displayDirectory = localFile;
          }
        } catch (e) {
          aedump(e, 1);
        }
        fp.open(r => {
          if (r != Ci.nsIFilePicker.returnOK || !fp.file) {
            return;
          }
          //wdw_aecConfiguration.setComplexPref(prefname, fp.file.path);
          return fp.file.path;
        });
      } catch (e) {
        aedump(e, 0);
      }
    },

    browseForExecutable: function(prefname) {
      let pref = wdw_aecConfiguration.getComplexPref(prefname);
      let nsIFilePicker = Ci.nsIFilePicker;
      let fp = Cc["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
      let windowTitle =
        document.getElementById("aestrbundle").getString(
          "ExecutableFilePickerDialogTitle");
      try {
        fp.init(window, windowTitle, Ci.nsIFilePicker.modeOpen);
        fp.appendFilters(Ci.nsIFilePicker.filterApps || Ci.nsIFilePicker
          .filterAll);
        try {
          if (pref) {
            let localFile = Cc["@mozilla.org/file/local;1"].createInstance(
              Ci.nsIFile);
            localFile.initWithPath(pref);
            localFile = localFile.parent;
            fp.displayDirectory = localFile;
          }
        } catch (e) {
          aedump(e, 1);
        }
        fp.open(r => {
          if (r != Ci.nsIFilePicker.returnOK || !fp.file) {
            return;
          }
          wdw_aecConfiguration.setComplexPref(prefname, fp.file.path);
        });
      } catch (e) {
        aedump(e, 0);
      }
    },

    browseForCss: function(prefname) {
      let pref = wdw_aecConfiguration.getComplexPref(prefname);
      let nsIFilePicker = Ci.nsIFilePicker;
      let fp = Cc["@mozilla.org/filepicker;1"]
        .createInstance(nsIFilePicker);
      let windowTitle =
        document.getElementById("aestrbundle").getString(
          "CSSFilePickerDialogTitle");
      try {
        fp.init(window, windowTitle, Ci.nsIFilePicker.modeOpen);
        fp.appendFilter(document.getElementById("aestrbundle").getString(
          "CSSFileFilterDescription"), "*.css");
        try {
          if (pref) {
            let localFile = Cc["@mozilla.org/file/local;1"].createInstance(
              Ci.nsIFile);
            localFile.initWithPath(pref);
            localFile = localFile.parent;
            fp.displayDirectory = localFile;
          }
        } catch (e) {
          aedump(e, 1);
        }
        fp.open(r => {
          if (r != Ci.nsIFilePicker.returnOK || !fp.file) {
            return;
          }
          wdw_aecConfiguration.setComplexPref(prefname, fp.file.path);
        });
      } catch (e) {
        aedump(e, 0);
      }
    },

    filltaglist: function() {
      let taglist = document.getElementById('autotriggertag');
      if (taglist.selectedItem != null)
        return; //sometimes triggers twice. don't know why but stop it anyway.
      let tagService = Components.classes[
          "@mozilla.org/messenger/tagservice;1"]
        .getService(Components.interfaces.nsIMsgTagService);
      let tagArray = tagService.getAllTags({});
      if (tagArray) {
        for (let tagInfo of tagArray) {
          if (tagInfo.tag) taglist.appendItem(tagInfo.tag, tagInfo.key);
        }
      }
      return;
    },

    fillcountlist: function() {
      let countlist = document.getElementById('savepathmrucount');
      if (countlist.selectedItem != null)
        return; //sometimes triggers twice. don't know why but stop it anyway.
      for (let i = 1; i <= attachmentextractor.MRUMAXCOUNT; i++) {
        countlist.appendItem(i + "", i);
      }
      return;
    },

    check_filenamepattern: function(element, countpattern) {
      if ((!countpattern && filemaker.isValidFilenamePattern(element
        .value)) || (
          filemaker.isValidCountPattern(element.value))) return;
      let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Ci
          .nsIPromptService);

      let bundle = document.getElementById("aestrbundle");
      let fixed = (!countpattern) ? filemaker.fixFilenamePattern(element
          .value) :
        filemaker.fixCountPattern(element.value);
      if (prompts.confirmEx(window,
          bundle.getString("FileNamePatternFixTitle"),
          bundle.getString("FileNamePatternFixMessage").replace("%1$s",
            fixed),
          prompts.STD_YES_NO_BUTTONS,
          "",
          "",
          "",
          null, {}) == 0) {
        element.value = fixed;
      }
    },

    updateexamplefilename: function(fnpbox) {
      let pattern = fnpbox.value;
      let countpattern = document.getElementById('filenamepatterncount')
        .value;
      let datepattern = document.getElementById('filenamepatterndate')
      .value;
      let docleansubject = document.getElementById(
          'filenamepatterncleansubject')
        .checked;
      let exname = document.getElementById('filenamepattern_examplename')
        .value;
      //      let cleansubjectstrings = document.getElementById('filenamepattern_examplesubject').value.toLowerCase().split(',');

      let cleansubjectstrings = AECprefs.getStringPref(
          "extensions.attachmentextractor_cont.filenamepattern.cleansubject.strings"
          )
        .toLowerCase().split(',');


      let excache = new AttachmentFileMaker.AttachmentFileMakerCache();
      excache.subject = document.getElementById(
          'filenamepattern_examplesubject')
        .value.replace(filemaker.tokenregexs.subject, "_");
      excache.author = document.getElementById(
          'filenamepattern_exampleauthor')
        .value.replace(filemaker.tokenregexs.author, "");
      excache.authoremail = document.getElementById(
          'filenamepattern_exampleauthor')
        .value.replace(filemaker.tokenregexs.authoremail, "");
      excache.datetime = filemaker.formatdatestring(datepattern,
        exampleDate);
      excache.mailfolder = document.getElementById(
          'filenamepattern_examplefolder')
        .value.replace(filemaker.tokenregexs.folder, "");

      let cleansubject = filemaker.cleanSubjectLine(excache.subject,
        cleansubjectstrings);
      if (docleansubject) excache.subject = cleansubject;

      let st = filemaker.generate(pattern.replace(/#count#/g, ""), null,
        exname, 1,
        excache);
      let st2 = filemaker.generate(pattern.replace(/#count#/g,
        countpattern), null,
        exname, 1, excache);

      document.getElementById('filenamepattern_examplecleansubject').value =
        cleansubject;
      document.getElementById('filenamepattern_exampledategenerated')
        .value =
        excache.datetime;
      document.getElementById('filenamepattern_examplegenerated').value =
      st;
      document.getElementById('filenamepattern_examplegenerated2').value =
        st2;
    },

    add_to_pattern: function(button, fnpbox) {
      let postindex = fnpbox.selectionStart + button.label.length;
      fnpbox.value = fnpbox.value.substring(0, fnpbox.selectionStart) +
        button
        .label + fnpbox.value.substring(fnpbox.selectionEnd);
      fnpbox.setSelectionRange(postindex, postindex);
    },

  }
}


function appendPrefEntry(listbox, prefid, emptytext) {
  let entry = listbox.appendItem(".", prefid);
  let tb2idfix = listbox.itemCount ? null : listbox.id + listbox.childNodes
    .length; //bloody tb2 ! "this" doesnt resolve properly within onsyncfrompreference in tb2 so workaround.
  entry.setAttribute("preference", prefid);
  if (tb2idfix) entry.setAttribute("id", tb2idfix);
  entry.setAttribute("onsyncfrompreference", "let l=syncFromFilePref('" +
    prefid + "');" + (tb2idfix ? "document.getElementById('" + tb2idfix +
      "')" : "this") + ".setAttribute('label',(l==''?'" + emptytext + "':l))");
  return entry;
}

function fillParentFolderList(folderlist) {
  //aedump(folderlist.nodeName+",");
  if (folderlist.childNodes.length != 0) return;
  let emptytext = document.getElementById("aestrbundle").getString(
    "EmptyLineText");
  let prefid = folderlist.getAttribute("preference");
  //aedump(prefid+"\n");
  let pref = document.getElementById(prefid);
  if (pref && pref.name) {
    for (let i = 1; i <= 100; i++) {
      let entryid = prefid + "_" + i;
      if (!document.getElementById(entryid)) {
        let newpref = document.createElement("preference");
        newpref.setAttribute("id", entryid);
        newpref.setAttribute("name", pref.name + "." + i);
        newpref.setAttribute("type", "file");
        /*newpref.setAttribute("onchange","removeBlanks(document.getElementById('"+folderlist.id+"'));");*/
        pref.preferences.appendChild(newpref);
        //if (newpref.value==null) break; /*newpref=document.getElementById(entryid);*/
      } else {
        if (!document.getElementById(entryid)) break;
        appendPrefEntry(folderlist, entryid, emptytext);
        if (i == 1) folderlist.selectedIndex = 0;
        if (!document.getElementById(entryid).value) break;
      }
    }
  }
}

function removeEntry(button, folderlist) {
  //aedump("*");
  let resetpref = document.getElementById(button.getAttribute('_preference'));
  /*for (f in resetpref) aedump(f+":"+resetpref[f]+"\n") */
  if (!resetpref.value) return;
  else resetpref.reset();
  let prefid = folderlist.getAttribute("preference");
  let pref = document.getElementById(prefid);
  if (!pref) return;
  for (let i = 1; i < 100; i++) {
    let cpref = document.getElementById(prefid + "_" + i);
    let npref = document.getElementById(prefid + "_" + (i + 1));
    if (!cpref || !npref) break;
    //aedump(i+") cval: "+(cpref.value?cpref.value.leafName:cpref.value)+"; nval: "+(npref.value?npref.value.leafName:npref.value)+"\n");
    if (!cpref.value && npref.value) {
      cpref.value = npref.value;
      npref.reset();
      //continue;
    }
  }
  folderlist.removeItemAt(folderlist.childNodes.length - 1);
}

function addEntry(button, folderlist) {
  let prefid = button.getAttribute('_preference');
  wdw_aecConfiguration.browseForSuggestfolder(prefid);
  let addpref = document.getElementById(prefid);
  //aedump(prefid+"="+addpref.value+"\n");
  if (!addpref) return;
  //aedump('*');
  if (folderlist.getItemAtIndex(folderlist.childNodes.length - 1).getAttribute(
      'preference') == prefid) {
    let clearpref = folderlist.getAttribute("preference") + "_" + (folderlist
      .childNodes.length + 1);
    appendPrefEntry(folderlist, clearpref, document.getElementById(
      "aestrbundle").getString("EmptyLineText"));
    document.getElementById(clearpref).updateElements();
  }
}

function updateEditBox(ele) {
  let pref = ele.selectedItem.getAttribute("preference");
  //aedump(pref+";\n");
  document.getElementById("parent1").setAttribute("preference", pref);
  document.getElementById(pref).updateElements();
  document.getElementById("parentbutton").setAttribute("_preference", pref);
  document.getElementById("parentbutton").removeAttribute("disabled");
  document.getElementById("parentresetbutton").setAttribute("_preference",
    pref);
  document.getElementById("parentresetbutton").removeAttribute("disabled");
}