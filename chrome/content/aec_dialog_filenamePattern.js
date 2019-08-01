function add_to_pattern(button) {
  console.log("add_to_pattern");
  let fnpbox=document.getElementById('filenamepattern');
  let postindex=fnpbox.selectionStart+button.label.length; 
  fnpbox.value=fnpbox.value.substring(0,fnpbox.selectionStart)+button.label+fnpbox.value.substring(fnpbox.selectionEnd);
  fnpbox.setSelectionRange(postindex,postindex);
}

function onload() {
  console.log("onload");
  document.getElementById('filenamepattern').value = window.arguments[0].value; 
  document.getElementById('savecheck').checked = window.arguments[1].value;
}

function onaccept() { 
  console.log("onaccept");
  window.arguments[0].value=document.getElementById('filenamepattern').value; 
  window.arguments[1].value=document.getElementById('savecheck').checked; 
  window.arguments[2].value=true;
}

window.addEventListener("load", function (event) {
  onload();
});

document.addEventListener("dialogaccept", function (event) {
  onaccept();
	event.preventDefault();
});
