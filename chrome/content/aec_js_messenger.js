/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

try {
  if (typeof Cc === "undefined") var Cc = Components.classes;
  if (typeof Ci === "undefined") var Ci = Components.interfaces;
  if (typeof Cr === "undefined") var Cr = Components.results;
} catch (e) {}

var {
  Services
} = ChromeUtils.import("resource://gre/modules/Services.jsm");
var {
  MailServices
} = ChromeUtils.import("resource:///modules/MailServices.jsm");
/*
var {
  XPCOMUtils
} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
var {
  OSFile
} = ChromeUtils.import("resource://gre/modules/osfile.jsm");
*/

function AEDelAttachListener(mMessenger, mMsgWindow, mAttachUrls, mMsgUri,
  mDetachedFileUris, aewindow) {
  var mMessageService = mMessenger.messageServiceFromURI(
  mMsgUri); // original message service
  var mOriginalMessage = mMessageService.messageURIToMsgHdr(
  mMsgUri); // original message header
  var mMessageFolder = mOriginalMessage.folder; // original message folder
  var mOrigMsgFlags = mOriginalMessage.flags;

  var mMsgFileSpec; // temporary file (processed mail) not used in tb3
  var mMsgFile; // temporary file (processed mail)
  var mMsgFileStream; // temporary stream (processed mail)
  var mNewMessageKey = Number.MAX_VALUE; // new message key

  var that = this;

  var m_state_enum = {
    eStarting: 0,
    eCopyingNewMsg: 1,
    eUpdatingFolder: 2, // for IMAP
    eDeletingOldMessage: 3,
    eSelectingNewMessage: 4
  };
  var m_state = m_state_enum.eStarting;

  // nsIRequestObserver // 
  // Thunderbird 60:
  // this.onStartRequest = function(aRequest, aContext) {}
  // Thunderbird 68:
  this.onStartRequest = function(aRequest) {}

  // Thunderbird 60:
  // this.onStopRequest = function(aRequest, aContext, aStatusCode) {
  // Thunderbird 68:
  this.onStopRequest = function(aRequest, aStatusCode) {
    aedump("{function:AEDelAttachListener.onStopRequest}\n", 2);
    // called when we have completed processing the StreamMessage request. 
    // This is called after OnStopRequest(). This means that we have now
    // received all data of the message and we have completed processing.
    // We now start to copy the processed message from the temporary file
    // back into the message store, replacing the original message.

    mMessageFolder.copyDataDone();
    // copy the file back into the folder. Note: if we set msgToReplace then 
    // CopyFileMessage() fails, do the delete ourselves

    mMsgFileStream.close();
    mMsgFileStream = null;
    if (mMsgFileStream) mMsgFileSpec.closeStream(); //tb3 doesn't use
    //aedump("//"+mMsgFileSpec.nativePath+","+mMessageFolder.name+","+mOrigMsgFlags+","+mMsgWindow+"\n");
    mNewMessageKey = Number.MAX_VALUE;
    var copyService = Cc["@mozilla.org/messenger/messagecopyservice;1"]
      .getService(Ci.nsIMsgCopyService);
    var originalKeys = mOriginalMessage.getStringProperty(
    "keywords"); //tb3 only uses
    m_state = m_state_enum.eCopyingNewMsg;
    return (!mMsgFileSpec) ? copyService.CopyFileMessage(mMsgFile.clone(),
        mMessageFolder, null, false, mOrigMsgFlags, originalKeys, that,
        mMsgWindow) : //tb3
      copyService.CopyFileMessage(mMsgFileSpec, mMessageFolder, null, false,
        mOrigMsgFlags, that, mMsgWindow); //tb2
  }

  // nsIStreamListener //
  // Thunderbird 60:
  // this.onDataAvailable = function(aRequest, aSupport, aInStream, aSrcOffset, aCount) {
  // Thunderbird 68:
  this.onDataAvailable = function(aRequest, aInStream, aSrcOffset, aCount) {
      aedump("{function:AEDelAttachListener.onDataAvailable}\n", 2);
    if (!mMsgFileStream) return undefined;
    return mMessageFolder.copyDataToOutputStreamForAppend(aInStream, aCount,
      mMsgFileStream);
  }

  // nsIUrlListener //
  this.OnStartRunningUrl = function(aUrl) {}

  this.OnStopRunningUrl = function(aUrl, aExitCode) {
    aedump("{function:AEDelAttachListener.OnStopRunningUrl(" + aUrl.spec +
      "," + aExitCode + ")}\n", 2);
    if (mOriginalMessage && mMsgUri.indexOf("imap-message") === 0) {
      if (m_state === m_state_enum.eUpdatingFolder)
      return deleteOriginalMessage();
    }
    // check if we've deleted the original message, and we know the new msg id.
    else if (m_state === m_state_enum.eDeletingOldMessage && mMsgWindow) {
      selectNewMessage();
    }
    return undefined;
  }

  // nsIMsgCopyServiceListener //
  this.OnStartCopy = function() {}

  this.OnProgress = function(aProgress, aProgressMax) {}

  this.SetMessageKey = function(aKey) {
    aedump("{function:AEDelAttachListener.SetMessageKey(" + aKey + ")}\n", 2);
    // called during the copy of the modified message back into the message 
    // store to notify us of the message key of the newly created message.
    mNewMessageKey = aKey;
  }

  this.GetMessageId = function() {
    return null
  }

  this.OnStopCopy = function(aStatus) {
    aedump("{function:AEDelAttachListener.onStopCopy}\n", 2);
    // only if the currently selected message is the one that we are about to delete then we 
    // change the selection to the new message that we just added. Failures in this code are not fatal. 
    // Note that can only do this if we have the new message key, which we don't always get from IMAP.
    // delete the original message
    if (aStatus) return aStatus;
    // check if we've deleted the original message, and we know the new msg id.
    if (m_state === m_state_enum.eDeletingOldMessage && mMsgWindow)
      selectNewMessage();
    // do this for non-imap messages - for imap, we'll do the delete in
    // OnStopRunningUrl. For local messages, we won't get an OnStopRunningUrl
    // notification. And for imap, it's too late to delete the message here,
    // because we'll be updating the folder naturally as a result of
    // running an append url. If we delete the header here, that folder
    // update will think we need to download the header...If we do it
    // in OnStopRunningUrl, we'll issue the delete before we do the
    // update....all nasty stuff.
    if (mOriginalMessage && mMsgUri.indexOf("imap-message:") === -1)
    return deleteOriginalMessage();
    else m_state = m_state_enum.eUpdatingFolder;
    return 0;
  }

  // non-interface functions //
  var selectNewMessage = function() {
    aedump("{function:AEDelAttachListener.selectNewMessage}\n", 2);
    var displayUri = mMessenger.lastDisplayedMessageUri;
    var newMsgURI = mMessageFolder.generateMessageURI(mNewMessageKey);
    if (displayUri === mMsgUri && mMsgWindow) {
      if (mMsgWindow.SelectMessage) mMsgWindow.SelectMessage(newMsgURI);
      else if (mMsgWindow.selectMessage) mMsgWindow.selectMessage(newMsgURI);
      else aewindow.currentTask.selectMessage(newMsgURI);
    }
    mNewMessageKey = Number.MAX_VALUE;
  }

  var deleteOriginalMessage = function() {
    aedump("{function:AEDelAttachListener.deleteOriginalMessage}\n", 2);
    var messageArray = aewindow.nsIArray;
    if (messageArray.appendElement) messageArray.appendElement(
      mOriginalMessage, false); //tb3
    else messageArray.AppendElement(mOriginalMessage); //tb2
    mOriginalMessage = null;

    if (mMsgFileSpec) mMsgFileSpec.closeStream(); // not used in tb3
    m_state = m_state_enum.eDeletingOldMessage;
    return mMessageFolder.deleteMessages(
      messageArray, // messages
      mMsgWindow, // msgWindow
      true, // deleteStorage
      false, // isMove
      that, // listener
      false); // allowUndo

  }

  this.startProcessing = function() {
    aedump("{function:AEDelAttachListener.startProcessing}\n", 2);
    var detaching = (mDetachedFileUris !== null);
    // ensure that we can store and delete messages in this folder, if we can't then we can't do attachment deleting
    if (!mMessageFolder.canDeleteMessages || !mMessageFolder.canFileMessages)
      return null;

    // create an output stream on a temporary file. This stream will save the modified 
    // message data to a file which we will later use to replace the existing message.
    // The file is removed in the destructor - not yet!

    mMsgFile = Cc["@mozilla.org/file/directory_service;1"]
      .getService(Ci.nsIProperties)
      .get("TmpD", Ci.nsIFile);
    mMsgFile.append("aemail.tmp");
    mMsgFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 00600);

    if (!aewindow.tb3) {
      mMsgFileSpec = Cc["@mozilla.org/filespec;1"].createInstance(Ci
        .nsIFileSpec);
      if (!mMsgFileSpec) return null;
      mMsgFileSpec.nativePath = mMsgFile.path;
      //aedump("//"+msgFile.path+"\n//"+mMsgFileSpec.nativePath+"\n");
    }

    var fileOutputStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    fileOutputStream.init(mMsgFile, 0x04 | 0x08 | 0x20, 00600, 0);

    mMsgFileStream = Cc["@mozilla.org/network/buffered-output-stream;1"]
      .createInstance(Ci.nsIBufferedOutputStream);
    mMsgFileStream.init(fileOutputStream, 4096);
    // create the additional header for data conversion. This will tell the stream converter
    // which MIME emitter we want to use, and it will tell the MIME emitter which attachments
    // should be deleted.
    var partId = "";
    var sHeader = "attach&del=";
    var detachToHeader = "&detachTo=";
    for (var u = 0; u < mAttachUrls.length; u++) {
      if (u > 0) {
        sHeader += ",";
        if (detaching) detachToHeader += ",";
      }
      partId = getAttachmentPartId(mAttachUrls[u]);
      var nextField = (!partId) ? -1 : partId.indexOf('&');
      if (nextField !== -1) sHeader += partId.substr(0, nextField);
      else sHeader += partId;
      if (detaching) detachToHeader += mDetachedFileUris[u];
    }
    aedump("[sHeader: " + sHeader + "]\n", 3);
    if (detaching) sHeader = sHeader + detachToHeader;
    // stream this message to our listener converting it via the attachment mime
    // converter. The listener will just write the converted message straight to disk.

    mMessageService.streamMessage(
      mMsgUri, // aMessageURI 
      that, // aConsumer 
      mMsgWindow, // aMsgWindow 
      that, // aUrlListener
      true, // aConvertData
      sHeader); // requestUri
    return mMsgFile;
  }

  this.QueryInterface = function(iid) {
    if ((iid === Ci.nsIStreamListener) ||
      (iid === Ci.nsIUrlListener) ||
      (iid === Ci.nsIRequestObserver) ||
      (iid === Ci.nsISupports) ||
      (iid === Ci.nsIMsgCopyServiceListener))
      return this;
    throw Cr.NS_NOINTERFACE;
  };

  var aedump = aewindow.aedump;
};

