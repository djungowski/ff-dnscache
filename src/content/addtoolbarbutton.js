var addToAddonBar = function() {
	var addonBar = document.getElementById("addon-bar");
	if (addonBar) {
	  if (!document.getElementById("dnsCacheStatusBar")) {
	    addonBar.insertItem("dnsCacheStatusBar");
	  }
	}
};

window.addEventListener("load", addToAddonBar, false);