
(function () {
  var cfg = window.APP_CONFIG || {};
  var agentsEl = document.getElementById("agents");
  var countEl = document.getElementById("channel-count");

  var agents = Array.isArray(cfg.agents) ? cfg.agents : [];
  var activeIndex = 0;
  var widgetReady = false;

  function isMissing(value) {
    return !value || String(value).indexOf("PASTE_") === 0;
  }

  function userId() {
    try {
      var id = sessionStorage.getItem("bench-user");

      if (!id) {
        id = "tester-" + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem("bench-user", id);
      }

      return id;
    } catch (error) {
      return "tester";
    }
  }

  function showMessage(mount, message, isError) {
    mount.textContent = "";

    var p = document.createElement("p");
    p.className = "msg" + (isError ? " error" : "");
    p.textContent = message;

    mount.appendChild(p);
  }

  function mountWidget(mount, agent) {
    if (!agent || isMissing(agent.appId)) {
      showMessage(
        mount,
        "Add this agent's appId in config.js to enable calls.",
        true
      );
      return;
    }

    var widget = document.createElement("sarvam-widget");

    widget.setAttribute("app-id", agent.appId);
    widget.setAttribute("org-id", agent.orgId || cfg.orgId);
    widget.setAttribute(
      "workspace-id",
      agent.workspaceId || cfg.workspaceId
    );
    widget.setAttribute("user-id", userId());
    widget.setAttribute(
      "button-text",
      agent.buttonText || ("Talk to " + (agent.name || "agent"))
    );
    widget.setAttribute(
      "interaction-type",
      agent.interactionType || "call"
    );

    if (cfg.mode === "direct") {
      widget.setAttribute("api-key", cfg.directApiKey || "");
    } else {
      widget.setAttribute(
        "session-endpoint",
        cfg.sessionEndpoint || "/api/sarvam/"
      );
    }

    mount.textContent = "";
    mount.appendChild(widget);
  }

  function selectAgent(index) {
    if (index === activeIndex) return;

    activeIndex = index;
    renderWorkspace();
  }

  function renderWorkspace() {
    agentsEl.textContent = "";

    if (!agents.length) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        "Add your agents to the agents array in config.js to get started.";

      agentsEl.appendChild(empty);
      countEl.textContent = "0 CHANNELS";
      return;
    }

    countEl.textContent =
      agents.length + (agents.length === 1 ? " CHANNEL" : " CHANNELS");

    // Agent selection tabs
    var tabs = document.createElement("div");
    tabs.className = "agent-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Choose an agent");

    agents.forEach(function (agent, index) {
      var tab = document.createElement("button");

      tab.type = "button";
      tab.className =
        "agent-tab" + (index === activeIndex ? " active" : "");

      tab.setAttribute("role", "tab");
      tab.setAttribute(
        "aria-selected",
        index === activeIndex ? "true" : "false"
      );

      var number = document.createElement("span");
      number.className = "tab-number";
      number.textContent = String(index + 1).padStart(2, "0");

      var name = document.createElement("span");
      name.className = "tab-name";
      name.textContent = agent.name || ("Agent " + (index + 1));

      var arrow = document.createElement("span");
      arrow.className = "tab-arrow";
      arrow.textContent = "↗";

      tab.append(number, name, arrow);

      tab.addEventListener("click", function () {
        selectAgent(index);
      });

      tabs.appendChild(tab);
    });

    agentsEl.appendChild(tabs);

    // Active agent panel
    var panel = document.createElement("section");
    panel.className = "channel-panel";
    panel.id = "agent-channel";
    panel.setAttribute("role", "tabpanel");

    agentsEl.appendChild(panel);

    renderActivePanel();
  }

  function renderActivePanel() {
    var panel = document.getElementById("agent-channel");
    var agent = agents[activeIndex];

    if (!panel || !agent) return;

    panel.textContent = "";

    // Agent identity
    var panelTop = document.createElement("div");
    panelTop.className = "channel-top";

    var identity = document.createElement("div");
    identity.className = "agent-identity";

    var avatar = document.createElement("div");
    avatar.className = "agent-avatar avatar-" + (activeIndex % 4);
    avatar.textContent = String(activeIndex + 1).padStart(2, "0");

    var titleWrap = document.createElement("div");

    var kicker = document.createElement("div");
    kicker.className = "section-kicker";
    kicker.textContent = "ACTIVE CHANNEL";

    var title = document.createElement("h3");
    title.className = "channel-title";
    title.textContent = agent.name || ("Agent " + (activeIndex + 1));

    titleWrap.append(kicker, title);
    identity.append(avatar, titleWrap);

    var status = document.createElement("span");
    status.className = "ready-pill";
    status.innerHTML = '<span class="live-dot"></span> READY TO TEST';

    panelTop.append(identity, status);
    panel.appendChild(panelTop);

    // Agent description
    if (agent.description) {
      var description = document.createElement("p");
      description.className = "channel-description";
      description.textContent = agent.description;
      panel.appendChild(description);
    }

    // Supported languages
    if (agent.languages && agent.languages.length) {
      var languages = document.createElement("div");
      languages.className = "language-row";

      var label = document.createElement("span");
      label.className = "language-label";
      label.textContent = "LANGUAGES";
      languages.appendChild(label);

      agent.languages.forEach(function (language) {
        var chip = document.createElement("span");
        chip.className = "language-chip";
        chip.textContent = language;
        languages.appendChild(chip);
      });

      panel.appendChild(languages);
    }

    // Keep the call widget, without the Conversation console section.
    var mount = document.createElement("div");
    mount.className = "mount";
    mount.id = "active-agent-mount";

    panel.appendChild(mount);

    if (widgetReady) {
      mountWidget(mount, agent);
    } else {
      showMessage(mount, "Loading call interface...", false);
    }
  }

  // Render the workspace immediately.
  renderWorkspace();

  // Wait for Sarvam's widget to become available.
  if (!window.customElements) {
    var mount = document.getElementById("active-agent-mount");

    if (mount) {
      showMessage(mount, "Your browser does not support this widget.", true);
    }

    return;
  }

  var timeout = new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error("Sarvam widget loading timed out"));
    }, 8000);
  });

  Promise.race([
    customElements.whenDefined("sarvam-widget"),
    timeout
  ])
    .then(function () {
      widgetReady = true;
      renderActivePanel();
    })
    .catch(function () {
      var mount = document.getElementById("active-agent-mount");

      if (mount) {
        showMessage(
          mount,
          "Could not load the Sarvam widget. Check your internet connection and refresh.",
          true
        );
      }
    });
})();