///////////////////////////////////////////////////////////////////////////////
// Detach/Delete Attachments 
///////////////////////////////////////////////////////////////////////////////

function getAttachmentPartId(aAttachmentUrl) {
  var partIdPrefix = "part=";
  var index = aAttachmentUrl.indexOf(partIdPrefix);
  if (index === -1) return null;
  else return aAttachmentUrl.substring(index + partIdPrefix.length);
}

var aeMessenger = {

  compareAttachmentPartId: function(aAttachUrlLeft, aAttachUrlRight) {
    // part ids are numbers separated by periods, like "1.2.3.4".
    // we sort by doing a numerical comparison on each item in turn. e.g. "1.4" < "1.25"
    // shorter entries come before longer entries. e.g. "1.4" < "1.4.1.2"
    // return values:
    //  -2  left is a parent of right
    //  -1  left is less than right
    //   0  left === right
    //   1  right is greater than left
    //   2  right is a parent of left

    var partIdLeft = getAttachmentPartId(aAttachUrlLeft);
    var partIdRight = getAttachmentPartId(aAttachUrlRight);
    //dump("{"+partIdLeft+","+partIdRight+"}\n");
    // for detached attachments the URL does not contain any "part=xx"
    if (!partIdLeft) partIdLeft = "0";
    if (!partIdRight) partIdRight = "0";
    var idLeftArray = partIdLeft.split(".");
    var idRightArray = partIdRight.split(".");

    var i = 0;
    do {
      // if at least of the part ids are incomplete check if one or both.
      if (i === idLeftArray.length || i === idRightArray.length) {
        // if both part ids are complete (partIdLeft === partIdRight) then they are equal
        if (idLeftArray.length === idRightArray.length) return 0;
        // if one part id is complete but the other isn't, then the shortest one is first (parents before children)
        else return (idLeftArray.length < idRightArray.length) ? -2 : 2;
      }
      // if the part numbers are different then the numerically smaller one is first
      if (idLeftArray[i] !== idRightArray[i]) return (idLeftArray[i] <
        idRightArray[i]) ? -1 : 1;

      i++;
    } while (true);
    return 0;
  },

  prepareForAttachmentDelete: function(urlArray1) {
    var urlArray = new Array(urlArray1.length);
    for (let i = 0; i < urlArray.length; i++) {
      urlArray[i] = urlArray1[i];
    }
    // this prepares the attachment list for use in deletion. In order to prepare, we
    // sort the attachments in numerical ascending order on their part id, remove all
    // duplicates and remove any subparts which will be removed automatically by the
    // removal of the parent.
    // 
    // e.g. the attachment list processing (showing only part ids)
    // before: 1.11, 1.3, 1.2, 1.2.1.3, 1.4.1.2
    // sorted: 1.2, 1.2.1.3, 1.3, 1.4.1.2, 1.11
    // after:  1.2, 1.3, 1.4.1.2, 1.11

    urlArray.sort(this.compareAttachmentPartId);

    // remove duplicates and sub-items
    for (var u = 1; u < urlArray.length;) {
      var nCompare = this.compareAttachmentPartId(urlArray[u - 1], urlArray[
        u]);
      //dump("{"+nCompare+"}\n");
      if (nCompare === 0 || nCompare === -
        2) // [u-1] is the same as or a parent of [u]
      {
        urlArray.splice(u - 1, 1);
      } else u++;
    }
    return urlArray;
  },

  detachAttachments: function(aMessenger, aMsgWindow, aContentTypeArray,
    aUrlArray, aDisplayNameArray, aMessageUriArray, saveFiles) {
    var saveFileUris = (saveFiles) ? new Array(saveFiles.length) : null;
    var fileHandler = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService).getProtocolHandler("file")
      .QueryInterface(Ci.nsIFileProtocolHandler);
    for (var u = 0; u < aMessageUriArray.length; ++u) {
      // ensure all of the message URI are the same, we cannot process attachments from different messages
      if (u > 0 && aMessageUriArray[0] !== aMessageUriArray[u]) return null;
      // ensure that we don't have deleted messages in this list
      if (aContentTypeArray[u] === "text/x-moz-deleted") return undefined;
      // convert savefiles into uris
      if (saveFiles) saveFileUris[u] = fileHandler.getURLSpecFromFile(
        saveFiles[u]).replace(/,/g, "%2C");
    }
    //aedump("["+getAttachmentPartId(aUrlArray[0])+"]\n");
    //aedump("["+aUrlArray+"]\n");
    var urls = this.prepareForAttachmentDelete(aUrlArray);
    //aedump("["+urls+"]\n");
    var listener = new AEDelAttachListener(aMessenger, aMsgWindow, urls,
      aMessageUriArray[0], saveFileUris, aewindow);
    return listener.startProcessing();
  },

  /* ************************************* saving ************************************* */
  saveAttachmentToFolder: function(contentType, url, displayName, messageUri,
    aDestFolder, attachmentindex) {
    var out = aDestFolder.clone();
    out = out.QueryInterface(Ci.nsIFile);
    out.append(displayName);
    if (this.saveAttachment(out, url, messageUri, contentType,
        attachmentindex)) return out;
    else return null;
  },

  // simplified version of this function.
  saveAttachment: function(file, url, messageUri, contentType,
    attachmentindex) {
    aewindow.aedump("{function:aeMessenger.saveAttachment}\n", 2);
    try {
      // strip out ?type=application/x-message-display because it confuses libmime
      if (url.indexOf("?type=application/x-message-display") !== -1) {
        url = url.replace("?type=application/x-message-display", "")
          .replace('&', '?');
      }
      url = url.replace("/;section", "?section");
  
      var saveListener = new aeSaveMsgListener(
        file, aewindow.messenger, contentType,
        "saveAtt_cleanUp", attachmentindex,
        aewindow, aewindow.prefs.get("extract.minimumsize"));

      var messageService = aewindow.messenger.messageServiceFromURI(
        messageUri);
      var fetchService = messageService.QueryInterface(
        Ci.nsIMsgMessageFetchPartService);
      // if the message service has a fetch part service then we know we can fetch mime parts...
      if (fetchService) { 
        aedump("// message has a fetch service.\n", 3);
        // ?section versus ?part in the next line - which one is correct?
        // ?section is used in the original C++ function in Thunderbirds own code
        // messageUri += url.substring(url.indexOf("?section"), url.length);
        messageUri += url.substring(url.indexOf("?section"), url.length);
      }

      var convertedListener = saveListener.QueryInterface(
        Ci.nsIStreamListener);
      if (navigator.appVersion.indexOf("Macintosh") === -1) {
        // if the content type is binhex we are going to do a hokey hack and make sure we decode the binhex when saving an attachment
        if (contentType === "application/mac-binhex40") {
          aedump(
            "// not a mac but got a binhex att so using an additional convertor.\n",
            3);
          var streamConverterService = Cc["@mozilla.org/streamConverters;1"]
            .getService(Ci.nsIStreamConverterService);
          convertedListener = streamConverterService.asyncConvertData(
            "application/mac-binhex40",
            "*" + "/" + "*", convertedListener, saveListener.m_channel
            .QueryInterface(Ci.nsISupports));
        }
      }
      var openAttArgs = new Array(contentType, file.leafName, url,
        messageUri, convertedListener, aewindow.msgWindow,
        saveListener /*null*/ );
      var fetchServArgs = new Array(this.createStartupUrl(url), messageUri,
        convertedListener, aewindow.msgWindow, null);

      if (fetchService) fetchService.fetchMimePart.apply(null,
        fetchServArgs);
      else messageService.openAttachment.apply(null, openAttArgs);
    } catch (e) {
      aedump(e.message + " @ line " + e.lineNumber + " in " + e.fileName +
        "\n");
      alert(aewindow.messengerStringBundle.GetStringFromName(
        "saveAttachmentFailed"));
      return false;
    }
    return true;
  },

  /* **************** message text saving *********************** */
  saveMessageToDisk: function(message, file) {
    var messageUri = message.folder.getUriForMsg(message);
    var msgService = aewindow.messenger.messageServiceFromURI(messageUri);
    var saveListener = new aeSaveMsgListener(file, aewindow.messenger, "",
      "doAfterActions(aewindow.progress_tracker.message_states.CLEARTAG)", null,
      aewindow, 0);
    
    // nsIURI.spec is read-only, use url.mutate().setSpec(aSpec).finalize();
    // messageUri.spec = messageUri.spec + "?header=saveas";
    
    messageUri = messageUri + "?header=saveas";
    
    /*
    if (messageUri.spec){
      messageUri = messageUri.mutate().setSpec(messageUri.spec + "?header=saveas").finalize();
    } else {
      messageUri = messageUri.mutate().setSpec("?header=saveas").finalize();
    }
    */
    
    //messageUri.spec = Services.io.newURI(messageUri.spec + "?header=saveas");
    /*
    aedump('//messageUri: ' + messageUri + '\n', 2);
    messageUri = Services.io.newURI(messageUri + "?header=saveas");
    aedump('//messageUri: ' + messageUri + '\n', 2);
    */
    /*
    if (messageUri.spec) {
      var aSpec = messageUri.spec + "?header=saveas";
    } else {
      var aSpec = "?header=saveas";
    }
    messageUri = 
      Cc["@mozilla.org/network/standard-url-mutator;1"]
      .createInstance(Ci.nsIURIMutator)
      .setSpec(aSpec)
      .finalize();
    
    aedump("MTS after mutate \n");
    aedump("MTS messageUri: " + messageUri + "\n");
    aedump("MTS messageUri.spec: " + messageUri.spec + "\n");
    */
    
    saveListener.m_channel = Cc["@mozilla.org/network/input-stream-channel;1"]
      .createInstance(Ci.nsIInputStreamChannel);
    var url = {};
    //url=this.createStartupUrl(messageUri);
    //msgService.GetUrlForUri(messageUri,url,null);
    url = Cc["@mozilla.org/network/io-service;1"].getService(
      Ci.nsIIOService).newURI(messageUri, null, null);
    aedump("// messageUri: " + messageUri + ", url: " + url.spec + "\n");
    saveListener.m_channel.setURI(url);
    var streamConverterService = Cc["@mozilla.org/streamConverters;1"]
      .getService(Ci.nsIStreamConverterService);
    var convertedListener = streamConverterService.asyncConvertData(
      "message/rfc822", "text/html", saveListener, saveListener.m_channel);
    if (aewindow.currentTask.isExtractEnabled) saveListener.postFunc =
      aewindow.currentTask.currentMessage.postProcessMessage;
    var o = new Object();
    msgService.DisplayMessage(messageUri, convertedListener, 
      aewindow.msgWindow, saveListener, false, o);
    //aedump("//"+msgService.streamMessage(messageUri, saveListener, aewindow.msgWindow, saveListener, false,"saveas").spec+"\n");
  },

  saveExternalAttachment: function(uri, file, attachmentindex) {
    aedump = aewindow.aedump;
    //aedump(">> "+uri+"\n");
    uri = Cc["@mozilla.org/network/io-service;1"].getService(
      Ci.nsIIOService).newURI(uri, null, null);
    if (uri.schemeIs(
      "file")) { //make sure file exists or saveUri below fails.
      if (!(uri.QueryInterface(Ci.nsIFileURL).file).exists())
      return null;
    }
    var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
      .createInstance(Ci.nsIWebBrowserPersist);
    persist.progressListener = {
      index: attachmentindex,
      ptracker: aewindow.progress_tracker,
      m_file: file,
      realFileName: file.leafName,
      minFileSize: aewindow.prefs.get("extract.minimumsize"),
      onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress,
        aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
        if (this.ptracker) this.ptracker.set_file_progress(
          aCurSelfProgress, aMaxSelfProgress);
      },
      onStateChange: function(aWebProgress, aRequest, aStatus, aMessage) {
        //aedump("// "+aStatus+"\n");
        /*if (aStatus & 0x00000001 && this.ptracker)*/
        if (aStatus & 0x00000010) {
          //if (this.ptracker) this.ptracker.set_file_progress(-1,0);
          this.ptracker = null;
          if (this.m_file.fileSize < this.minFileSize) {
            aedump("// file size (" + this.m_file.fileSize +
              ") is below min (" + this.minFileSize +
              ") so abort save.\n", 3);
            this.m_file.remove(false);
          } else { // rename temp file to actual filename.
            try {
              this.m_file.moveTo(null, this.realFileName);
            } catch (e) {
              aedump(e);
            }
          }
          if (typeof aewindow === "object") aewindow.currentTask
            .currentMessage.saveAtt_cleanUp(this.index, false);
        }
      },
      onStatusChange: function(aWebProgress, aRequest, aStatus,
      aMessage) {
        /*aedump("// "+aStatus+"\n",3);*/ }
    };
    //persist.progressListener.minFileSize=aewindow.prefs.get("extract.minimumsize");
    file.leafName += "~~~";
    persist.saveURI(uri, null, null, null, "", file);
    return persist;
  },

  createStartupUrl: function(uri) {
    aedump('{function:aeMessenger.createStartupUrl}: ' + uri + '\n', 2);
    startupUrl = Services.io.newURI(uri);
    aedump('//startupUrl: ' + startupUrl + '\n');
    return startupUrl;
  },

