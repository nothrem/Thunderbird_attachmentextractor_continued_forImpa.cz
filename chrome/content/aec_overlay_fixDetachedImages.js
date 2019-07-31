try {
  if (typeof Cc == "undefined") var Cc = Components.classes;
  if (typeof Ci == "undefined") var Ci = Components.interfaces;
  if (typeof Cr == "undefined") var Cr = Components.results;
} catch (e) {}

var fixDetachedImages=function fixDetachedImages(aEvent) {
  if (!attachmentextractor.prefs.get("fixdetachedimages")) return;
  var messagePane=document.getElementById("messagepane");
  
  var messageMatches=messagePane.contentDocument.getElementsByTagName('IMG');
  // just include attachments not external images
  messageMatches = 
    Array.prototype.filter.call(messageMatches,function (a) {return /^mailbox|imap/.test(a.src);});
  //aedump(messageMatches.map(function (a) {return a.src+"\n";}));
  
  var attachments = currentAttachments;/*document.getElementById('attachmentList').children;
  attachments=Array.prototype.map.call(attachments,function (c) {return c.attachment;});*/
  // just concentrate on image attachments.
  attachments=attachments.filter(function (att) {return att.contentType.indexOf("image")==0;});
  //aedump(attachments.map(function (c) {return c.displayName+" : "+c.url+"\n";}));
  
  if (attachments.length==0 || messageMatches.length==0) return;
  attachments.reverse();
  messageMatches.reverse();
  
  var ioService = 
    Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  var resProt = 
    ioService.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
  var setResources=new Array();
  attachments.forEach(function (att,i,a) {
    if (!att.isExternalAttachment) return;
    var resourceName=encodeURIComponent("ae_"+att.displayName.toLowerCase());
    resProt.setSubstitution(resourceName, ioService.newURI(att.url, null, null));	
    messageMatches[i].src="resource://"+resourceName;
    aedump("substituted "+att.displayName+" with resource://"+resourceName+"> "+att.url+"\n",3);
    att.resource=messageMatches[i].src;
    setResources.push(resourceName);			
  });
  // create timeout to remove resources after we've finished with them - they're a security hole.
  setTimeout(function(prot,res) {res.forEach(function(r){prot.setSubstitution(r,null);});},1000,resProt,setResources);
  if (typeof messagePaneOnResize == "function") setTimeout(messagePaneOnResize,500); //TB3 only
}

window.addEventListener('load', function() {
  document.getElementById("messagepane").addEventListener("load", fixDetachedImages, true);
  window.removeEventListener('load',arguments.callee,true);
}, true);
