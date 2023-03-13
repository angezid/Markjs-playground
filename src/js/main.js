
'use strict';

let version = '1.0.0',
	currentTabId = '',
	time = 0,
	matchCount = 0,
	currentIndex = 0,
	currentType = '',
	currentSection = '',
	markElementSelector = '',
	markElement = '',
	optionPad = '',
	dFlagSupport = true,
	isScrolled = false,
	canBeNested = false,
	flagEveryElement = false,
	jsonEditor = null,
	noMatchTerms = [],
	marks = $(),
	startElements = $(),
	previousButton = $(`.previous`),
	nextButton = $(`.next`);

const currentLibrary = { old : false, jquery : false };

const types = {
	string_ : {
		options : [ 'element', 'className', 'exclude', 'separateWordSearch', 'accuracy', 'diacritics', 'synonyms', 'iframes', 'iframesTimeout', 'acrossElements', 'caseSensitive', 'ignoreJoiners', 'ignorePunctuation', 'wildcards', 'blockElementsBoundary', 'combinePatterns', 'cacheTextNodes', 'wrapAllRanges', 'shadowDOM', 'debug' ],
		editors : { 'queryString' : null, 'selectors' : null, 'testString' : null, 'exclude' : null, 'synonyms' : null, 'ignorePunctuation' : null, 'accuracyObject' : null, 'blockElements' : null, 'shadowStyle' : null },
		queryEditor : 'queryString',
		testEditorMode : 'text',
		customCodeEditor : null,
		isDirty : false
	},

	array : {
		options : [ 'element', 'className', 'exclude', 'separateWordSearch', 'accuracy', 'diacritics', 'synonyms', 'iframes', 'iframesTimeout', 'acrossElements', 'caseSensitive', 'ignoreJoiners', 'ignorePunctuation', 'wildcards', 'blockElementsBoundary', 'combinePatterns', 'cacheTextNodes', 'wrapAllRanges', 'shadowDOM', 'debug' ],
		editors : { 'queryArray' : null, 'selectors' : null, 'testString' : null, 'exclude' : null, 'synonyms' : null, 'ignorePunctuation' : null, 'accuracyObject' : null, 'blockElements' : null, 'shadowStyle' : null },
		queryEditor : 'queryArray',
		testEditorMode : 'text',
		customCodeEditor : null,
		isDirty : false
	},

	regexp : {
		options : [ 'element', 'className', 'exclude', 'iframes', 'iframesTimeout', 'acrossElements', 'ignoreGroups', 'separateGroups', 'blockElementsBoundary', 'wrapAllRanges', 'shadowDOM', 'debug' ],
		editors : { 'queryRegExp' : null, 'selectors' : null, 'testString' : null, 'exclude' : null, 'blockElements' : null, 'shadowStyle' : null },
		queryEditor : 'queryRegExp',
		testEditorMode : 'text',
		customCodeEditor : null,
		isDirty : false
	},

	ranges : {
		options : [ 'element', 'className', 'exclude', 'iframes', 'iframesTimeout', 'wrapAllRanges', 'shadowDOM', 'debug' ],
		editors : { 'queryRanges' : null, 'selectors' : null, 'testString' : null, 'exclude' : null, 'shadowStyle' : null },
		queryEditor : 'queryRanges',
		testEditorMode : 'text',
		customCodeEditor : null,
		isDirty : false
	}
};

const newOptions = [ 'blockElementsBoundary', 'combinePatterns', 'cacheTextNodes', 'wrapAllRanges', 'shadowDOM' ];

const defaultOptions = {
	element : { value : 'mark', type : 'text' },
	className : { value : '', type : 'text' },
	exclude : { value : [], type : 'editor' },
	separateWordSearch : { value : true, type : 'checkbox' },
	diacritics : { value : true, type : 'checkbox' },
	accuracy : { value : 'partially', type : 'select' },
	synonyms : { value : {}, type : 'editor' },
	iframes : { value : false, type : 'checkbox' },
	iframesTimeout : { value : 5000, type : 'number' },
	acrossElements : { value : false, type : 'checkbox' },
	caseSensitive : { value : false, type : 'checkbox' },
	ignoreJoiners : { value : false, type : 'checkbox' },
	ignorePunctuation : { value : [], type : 'editor' },
	wildcards : { value : 'disabled', type : 'select' },
	ignoreGroups : { value : 0, type : 'number' },
	combinePatterns : { value : false, type : 'checkbox' },    //combinePatterns default value is actually number - 10
	cacheTextNodes : { value : false, type : 'checkbox' },
	wrapAllRanges : { value : false, type : 'checkbox' },
	separateGroups : { value : false, type : 'checkbox' },
	blockElementsBoundary : { value : false, type : 'checkbox' },
	shadowDOM : { value : false, type : 'checkbox' },
	debug : { value : false, type : 'checkbox' },
	log : { value : false, type : 'checkbox' },
};

$(document).ready(function() {
	let t0 = performance.now();
	
	detectLibrary();

	try { new RegExp('\\w', 'd'); } catch (e) { dFlagSupport = false; }

	registerEvents();
	tab.selectTab();
	tab.initTab();
	settings.setCheckboxes();
	tab.setDirty(false);
	tab.buildExampleSelector(`header select#examples`, examples);

	console.log('total time - ' + (performance.now() - t0));
});

const code = {
	// code.setText(text);
	setText : function(text) {
		tab.setTextMode(text);
	},

	// code.setHtml(iframes);
	setHtml : function(html) {
		tab.setHtmlMode(html, false);
		tab.setTextMode(null);
	},

	// code.setListener('keyup', runCode);
	setListener : function(event, fn) {
		const elem = document.querySelector(tab.getSearchEditorInfo().selector);
		elem.removeEventListener(event, fn);
		elem.addEventListener(event, fn);
	},

	setSelectors : function(selectors, all = false) {
		const info = tab.getSelectorsEditorInfo();
		if (info.editor) {
			info.editor.updateCode(selectors);
			$(info.all).prop('checked', all)
		}
	},
};