/*
  createStartupUrl: function(uri) {
    aedump('{function:aeMessenger.createStartupUrl}: ' + uri + '\n', 2);
    var obj;
    if (uri.startsWith("imap://")) {
      obj = Components.classesByID["{21a89611-dc0d-11d2-806c-006008128c4e}"];
    } else if (uri.startsWith("mailbox://")) {
      obj = Cc["@mozilla.org/messenger/mailboxurl;1"];
    } else if (uri.startsWith("news://")) {
      obj = Cc["@mozilla.org/messenger/nntpurl;1"];
    } else {
      throw new Error("unusable type of uri: " + uri.substr(0, uri.indexOf(
        ":")) + "\n");
    }
    var startupUrl = obj.createInstance(Ci.nsIURI);

    // nsIURI.spec is read-only, use url.mutate().setSpec(aSpec).finalize();
    // startupUrl.spec = uri;
    startupUrl = startupUrl.mutate().setSpec(uri).finalize();
/*
    startupUrl = 
    Cc["@mozilla.org/network/standard-url-mutator;1"]
    .createInstance(Ci.nsIURIMutator)
    .setSpec(uri)
    .finalize();

    aedump("startupUrl after mutate\n");
    aedump("startupUrl: " + startupUrl + "\n");
    aedump("startupUrl.spec: " + startupUrl.spec + "\n");
    return startupUrl;
  }
*/
};

