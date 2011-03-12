/**
 * Event Listener to listen to browser's load events
 * Implements nsISupportsWeakReference
 * 
 * Parts of this object's code are taken from
 * https://developer.mozilla.org/en/XUL_School/Intercepting_Page_Loads
 * 
 */
var eventListener = {
  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.nsISupportsWeakReference)
        || aIID.equals(Components.interfaces.nsISupports)) {
      return this;
    }

    throw Components.results.NS_NOINTERFACE;
  },
  /**
   * Adds progressListener to every current tab
   * and also registers progressListener for every new tab
   * that is opened afterwards
   * 
   */
  init: function() {
    gBrowser.browsers.forEach(function(browser) {
      this._toggleProgressListener(browser.webProgress, true);
    }, this);

    gBrowser.tabContainer.addEventListener("TabOpen", this, false);
    gBrowser.tabContainer.addEventListener("TabClose", this, false);
  },
  /**
   * Register progressListener for newly opened tabs
   * 
   * @param aEvent
   */
  handleEvent: function(event) {
    var tab = event.target;
    var webProgress = gBrowser.getBrowserForTab(tab).webProgress;

    this._toggleProgressListener(webProgress, ("TabOpen" == event.type));
  },
  /**
   * Listen to Firefox' state changes
   * Concretely: Flush DNS cache if user is reloading a current page,
   * be it in a normal browser frame or an iframe
   * 
   * @param webProgress
   * @param request
   * @param stateFlags
   * @param status
   */
  onStateChange: function(webProgress, request, stateFlags, status) {
    // If dns cache is active, there's nothing we need to do here
    if (dnscache.isDnsActive()) {
      return;
    }
    // If request is started and request is a document
    if ((stateFlags & Components.interfaces.nsIWebProgressListener.STATE_START) &&
        (stateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT)) {
      // Only trigger if user is reloading page
      if (window.content.location.href == request.name) {
        dnscache.flushDns();
      }
    }
  },
  // Empty methods, need to be implemented because of nsISupportsWeakReference
  onLocationChange: function() {},
  onProgressChange: function() {},
  onSecurityChange: function() {},
  onStatusChange: function() {},
  /**
   * Add or remove progressListener to tab
   * 
   * @param aWebProgress
   * @param aIsAdd
   */
  _toggleProgressListener: function(webProgress, isAdd) {
    if (isAdd) {
      webProgress.addProgressListener(this, webProgress.NOTIFY_STATE_ALL);
    } else {
      webProgress.removeProgressListener(this);
    }
  }
};

var dnscache = {
  expiration: -1,
  entries: -1,
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("dnscache-strings");
    this.expiration = -1;
    this.entries = -1;
    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefBranch);
    this.getDnsCacheValues();
    this.changeButtonState();
    eventListener.init();
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
    return (this.expiration > 0 && this.entries > 0);
  },
  flushDns: function() {
    var networkIoService = Components.classes["@mozilla.org/network/io-service;1"]
        .getService(Components.interfaces.nsIIOService);
    networkIoService.offline = true;
    var cacheService = Components.classes["@mozilla.org/network/cache-service;1"]
        .getService(Components.interfaces.nsICacheService);
    cacheService.evictEntries(Components.interfaces.nsICache.STORE_ANYWHERE);
    networkIoService.offline = false;
  },
  changeDnsState: function(state) {
    if (typeof state == 'undefined') {
      state = this.isDnsActive();
    }
    this.getDnsCacheValues();
    switch (state) {
    // DNS Cache is not active and shall be reactivated
    case false:
      this.prefs
          .setIntPref(
              "network.dnsCacheExpiration",
              this.prefs
                  .getIntPref("extensions.dnscache@dominik.jungowski.dnsCacheExpiration"));
      this.prefs.setIntPref("network.dnsCacheEntries", this.prefs
          .getIntPref("extensions.dnscache@dominik.jungowski.dnsCacheEntries"));
      this.changeButtonState(true);
      break;

    // DNS Cache is active and shall be deactivated
    case true:
      // First off: Flush the cache
      this.flushDns();
      // Change caching values
      this.prefs.setIntPref("network.dnsCacheExpiration", "0");
      this.prefs.setIntPref("network.dnsCacheEntries", "0");
      this.changeButtonState(false);
      break;
    }
    this.prefs.setIntPref(
        "extensions.dnscache@dominik.jungowski.dnsCacheExpiration",
        this.expiration);
    this.prefs.setIntPref(
        "extensions.dnscache@dominik.jungowski.dnsCacheEntries", this.entries);
    this.getDnsCacheValues();
  },
  changeButtonState: function(state) {
    if (typeof state == 'undefined') {
      state = this.isDnsActive();
    }
    var buttons = new Array();
    buttons.push(document.getElementById("dnscache-toolbar-button"));
    buttons.push(document.getElementById("dnsCacheStatusIcon"));
    for ( var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      if (button === null) {
        continue;
      }
      switch (state) {
      // DNS Cache is not active
      case false:
        button.setAttribute("class", "inactive");
        button.setAttribute("tooltiptext", this.strings
            .getString("dnsInactive"));
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

window.addEventListener("load", function(e) {
  dnscache.onLoad(e);
}, false);