const tab = {

	initTab : function() {
		const saved = this.setLoadButton();

		if ( !this.isInitialize()) {
			this.initializeEditors();

			if (settings.loadDefault || !saved) {
				importer.resetOptions();

				this.loadDefaultSearchParameter();
				this.loadDefaultHtml();
				runCode(true);

			} else {
				importer.loadTab();
			}
		}

		this.setVisibility();
	},

	selectTab : function(type) {
		if ( !type) {
			type = settings.loadValue('tabType');
			if ( !type) type = 'string_';
		}

		$('body.playground>header .mark-type li').removeClass('selected');
		$('body.playground>header .mark-type li[data-type=' + type + ']').addClass('selected');

		settings.saveValue('tabType', type);
		currentType = type;
		currentSection = `.playground section.${currentType}`;
		optionPad = `${currentSection}>.right-column`;

		if (currentType === 'array') {
			this.buildSelector(`${currentSection} .queryArray select`, wordArrays);
		}

		codeBuilder.initCodeSnippet();
		this.clear();

		settings.load();

		currentTabId = `${settings.library}_section_${currentType}`;

		$('.file-form .file-name').val(getFileName());
		$('header .save').toggleClass('dirty', types[currentType].isDirty);

		previousButton = $(`${currentSection} .testString .previous`);
		nextButton = $(`${currentSection} .testString .next`);
		previousButton.css('opacity', 0.5);
		nextButton.css('opacity', 0.5);

		isScrolled = false;
	},

	setVisibility : function() {
		$(`${currentSection} .dependable`).addClass('hide');

		if (currentLibrary.old) {
			$(`${currentSection} .advanced`).addClass('hide');
			$(`${currentSection} .standard`).removeClass('hide');

		} else {
			$(`${currentSection} .standard`).addClass('hide');
			$(`${currentSection} .advanced:not(.dependable)`).removeClass('hide');
		}

		$('.switch-library input').prop('checked', !currentLibrary.old);
		$('.switch-library label').text((currentLibrary.old ? 'standard' : 'advanced') + ' library' + (currentLibrary.jquery ? ' (jquery)' : ''));
		$('button.open-setting-form').css('color', currentLibrary.old ? '#000' : '#f80');

		setIframesTimeout($(`${optionPad} .iframes input`)[0]);

		$('body.playground>main>article>section').addClass('hide');
		$(currentSection).removeClass('hide');
		$('.internal-code').addClass('hide');

		if ( !currentLibrary.old) {
			setShadowDOMStyle($(`${optionPad} .shadowDOM>input`)[0]);
		}

		toggleTestButton($(`.setting-form .show-test-btn>input`)[0]);

		switch (currentType) {
			case 'string_' :
				setAccuracy($(`${optionPad} .accuracy>select`)[0]);

				if ( !currentLibrary.old) {
					setAcrossElementsDependable($(`${optionPad} .acrossElements input`)[0]);
					setCacheAndCombine($(`${optionPad} .separateWordSearch input`)[0]);
				}
				break;

			case 'array' :
				setAccuracy($(`${optionPad} .accuracy>select`)[0]);

				if ( !currentLibrary.old) {
					setAcrossElementsDependable($(`${optionPad} .acrossElements input`)[0]);
					setCombineNumber($(`${optionPad} .combinePatterns input`)[0]);
				}
				break;

			case 'regexp' :
				if ( !currentLibrary.old) {
					setBlockElementsBoundary($(`${optionPad} .acrossElements input`)[0]);
					setSeparateGroupsDependable($(`${optionPad} .separateGroups input`)[0]);
				}
				break;

			default : break;
		}
	},

	buildExampleSelector : function(selector, obj) {
		let options = '<option value="">Examples</option>';

		for (const key in obj) {
			if (key !== 'name') {
				let title = key.replace(/^([a-z])/, (m, gr1) => gr1.toUpperCase()).replace(/([a-z])([A-Z])/g, (m, gr1, gr2) => gr1 + ' ' + gr2);
				title = title.replace(/( [A-Z])([a-z]+)/g, (m, gr1, gr2) => gr1.toLowerCase() + gr2);
				options += `<option value="${key}">${title}</option>`;
			}
		}
		$(selector).html(options);
	},

	buildSelector : function(selector, obj) {
		let options = '';

		for (const key in obj) {
			if (key !== 'name') {
				const value = key.startsWith('default') ? `['${obj[key].toString().split(',').join("', '")}']` : `${obj.name}.${key}`;
				options += `<option value="${value}">${obj.name}.${key}</option>`;
			}
		}
		$(selector).html(options);
	},

	switchElements : function(elem, selector, negate) {
		const div = $(`${optionPad} ${selector}`),
			checked = $(elem).prop('checked');

		if (negate) {
			if (checked) div.addClass('hide');
			else div.removeClass('hide');

		} else {
			if (checked) div.removeClass('hide');
			else div.addClass('hide');
		}
	},

	loadDefaultHtml : function(force) {
		const testEditor = this.getTestEditor();

		if (force || testEditor.toString().trim() === '') {
			const elem = this.getTestElement();
			elem.innerHTML = defaultHtml;

			types[currentType].testEditorMode = 'text';
			this.highlightButton('.text');
		}
	},

	loadDefaultSearchParameter : function() {
		const info = this.getSearchEditorInfo();

		if (info.editor.toString().trim() === '') {
			let searchParameter = defaultSearchParameter[currentType];

			if (searchParameter) {
				if (currentType === 'array' || currentType === 'ranges') {
					searchParameter = JSON.stringify(searchParameter);
				}
				info.editor.updateCode(searchParameter);
			}
		}
	},

	setHtmlMode : function(content, highlight = true) {
		if (types[currentType].testEditorMode === 'html' && !content) return;

		types[currentType].testEditorMode = 'html';

		let html = content || this.getInnerHTML();

		if (html) {
			const div = this.destroyTestEditor();
			if ( !div) return;

			if (highlight) {
				highlighter.highlightRawHtml(div, html);

			} else {
				// .innerText removes/normalizes white spaces
				div.innerHTML = util.entitize(html);
			}
			this.initializeEditors();

		} else {
			this.getTestEditor().updateCode('');
		}

		this.highlightButton('.html');
	},

	setTextMode : function(content, highlight = false) {
		if (types[currentType].testEditorMode === 'text' && !content) return;

		types[currentType].testEditorMode = 'text';

		const text = content || this.getTestElement().innerText;

		if (text) {
			const div = this.destroyTestEditor();
			if ( !div) return;

			div.innerHTML = text;
			this.initializeEditors();

			if (highlight) {
				runCode();
			}

		} else {
			this.getTestEditor().updateCode('');
		}

		this.highlightButton('.text');
	},

	highlightButton : function(selector) {
		const button = $(`${currentSection} .testString ${selector}`);

		$(`${currentSection} .testString button`).removeClass('pressed');
		button.addClass('pressed');
	},

	initializeEditors : function() {
		const obj = types[currentType];

		for (const key in obj.editors) {
			if (obj.editors[key] === null) {
				if (key === 'testString') {
					obj.editors[key] = this.initTestEditor(obj.editors[key]);

				} else {
					let selector = `${currentSection} .${key} .editor`;
					obj.editors[key] = this.initEditor(obj.editors[key], selector);
				}
			}
		}
	},

	defineCustomElements : function() {
		customElements.define('shadow-dom-' + currentType, class extends HTMLElement {
			constructor() {
				super();
				const root = this.attachShadow({ mode : 'open' });
				root.innerHTML = `<link rel="stylesheet" href="css/shadow-dom.css" /><div class="editor"></div>`;
			}
		});
	},

	initTestEditor : function(editor) {
		if ( !document.querySelector('shadow-dom-' + currentType).shadowRoot) {
			this.defineCustomElements();
		}

		const elem = this.getTestElement();
		elem.addEventListener('scroll', testContainerScrolled);

		editor = CodeJar(elem, () => {}, { tab : '  ' });
		editor.onUpdate((code, event) => this.updateTestEditor(code, event));
		return editor;
	},

	getTestElement : function() {
		const root = document.querySelector('shadow-dom-' + currentType).shadowRoot;
		return root.querySelector('.editor');
	},

	initEditor : function(editor, selector) {
		editor = CodeJar(document.querySelector(selector), () => {}, { tab : '  ' });
		editor.onUpdate(code => this.onUpdateEditor(code, selector));
		return editor;
	},

	isInitialize : function() {
		const obj = types[currentType];
		for (const key in obj.editors) {
			if (obj.editors[key] !== null) return true;
		}
		return false;
	},

	// for performance reason it destroys an old editor, and replaces the old editor div element by the new one
	destroyTestEditor : function() {
		tab.setEditableAttribute(false);

		const obj = types[currentType];
		if (obj.editors.testString !== null) {
			obj.editors.testString.destroy();
			obj.editors.testString = null;
		}

		const elem = this.getTestElement();
		if (elem) {
			elem.removeEventListener('scroll', testContainerScrolled);

			let div = document.createElement('div');
			div.className = 'editor';
			elem.parentNode.replaceChild(div, elem);
			return div;
		}
		return null;
	},

	updateTestEditor : function(code, event) {
		if (event.type === 'paste' || event.type === 'drop') {
			if (types[currentType].testEditorMode === 'html') {
				this.setHtmlMode(importer.sanitizeHtml(code));
			}
		}
		this.setDirty(true);
	},

	onUpdateEditor : function(code, selector) {
		const button = $(selector).parents('div').first().find('button.clear');

		if (code.trim()) button.removeClass('hide');
		else button.addClass('hide');

		this.setDirty(true);
	},

	updateCustomCode : function(content) {
		const info = this.getCodeEditorInfo();
		info.editor.updateCode(content);

		$(info.selector).parent().attr('open', true);
		hljs.highlightElement($(info.selector)[0]);
	},

	getSelectorsEditorInfo : function() {
		const obj = types[currentType],
			checkbox = `${currentSection} .selectors .selector-all>input`,
			selector = `${currentSection} .selectors .editor`,
			editor = obj.editors['selectors'];

		return { selector, editor, all : checkbox };
	},

	getSearchEditorInfo : function() {
		const obj = types[currentType],
			selector = `${currentSection} .${obj.queryEditor} .editor`,
			editor = obj.editors[obj.queryEditor];

		return { selector, editor };
	},

	getCodeEditorInfo : function() {
		const obj = types[currentType],
			selector = `${optionPad} .customCode .editor`,
			editor = obj.customCodeEditor;

		if ( !editor) {
			types[currentType].customCodeEditor = tab.initEditor(editor, selector);
		}
		return { selector, editor : types[currentType].customCodeEditor };
	},

	getTestEditor : function() {
		const editor = types[currentType].editors.testString;
		if ( !editor) {
			types[currentType].editors.testString = tab.initTestEditor(editor);
		}
		return types[currentType].editors.testString;
	},

	getOptionEditor : function(option) {
		return types[currentType].editors[option];
	},

	clear : function(keep) {
		$('.results code').empty();
		$('.internal-code code').empty();
		if ( !keep) $('.generated-code code').empty();
		$('section .editor, header li').removeClass('error warning');
		marks = $();
		startElements = $();
	},

	setEditableAttribute : function(on) {
		const elem = this.getTestElement();
		$(elem).attr('contenteditable', on);
	},

	setLoadButton : function() {
		const value = settings.loadValue(currentTabId),
			button = $('header button.load');

		if (value) button.removeClass('inactive');
		else button.addClass('inactive');

		return value;
	},

	setDirty : function(value) {
		types[currentType].isDirty = value;
		$('header .save').toggleClass('dirty', value);
	},

	isChecked : function(option) {
		return $(`${optionPad} .${option} input`).prop('checked');
	},

	getInnerHTML : function() {
		const elem = tab.getTestElement();

		if (tab.isChecked('iframes') || tab.isChecked('shadowDOM')) {
			return this.innerHTML(elem);
		}
		return elem.innerHTML;
	},

	innerHTML : function(root) {
		const array = [],
			stack = [],
			iframe = tab.isChecked('iframes'),
			shadow = tab.isChecked('shadowDOM');

		const pushToStack = parent => {
			if (parent.hasChildNodes()) {
				for (let i = parent.childNodes.length - 1; i >= 0; i--) {
					const node = parent.childNodes[i];

					if (node.nodeType === Node.ELEMENT_NODE && !util.isVoidElement(node)) {
						stack.push({ node : null, closeTag : `</${node.nodeName.toLowerCase()}>` });
					}
					stack.push({ node : node, closeTag : null });
				}
			}
		};

		const writeElement = node => {
			array.push('<' + node.nodeName.toLowerCase());

			if (node.hasAttributes()) {
				for (let i = 0; i < node.attributes.length; i++) {
					const attr = node.attributes[i];
					array.push(` ${attr.name}="${attr.value}"`);
				}
			}
			array.push('>');
		};

		pushToStack(root);

		while (stack.length > 0) {
			const obj = stack.pop();

			if (obj.closeTag) {
				array.push(obj.closeTag);
				continue;
			}

			let node = obj.node;

			if (node.nodeType === Node.ELEMENT_NODE) {
				writeElement(node);

				if (shadow && node.shadowRoot && node.shadowRoot.mode === 'open') {
					array.push('\n#shadow-root (open)\n');
					pushToStack(node.shadowRoot);

				} else if (iframe && node.nodeName.toLowerCase() === 'iframe') {
					try {
						let body, doc = node.contentWindow.document;

						if (doc && (body = doc.querySelector('body'))) {
							pushToStack(body);
						}
					} catch (e) { }

				} else {
					pushToStack(node);
				}

			} else if (node.nodeType === Node.TEXT_NODE) {
				array.push(util.entitize(node.textContent));
			}
		}
		return array.join('');
	}
};

