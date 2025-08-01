/**
 * @name CustomStatusPresets
 * @author DevilBro
 * @authorId 278543574059057154
 * @version 1.3.2
 * @description Allows you to save Custom Statuses as Quick Select and select them by right-clicking the Status Bubble
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://mwittrien.github.io/
 * @source https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/CustomStatusPresets/
 * @updateUrl https://mwittrien.github.io/BetterDiscordAddons/Plugins/CustomStatusPresets/CustomStatusPresets.plugin.js
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
		var _this;
		var presets = {};
		
		const ClearAfterValues = {
			HOURS_1: 3600000,
			HOURS_4: 14400000,
			MINUTES_30: 1800000,
			DONT_CLEAR: "DONT_CLEAR",
			TODAY: "TODAY"
		};
		
		const CustomStatusInputComponent = class CustomStatusInput extends BdApi.React.Component {
			render() {
				return BDFDB.ReactUtils.createElement("div", {
					className: BDFDB.disCN.emojiinputcontainer,
					children: [
						BDFDB.ReactUtils.createElement("div", {
							key: "EMOJIINPUT",
							className: BDFDB.disCN.emojiinputbuttoncontainer,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.EmojiPickerButton, {
								emoji: this.props.emoji,
								onSelect: value => {
									this.props.emoji = value;
									this.props.onChange(this.props);
									BDFDB.ReactUtils.forceUpdate(this);
								}
							}, true)
						}),
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
							key: "TEXTINPUT",
							inputClassName: BDFDB.disCN.emojiinput,
							maxLength: 128,
							value: this.props.text,
							placeholder: this.props.text,
							onChange: value => {
								this.props.text = value;
								this.props.onChange(this.props);
								BDFDB.ReactUtils.forceUpdate(this);
							}
						}),
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
							size: BDFDB.LibraryComponents.Button.Sizes.NONE,
							look: BDFDB.LibraryComponents.Button.Looks.BLANK,
							className: BDFDB.disCN.emojiinputclearbutton,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
								className: BDFDB.disCN.emojiinputclearicon,
								name: BDFDB.LibraryComponents.SvgIcon.Names.CLOSE_CIRCLE
							}),
							onClick: (e, instance) => {
								this.props.text = "";
								delete this.props.emoji;
								this.props.onChange(this.props);
								BDFDB.ReactUtils.forceUpdate(this);
							}
						})
					]
				});
			}
		};
		
		const SortableListComponent = class SortableList extends BdApi.React.Component {
			createDragPreview(div, event) {
				if (!Node.prototype.isPrototypeOf(div)) return;
				let dragPreview = div.cloneNode(true);
				BDFDB.DOMUtils.addClass(dragPreview, BDFDB.disCN._customstatuspresetsdragpreview);
				BDFDB.DOMUtils.hide(dragPreview);
				dragPreview.style.setProperty("pointer-events", "none", "important");
				dragPreview.style.setProperty("left", event.clientX - 25 + "px", "important");
				dragPreview.style.setProperty("top", event.clientY - 25 + "px", "important");
				document.querySelector(BDFDB.dotCN.appmount).appendChild(dragPreview);
				this.props.dragPreview = dragPreview;
			}
			updateDragPreview(event) {
				if (!Node.prototype.isPrototypeOf(this.props.dragPreview)) return;
				BDFDB.DOMUtils.show(this.props.dragPreview);
				this.props.dragPreview.style.setProperty("left", event.clientX - 25 + "px", "important");
				this.props.dragPreview.style.setProperty("top", event.clientY - 25 + "px", "important");
			}
			render() {
				return !Object.keys(this.props.entries).length ? BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextElement, {
					children: "You haven't added any Custom Status Presets. You can add some via the Custom Status Modal, where you usually configure your Custom Status."
				}) : Object.keys(BDFDB.ObjectUtils.sort(this.props.entries, this.props.sortKey)).map(id => [
					this.props.hovered == id && BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN._customstatuspresetssortdivider
					}),
					this.props.dragged != id && BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN._customstatuspresetssortablecard,
						cardId: id,
						onMouseDown: event => {
							event = event.nativeEvent || event;
							let target = BDFDB.DOMUtils.containsClass(event.target, BDFDB.disCN.hovercard) ? event.target.parentElement : event.target;
							if (!BDFDB.DOMUtils.containsClass(target, BDFDB.disCN._customstatuspresetssortablecard)) return;
							let mouseMove = event2 => {
								if (Math.sqrt((event.pageX - event2.pageX)**2) > 20 || Math.sqrt((event.pageY - event2.pageY)**2) > 20) {
									BDFDB.ListenerUtils.stopEvent(event);
									this.createDragPreview(target, event2);
									this.props.dragged = id;
									BDFDB.ReactUtils.forceUpdate(this);
									document.removeEventListener("mousemove", mouseMove);
									document.removeEventListener("mouseup", mouseUp);
									let dragging = event3 => {
										this.updateDragPreview(event3);
										let hoveredId = BDFDB.DOMUtils.getParent(BDFDB.dotCN._customstatuspresetssortablecard, event3.target);
										hoveredId = hoveredId && hoveredId.getAttribute("cardId");
										let update = hoveredId != this.props.hovered;
										this.props.hovered = hoveredId;
										if (update) BDFDB.ReactUtils.forceUpdate(this);
									};
									let releasing = event3 => {
										BDFDB.ListenerUtils.stopEvent(event3);
										BDFDB.DOMUtils.remove(this.props.dragPreview);
										if (this.props.hovered) {
											presets[id][this.props.sortKey] = presets[this.props.hovered][this.props.sortKey] - 0.5;
											let pos = 0, sortedPresets = BDFDB.ObjectUtils.sort(presets, this.props.sortKey);
											for (let sortId in sortedPresets) presets[sortId][this.props.sortKey] = pos++;
											this.props.entries = presets;
											BDFDB.DataUtils.save(presets, _this, "presets");
										}
										delete this.props.dragged;
										delete this.props.hovered;
										BDFDB.ReactUtils.forceUpdate(this);
										document.removeEventListener("mousemove", dragging);
										document.removeEventListener("mouseup", releasing);
									};
									document.addEventListener("mousemove", dragging);
									document.addEventListener("mouseup", releasing);
								}
							};
							let mouseUp = _ => {
								document.removeEventListener("mousemove", mouseMove);
								document.removeEventListener("mouseup", mouseUp);
							};
							document.addEventListener("mousemove", mouseMove);
							document.addEventListener("mouseup", mouseUp);
						},
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Card, {
							horizontal: true,
							children: [
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
									wrap: true,
									children: BDFDB.ReactUtils.createElement(CustomStatusInputComponent, {
										text: presets[id].text,
										emoji: presets[id].emojiInfo,
										onChange: value => {
											presets[id].text = value.text;
											presets[id].emojiInfo = value.emoji;
											BDFDB.DataUtils.save(presets, _this, "presets");
										}
									})
								}),
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Select, {
									className: BDFDB.disCN.flexchild,
									value: ClearAfterValues[presets[id].clearAfter] || presets[id].clearAfter,
									options: Object.entries(ClearAfterValues).map(entry => ({value: entry[1], label: !entry[1] || entry[1] == ClearAfterValues.DONT_CLEAR ? BDFDB.LanguageUtils.LanguageStrings.DISPLAY_OPTION_NEVER : entry[1] == ClearAfterValues.TODAY ? BDFDB.LanguageUtils.LanguageStrings.CUSTOM_STATUS_TODAY : BDFDB.LanguageUtils.LanguageStringsFormat("CUSTOM_STATUS_HOURS", entry[1]/3600000)})),
									onChange: value => {
										presets[id].clearAfter = value;
										BDFDB.DataUtils.save(presets, _this, "presets");
									}
								}),
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
									children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Switch, {
										value: !presets[id].disabled,
										onChange: value => {
											presets[id].disabled = !value;
											BDFDB.DataUtils.save(presets, _this, "presets");
										}
									})
								})
							],
							onRemove: _ => {
								delete presets[id];
								BDFDB.DataUtils.save(presets, _this, "presets");
								this.props.entries = presets;
								BDFDB.ReactUtils.forceUpdate(this);
							}
						})
					})
				]).flat().filter(n => n);
			}
		};
		
		return class CustomStatusPresets extends Plugin {
			onLoad () {
				_this = this;
				
				this.modulePatches = {
					before: [
						"ModalRoot"
					],
					after: [
						"CustomStatusModal",
						"CustomStatusModalWithPreview",
						"UserPopoutStatusBubble",
						"UserPopoutStatusBubbleEmpty"
					]
				};
				
				this.css = `
					${BDFDB.dotCN.customstatusmodal} {
						min-width: 440px;
						width: unset;
					}
					${BDFDB.dotCN.animationcontainerscale + BDFDB.dotCN.animationcontainerrender} {
						transform: unset !important;
					}
					${BDFDB.dotCN.menu} #account-edit-custom-status ${BDFDB.dotCN.menuhintcontainer} {
						margin-right: 8px;
						margin-left: 0;
						order: -1;
					}
					#status-picker${BDFDB.dotCN.menu} #status-picker-custom-status${BDFDB.dotCN.menulabelcontainer} {
						padding-left: 0;
					}
					#status-picker${BDFDB.dotCN.menu} #status-picker-custom-status ${BDFDB.dotCN.menulabel} {
						overflow: visible;
						white-space: unset;
					}
					${BDFDB.dotCN._customstatuspresetscustomstatusitem} {
						display: flex;
						align-items: center;
					}
					${BDFDB.dotCNS._customstatuspresetscustomstatusitem + BDFDB.dotCN.menuiconcontainer} {
						margin-left: 0;
						margin-right: 6px;
					}
					${BDFDB.dotCN._customstatuspresetsdeletebutton} {
						display: flex;
						margin-right: 6px;
					}
					${BDFDB.dotCN._customstatuspresetsstatus} {
						margin-right: 6px;
						flex: 0 0 auto;
					}
					${BDFDB.dotCN._customstatuspresetssortdivider} {
						background: ${BDFDB.DiscordConstants.Colors.GREEN};
						height: 2px;
						margin: 0 26px 8px 0;
					}
					${BDFDB.dotCN._customstatuspresetsdragpreview} {
						pointer-events: none !important;
						position: absolute !important;
						opacity: 0.5 !important;
						z-index: 10000 !important;
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
				
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsPanelList, {
					title: "Custom Status Presets:",
					dividerTop: true,
					children: BDFDB.ReactUtils.createElement(SortableListComponent, {
						entries: presets,
						sortKey: "pos"
					})
				}));
				
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
			}
			
			forceUpdateAll () {
				presets = BDFDB.DataUtils.load(this, "presets");
				for (let i in presets) if (presets[i].text && presets[i].text.text) presets[i] = Object.assign({}, presets[i], presets[i].text);
				BDFDB.DataUtils.save(presets, this, "presets");
				
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
			
			processUserPopoutStatusBubble (e) {
				this.processUserPopoutStatusBubbleEmpty(Object.assign({}, e, {returnvalue: BDFDB.ReactUtils.findChild(e.returnvalue, {props: [["className", BDFDB.disCN.userpopoutstatusbubbleeditable]]})}));
			}
			
			processUserPopoutStatusBubbleEmpty (e) {
				if (e.instance.returnvalue) return;
				let bubble = BDFDB.ReactUtils.findChild(e.returnvalue, {props: [["className", BDFDB.disCN.userpopoutstatusbubbleeditable]]}) || e.returnvalue;
				if (!bubble) return;
				let onContextMenu = bubble.props.onContextMenu;
				bubble.props.onContextMenu = BDFDB.TimeUtils.suppress(event => {
					onContextMenu && onContextMenu(event);
					let enabledPresets = BDFDB.ObjectUtils.filter(presets, id => !presets[id].disabled, true);
					BDFDB.ContextMenuUtils.open(this, event, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
						children: !Object.keys(enabledPresets).length ? BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
								id: BDFDB.ContextMenuUtils.createItemId(this.name, "no-presets"),
								label: this.labels.contextmenu_no_presets,
								disabled: true
							}) : Object.keys(BDFDB.ObjectUtils.sort(enabledPresets, "pos")).map(id => {
							let imageUrl = presets[id].emojiInfo && (presets[id].emojiInfo.id ? BDFDB.LibraryModules.IconUtils.getEmojiURL(presets[id].emojiInfo) : BDFDB.LibraryModules.EmojiStateUtils.getURL(presets[id].emojiInfo.name));
							let clearAfter = ClearAfterValues[presets[id].clearAfter] || presets[id].clearAfter;
							return BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
								id: BDFDB.ContextMenuUtils.createItemId(this.name, "custom-status-preset", id),
								label: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._customstatuspresetscustomstatusitem,
									children: [
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
											text: BDFDB.LanguageUtils.LanguageStrings.CUSTOM_STATUS_CLEAR_CUSTOM_STATUS,
											tooltipConfig: {
												zIndex: 2001
											},
											children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
												className: BDFDB.disCN._customstatuspresetsdeletebutton,
												onClick: _ => {
													delete presets[id];
													let pos = 0, sortedPresets = BDFDB.ObjectUtils.sort(presets, "pos");
													for (let id in sortedPresets) presets[id].pos = pos++;
													BDFDB.DataUtils.save(presets, this, "presets");
												},
												children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
													className: BDFDB.disCN._customstatuspresetsdeleteicon,
													name: BDFDB.LibraryComponents.SvgIcon.Names.CLOSE_CIRCLE,
													width: 14,
													height: 14
												})
											})
										}),
										!imageUrl ? null : BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.menuiconcontainer,
											children: BDFDB.ReactUtils.createElement("img", {
												className: BDFDB.disCN.menuicon,
												src: imageUrl,
												alt: ""
											})
										}),
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextScroller, {
											children: presets[id].text
										})
									]
								}),
								hint: !clearAfter || clearAfter == ClearAfterValues.DONT_CLEAR ? BDFDB.LanguageUtils.LanguageStrings.DISPLAY_OPTION_NEVER : clearAfter == ClearAfterValues.TODAY ? BDFDB.LanguageUtils.LanguageStrings.CUSTOM_STATUS_TODAY : BDFDB.LanguageUtils.LanguageStringsFormat("CUSTOM_STATUS_HOURS", clearAfter/3600000),
								action: _ => {
									if (!presets[id]) return;
									let expiresAt = clearAfter && clearAfter != ClearAfterValues.DONT_CLEAR ? clearAfter : null;
									if (clearAfter === ClearAfterValues.TODAY) {
										let date = new Date;
										expiresAt = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() - date.getTime();
									}
									if (presets[id].status) BDFDB.DiscordUtils.setSetting("status", "status", presets[id].status);
									BDFDB.DiscordUtils.setSetting("status", "customStatus", {
										text: presets[id].text && presets[id].text.length > 0 ? presets[id].text : "",
										expiresAtMs: expiresAt ? BDFDB.DiscordObjects.Timestamp().add(expiresAt, "ms").toDate().getTime().toString() : "0",
										emojiId: presets[id].emojiInfo ? presets[id].emojiInfo.id : "0",
										emojiName: presets[id].emojiInfo ? presets[id].emojiInfo.name : ""
									});
								}
							});
						})
					}));
				}, "", this);
			}
			
			processModalRoot (e) {
				if (!BDFDB.ReactUtils.findChild(e.instance, {props: [["className", BDFDB.disCN.customstatusmodalprofilepreview]]})) return;
				e.instance.props.size = BDFDB.LibraryComponents.ModalComponents.ModalSize.MEDIUM;
			}
			
			processCustomStatusModalWithPreview (e) {
				let footer = BDFDB.ReactUtils.findChild(e.returnvalue, {name: "ModalFooter"});
				if (!footer) return;
				footer.props.children.props.children.splice(1, 0, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
					color: BDFDB.disCN.modalcancelbutton,
					look: BDFDB.LibraryComponents.Button.Looks.LINK,
					style: {marginLeft: "auto"},
					onClick: event => {
						BDFDB.PatchUtils.patch(this, BDFDB.LibraryModules.CustomStatusStore, "update", {instead: e2 => {
							let id = BDFDB.NumberUtils.generateId(Object.keys(presets));
							presets[id] = {
								pos: Object.keys(presets).length,
								clearAfter: e2.methodArguments[0].clearAfter,
								emojiInfo: e2.methodArguments[0].emojiInfo,
								text: e2.methodArguments[0].text
							};
							BDFDB.DataUtils.save(presets, this, "presets");
							if (!event.shiftKey) e.instance.props.onClose();
							else id = BDFDB.NumberUtils.generateId(Object.keys(presets));
						}}, {once: true});
						footer.props.children.props.children[2].props.onClick();
					},
					children: this.labels.modal_savepreset
				}));
			}
			
			processCustomStatusModal (e) {
				let footer = BDFDB.ReactUtils.findChild(e.returnvalue, {name: "ModalFooter"});
				if (!footer) return;
				footer.props.children.splice(1, 0, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
					color: BDFDB.disCN.modalcancelbutton,
					look: BDFDB.LibraryComponents.Button.Looks.LINK,
					onClick: event => {
						let id = BDFDB.NumberUtils.generateId(Object.keys(presets));
						presets[id] = Object.assign({pos: Object.keys(presets).length}, BDFDB.ObjectUtils.extract(e.instance.state, "clearAfter", "emojiInfo", "status", "text"));
						BDFDB.DataUtils.save(presets, this, "presets");
						if (!event.shiftKey) e.instance.props.onClose();
						else id = BDFDB.NumberUtils.generateId(Object.keys(presets));
					},
					children: this.labels.modal_savepreset
				}));
			}

			setLabelsByLanguage () {
				switch (BDFDB.LanguageUtils.getLanguage().id) {
					case "bg":		// Bulgarian
						return {
							contextmenu_no_presets:					"Няма запазени бързи избори",
							modal_savepreset:					"Запазване като бърз избор"
						};
					case "cs":		// Czech
						return {
							contextmenu_no_presets:					"Nebyly uloženy žádné rychlé volby",
							modal_savepreset:					"Uložit jako Rychlý výběr"
						};
					case "da":		// Danish
						return {
							contextmenu_no_presets:					"Ingen hurtige valg er gemt",
							modal_savepreset:					"Gem som hurtigvalg"
						};
					case "de":		// German
						return {
							contextmenu_no_presets:					"Keine Schnellauswahl gespeichert",
							modal_savepreset:					"Als Schnellauswahl speichern"
						};
					case "el":		// Greek
						return {
							contextmenu_no_presets:					"Δεν έχουν αποθηκευτεί Γρήγορες Επιλογές",
							modal_savepreset:					"Αποθήκευση ως Γρήγορη επιλογή"
						};
					case "es":		// Spanish
						return {
							contextmenu_no_presets:					"No se han guardado selecciones rápidas",
							modal_savepreset:					"Guardar como selección rápida"
						};
					case "es-419":		// Spanish (Latin America)
						return {
							contextmenu_no_presets:					"No se han guardado selecciones rápidas",
							modal_savepreset:					"Guardar como selección rápida"
						};
					case "fi":		// Finnish
						return {
							contextmenu_no_presets:					"Pikavalintoja ei ole tallennettu",
							modal_savepreset:					"Tallenna pikavalintana"
						};
					case "fr":		// French
						return {
							contextmenu_no_presets:					"Aucune sélection rapide enregistrée",
							modal_savepreset:					"Enregistrer en tant que sélection rapide"
						};
					case "hi":		// Hindi
						return {
							contextmenu_no_presets:					"कोई त्वरित चयन सहेजा नहीं गया",
							modal_savepreset:					"त्वरित चयन के रूप में सहेजें"
						};
					case "hr":		// Croatian
						return {
							contextmenu_no_presets:					"Nema spremljenih brzih odabira",
							modal_savepreset:					"Spremi kao brzi odabir"
						};
					case "hu":		// Hungarian
						return {
							contextmenu_no_presets:					"Nincs mentett gyorskiválasztás",
							modal_savepreset:					"Mentés gyorskiválasztásként"
						};
					case "it":		// Italian
						return {
							contextmenu_no_presets:					"Nessuna selezione rapida salvata",
							modal_savepreset:					"Salva come selezione rapida"
						};
					case "ja":		// Japanese
						return {
							contextmenu_no_presets:					"クイック選択は保存されませんでした",
							modal_savepreset:					"クイック選択として保存"
						};
					case "ko":		// Korean
						return {
							contextmenu_no_presets:					"빠른 선택이 저장되지 않았습니다.",
							modal_savepreset:					"빠른 선택으로 저장"
						};
					case "lt":		// Lithuanian
						return {
							contextmenu_no_presets:					"Greitųjų pasirinkimų neišsaugota",
							modal_savepreset:					"Išsaugoti kaip greitąjį pasirinkimą"
						};
					case "nl":		// Dutch
						return {
							contextmenu_no_presets:					"Geen snelle selecties opgeslagen",
							modal_savepreset:					"Opslaan als Snelselectie"
						};
					case "no":		// Norwegian
						return {
							contextmenu_no_presets:					"Ingen hurtigvalg lagret",
							modal_savepreset:					"Lagre som hurtigvalg"
						};
					case "pl":		// Polish
						return {
							contextmenu_no_presets:					"Nie zapisano żadnych szybkich wyborów",
							modal_savepreset:					"Zapisz jako Szybki wybór"
						};
					case "pt-BR":		// Portuguese (Brazil)
						return {
							contextmenu_no_presets:					"Nenhuma seleção rápida salva",
							modal_savepreset:					"Salvar como seleção rápida"
						};
					case "ro":		// Romanian
						return {
							contextmenu_no_presets:					"Nicio selecție rapidă salvată",
							modal_savepreset:					"Salvați ca Selectare rapidă"
						};
					case "ru":		// Russian
						return {
							contextmenu_no_presets:					"Быстрый выбор не сохранен.",
							modal_savepreset:					"Сохранить как быстрый выбор"
						};
					case "sv":		// Swedish
						return {
							contextmenu_no_presets:					"Inga snabbval sparade",
							modal_savepreset:					"Spara som snabbval"
						};
					case "th":		// Thai
						return {
							contextmenu_no_presets:					"ไม่มีการบันทึกการเลือกด่วน",
							modal_savepreset:					"บันทึกเป็นการเลือกด่วน"
						};
					case "tr":		// Turkish
						return {
							contextmenu_no_presets:					"Hiçbir Hızlı Seçim kaydedilmedi",
							modal_savepreset:					"Hızlı Seçim olarak kaydet"
						};
					case "uk":		// Ukrainian
						return {
							contextmenu_no_presets:					"Немає збережених пунктів швидкого вибору",
							modal_savepreset:					"Зберегти як швидкий вибір"
						};
					case "vi":		// Vietnamese
						return {
							contextmenu_no_presets:					"Không có lựa chọn nhanh nào được lưu",
							modal_savepreset:					"Lưu dưới dạng Chọn nhanh"
						};
					case "zh-CN":		// Chinese (China)
						return {
							contextmenu_no_presets:					"未保存快速选择",
							modal_savepreset:					"另存为快速选择"
						};
					case "zh-TW":		// Chinese (Taiwan)
						return {
							contextmenu_no_presets:					"未儲存快速選擇",
							modal_savepreset:					"另存為快速選擇"
						};
					default:		// English
						return {
							contextmenu_no_presets:					"No Quick Selects saved",
							modal_savepreset:					"Save as Quick Select"
						};
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
