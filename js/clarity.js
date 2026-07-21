/*
 * LocalClaw analytics bootstrap.
 *
 * The legacy filename is kept because it is already referenced across the
 * static site. PostHog handles product analytics; DataFast remains the source
 * for acquisition analytics. Session replay and person identification stay off.
 */
(function () {
  'use strict';

  var POSTHOG_TOKEN = 'phc_nFfTohVf89iWucfMKZKz2TapFFFD9wJK3q6odYhH7dj8';
  var POSTHOG_HOST = 'https://us.i.posthog.com';
  var lastManualCapture = { name: '', at: 0 };
  var allowedProperties = {
    active: true,
    article: true,
    component: true,
    destination: true,
    flow: true,
    group: true,
    guide: true,
    intent: true,
    label: true,
    model: true,
    page_path: true,
    placement: true,
    platform: true,
    preset: true,
    shown: true,
    slide: true,
    sort: true,
    source: true,
    target: true,
    value: true,
    view: true
  };

  function analyticsDisabled() {
    var host = window.location.hostname;
    return navigator.doNotTrack === '1' ||
      window.doNotTrack === '1' ||
      navigator.globalPrivacyControl === true ||
      window.location.protocol === 'file:' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local');
  }

  function cleanValue(value) {
    if (typeof value === 'boolean' || typeof value === 'number') return value;
    return String(value).replace(/\s+/g, ' ').trim().slice(0, 160);
  }

  function safeProperties(properties, captureSource) {
    var safe = {
      capture_source: captureSource,
      page_path: window.location.pathname
    };

    Object.keys(properties || {}).forEach(function (key) {
      if (!allowedProperties[key]) return;
      var value = properties[key];
      if (value === null || typeof value === 'undefined') return;
      safe[key] = cleanValue(value);
    });

    return safe;
  }

  function capture(name, properties, captureSource, manual) {
    if (!window.posthog || typeof window.posthog.capture !== 'function') return;
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(String(name || ''))) return;

    if (manual) {
      lastManualCapture = { name: name, at: Date.now() };
    }

    try {
      window.posthog.capture(name, safeProperties(properties, captureSource));
    } catch (error) {
      // Analytics must never interrupt the product experience.
    }
  }

  function destinationFor(element) {
    var link = element.closest('a[href]');
    if (!link) return '';

    try {
      var url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin
        ? url.pathname
        : url.hostname + url.pathname;
    } catch (error) {
      return '';
    }
  }

  function safePageUrl() {
    return window.location.origin + window.location.pathname;
  }

  function capturePageEvent(name) {
    if (!window.posthog || typeof window.posthog.capture !== 'function') return;
    try {
      window.posthog.capture(name, {
        $current_url: safePageUrl(),
        $pathname: window.location.pathname
      });
    } catch (error) {
      // Analytics must never interrupt the product experience.
    }
  }

  function installGoalTracking() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      var goalElement = target.closest('[data-fast-goal]');
      if (!goalElement) return;

      var name = goalElement.getAttribute('data-fast-goal');
      if (!name) return;

      // A page-specific handler may have captured the same business event.
      if (lastManualCapture.name === name && Date.now() - lastManualCapture.at < 350) {
        return;
      }

      var properties = {};
      [
        'source', 'target', 'intent', 'platform', 'component', 'slide',
        'model', 'guide', 'group', 'value', 'placement'
      ].forEach(function (property) {
        var value = goalElement.getAttribute('data-fast-goal-' + property);
        if (value) properties[property] = value;
      });

      var destination = destinationFor(goalElement);
      if (destination) properties.destination = destination;

      var label = goalElement.getAttribute('aria-label') || goalElement.textContent;
      if (label) properties.label = label;

      capture(name, properties, 'data_attribute', false);
    });
  }

  if (analyticsDisabled()) return;

  // Official asynchronous PostHog web snippet.
  !(function (documentRef, posthog) {
    var methods;
    var methodIndex;
    var script;
    var firstScript;

    if (posthog.__SV) return;
    window.posthog = posthog;
    posthog._i = [];
    posthog.init = function (token, config, name) {
      function stub(target, method) {
        var parts = method.split('.');
        if (parts.length === 2) {
          target = target[parts[0]];
          method = parts[1];
        }
        target[method] = function () {
          target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }

      script = documentRef.createElement('script');
      script.type = 'text/javascript';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.src = config.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
      firstScript = documentRef.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);

      var instance = posthog;
      if (typeof name !== 'undefined') {
        instance = posthog[name] = [];
      } else {
        name = 'posthog';
      }

      instance.people = instance.people || [];
      instance.toString = function (asPeople) {
        var value = 'posthog';
        if (name !== 'posthog') value += '.' + name;
        if (!asPeople) value += ' (stub)';
        return value;
      };
      instance.people.toString = function () {
        return instance.toString(1) + '.people (stub)';
      };

      methods = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' ');
      for (methodIndex = 0; methodIndex < methods.length; methodIndex += 1) {
        stub(instance, methods[methodIndex]);
      }
      posthog._i.push([token, config, name]);
    };
    posthog.__SV = 1;
  })(document, window.posthog || []);

  window.posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-05-30',
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    person_profiles: 'identified_only'
  });

  window.localClawPostHogCapture = function (name, properties) {
    capture(name, properties, 'app', true);
  };

  installGoalTracking();
  capturePageEvent('$pageview');

  if (window.location.pathname === '/pricing.html' || window.location.pathname === '/pricing') {
    capture('pricing_view', { source: 'page_context' }, 'page_context', false);
  }

  if (window.location.pathname === '/success.html' || window.location.pathname === '/success') {
    var checkoutSession = new URLSearchParams(window.location.search).get('session_id') || '';
    if (/^cs_(live|test)_[A-Za-z0-9]{20,}$/.test(checkoutSession)) {
      capture('checkout_success_view', { source: 'stripe_redirect' }, 'page_context', false);
    }
  }

  window.addEventListener('pagehide', function () {
    capturePageEvent('$pageleave');
  });
})();