// also DOM 'onchange' event
function setSeparateGroupsDependable(elem) {
	tab.switchElements(elem, '.ignoreGroups', true);

	if ( !currentLibrary.old) {
		tab.switchElements(elem, '.wrapAllRanges');
	}
}

// also DOM 'onchange' event
function setAcrossElementsDependable(elem) {
	$(`${optionPad} .wrapAllRanges`).addClass('hide');

	setBlockElementsBoundary(elem);
}

function setBlockElementsBoundary(elem) {
	$(`${optionPad} .blockElementsBoundary`).addClass('hide');
	$(`${optionPad} .blockElements`).addClass('hide');

	if ( !currentLibrary.old) {
		tab.switchElements(elem, '.blockElementsBoundary');

		if (tab.isChecked('acrossElements') && !$(`${optionPad} .blockElementsBoundary`).hasClass('hide')) {
			setBlockElements($(`${optionPad} .blockElementsBoundary input`)[0]);
		}
	}
}

function markArray() {
	return currentType === 'array' || currentType === 'string_' && tab.isChecked('separateWordSearch');
}

// DOM 'onchange' event
function setBlockElements(elem) {
	tab.switchElements(elem, '.blockElements');
}

// also DOM 'onchange' event
function setCacheAndCombine(elem) {
	$(`${optionPad} .combineNumber`).addClass('hide');
	$(`${optionPad} .wrapAllRanges`).addClass('hide');

	if (currentLibrary.old) {
		$(`${optionPad} .combinePatterns`).addClass('hide');
		$(`${optionPad} .cacheTextNodes`).addClass('hide');

	} else {
		tab.switchElements(elem, '.combinePatterns');
		tab.switchElements(elem, '.cacheTextNodes');

		if ( !$(`${optionPad} .combinePatterns`).hasClass('hide')) {
			setCombineNumber($('#string_-combinePatterns')[0]);
		}
	}
}

// also DOM 'onchange' event
function setCombineNumber(elem) {
	tab.switchElements(elem, '.combineNumber');
}

// also DOM 'onchange' event
function setShadowDOMStyle(elem) {
	tab.switchElements(elem, '.shadowStyle');
}

// also DOM 'onchange' event
function setAccuracy(elem) {
	const div = $(`${optionPad} .accuracyObject`).addClass('hide'),
		exactly = $(`${optionPad} .accuracyObject .accuracy-exactly`).addClass('hide'),
		complementary = $(`${optionPad} .accuracyObject .accuracy-complementary`).addClass('hide');

	if (elem.value === 'exactly') {
		div.removeClass('hide');
		exactly.removeClass('hide');

	} else if (elem.value === 'complementary') {
		div.removeClass('hide');
		complementary.removeClass('hide');
	}
}

// also DOM 'onchange' event
function setIframesTimeout(elem) {
	tab.switchElements(elem, '.iframesTimeout');
}

// DOM 'onchange' event
function selectExample(elem) {
	const str = examples[$(elem).val()];
	if (str) {
		if (settings.showWarning && types[currentType].isDirty) {
			if ( !window.confirm("Are you sure you want to load the example and lose the changes made in the tab?")) {
				return;
			}
		}
		importer.loadJson(str);
	}
}

// DOM 'onchange' event
function selectArray(elem) {
	const info = tab.getSearchEditorInfo();
	info.editor.updateCode($(elem).val());
}

// DOM 'onclick' event
function setTextMode() {
	tab.setTextMode(null, true);
}

// DOM 'onclick' event
function setHtmlMode() {
	tab.setHtmlMode(null, true);
}

// DOM 'onclick' event
function loadDefaultHtml() {
	tab.loadDefaultHtml();
}

// DOM 'onchange' event
function toggleTestButton(elem) {
	elem.parentNode.querySelector('button').classList.toggle('hide', !$(elem).prop('checked'));
}

// DOM 'onclick' event
function save() {
	const json = Json.buildJson();

	if (json) {
		settings.saveValue(currentTabId, json);
		tab.setLoadButton();
	}
	tab.setDirty(false);
}

// DOM 'onclick' event
function load() {
	if (types[currentType].isDirty) {
		if ( !window.confirm("Are you sure you want to reload the current tab and lose the changes made in it?")) {
			return;
		}
	}
	importer.loadTab();
}

// DOM 'onclick' event
function exportJson() {
	const json = Json.buildJson(true);

	if (json) {
		jsonEditor.updateCode(json);
		$('button.import-json').attr('disabled', false);
	}
}

// DOM 'onclick' event
function importJson() {
	let str = jsonEditor.toString().trim();
	importer.loadJson(str);
}

// DOM 'onclick' event
function clearCodeEditor(elem) {
	const editor = types[currentType].customCodeEditor;
	if (editor) {
		editor.updateCode('');
	}
	$(elem).addClass('hide');

	tab.clear();
	codeBuilder.build('js-jq');
	tab.setDirty(true);
}

// DOM 'onclick' event
function clearJsonEditor() {
	jsonEditor.updateCode('');
	$('button.import-json').attr('disabled', true);
}

