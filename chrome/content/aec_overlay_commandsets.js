window.addEventListener('load', function() {
  //aedump('load\n');

  var t;
  if ((t=document.getElementById('attachmentListContext'))) t.addEventListener('popupshowing',attachmentextractor.onShowAttachmentContextMenu,false);
  if ((t=document.getElementById('mailContext')))           t.addEventListener('popupshowing',attachmentextractor.updateMRUVisability,false);

}, true);
