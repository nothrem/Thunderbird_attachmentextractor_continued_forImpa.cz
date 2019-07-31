function onload() {
  let matches=window.arguments[0];
  let folderlist=document.getElementById('folderlist'); 
  if (folderlist.selectedItem!=null) return;  //sometimes triggers twice. dont know why but stop it anyway.
  if (matches.length==0) document.documentElement.getButton("accept").disabled = true;  
  for (let i=0;i < matches.length;i++) {
    folderlist.appendItem("["+matches[i].ct+"] "+matches[i].f.path,matches[i].f).crop="center";
  }
  folderlist.selectedIndex=0;
  setTimeout( function() {sizeToContent();}, 0);
  /*addEventListener("resize", function(){ removeEventListener("resize", arguments.callee, false); sizeToContent(); }, false);*/
}

function ondialogaccept() {
  let folderlist=document.getElementById('folderlist');
  window.arguments[1].selectedIndex=folderlist.selectedIndex;
}

function ondialogextra1() {
  window.arguments[1].browse=true;
  window.close();
}