// DOM 'onclick' event
function clearEditor(elem) {
	const parent = elem.parentNode.parentNode,
		className = parent.className.replace(/\b(?:advanced|dependable|hide)\b/g, '').trim(),
		obj = types[currentType],
		editor = obj.editors[className];

	if (editor) {
		if (className === 'testString') {
			tab.destroyTestEditor();
			tab.initializeEditors();

		} else {
			editor.updateCode('');
		}

		tab.setDirty(true);
	}
	if (className !== obj.queryEditor && className !== 'testString') {
		$(elem).addClass('hide');
	}
}

const importer = {

	loadTab : function() {
		const str = settings.loadValue(currentTabId);
		if (str) {
			this.loadJson(str);

		} else {
			log('\nSomething is wrong with the local storage', true);
		}
	},

	loadJson : function(str) {
		if (str) {
			const json = Json.parseJson(str);
			if ( !json) {
				return;
			}

			const type = json.section['type'];

			if (type && types[type]) {
				tab.selectTab(type);
				tab.initializeEditors();
				this.setOptions(json);
				tab.setVisibility();

			} else {
				log('\nSomething is wrong with the json', true);
			}
		}
	},

	resetOptions : function() {
		const obj = types[currentType];

		obj.options.every(option => {
			const selector = `${optionPad} .${option}`,
				opt = defaultOptions[option];

			if (opt) {
				switch (opt.type) {
					case 'checkbox' :
						$(selector + ' input').prop('checked', opt.value);
						break;

					case 'text' :
					case 'number' :
						$(selector + ' input').val(opt.value);
						break;

					case 'select' :
						$(selector + ' select').val(opt.value);
						break;

					default : break;
				}
			}
			return true;
		});

		for (const key in obj.editors) {
			for (const key in obj.editors) {
				if (obj.editors[key]) obj.editors[key].updateCode('');
			}
		}

		const editor = types[currentType].customCodeEditor;
		if (editor) {
			editor.updateCode('');
			$(`${currentSection} .customCode details`).attr('open', false);
			$(`${currentSection} .customCode button.clear`).addClass('hide');
		}
	},

	setOptions : function(json) {
		const obj = types[currentType],
			across = tab.isChecked('acrossElements'),
			textMode = obj.testEditorMode === 'text';

		let editor,
			saved = json.library;

		if ( !isNullOrUndefined(saved)) {
			$('#library').prop('checked', saved === 'advanced');
			settings.changed($('#library')[0]);
		}

		this.resetOptions();

		obj.options.every(option => {
			if (currentLibrary.old && newOptions.includes(option)) return true;

			const selector = `${optionPad} .${option}`,
				opt = defaultOptions[option];

			if (opt) {
				saved = json.section[option];

				if (isNullOrUndefined(saved)) {
					saved = opt.value;
				}

				switch (opt.type) {
					case 'checkbox' :
						if (option === 'combinePatterns') {
							$(`${optionPad} .combineNumber input`).val(parseInt(saved) || 10);
							saved = !isNullOrUndefined(json.section[option]);

						} else if (option === 'shadowDOM' && saved !== true && saved !== false) {
							const editor = tab.getOptionEditor('shadowStyle');
							editor.updateCode(saved);
							saved = true;

						} else if (option === 'blockElementsBoundary' && saved !== true && saved !== false) {
							const editor = tab.getOptionEditor('blockElements');
							editor.updateCode(saved);
							saved = true;
						}
						$(selector + ' input').prop('checked', saved);
						break;

					case 'text' :
						$(selector + ' input').val(saved);
						break;

					case 'number' :
						$(selector + ' input').val(saved);
						break;

					case 'select' :
						if (option === 'accuracy' && (saved !== 'exactly' && saved !== 'complementary' && saved !== 'partially')) {
							const editor = tab.getOptionEditor('accuracyObject');
							editor.updateCode(saved);

							const value = saved.replace(/^\{\s*[^:]+:\s*['"]([^'"]+)['"].+/, '$1');
							saved = value === 'exactly' || value === 'complementary' ? value : 'partially';
						}
						$(selector + ' select').val(saved);
						break;

					default : break;
				}
			}
			return true;
		});

		for (const key in obj.editors) {
			if (key === 'accuracyObject' || key === 'blockElements' || key === 'shadowStyle') continue;
			const editor = obj.editors[key];
			saved = json.section[key];

			if (isNullOrUndefined(saved)) {
				editor.updateCode('');

			} else if (key === 'testString') {
				const mode = isNullOrUndefined(saved.mode) || saved.mode !== 'text' ? 'html' : saved.mode;
				const content = isNullOrUndefined(saved.content) ? '' : this.sanitizeHtml(saved.content);

				if (mode === 'text') {
					tab.setTextMode(content);

				} else {
					if (content === 'defaultHtml') {
						tab.loadDefaultHtml(true);

					} else {
						tab.setHtmlMode(content, false);
					}
				}

			} else {
				if (key === 'queryArray') {
					const querySelect = `${currentSection} .queryArray select`;
					$(querySelect).val(saved);

				} else if (key === 'selectors') {
					const all = json.section['selectorAll'];
					if ( !isNullOrUndefined(all)) {
						$(`${currentSection} .selectors .selector-all>input`).prop('checked', all);
					}
				}
				editor.updateCode(saved);
			}
		}

		if ( !isNullOrUndefined(saved = json.section['customCode'])) {
			tab.updateCustomCode(saved);
		}

		if (textMode) {
			tab.setTextMode(null);
		}

		tab.setDirty(false);
	},

	sanitizeHtml : function(str) {
		const doc = new DOMParser().parseFromString(str, "text/html"),
			iterator = document.createNodeIterator(doc.documentElement, NodeFilter.SHOW_ALL),
			report = {};

		let node;
		while (node = iterator.nextNode()) {
			if (/^(?:head|script|style|link|meta|#comment)$/i.test(node.nodeName)) {
				node.parentNode.removeChild(node);
				add(`removed ${node.nodeType === 1 ? 'element' : ''} '${node.nodeName.toLowerCase()}'`);
				continue;
			}

			if (node.nodeType === 1) {
				checkAttributes(node);
			}
		}

		function checkAttributes(elem) {
			for (let i = 0; i < elem.attributes.length; i++) {
				const attr = elem.attributes[i],
					name = attr.name.toLowerCase();

				if (name === 'href' || name === 'src' && elem.nodeName.toLowerCase() !== 'iframe' || name === 'srcset') {
					const val = decodeURIComponent(attr.value);

					if (/^(?!#).+/i.test(val)) {
						attr.value = '#';
						add(`replaced '${name}' attribute value by '#'`);
					}

				} else if (/\bjavascript(?::|&colon;)/i.test(attr.value)) {
					elem.removeAttribute(attr.name);
					add(`removed ${name} attribute containing 'javascript:'`);

				} else if (name === 'style') {
					if (/\burl\s*\(/i.test(attr.value)) {
						elem.removeAttribute(attr.name);
						add(`removed ${name} attribute containing 'url'`);
					}

				} else if (/^xlink:href/i.test(name)) {
					attr.value = '#';
					add(`replaced '${name}' attribute value by '#'`);

				} else if (/^on[a-z]+/i.test(name)) {    // on event attribute
					elem.removeAttribute(attr.name);
					add(`removed '${name}' attribute`);
				}
			}
		}

		function add(msg) {
			report[msg] = !report[msg] ? 1 : report[msg] + 1;
		}

		console.log(toText(report, 'Html sanitizer report:', ' Ok'));

		const html = doc.body.innerHTML;

		// restores starting white spaces if any - vital for ranges
		const spcReg = /^\s+/y;
		if (spcReg.test(str) && !/^\s+/.test(html)) {
			return str.substring(0, spcReg.lastIndex) + html;
		}

		return html;
	}
};

function setVariables() {
	matchCount = 0;
	noMatchTerms = [];
	canBeNested = !currentLibrary.old && (currentType === 'regexp' || currentType === 'ranges') && tab.isChecked('wrapAllRanges');
	flagEveryElement = currentLibrary.old || currentType !== 'ranges' && !tab.isChecked('acrossElements');

	const className = $(`${optionPad} .className input`).val().trim();
	markElement = $(`${optionPad} .element input`).val().trim().toLowerCase() || 'mark';
	markElementSelector = `${markElement}[data-markjs]${className ? '.' + className : ''}`;
}

// DOM 'onclick' event
function unmarkMethod(elem) {
	codeBuilder.build('js-jq');
}

// also DOM 'onclick' event
function runCode(reset) {
	tab.clear();

	if (reset) {
		currentIndex = 0;
	}

	const editor = types[currentType].customCodeEditor;

	if (editor && editor.toString().trim()) {
		const code = codeBuilder.build('internal');

		if (code) {
			setVariables();
			// disable contenteditable attribute for performance reason
			tab.setEditableAttribute(false);

			log('Evaluating the whole code\n');

			let options;
			try { options = new Function('"use strict"; ' + code)(); } catch (e) {
				log('Failed to evaluate the code\n' + e.message, true);
				tab.setEditableAttribute(true);
				console.error(e.message);
				console.log(e.stack);
			}

			$('.internal-code').removeClass('hide');
			$('.internal-code code').text(code);

			hljs.highlightElement($(`${optionPad} .customCode .editor`)[0]);
			hljs.highlightElement($('.internal-code code')[0]);

			const val = settings.loadValue('internal_code');
			if (val && val === 'opened') {
				$("#internal-code").attr('open', true);
			}
			// returning an object 'options' is only necessary for testing purposes
			return options;
		}

	} else {
		highlighter.highlight();
	}
}

const codeBuilder = {
	comment : '// your code before',
	defaultSnippet : `\n<<markjsCode>> // don't remove this line\n\nfunction filter() {\n  return true;\n}\n\nfunction each() {}\n\nfunction done() {}`,
	snippet : '',

	build : function(kind) {
		const jsCode = this.buildCode('js');
		if ( !jsCode) return '';

		const jqCode = this.buildCode('jq');

		$('.generated-code pre>code').text(jsCode + '\n\n' + jqCode);

		hljs.highlightElement($('.generated-code pre>code')[0]);

		$('.internal-code').addClass('hide');

		return this.buildCode(kind);
	},

	buildCode : function(kind) {
		const info = tab.getSearchEditorInfo();

		const unmark = kind === 'internal' || $('.unmark-method input').prop('checked'),
			unmarkOpt = (tab.isChecked('iframes') ? 'iframes : true,\n  ' : '') + (tab.isChecked('shadowDOM') ? 'shadowDOM : true,\n  ' : ''),
			optionCode = this.buildOptions(kind, unmark);

		let code = '',
			str = '',
			text;

		if (kind === 'jq') {
			code = `$('selector')` + (unmark ? `.unmark({\n  ${unmarkOpt}done : () => {\n    $('selector')` : '');

		} else if (kind === 'js') {
			code = `const instance = new Mark(document.querySelector('selector'));\ninstance` + (unmark ? `.unmark({\n  ${unmarkOpt}done : () => {\n    instance` : '');

		} else {
			const time = `\n    time = performance.now();`;
			code = `let options;\n`;

			if (currentLibrary.jquery) {
				code += `const context = $(tab.getTestElement());\ncontext.unmark({\n  ${unmarkOpt}done : () => {${time}\n    context`;

			} else {
				code += `const instance = new Mark(tab.getTestElement());\ninstance.unmark({\n  ${unmarkOpt}done : () => {${time}\n    instance`;
			}
		}

		if (text = info.editor.toString().trim()) {
			switch (currentType) {
				case 'string_' :
					str = `.mark('${text}', ${optionCode});`;
					break;

				case 'array' :
					str = `.mark(${text}, ${optionCode});`;
					break;

				case 'regexp' :
					str = `.markRegExp(${text}, ${optionCode});`;
					break;

				case 'ranges' :
					str = `.markRanges(${text}, ${optionCode});`;
					break;

				default : break;
			}

		} else {
			$('.generated-code code').text('');
			log(`Missing search parameter\n`, true);
			$(tab.getSearchEditorInfo().selector).addClass('error');
			return '';
		}

		code += str + (unmark ? '\n  }\n});' : '');
		code = this.buildCustomCode(code, kind);

		if (kind !== 'internal') {
			code = (kind === 'jq' ? '//jQuery\n' : kind === 'js' ? '//javascript\n' : '') + code;

		} else {
			// returning an object 'options' is only necessary for testing purposes
			code += '\n\nreturn options;'
		}

		return code;
	},

	buildCustomCode : function(code, kind) {
		let text;
		const reg = /\s+/g,
			editor = types[currentType].customCodeEditor;

		if (editor && (text = editor.toString()) && /<<markjsCode>>/.test(text)) {
			if (kind === 'internal') {
				// necessary for the next/previous buttons functionality
				const fn = `highlighter.flagStartElement(element, ${currentLibrary.old ? null : 'info'})`,
					eachParam = this.getEachParameters(),
					doneParam = this.getDoneParameters();

				text = addCode(text, fn, eachParam, /\bfunction\s+each(\([^)]+\))\s*\{/);
				text = addCode(text, `highlighter.finish${doneParam}`, doneParam, /\bfunction\s+done(\([^)]+\))\s*\{/);
			}
			text = text.replace(new RegExp(`${this.comment}\s*\n`), '');
			code = text.replace(/<<markjsCode>>(?:[ \t]*\/\/.*)?/, code);
		}

		function addCode(text, fn, param, regex) {
			// adds code if normalized parameters are equal
			return text.replace(regex, (m, gr1) => gr1.replace(reg, '') === param.replace(reg, '') ? `${m}\n  ${fn};\n` : m);
		}

		return code;
	},

	buildOptions : function(kind, unmark) {
		const obj = types[currentType],
			across = tab.isChecked('acrossElements'),
			indent = ' '.repeat(unmark ? 6 : 2),
			end = unmark ? ' '.repeat(4) : '';

		if ( !obj) return '{}';

		let value, text, code = '';

		obj.options.every(option => {
			if (currentLibrary.old && newOptions.includes(option)) return true;

			const selector = `${optionPad} .${option}`,
				input = selector + ' input',
				opt = defaultOptions[option];

			if (opt) {
				switch (opt.type) {
					case 'checkbox' :
						value = $(input).prop('checked');

						if (value !== opt.value) {
							if (option === 'combinePatterns') {
								if (markArray()) {
									value = util.getNumericalValue('combineNumber', 10);

								} else {
									value = null;
								}

							} else if (option === 'shadowDOM') {
								const editor = tab.getOptionEditor('shadowStyle');
								value = editor && (text = editor.toString().trim()) ? text : value;

							} else if (option === 'wrapAllRanges') {
								if ( !(currentType === 'regexp' && tab.isChecked('separateGroups') || currentType === 'ranges')) {
									value = null;
								}

							} else if (option === 'cacheTextNodes') {
								if ( !markArray()) value = null;

							} else if (option === 'blockElementsBoundary') {
								if (across) {
									const editor = tab.getOptionEditor('blockElements');
									value = editor && (text = editor.toString().trim()) ? text : value;

								} else {
									value = null;
								}
							}

							if (value !== null) {
								code += `${indent}${option} : ${value},\n`;
							}
						}
						break;

					case 'text' :
						text = $(input).val().trim();

						if (text && text !== opt.value) {
							code += `${indent}${option} : '${text}',\n`;
						}
						break;

					case 'editor' :
						if (option !== 'accuracyObject') {
							const editor = tab.getOptionEditor(option);

							if (editor && (text = editor.toString().trim())) {
								code += `${indent}${option} : ${text},\n`;
							}
						}
						break;

					case 'select' :
						value = $(selector + ' select').val();

						if (value !== opt.value) {
							code += `${indent}${option} : `;

							if (option === 'accuracy' && (value === 'exactly' || value === 'complementary')) {
								const editor = tab.getOptionEditor('accuracyObject');
								code += editor && (text = editor.toString().trim()) ? `${text},\n` : `'${value}',\n`;

							} else {
								code += `'${value}',\n`;
							}
						}
						break;

					case 'number' :
						if (option === 'iframesTimeout' && !tab.isChecked('iframes')
							|| option === 'ignoreGroups' && tab.isChecked('separateGroups')) break;

						value = parseInt($(input).val().trim()) || opt.value;

						if (value !== opt.value) {
							code += `${indent}${option} : ${value},\n`;
						}
						break;

					default : break;
				}
			}
			return true;
		});

		code += this.buildCallbacks(kind, unmark);
		code = !code.trim() ? '{}' : (kind === 'internal' ? 'options = ' : '') + `{\n${code}}`;

		return code;
	},

	buildCallbacks : function(kind, unmark) {
		let text,
			code = '',
			indent = ' '.repeat(unmark ? 6 : 2),
			end = unmark ? ' '.repeat(4) : '';

		const editor = types[currentType].customCodeEditor;

		if (editor && (text = editor.toString())) {
			if (/\bfunction\s+filter\s*\(/.test(text)) {
				code += `${indent}filter : filter,\n`;
			}

			if (/\bfunction\s+each\s*\(/.test(text)) {
				code += `${indent}each : each,\n`;
			}

			if (/\bfunction\s+done\s*\(/.test(text)) {
				code += `${indent}done : done,\n`;
			}

			if (kind === 'internal') {
				code += `${indent}noMatch : (t) => { noMatchTerms.push(t); }\n`;
			}

		} else {
			if (kind === 'internal') {
				code = `${code}${indent}done : highlighter.finish\n`;

			} else if ($('#callbacks').prop('checked')) {
				code = `${indent}filter : ${this.getFilterParameters()} => {},\n`;
				code += `${indent}each : ${this.getEachParameters()} => {},\n`;
				code = `${code}${indent}done : ${this.getDoneParameters()} => {}\n`;
			}
		}

		return code + end;
	},

	getFilterParameters : function() {
		if (currentType === 'string_' || currentType === 'array') {
			let name = 'termMarksSoFar';
			if ( !currentLibrary.old && tab.isChecked('combinePatterns')) {
				name = 'termMatchesSoFar';
			}
			return `(textNode, term, marksSoFar, ${name}${currentLibrary.old ? '' : ', info'})`;

		} else if (currentType === 'regexp') {
			return `(textNode, matchString, count${currentLibrary.old ? '' : ', info'})`;
		}
		return `(textNode, range, matchString, index)`;
	},

	getEachParameters : function() {
		if (currentType === 'ranges') {
			return `(element, range${currentLibrary.old ? '' : ', info'})`;
		}
		return `(element${currentLibrary.old ? '' : ', info'})`;
	},

	getDoneParameters : function() {
		if (currentLibrary.old) {
			return `(totalMarks)`;

		} else {
			const stats = currentType === 'string_' || currentType === 'array';
			return `(totalMarks, totalMatches${stats ? ', termStats' : ''})`;
		}
	},

	initCodeSnippet : function() {
		this.snippet = (this.comment + this.defaultSnippet).replace(/\bfilter\(\)/g, 'filter' + codeBuilder.getFilterParameters())
			.replace(/\beach\(\)/g, 'each' + codeBuilder.getEachParameters())
			.replace(/\bdone\(\)/g, 'done' + codeBuilder.getDoneParameters());
	}
};

const Json = {
	buildJson : function(format) {
		const obj = types[currentType];

		let textMode = false;

		if (obj.testEditorMode === 'text') {
			tab.setHtmlMode(null, false);
			textMode = true;
		}

		let json = this.serialiseOptions(`{"version":"${version}","library":"${settings.library}","section":{`),
			text;

		json += this.serialiseCustomCode();

		const editor = tab.getOptionEditor(obj.queryEditor);
		if (editor && (text = editor.toString()).trim()) {
			json += `,"${obj.queryEditor}":${JSON.stringify(text)}`;
		}

		const selectorsInfo = tab.getSelectorsEditorInfo();
		if (selectorsInfo.editor && (text = selectorsInfo.editor.toString()).trim()) {
			json += `,"selectors":${JSON.stringify(text)}`;
			json += `,"selectorAll":${$(selectorsInfo.all).prop('checked')}`;
		}

		const testEditor = tab.getTestEditor();
		if ((text = testEditor.toString()).trim()) {
			const mode = types[currentType].testEditorMode;

			if (mode === 'html') {
				// removes all mark elements from the text
				const regex = new RegExp(`<${markElement} data-markjs=[^>]+>((?:(?!</${markElement}>)[^])+)</${markElement}>`, 'g');
				let max = 20;    // just to be on the safe side

				while (--max > 0 && regex.test(text)) {
					text = text.replace(regex, '$1');
				}
			}
			json += `,"testString":{"mode":"${mode}","content":${JSON.stringify(text)}}`;
		}
		json += '}}';

		const jsonObj = Json.parseJson(json);
		if ( !jsonObj) return null;

		if (format) {
			json = JSON.stringify(jsonObj, null, '    ');
		}

		if (textMode) {
			tab.setTextMode(null);
		}

		return json;
	},

	serialiseOptions : function(json) {
		const obj = types[currentType],
			across = tab.isChecked('acrossElements');

		let value, text;
		json += `"type":"${currentType}"`;

		obj.options.every(option => {
			if (currentLibrary.old && newOptions.includes(option)) return true;

			const selector = `${optionPad} .${option}`,
				input = selector + ' input',
				opt = defaultOptions[option];

			if (opt) {
				switch (opt.type) {
					case 'checkbox' :
						value = $(input).prop('checked');

						if (value !== opt.value) {
							if (option === 'combinePatterns') {
								if (markArray()) {
									json += `,"combinePatterns":${util.getNumericalValue('combineNumber', 10)}`;
								}

							} else if (option === 'shadowDOM') {
								const editor = tab.getOptionEditor('shadowStyle');

								if (editor && (text = editor.toString().trim())) {
									json += `,"${option}":${JSON.stringify(text)}`;

								} else {
									json += `,"${option}":${value}`;
								}

							} else if (option === 'wrapAllRanges') {
								if (currentType === 'regexp' && tab.isChecked('separateGroups') || currentType === 'ranges') {
									json += `,"${option}":${value}`;
								}

							} else if (option === 'cacheTextNodes') {
								if (markArray()) {
									json += `,"${option}":${value}`;
								}

							} else if (option === 'blockElementsBoundary') {
								if (across) {
									const editor = tab.getOptionEditor('blockElements');

									if (editor && (text = editor.toString().trim())) {
										json += `,"${option}":${JSON.stringify(text)}`;

									} else {
										json += `,"${option}":${value}`;
									}
								}

							} else {
								json += `,"${option}":${value}`;
							}
						}
						break;

					case 'text' :
						text = $(input).val().trim();

						if (text && text !== opt.value) {
							json += `,"${option}":"${text}"`
						}
						break;

					case 'editor' :
						if (option !== 'accuracyObject') {
							const editor = tab.getOptionEditor(option);

							if (editor && (text = editor.toString().trim())) {
								json += `,"${option}":${JSON.stringify(text)}`;
							}
						}
						break;

					case 'select' :
						value = $(selector + ' select').val();

						if (value !== opt.value) {
							if (option === 'accuracy' && (value === 'exactly' || value === 'complementary')) {
								const editor = tab.getOptionEditor('accuracyObject');
								json += editor && (text = editor.toString().trim()) ? `,"${option}":${JSON.stringify(text)}` : `,"${option}":"${value}"`;

							} else {
								json += `,"${option}":"${value}"`;
							}
						}
						break;

					case 'number' :
						if (option === 'iframesTimeout' && !tab.isChecked('iframes')
							|| option === 'ignoreGroups' && tab.isChecked('separateGroups')) break;

						value = parseInt($(input).val().trim()) || opt.value;

						if (value !== opt.value) {
							json += `,"${option}":${value}`;
						}
						break;

					default : break;
				}
			}
			return true;
		});

		return json;
	},

	serialiseCustomCode : function() {
		let code;
		const editor = types[currentType].customCodeEditor;

		if (editor && (code = editor.toString().trim())) {
			return `,"customCode":${JSON.stringify(code)}`;
		}
		return '';
	},

	parseJson : function(str) {
		let json;
		try { json = JSON.parse(str); } catch (e) {
			log('\nFailed to parse this json\n' + e.message, e.stack);
		}
		return json;
	}
};

function registerEvents() {

	$(window).on("beforeunload", function(e) {
		if (settings.showWarning && isDirty()) {
			e.preventDefault();
			e.returnValue = '';
			return '';
		}
	});

	$('main').on('click', function(e) {
		$('.setting-form, .file-form').each((i, form) => {
			if ($(form).css('display') === 'block' && !form.contains(e.target)) {
				$(form).css('display', 'none');
			}
		});
	});

	$(document).on('mouseup', function() {
		$('section .editor, header li').removeClass('error warning');
	});

	$(".mark-type li").on('click', function() {
		tab.selectTab($(this).data('type'));
		tab.initTab();
	});

	$("#internal-code").on('toggle', function(e) {
		const attr = $(this).attr('open');
		settings.saveValue('internal_code', attr ? 'opened' : 'closed');
	});

	$(".customCode details, .customCode details>summary").on('toggle', function(e) {
		const button = $(this).parents('.customCode').first().find('button.clear');

		if ($(this).attr('open')) {
			const editor = types[currentType].customCodeEditor;

			if ( !editor || !editor.toString().trim()) {
				tab.updateCustomCode(codeBuilder.snippet);
			}
			button.removeClass('hide');
			tab.clear();
			codeBuilder.build('js-jq');

		} else {
			button.addClass('hide');
		}
	});

	$("input[type=text]").on('input', function(e) {
		codeBuilder.build('js-jq');
		tab.setDirty(true);
	});

	$("input[type=checkbox], input[type=number], select[name]").on('change', function(e) {
		codeBuilder.build('js-jq');

		if ($(this).attr('name')) {
			tab.setDirty(true);
		}
	});

	$("label[for], input[name], option[name], div.editor[name], select[name]").on('mouseenter', function(e) {
		if (settings.showTooltips || e.ctrlKey || e.metaKey) {
			const attr = $(this).attr('for');
			if (attr) {
				showTooltip($(this).attr('for').replace(/^[^-]+-/, ''), $(this), e);

			} else {
				showTooltip($(this).attr('name'), $(this), e);
			}
		}
	}).on('mouseleave', function() {
		$(this).powerTip('hide', true);
	});

	$('button.open-json-form').on('click', function() {
		if ($('.json-form:visible').length) {
			$('.json-form').css('display', 'none');

		} else {
			$('.json-form').css('display', 'block');

			if (jsonEditor === null) {
				jsonEditor = CodeJar($('.json-form .editor')[0], () => {});

				jsonEditor.onUpdate(code => {
					$('button.import-json').attr('disabled', code.trim() ? false : true);
				});
			}

			$('button.import-json').attr('disabled', jsonEditor.toString().trim() ? false : true);
		}
	});

	$('.json-form>.close, .setting-form>.close').on('click', function() {
		$(this).parent().css('display', 'none');
	});

	$('button.open-setting-form').on('click', function() {
		if ($('.setting-form:visible').length) {
			$('.setting-form').css('display', 'none');

		} else {
			$('.setting-form').css('display', 'block');
		}
	});

	$('button.open-file-form').on('click', function() {
		if ($('.file-form:visible').length) {
			$('.file-form').css('display', 'none');

		} else {
			$('.file-form').css('display', 'block');
			$('.file-form .file-name').attr('placeholder', getFileName());
		}
	});

	$('.file-form>.close').on('click', function() {
		$(this).parent().css('display', 'none');
	});

	$(document).on('keydown', function(e) {
		if (e.ctrlKey || e.metaKey) {
			if (e.code === 'KeyS') {    // s
				$('.file-form a.save-file')[0].click();
				e.preventDefault();

			} else if (e.code === 'KeyO') {    // o
				$('.file-form #file-dialog')[0].click();
				e.preventDefault();
			}
		}
	});

	$('.file-form a.save-file').on('click', function(e) {
		const json = Json.buildJson(true);

		if (json) {
			let name = $('.file-form .file-name').val();

			if (name && !/\.json$/i.test(name)) {
				name = name.replace(/[.]+$/g, '') + '.json';
			}
			name = (name || getFileName());

			this.download = name;
			this.href = URL.createObjectURL(new Blob([json], { type : 'text/json' }));
			//URL.revokeObjectURL(this.href);

			$('.file-form .file-name').val(name);
			settings.saveValue(currentType + '-fileName', name);
		}
	});

	$('.file-form #file-dialog').on('change', function() {
		const reader = new FileReader(),
			file = this.files[0];
		reader.file = file;

		reader.onload = function() {
			importer.loadJson(this.result);

			$('.file-form .loaded-file-name').text(file.name);
			$('.file-form .file-name').val(file.name);
			$('.file-form').css('display', 'none');
		};

		reader.readAsText(file);
	});

	$(".copy").on('mouseup', function(e) {
		document.getSelection().selectAllChildren($(this).parent().parent().find('.editor')[0]);
		document.execCommand('copy');
		document.getSelection().removeAllRanges();
	});

}

const util = {
	voidElements : ['meta', 'link', 'br', 'col', 'hr', 'input', 'img', 'area', 'menuitem', 'wbr', 'param', 'source', 'track', 'base', 'basefont', 'embed', 'frame', 'isindex', 'keygen', 'nextid', 'nobr', 'plaintext'],

	isVoidElement : function(node) {
		return this.voidElements.indexOf(node.nodeName.toLowerCase()) !== -1;
	},

	getNumericalValue : function(option, defaultValue) {
		return parseInt($(`${optionPad} .${option} input`).val().trim()) || defaultValue;
	},

	entitize : function(text) {
		text = text.replace(/[<>"'&]/g, (m) => {
			if (m === '<') return '&lt;';
			else if (m === '>') return '&gt;';
			else if (m === '"') return '&quot;';
			else if (m === '&') return '&amp;';
			return '&#039;';
		});
		return text;
	},

	distinct : function(arr) {
		const array = [];

		for (let i = 0; i < arr.length; ++i) {
			if (array.indexOf(arr[i]) === -1) array.push(arr[i]);
		}
		return array;
	}
};

const settings = {
	library : 'advanced',
	loadDefault : true,
	showTooltips : false,
	showWarning : true,

	save : function() {
		const str = JSON.stringify(settings);
		this.saveValue('settings', str);
	},

	load : function() {
		const str = this.loadValue('settings');
		if (str) {
			const json = Json.parseJson(str);
			if (json) {
				if (json.library) {
					this.library = json.library;
				}

				if ( !isNullOrUndefined(json.loadDefault)) {
					this.loadDefault = json.loadDefault;
				}

				if ( !isNullOrUndefined(json.showTooltips)) {
					this.showTooltips = json.showTooltips;
				}

				if ( !isNullOrUndefined(json.showWarning)) {
					this.showWarning = json.showWarning;
				}
				this.setCheckboxes();
			}
		}
		switchLibrary(this.library === 'advanced');
	},

	setCheckboxes : function() {
		$('#library').prop('checked', this.library === 'advanced');
		$('#load-default').prop('checked', this.loadDefault);
		$('#show-tooltips').prop('checked', this.showTooltips);
		$('#unsaved').prop('checked', this.showWarning);
	},

	changed : function(elem) {
		if (elem.id === 'library') {
			const checked = $(elem).prop('checked');
			this.library = checked ? 'advanced' : 'standard';
			switchLibrary(checked);
		}
		this.loadDefault = $('#load-default').prop('checked');
		this.showTooltips = $('#show-tooltips').prop('checked');
		this.showWarning = $('#unsaved').prop('checked');
		this.save();
	},

	loadValue : function(key) {
		try {
			return localStorage.getItem(key);
		} catch (e) {
			log('localStorage ' + e.message, true);
		}
		return null;
	},

	saveValue : function(key, value) {
		try {
			const saved = localStorage.getItem(key);
			if (value !== saved) {
				localStorage.setItem(key, value);
			}
		} catch (e) {
			log('localStorage ' + e.message, true);
		}
	}
};

function writeTermStats(obj, title) {
	let array = [];
	for (let key in obj) {
		if (obj[key] !== 0) {
			array.push(`${key} = ${obj[key]}`);
		}
	}
	return array.length ? title + array.join('<b>,</b> ') : '';
}

function toText(obj, title, msg) {
	let text = '';
	for (let key in obj) {
		text += `\n${key} = ${obj[key]}`;
	}
	return text ? title + text : msg ? title + msg : '';
}

function getFileName() {
	let name = settings.loadValue(currentType + '-fileName');

	return name || `${(currentType === 'string_' ? 'string' : currentType)}-${settings.library}-lib.json`;
}

function showTooltip(id, elem, e) {
	showHideInfo(id);

	elem.data('powertiptarget', id).powerTip({
		manual : true,
		intentPollInterval : 300,
		fadeInTime : 100,
		smartPlacement : true,
		placement : 'w',
		offset : 30
	});
	elem.powerTip('show', e);
}

function showHideInfo(id) {
	const separateGroups = tab.isChecked('separateGroups'),
		acrossElements = tab.isChecked('acrossElements'),
		info = $('article.options-info #' + id),
		elemsAE = info.find('.acrossElements').addClass('hide'),
		elemsSG = info.find('.separateGroups').addClass('hide');

	if (acrossElements) {
		elemsAE.each(function() {
			if ($(this).hasClass('separateGroups')) {
				if (separateGroups) $(this).removeClass('hide');

			} else $(this).removeClass('hide');
		});
	}

	if (separateGroups) {
		elemsSG.each(function() {
			if ($(this).hasClass('acrossElements')) {
				if (acrossElements) $(this).removeClass('hide');

			} else $(this).removeClass('hide');
		});
	}

	if (currentLibrary.old) {
		$(`.options-info .advanced`).addClass('hide');
		$(`.options-info .standard`).removeClass('hide');

	} else {
		$(`.options-info .standard`).addClass('hide');
		$(`.options-info .advanced`).removeClass('hide');
	}
}

function log(message, error, warning) {
	if (error) {
		$('header .mark-type li.selected').addClass('error');
		message = `<span style="color:red">${message}</span><br>`;
		$('.results code').html(message);
		return;

	} else if (warning) {
		message = `<span style="color:#ca5500">${message}</span><br>`;
	}
	let html = $('.results code').html();
	$('.results code').html((html ? html + '\n' : '') + message);
}

function isNullOrUndefined(prop) {
	return typeof prop === 'undefined' || prop === null;
}

function isDirty() {
	for (const type in types) {
		if (types[type].isDirty) return true;
	}
	return false;
}

function testContainerScrolled() {
	isScrolled = true;
}

function previousMatch() {
	if (canBeNested) {
		if (--currentIndex <= 0) currentIndex = 0;

		highlightMatch2();

	} else {
		if ( !startElements.length) return;

		findNextPrevious(false);
	}
}

function nextMatch() {
	if (canBeNested) {
		if (++currentIndex > matchCount - 1) currentIndex = matchCount - 1;

		highlightMatch2();

	} else {
		if ( !startElements.length) return;

		findNextPrevious(true);
	}
}

function findNextPrevious(next) {
	let elem,
		top = $(`${currentSection} .testString>.test-container`).offset().top;

	if (next) {
		startElements.each(function(i) {
			if (isScrolled) {
				if ($(this).offset().top > top) elem = $(this);

			} else if (i > currentIndex) elem = $(this);

			if (elem) {
				currentIndex = i;
				return false;
			}
		});
		if ( !elem) {
			elem = startElements.last();
			currentIndex = startElements.length - 1;
		}

	} else {
		startElements.each(function(i) {
			if (isScrolled) {
				if ($(this).offset().top > top) {
					currentIndex = i > 0 ? i - 1 : i;
					return false;
				}

			} else if (i === currentIndex) {
				currentIndex = i > 0 ? i - 1 : i;
				return false;
			}
			elem = $(this);
		});
		if ( !elem) {
			elem = startElements.first();
			currentIndex = 0;
		}
	}

	highlightMatch(elem);
}

function highlightMatch(elem) {
	marks.removeClass('current');

	const htmlMode = types[currentType].testEditorMode === 'html';
	let found = false;

	marks.each(function(i, el) {
		if ( !found) {
			if (el === elem[0]) found = true;

		} else {
			// the start of the next 'start element' means the end of the current match
			if ($(this).data('markjs') === 'start-1') return false;
		}

		if (found) {
			if (htmlMode) {
				$(this).find(markElementSelector + '.mark-term').addClass('current');

			} else {
				$(this).addClass('current');
				$(this).find(markElementSelector).addClass('current');
			}
		}
	});

	setButtonOpacity();
	setTimeout(function() { scrollIntoView(elem); }, 100);
}

// highlight a whole match using only the 'start elements' is not possible with nesting/overlapping matches
// using numbers as unique match identifiers can solve this problem, but only with single-pass methods - 'markRegExp' and 'markRanges'
function highlightMatch2() {
	marks.removeClass('current');
	let elems;

	if (types[currentType].testEditorMode === 'html') {
		elems = marks.filter((i, elem) => $(elem).data('markjs') === currentIndex);
		elems.filter((i, elem) => $(elem).hasClass('mark-term')).addClass('current');
		elems.find('mark[data-markjs].mark-term').addClass('current');

	} else {
		elems = marks.filter((i, elem) => $(elem).data('markjs') === currentIndex).addClass('current');
		elems.find(`${markElement}[data-markjs]`).addClass('current');
	}
	setButtonOpacity();
	setTimeout(function() { scrollIntoView(elems.first()); }, 100);
}

function setButtonOpacity() {
	if (canBeNested && matchCount === 0 || !canBeNested && !startElements.length) {
		previousButton.css('opacity', 0.5);
		nextButton.css('opacity', 0.5);

	} else {
		previousButton.css('opacity', currentIndex > 0 ? 1 : 0.5);
		nextButton.css('opacity', currentIndex < (canBeNested ? matchCount - 1 : startElements.length - 1) ? 1 : 0.5);
	}
}

function scrollIntoView(elem) {
	if (elem.length) {
		elem[0].scrollIntoView(true);
		// 'scrollBy' is very slow in Firefox on big test content
		window.scrollBy(0, -1000);
		setTimeout(function() { isScrolled = false; }, 150);
	}
}

function switchLibrary(checked) {
	const info = getLibrariesInfo();

	if (info.jquery && info.jquery !== 'none' && info.javascript && info.javascript !== 'none') {
		if (checked) {
			currentLibrary.old = false;
			currentLibrary.jquery = info.jquery === 'advanced';

		} else {
			currentLibrary.old = true;
			currentLibrary.jquery = info.jquery === 'standard';
		}
	}

	tab.setVisibility();
	codeBuilder.initCodeSnippet();

	currentTabId = `${settings.library}_section_${currentType}`;
	tab.setLoadButton();
	$('.file-form .file-name').val(getFileName());
}

function detectLibrary() {
	const info = getLibrariesInfo();
	let both = info.jquery && info.jquery !== 'none' && info.javascript && info.javascript !== 'none' && info.jquery !== info.javascript;

	if (both) {
		const lib = settings.loadValue('library');
		if (lib) {
			if (lib === 'standard') {
				currentLibrary.jquery = info.jquery === 'standard';
				currentLibrary.old = true;

			} else if (lib === 'advanced') {
				currentLibrary.jquery = info.jquery === 'advanced';
				currentLibrary.old = false;
			}

		} else {
			currentLibrary.jquery = info.jquery === 'advanced';
			currentLibrary.old = false;
		}

	} else {
		if (info.javascript && info.javascript !== 'none') {
			currentLibrary.jquery = false;
			currentLibrary.old = info.javascript === 'standard';

		} else if (info.jquery && info.jquery !== 'none') {
			currentLibrary.jquery = true;
			currentLibrary.old = info.jquery === 'standard';
		}
	}

	if ( !both) {
		$('.switch-library input').attr('disabled', true);
		$('.switch-library label').css('opacity', .4);
	}
}

function getLibrariesInfo() {
	const info = {};
	let jq = false, js = false;

	$('head script[src]').each(function(i, elem) {
		const src = elem.getAttribute('src');
		if (/\/jquery\.mark\./i.test(src)) jq = true;
		if (/\/mark\./i.test(src)) js = true;
	});

	if (jq) {
		info.jquery = getLibrary(true);
	}
	if (js) {
		info.javascript = getLibrary(false);
	}
	return info;
}

function getLibrary(jquery) {
	let library = 'advanced';
	try {
		getContext('#playground-article h1', jquery).markRegExp(/^\s*\w/g, {
			'filter' : (n, m, t, info) => {
				if ( !info) library = 'standard';
				return false;
			}
		});
	} catch (e) { return 'none'; }

	return library;
}

function getContext(selector, jquery) {
	return jquery ? $(selector) : new Mark(document.querySelector(selector));
}























