/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* General pane */
pref("extensions.attachmentextractor_cont.defaultsavepath","");
pref("extensions.attachmentextractor_cont.defaultsavepath.relative","");
pref("extensions.attachmentextractor_cont.defaultsavepath.relative.key","");

pref("extensions.attachmentextractor_cont.overwritepolicy",0);

pref("extensions.attachmentextractor_cont.savepathmru",true);
pref("extensions.attachmentextractor_cont.savepathmru.count",5);

pref("extensions.attachmentextractor_cont.suggestfolder",false);
pref("extensions.attachmentextractor_cont.suggestfolder.parent",true);
pref("extensions.attachmentextractor_cont.suggestfolder.disregardduplicates",true);
pref("extensions.attachmentextractor_cont.suggestfolder.excludekeywords",""); 
pref("extensions.attachmentextractor_cont.suggestfolder.maxmatches",10);

pref("extensions.attachmentextractor_cont.actionafterextract.markread",false);
pref("extensions.attachmentextractor_cont.actionafterextract.savemessage",false);

pref("extensions.attachmentextractor_cont.actionafterextract.delete",false);
pref("extensions.attachmentextractor_cont.actionafterextract.detach",false);
pref("extensions.attachmentextractor_cont.actionafterextract.withoutconfirm",false);


pref("extensions.attachmentextractor_cont.actionafterextract.detach.mode",0);
pref("extensions.attachmentextractor_cont.actionafterextract.detach.confirm",true);

pref("extensions.attachmentextractor_cont.notifywhendone",true);

pref("extensions.attachmentextractor_cont.actionafterextract.launch",false);
pref("extensions.attachmentextractor_cont.actionafterextract.endlaunch",false);
pref("extensions.attachmentextractor_cont.actionafterextract.endlaunch.application","");

/* Auto pane */
pref("extensions.attachmentextractor_cont.autoextract",false);

pref("extensions.attachmentextractor_cont.autoextract.onattachmentsonly",true);
pref("extensions.attachmentextractor_cont.autoextract.waitforall",false);

pref("extensions.attachmentextractor_cont.autoextract.savepath","");
pref("extensions.attachmentextractor_cont.autoextract.savepath.relative","");
pref("extensions.attachmentextractor_cont.autoextract.savepath.relative.key","");

pref("extensions.attachmentextractor_cont.autoextract.ontriggeronly",true);
pref("extensions.attachmentextractor_cont.autoextract.triggertag","ae_autoextract");

pref("extensions.attachmentextractor_cont.autoextract.overwritepolicy",2);

pref("extensions.attachmentextractor_cont.autoextract.markread",false);
pref("extensions.attachmentextractor_cont.autoextract.delete",false);
pref("extensions.attachmentextractor_cont.autoextract.detach",false);
pref("extensions.attachmentextractor_cont.autoextract.withoutconfirm",false);
pref("extensions.attachmentextractor_cont.autoextract.detach.mode",1);

pref("extensions.attachmentextractor_cont.autoextract.cleartag",false);

pref("extensions.attachmentextractor_cont.autoextract.savemessage",false);
pref("extensions.attachmentextractor_cont.autoextract.filenamepattern","");


pref("extensions.attachmentextractor_cont.autoextract.launch",false);
pref("extensions.attachmentextractor_cont.autoextract.endlaunch",false);
pref("extensions.attachmentextractor_cont.autoextract.endlaunch.application","");

/* Filename pattern pane */
pref("extensions.attachmentextractor_cont.filenamepattern","#namepart##count##extpart#");
pref("extensions.attachmentextractor_cont.filenamepattern.countpattern","-%");
pref("extensions.attachmentextractor_cont.filenamepattern.datepattern","D M d Y");
pref("extensions.attachmentextractor_cont.filenamepattern.cleansubject",false);
pref("extensions.attachmentextractor_cont.filenamepattern.cleansubject.strings","aw: ,re: ,fw: ,fwd: ");
pref("extensions.attachmentextractor_cont.filenamepattern.savemessage","#subject##count#.html");
pref("extensions.attachmentextractor_cont.filenamepattern.savemessage.countpattern","-%");

/* Advanced pane */
pref("extensions.attachmentextractor_cont.includeenabled",0);
pref("extensions.attachmentextractor_cont.includepatterns4","*.jpeg;*.jpg");
pref("extensions.attachmentextractor_cont.excludepatterns4","*.bat;*.exe;*.eml");

pref("extensions.attachmentextractor_cont.extract.mode",0);
pref("extensions.attachmentextractor_cont.setdatetoemail",false);
pref("extensions.attachmentextractor_cont.extract.minimumsize",0);

pref("extensions.attachmentextractor_cont.returnreceipts",false);
pref("extensions.attachmentextractor_cont.returnreceipts.override",false);

pref("extensions.attachmentextractor_cont.queuerequests",true);

pref("extensions.attachmentextractor_cont.progressdialog.showtext",true);
pref("extensions.attachmentextractor_cont.extractinlinetoo",false);
pref("extensions.attachmentextractor_cont.fixdetachedimages",false);

pref("extensions.attachmentextractor_cont.reportgen",false);
pref("extensions.attachmentextractor_cont.reportgen.cssfile", "");
pref("extensions.attachmentextractor_cont.reportgen.embedcss", false);
pref("extensions.attachmentextractor_cont.reportgen.thumbnail", true);
pref("extensions.attachmentextractor_cont.reportgen.reportname", "aec_report.html");
pref("extensions.attachmentextractor_cont.reportgen.append", true);

pref("extensions.attachmentextractor_cont.debug",false);
pref("extensions.attachmentextractor_cont.debugonstart",false);

/* hidden (?) prefs */
pref("extensions.attachmentextractor_cont.nextattachmentdelay",5);
pref("extensions.attachmentextractor_cont.nextmessagedelay",50);
pref("extensions.attachmentextractor_cont.dontloadimages",true);
pref("extensions.attachmentextractor_cont.skipidentical",false);
