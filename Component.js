sap.ui.define([
	"sap/ui/core/Component",
], function(Component) {

	return Component.extend("com.sap.shellplugin1.Component", {

		metadata: {
			"manifest": "json"
		},
		sciConfig: null,

		init: function() {
			var rendererPromise = this._getRenderer();

			this.sciConfig = this.getMetadata().getConfig().sci;
			var isGuest = sap.ushell.Container.getUser().getFullName() === "Guest";

			var renderer = sap.ushell.Container.getRenderer("fiori2");
			renderer.addHeaderEndItem("sap.ushell.ui.shell.ShellHeadItem", {
				id: isGuest ? "headerLoginButton" : "headerLogoutButton",
				icon: "sap-icon://log",
				press: isGuest ? this.login.bind(this) : this.logout,
				tooltip: isGuest ? "Log On" : "Log Off"
			}, true, false);

			var siteService = sap.ushell.Container.getService("SiteService");
			if (this.sciConfig.useOverlay && siteService.isRuntime() && !siteService.isDraftPreview()) {
				var href = encodeURI(this.getLoginUrl());
				$("#shell").append("<div id=\"hiddenLoginButton\" style=\"display: none;\"><a href=" + href + " rel=\"IDS_login\">Login</a></div>");
				jQuery.sap.require("sap.ui.thirdparty.datajs");
				jQuery.sap.includeScript(this.sciConfig.sci_tenant + this.sciConfig.sap_ids_path);
			}

		},

		getLoginUrl: function() {
			var location = window.top.location;
			var params = location.search;
			if (params === '?') {
				params += 'hc_login';
			} else if (params.length > 0) {
				params += '&hc_login';
			} else {
				params = '?hc_login';
			}
			var loginUrl = location.origin + location.pathname + params;
			return loginUrl;
		},

		login: function() {
			if (!sap.ushell.Container.getService("SiteService").isRuntime()) {
				return;
			}
			if (this.sciConfig.useOverlay) {
				$("#hiddenLoginButton").find("a").click();
			} else {
				window.top.location = encodeURI(this.getLoginUrl());
			}
		},

		logout: function() {
			if (!sap.ushell.Container.getService("SiteService").isRuntime()) {
				return;
			}
			sap.ushell.Container.logout();
		},

		/**
		 * Returns the shell renderer instance in a reliable way,
		 * i.e. independent from the initialization time of the plug-in.
		 * This means that the current renderer is returned immediately, if it
		 * is already created (plug-in is loaded after renderer creation) or it
		 * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
		 * before the renderer is created).
		 *
		 *  @returns {object}
		 *      a jQuery promise, resolved with the renderer instance, or
		 *      rejected with an error message.
		 */
		_getRenderer: function() {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function(oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		}
	});
});