function aeSaveMsgListener(m_file, m_messenger, m_contentType, afterAction, afterActionAttachmentindex,
  aewindow, minFileSize) {
  var aedump = aewindow.aedump;

  var mProgress = 0;
  var mContentLength = -1;
  var mCanceled = false;
  var mInitialized = false;
  var m_outputStream = (m_file) ? Cc[
    "@mozilla.org/network/file-output-stream;1"].createInstance(Ci
    .nsIFileOutputStream) : null;
  this.postFunc = null;
  var storage = "";
  this.m_channel = null;

  if (m_file) {
    var realFileName = m_file.leafName;
    m_file = m_file.clone();
    m_file.leafName += "~~~"; //use temp file.
  }
  //var mTransfer; // not used at the moment. keep because may in the future.
  var that = this;

  this.QueryInterface = function(iid) {
    if ((iid === Ci.nsIStreamListener) ||
      (iid === Ci.nsIUrlListener) ||
      (iid === Ci.nsICancelable) ||
      (iid === Ci.nsISupports) ||
      (iid === Ci.nsIMsgCopyServiceListener) ||
      (iid === Ci.nsIRequestObserver))
      return this;
    throw Cr.NS_NOINTERFACE;
  };

  this.cancel = function(status) {
    aedump("{function:aeSaveMsgListener.Cancel}\n", 2);
    mCanceled = true;
  }

  this.OnStartRunningUrl = function(url) {}

  this.OnStopRunningUrl = function(url, exitCode) {
    aedump("{function:aeSaveMsgListener.OnStopRunningUrl}\n", 2);
    try {
      if (m_outputStream) {
        m_outputStream.flush();
        m_outputStream.close();
      }
      if (exitCode !== 0) {
        if (m_file) m_file.remove(false);
        alert(aewindow.messengerStringBundle.GetStringFromName(
          "saveMessageFailed"));
      }
    } catch (e) {
      aedump(e);
    }
    this.finish();
  }

  this.OnStartCopy = function(v) {
    aedump("{function:OnStartCopy(" + argexpand(arguments) + ")}\n", 4);
  }
  this.OnProgress = function(aProgress, aProgressMax) {
    aedump("{function:OnProgress(" + argexpand(arguments) + ")}\n", 4);
  }
  this.SetMessageKey = function(aKey) {
    aedump("{function:SetMessageKey(" + argexpand(arguments) + ")}\n", 4);
  }
  this.GetMessageId = function(aMessageId) {
    aedump("{function:GetMessageId(" + argexpand(arguments) + ")}\n", 4);
  }
  this.OnStopCopy = function(aStatus) {
    aedump("{function:OnStopCopy(" + argexpand(arguments) + ")}\n", 4);
  }

  // for OSX, sets creator flags on the output file
  function initializeDownload(aRequest, aBytesDownloaded) {
    aedump("{function:aeSaveMsgListener.initializeDownload}\n", 2);
    mInitialized = true;
    if (that.postFunc) aedump("// using a post-save function\n", 4);
    var channel = aRequest.QueryInterface(Ci.nsIChannel);
    if (!channel) return;
    //aedump("// channel contentLength: "+channel.contentLength+"\n",3);

    if (mContentLength === -1) mContentLength = channel.contentLength;
    if (!m_contentType || m_contentType === "") return;

    // if we are saving an appledouble or applesingle attachment, we need to use an Apple File Decoder 
    if (navigator.appVersion.indexOf("Macintosh") !== -1) {
      var mimeinfo = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService)
        .getFromTypeAndExtension(m_contentType, "");
      if (m_contentType === "application/applefile" || m_contentType ===
        "multipart/appledouble") {
        var appleFileDecoder = Cc["@mozilla.org/applefiledecoder;1"]
          .createInstance(Ci.nsIAppleFileDecoder);
        if (appleFileDecoder) {
          appleFileDecoder.initialize(m_outputStream, m_file);
          m_outputStream = appleFileDecoder;
        }
      } else if (mimeinfo && mimeinfo.macType && mimeinfo.macCreator) {
        // nsILocalFile has been replaced by nsIFile, but nsILocalFileMac seems still to be okay ?
        // var macFile = m_file.QueryInterface(Ci.nsIFileMac);
        var macFile = m_file.QueryInterface(Ci.nsILocalFileMac);
        if (macFile) {
          macFile.setFileCreator(mimeinfo.macCreator);
          macFile.setFileType(mimeinfo.macType);
        }
      }
    }
  }

  // Thunderbird 60:
  // this.onStartRequest = function(request, aSupport) {
  // Thunderbird 68:
  this.onStartRequest = function(request) {
    aedump("{function:aeSaveMsgListener.OnStartRequest}\n", 2);

    if (!m_outputStream) {
      mCanceled = true;
      aedump("AEC: mCanceled=true {function:aeSaveMsgListener.OnStartRequest}\n",2);
      m_messenger.alert(aewindow.messengerStringBundle.GetStringFromName(
        "saveAttachmentFailed"));
    } else {
      m_outputStream.init(m_file, -1, 00600, 0);
      var bufferedStream = Cc["@mozilla.org/network/buffered-output-stream;1"]
        .createInstance(Ci.nsIBufferedOutputStream);
      bufferedStream.init(m_outputStream, 4096);
      m_outputStream = bufferedStream;
    }
  }

  // Thunderbird 60:
  // this.onStopRequest = function(request, aSupport, status) {
  // Thunderbird 68:
  this.onStopRequest = function(request, status) {
    aedump("{function:aeSaveMsgListener.OnStopRequest}\n", 2);
    try { // close down the file stream 
      if (m_outputStream) {
        if (that.postFunc) {
          storage = that.postFunc.apply(null, [storage]);
          m_outputStream.write(storage, storage.length);
        }
        m_outputStream.flush();
        m_outputStream.close();
      }
      /*
	  if (mTransfer) {
    	mTransfer.onProgressChange(null, null, mContentLength, mContentLength, mContentLength, mContentLength);
    	mTransfer.onStateChange(null, null, nsIWebProgressListener.STATE_STOP, 0);
    	mTransfer = null; // break any circular dependencies between the progress dialog and use
      }
	  */
    } catch (e) {
      aedump(e);
    }
    this.finish();
  }

  this.onDataAvailable = 
    // Thunderbird 60:
    // function(request, aSupport, inStream, srcOffset, count) {
    // Thunderbird 68:
    function(request, inStream, srcOffset, count) {
        //aedump("{function:aeSaveMsgListener.OnDataAvailable}\n",4);
    if (mCanceled) request.cancel(2); // then go cancel our underlying channel too.  
                                      // NS_BINDING_ABORTED =2 apparently.
    if (!mInitialized) initializeDownload(request, count);
    try {
      if (m_outputStream) {
        mProgress += count;
        if (that.postFunc) {
          var sis = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(
            Ci.nsIScriptableInputStream);
          sis.init(inStream);
          storage += sis.read(sis.available());
          var sis = null;
        } else {
          m_outputStream.writeFrom(inStream, inStream.available());
        }
        /*if (aewindow.progress_tracker) aewindow.progress_tracker.set_file_progress(mProgress,mContentLength);*/
        /*
      if (mTransfer) mTransfer.OnProgressChange(null, request, mProgress, mContentLength, mProgress, mContentLength);
		*/
      }
    } catch (e) {
      aedump(e);
      this.cancel();
    }
  }

  this.finish = function() {
    if (!m_file || !m_file.exists()) return;

    if (aewindow.prefs.get("setdatetoemail")) {
      //aewindow.aedump('// m_file.lastModifiedTime = '+m_file.lastModifiedTime+'\n');
      try {
        m_file.lastModifiedTime = aewindow.currentTask.getMessageHeader()
          .dateInSeconds * 1000;
      } catch (e) {
        aedump("//setting lastModifiedTime failed on current attachment\n",
        0);
      }
      //aewindow.aedump('// m_file.lastModifiedTime = '+m_file.lastModifiedTime+'\n');
    }
    if (m_file.fileSize < minFileSize) {
      aedump("// file size (" + m_file.fileSize + ") is below min (" +
        minFileSize + ") so abort save.\n", 3);
      m_file.remove(false);
    } else { // rename temp file to actual filename.
      try {
        m_file.moveTo(null, realFileName);
        m_file = null;
      } catch (e) {
        aedump("m_file: " + m_file.leafName + ";realFileName: " +
          realFileName + "; " + e + "\n");
      }
    }
    if (afterAction) {
      aedump("AEC afterAction: " + afterAction + "\n");

      // eval(afterEval);
      // try to replace eval() with the following 3 lines
      // not sure if it is working because of an other error 
      // we don't arrive here at this development status
      /*
        let aeSandbox = new Components.utils.Sandbox("https://www.example.com/");
        aeSandbox.afterEval = afterEval;
        aeSandbox.aewindow = aewindow;
        Components.utils.evalInSandbox(afterEval, aeSandbox);
      */

      switch (afterAction) {
        case "doAfterActions(aewindow.progress_tracker.message_states.CLEARTAG)":
          aewindow.currentTask.currentMessage.doAfterActions(aewindow.progress_tracker.message_states.CLEARTAG)
          break;
        case "saveAtt_cleanUp":
          aewindow.currentTask.currentMessage.saveAtt_cleanUp(afterActionAttachmentindex,false)
          break;
      }

      afterAction = null;
    }
  }
}
