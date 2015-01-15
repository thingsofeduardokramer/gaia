'use strict';

var Actions = require('marionette-client').Actions;
var System = require('./lib/system.js');
var UtilityTray = require('./lib/utility_tray');

marionette('Utility Tray - Gestures', function() {
  var client = marionette.client({
    prefs: {
      'dom.w3c_touch_events.enabled': 1
    },
    settings: {
      'ftu.manifestURL': null,
      'lockscreen.enabled': false
    }
  });

  var system;
  var utilityTray;

  setup(function() {
    system = new System(client);
    utilityTray = new UtilityTray(client);

    system.waitForStartup();
  });

  test('Swiping down', function() {
    var topPanel = system.topPanel;

    utilityTray.swipeDown(topPanel);
    utilityTray.waitForOpened();
  });

  test('Swiping down when already opened', function() {
    var topPanel = system.topPanel;

    utilityTray.swipeDown(topPanel);
    utilityTray.waitForOpened();

    utilityTray.swipeDown(topPanel);
    utilityTray.waitForOpened();
  });

  test('Swiping up', function() {
    utilityTray.open();
    utilityTray.waitForOpened();

    var grippy = client.findElement(utilityTray.Selectors.grippy);
    utilityTray.swipeUp(grippy);
    utilityTray.waitForClosed();
  });
});
