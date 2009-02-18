var dnscache = {
  expiration: -1,
  entries: -1,
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("dnscache-strings");
	this.expiration = -1;
	this.entries = -1;
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"].
	                getService(Components.interfaces.nsIPrefBranch);
	this.getDnsCacheValues();
	this.changeButtonState();
  },
  onToolbarButtonCommand: function(e) {
	this.getDnsCacheValues();
	this.changeDnsState();
	this.getDnsCacheValues();
  },
  getDnsCacheValues: function() {
	this.expiration = this.prefs.getIntPref("network.dnsCacheExpiration");
	this.entries = this.prefs.getIntPref("network.dnsCacheEntries");
  },
  isDnsActive: function() {
 	return (this.expiration > 0 && this.expiration > 0);
  },
  changeDnsState: function(state) {
    if (typeof state == 'undefined') {
		state = this.isDnsActive();
	}
	this.getDnsCacheValues();
  	switch(state) {
		// DNS Cache is not active and shall be reactivated
		case false:
			this.prefs.setIntPref("network.dnsCacheExpiration", this.prefs.getIntPref("extensions.dnscache@dominik.jungowski.dnsCacheExpiration"));
			this.prefs.setIntPref("network.dnsCacheEntries", this.prefs.getIntPref("extensions.dnscache@dominik.jungowski.dnsCacheEntries"));
			this.changeButtonState(true);
		break;

		// DNS Cache is active and shall be deactivated
		case true:
			this.prefs.setIntPref("network.dnsCacheExpiration", "0");
			this.prefs.setIntPref("network.dnsCacheEntries", "0");
			this.changeButtonState(false);
		break;
	}
	this.prefs.setIntPref("extensions.dnscache@dominik.jungowski.dnsCacheExpiration", this.expiration);
	this.prefs.setIntPref("extensions.dnscache@dominik.jungowski.dnsCacheEntries", this.entries);
	this.getDnsCacheValues();
  },
  changeButtonState: function(state) {
    if (typeof state == 'undefined') {
            state = this.isDnsActive();
	}
        var buttons = new Array();
        buttons.push(document.getElementById("dnscache-toolbar-button"));
        buttons.push(document.getElementById("dnsCacheStatusIcon"));
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            if (button === null) {
                continue;
            }
            switch(state) {
                    // DNS Cache is not active
                    case false:
                            button.setAttribute("class", "inactive");
                            button.setAttribute("tooltiptext", this.strings.getString("dnsInactive"));
                    break;

                    // DNS Cache is active
                    case true:
                            button.setAttribute("class", "");
                            button.setAttribute("tooltiptext", this.strings.getString("dnsActive"));
                    break;
            }
        }
  }
};
window.addEventListener("load", function(e) { dnscache.onLoad(e); }, false);
