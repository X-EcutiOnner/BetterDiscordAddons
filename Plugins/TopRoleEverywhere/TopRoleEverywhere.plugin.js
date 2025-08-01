/**
 * @name TopRoleEverywhere
 * @author DevilBro
 * @authorId 278543574059057154
 * @version 3.2.1
 * @description Adds the highest Role of a User as a Tag
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://mwittrien.github.io/
 * @source https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/TopRoleEverywhere/
 * @updateUrl https://mwittrien.github.io/BetterDiscordAddons/Plugins/TopRoleEverywhere/TopRoleEverywhere.plugin.js
 */

module.exports = (_ => {
	const changeLog = {
		
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			BdApi.Net.fetch("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js").then(r => {
				if (!r || r.status != 200) throw new Error();
				else return r.text();
			}).then(b => {
				if (!b) throw new Error();
				else return require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.UI.showToast("Finished downloading BDFDB Library", {type: "success"}));
			}).catch(error => {
				BdApi.UI.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.UI.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--text-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		return class TopRoleEverywhere extends Plugin {
			onLoad () {
				this.defaults = {
					general: {
						useOtherStyle:		{value: false, 	description: "Use BotTag Style instead of the Role Style"},
						useBlackFont:		{value: false, 	description: "Use black Font instead of darkening the Color for BotTag Style on bright Colors"},
						includeColorless:	{value: false, 	description: "Include colorless Roles"},
						showOwnerRole:		{value: false, 	description: `Display Role Tag of Server Owner as "${BDFDB.LanguageUtils.LanguageStrings.GUILD_OWNER}".`},
						disableForBots:		{value: false, 	description: "Disable Role Tag for Bots"},
						addUserId:		{value: false, 	description: "Add the User Id as a Tag to the Chat Window"},
						userIdFirst:		{value: false, 	description: "Place the User Id before the Role Tag"}
					},
					places: {
						chat:			{value: true, 	description: "Chat Window"},
						memberList:		{value: true, 	description: "Member List"},
						voiceList:		{value: true, 	description: "Voice User List"},
					}
				};
				
				this.modulePatches = {
					before: [
						"MessageUsername"
					],
					after: [
						"NameContainerDecorators",
						"VoiceUser"
					]
				};
				
				this.patchPriority = 4;
				
				this.css = `
					${BDFDB.dotCNS.member + BDFDB.dotCN.namecontainercontent} {
						overflow: visible;
					}
					${BDFDB.dotCN._toproleseverywheretag} {
						display: inline-flex;
						flex: 0 1 auto;
						cursor: pointer;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
					${BDFDB.dotCN._toproleseverywheremembertag} {
						max-width: 50%;
					}
					${BDFDB.dotCNS.messagecompact + BDFDB.dotCN._toproleseverywhererolestyle} {
						margin-right: 0;
						margin-left: .3rem;
						text-indent: 0;
					}
					${BDFDB.dotCNS.messagerepliedmessage + BDFDB.dotCN._toproleseverywhererolestyle} {
						margin-right: .3rem;
						margin-left: 0;
						text-indent: 0;
					}
					${BDFDB.dotCN._toproleseverywhererolestyle} {
						display: inline-flex;
						margin: 0 0 0 0.3rem;
						color: var(--text-secondary)
					}
					${BDFDB.dotCNS._toproleseverywhererolestyle + BDFDB.dotCN.userrolecircle} {
						flex: 0 0 auto;
					}
				`;
			}
			
			onStart () {
				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel, settingsItems = [];
				
				for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
					type: "Switch",
					plugin: this,
					keys: ["general", key],
					label: this.defaults.general[key].description,
					value: this.settings.general[key]
				}));
				
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsPanelList, {
					title: "Add Role Tags in:",
					children: Object.keys(this.defaults.places).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
						type: "Switch",
						plugin: this,
						keys: ["places", key],
						label: this.defaults.places[key].description,
						value: this.settings.places[key]
					}))
				}));
				
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
			}

			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
	
			forceUpdateAll () {
				BDFDB.PatchUtils.forceAllUpdates(this);
				BDFDB.MessageUtils.rerenderAll();
			}

			processNameContainerDecorators (e) {
				if (!this.settings.places.memberList || !e.instance.props.user) return;
				this.injectRoleTag(e.returnvalue.props.children, e.instance.props.user, "member", 3, {
					tagClass: BDFDB.disCN.bottagmember
				});
			}

			processMessageUsername (e) {
				if (!e.instance.props.message) return;
				const author = e.instance.props.userOverride || e.instance.props.message.author;
				let index = e.instance.props.compact ? 1 : 0;
				if (!BDFDB.ArrayUtils.is(e.instance.props.decorations[index])) e.instance.props.decorations[index] = [e.instance.props.decorations[index]].filter(n => n);
				if (this.settings.general.addUserId && this.settings.general.userIdFirst) this.injectIdTag(e.instance.props.decorations[index], author, "chat", {
					tagClass: e.instance.props.compact ? BDFDB.disCN.messagebottagcompact : BDFDB.disCN.messagebottagcozy,
					useRem: true
				});
				if (this.settings.places.chat) this.injectRoleTag(e.instance.props.decorations[index], author, "chat", -1, {
					tagClass: e.instance.props.compact ? BDFDB.disCN.messagebottagcompact : BDFDB.disCN.messagebottagcozy,
					useRem: true
				});
				if (this.settings.general.addUserId && !this.settings.general.userIdFirst) this.injectIdTag(e.instance.props.decorations[index], author, "chat", {
					tagClass: e.instance.props.compact ? BDFDB.disCN.messagebottagcompact : BDFDB.disCN.messagebottagcozy,
					useRem: true
				});
			}

			processVoiceUser (e) {
				if (e.instance.props.user && this.settings.places.voiceList) {
					let content = BDFDB.ReactUtils.findChild(e.returnvalue, {props: [["className", BDFDB.disCN.voicecontent]]});
					if (content) this.injectRoleTag(content.props.children, e.instance.props.user, "voice", 3);
				}
			}

			injectRoleTag (children, user, type, insertIndex, config = {}) {
				if (!BDFDB.ArrayUtils.is(children) || !user) return;
				let guild = BDFDB.LibraryStores.GuildStore.getGuild(BDFDB.LibraryStores.SelectedGuildStore.getGuildId());
				if (!guild || user.bot && this.settings.general.disableForBots) return;
				let member = BDFDB.LibraryStores.GuildMemberStore.getMember(guild.id, user.id);
				let role = member && BDFDB.LibraryStores.GuildRoleStore.getRole(guild.id, member.highestRoleId);
				if (this.settings.general.showOwnerRole && user.id == guild.ownerId) role = Object.assign({}, role, {name: BDFDB.LanguageUtils.LanguageStrings.GUILD_OWNER, ownerRole: true});
				if (role && !role.colorString && !this.settings.general.includeColorless && !role.ownerRole) {
					for (let sortedRole of BDFDB.ArrayUtils.keySort(member.roles.map(roleId => BDFDB.LibraryStores.GuildRoleStore.getRole(guild.id, roleId)), "position").reverse()) if (sortedRole.colorString) {
						role = sortedRole;
						break;
					}
				}
				if (role && (role.colorString || role.ownerRole || this.settings.general.includeColorless)) {
					if (insertIndex == -1) children.push(this.createTag(role, type, config));
					else children.splice(insertIndex, 0, this.createTag(role, type, config));
				}
			}

			injectIdTag (children, user, type, config = {}) {
				if (!BDFDB.ArrayUtils.is(children) || !user) return;
				children.push(this.createTag({
					name: user.id
				}, type, config));
			}
			
			createTag (role, type, config = {}) {
				if (this.settings.general.useOtherStyle) {
					let tagColor = BDFDB.ColorUtils.convert(role.colorString || BDFDB.DiscordConstants.Colors.PRIMARY_500, "RGB")
					let isBright = role.colorString && BDFDB.ColorUtils.isBright(tagColor);
					tagColor = isBright ? (this.settings.general.useBlackFont ? tagColor : BDFDB.ColorUtils.change(tagColor, -0.3)) : tagColor;
					return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.BotTag, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._toproleseverywheretag, BDFDB.disCN[`_toproleseverywhere${type}tag`], BDFDB.disCN._toproleseverywherebadgestyle, config.tagClass),
						useRemSizes: config.useRem,
						invertColor: config.inverted,
						style: {
							backgroundColor: tagColor,
							color: isBright && this.settings.general.useBlackFont ? "black" : null
						},
						tag: role.name,
						onContextMenu: role.id ? event => this.openRoleContextMenu(event, role) : null
					});
				}
				else return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MemberRole, {
					className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._toproleseverywheretag, BDFDB.disCN[`_toproleseverywhere${type}tag`], BDFDB.disCN._toproleseverywhererolestyle),
					role: role,
					onContextMenu: role.id ? event => this.openRoleContextMenu(event, role) : null
				});
			}
			
			openRoleContextMenu (event, role) {
				BDFDB.LibraryModules.ContextMenuUtils.openContextMenu(event, e => BDFDB.ReactUtils.createElement(BDFDB.ModuleUtils.findByName("DeveloperContextMenu"), Object.assign({}, e, {id: role.id})));
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
