
'use strict';

let version = '1.0.0',
	library = 'standard',
	currentTabId = '',
	maxLength = 100000,
	time = 0,
	oldLibrary = false,
	jqueryMark = false,
	dFlagSupport = true,
	showTooltips = false,
	scroll = true,
	currentIndex = 0,
	currentType = '',
	testContainerSelector = '',
	markElementSelector = '',
	markElement = '',
	jsonEditor = null,
	marks = $(),
	startElements = $(),
	previousButton = $(`.previous`),
	nextButton = $(`.next`);

const settings = {
	//loadDefault : true,
	loadDefault : false,

};

const types = {
	string_ : {
		options : [ 'element', 'className', 'exclude', 'separateWordSearch', 'accuracy', 'diacritics', 'synonyms', 'iframes', 'iframesTimeout', 'acrossElements', 'caseSensitive', 'ignoreJoiners', 'ignorePunctuation', 'wildcards', 'debug' ],
		editors : { 'queryString' : null, 'testString' : null, 'exclude' : null, 'synonyms' : null, 'ignorePunctuation' : null, 'accuracyObject' : null, },
		queryEditor : 'queryString',
		testEditorMode : 'text',
		customCodeEditor : null
	},

	array : {
		options : [ 'element', 'className', 'exclude', 'separateWordSearch', 'accuracy', 'diacritics', 'synonyms', 'iframes', 'iframesTimeout', 'acrossElements', 'caseSensitive', 'ignoreJoiners', 'ignorePunctuation', 'wildcards', 'cacheTextNodes', 'wrapAllRanges', 'debug' ],
		editors : { 'queryArray' : null, 'testString' : null, 'exclude' : null, 'synonyms' : null, 'ignorePunctuation' : null, 'accuracyObject' : null, },
		queryEditor : 'queryArray',
		testEditorMode : 'text',
		customCodeEditor : null
	},

	regexp : {
		options : [ 'element', 'className', 'exclude', 'iframes', 'iframesTimeout', 'acrossElements', 'ignoreGroups', 'separateGroups', 'blockElementsBoundary', 'blockElements', 'wrapAllRanges', 'debug' ],
		editors : { 'queryRegExp' : null, 'testString' : null, 'exclude' : null, 'blockElements' : null, },
		queryEditor : 'queryRegExp',
		testEditorMode : 'text',
		customCodeEditor : null
	},

	ranges : {
		options : [ 'element', 'className', 'exclude', 'iframes', 'iframesTimeout', 'wrapAllRanges', 'debug' ],
		editors : { 'queryRanges' : null, 'testString' : null, 'exclude' : null, },
		queryEditor : 'queryRanges',
		testEditorMode : 'text',
		customCodeEditor : null
	}
};

const newOptions = [ 'blockElementsBoundary', 'cacheTextNodes', 'wrapAllRanges' ];

const defaultOptions = {
	element : [ 'mark', 'text' ],
	className : [ '', 'text' ],
	exclude : [[], 'editor' ],
	separateWordSearch : [ true, 'checkbox' ],
	diacritics : [ true, 'checkbox' ],
	accuracy : [ 'partially', 'select' ],
	synonyms : [ {}, 'editor' ],
	iframes : [ false, 'checkbox' ],
	iframesTimeout : [ '5000', 'number' ],
	acrossElements : [ false, 'checkbox' ],
	caseSensitive : [ false, 'checkbox' ],
	ignoreJoiners : [ false, 'checkbox' ],
	ignorePunctuation : [[], 'editor' ],
	wildcards : [ 'disabled', 'select' ],
	ignoreGroups : [ '0', 'number' ],
	cacheTextNodes : [ false, 'checkbox' ],
	wrapAllRanges : [ false, 'checkbox' ],
	separateGroups : [ false, 'checkbox' ],
	blockElementsBoundary : [ false, 'checkbox' ],
	blockElements : [[], 'editor' ],
	debug : [ false, 'checkbox' ],
	log : [ false, 'checkbox' ],
};

$(document).ready(function() {
	let t0 = performance.now();

	detectLibrary();
	//testSaveLoad();

	try { new RegExp('\\w', 'd'); } catch(e) { dFlagSupport = false; }

	registerEvents();
	tab.selectTab();
	tab.initTab();

	console.log('total time - ' + (performance.now() - t0));
});

const tab = {

	initTab : function() {
		const saved = this.setLoadButton();

		if( !this.isInitialize()) {
			this.initializeEditors();

			if(settings.loadDefault || !saved) {
				const str = defaultJsons[currentType];

				importer.setOptions(Json.parseJson(str));

				this.loadDefaultSearchParameter();
				this.loadDefaultHtml();

			} else {
				importer.loadOptions();
			}
		}

		//highlighter.highlight();
	},

	selectTab : function(type) {
		if( !type) {
			type = loadValue('tabType');
			if( !type) type = 'string_';
		}

		$('.mark-type li').removeClass('selected');
		$('.mark-type li[data-type=' + type + ']').addClass('selected');

		saveValue('tabType', type);
		currentType = type;

		const querySelect = `section.${type} .${types[type].queryEditor} select`;
		const testSelect = `section.${type} .testString select`;

		if(type === 'string_') {
			this.setVisibleString();

		} else if(type === 'array') {
			this.setVisibleArray();
			this.buildSelector(querySelect, wordArrays, 'Array of strings');

		} else if(type === 'regexp') {
			this.setVisibleRegExp();

		} else if(type === 'ranges') {
			this.setVisibleRanges();
		}

		checkIframes($(`section.${type} .iframes input`)[0]);

		codeBuilder.initCodeSnippet();
		this.clear();

		testContainerSelector = `section.${currentType} .testString .editor`;
		currentTabId = `${library}_section_${currentType}`;
	},

	buildSelector : function(selector, obj, selected) {
		let options = `<option value="" selected>${selected}</option>`;
		//let options = '';

		for(const key in obj) {
			if(key !== 'name') {
				const value = key.startsWith('default') ? `['${obj[key].toString().split(',').join("', '")}']` : `${obj.name}['${key}']`;
				options += `<option value="${value}">${key}</option>`;
			}
		}
		$(selector).html(options);
	},

	setVisibleString : function() {
		$('section.string_').removeClass('hide');
		$('section.array').addClass('hide');
		$('section.regexp').addClass('hide');
		$('section.ranges').addClass('hide');

		checkAccuracy($('section.string_ .accuracy>select')[0]);
	},

	setVisibleArray : function() {
		$('section.string_').addClass('hide');
		$('section.array').removeClass('hide');
		$('section.regexp').addClass('hide');
		$('section.ranges').addClass('hide');

		checkAccuracy($('section.array .accuracy>select')[0]);
	},

	setVisibleRegExp : function() {
		$('section.string_').addClass('hide');
		$('section.array').addClass('hide');
		$('section.regexp').removeClass('hide');
		$('section.ranges').addClass('hide');
		this.switchElements($('.blockElementsBoundary input'), '.blockElements');
	},

	setVisibleRanges : function() {
		$('section.string_').addClass('hide');
		$('section.array').addClass('hide');
		$('section.regexp').addClass('hide');
		$('section.ranges').removeClass('hide');
	},

	switchElements : function(elem, selector) {
		let checked = elem.prop('checked');

		if(checked) $(selector).removeClass('hide');
		else $(selector).addClass('hide');
	},

	loadDefaultHtml : function() {
		const info = this.getTestEditorInfo();

		if(info.editor.toString().trim() === '') {
			//$(testContainerSelector).html(minHtml);
			$(testContainerSelector).html(defaultHtml);

			types[currentType].testEditorMode = 'text';
			this.highlightButton('.text');
		}
	},

	loadDefaultSearchParameter : function() {
		const info = this.getSearchEditorInfo();
		if( !info) return;

		if(info.editor.toString().trim() === '') {
			const searchParameter = defaultSearchParameter[currentType];

			if(searchParameter) {
				let str = searchParameter;

				if(currentType === 'array' || currentType === 'ranges') {
					str = JSON.stringify(searchParameter);
				}
				info.editor.updateCode(str);
			}
		}
	},

	setHtmlMode : function(content, highlight = true) {
		if(types[currentType].testEditorMode === 'html' && !content) return;

		types[currentType].testEditorMode = 'html';

		const editor = $(testContainerSelector),
			html = content ? content : editor.html();

		if(html !== '') {
			// as it turn out, the performance problem causes contenteditable attribute
			// nevertheless, it's better to replace the editor node by the new one
			this.destroyTestEditor();

			const node = document.querySelector(testContainerSelector);
			if(node) {
				const div = document.createElement('div');
				div.className = 'editor lang-html';
				node.parentNode.replaceChild(div, node);
				div.innerText = html;
			}

			if(highlight) {
				// it's still better to avoid syntax highlighting in some cases - the performance is more important
				let forbid = html.length > maxLength || oldLibrary && (isChecked('acrossElements') || currentType === 'ranges') && html.length > maxLength / 2;
				if( !forbid) {
					hljs.highlightElement($(testContainerSelector)[0]);
				}

				highlighter.highlightRawHtml(testContainerSelector, html.length, forbid);
			}

			this.initializeEditors();

		} else {
			const info = this.getTestEditorInfo();
			info.editor.updateCode('');
		}

		this.highlightButton('.html');
	},

	setTextMode : function(content = null) {
		if(types[currentType].testEditorMode === 'text') return;

		types[currentType].testEditorMode = 'text';

		const editor = $(testContainerSelector),
			text = content !== null ? content : editor.text();

		if(text !== '') {
			// switching from html mode to text one with large highlighted html content is very slowly
			// this is a workaround for this issue
			this.destroyTestEditor();

			const parent = editor.parent();
			editor.remove();
			parent.append(`<div class="editor">${text}</div>`);

			runCode();
			this.initializeEditors();

		} else {
			const info = this.getTestEditorInfo();
			info.editor.updateCode('');
		}

		this.highlightButton('.text');
	},

	highlightButton : function(selector) {
		const parent = $(testContainerSelector).parent();

		parent.find(selector).addClass('pressed');
		parent.find(selector === '.text' ? '.html' : '.text').removeClass('pressed');
	},

	initializeEditors : function() {
		const obj = types[currentType];

		for(const key in obj.editors) {
			if(obj.editors[key] === null) {
				let selector = `section.${currentType} .${key} .editor`;

				obj.editors[key] = this.initEditor(obj.editors[key], selector, key === 'testString');
			}
		}
	},

	initEditor : function(editor, selector, testEditor) {
		editor = CodeJar(document.querySelector(selector), () => {}, { tab : '  ' });

		if(testEditor) {
			editor.onUpdate((code, event) => this.updateTestEditor(code, event));

		} else {
			editor.onUpdate(code => this.onUpdateEditor(code, selector));
		}
		return  editor;
	},

	isInitialize : function() {
		const obj = types[currentType];
		for(const key in obj.editors) {
			if(obj.editors[key] !== null) return  true;
		}
		return false;
	},

	destroyTestEditor : function() {
		tab.setEditableAttribute(false);

		const obj = types[currentType];

		obj.editors.testString.destroy();
		obj.editors.testString = null;
	},

	updateTestEditor : function(code, event) {
		if(event.type === 'paste' || event.type === 'drop') {
			if(types[currentType].testEditorMode === 'html') {
				this.setHtmlMode(importer.sanitizeHtml(code));
			}
		}
	},

	onUpdateEditor : function(code, selector) {
		const button = $(selector).parents('div').first().find('button.clear');

		if(code.trim().length) button.removeClass('hide');
		else button.addClass('hide');
	},

	updateCustomCode : function(content) {
		const info = this.getCodeEditorInfo();
		info.editor.updateCode(content);

		$(info.selector).parent().attr('open', true);
		//$(info.selector).parents('.customCode').first().find('button.clear').removeClass('hide');
		hljs.highlightElement($(info.selector)[0]);
	},

	getSearchEditorInfo : function() {
		const obj = types[currentType],
			selector = `section.${currentType} .${obj.queryEditor} .editor`,
			editor = obj.editors[obj.queryEditor];

		if( !editor) return  null;

		return  { selector, editor };
	},

	getCodeEditorInfo : function() {
		const obj = types[currentType],
			selector = `section.${currentType} .customCode .editor`,
			editor = obj.customCodeEditor;

		if( !editor) {
			types[currentType].customCodeEditor = tab.initEditor(editor, selector, false);
		}

		return  { selector, editor : types[currentType].customCodeEditor };
	},

	getTestEditorInfo : function() {
		const obj = types[currentType],
			selector = `section.${currentType} .testString .editor`,
			editor = obj.editors.testString;

		if( !editor) {
			types[currentType].editors.testString = tab.initEditor(editor, selector, true);
		}

		return  { selector, editor : types[currentType].editors.testString };
	},

	getOptionEditor : function(option) {
		if(option) {
			return  types[currentType].editors[option];
		}
		return  null;
	},

	clear : function(keep) {
		$('.results code').empty();
		$('.internal-code code').empty();
		if( !keep) $('.generated-code code').empty();
		$('body *').removeClass('warning');
		marks = $();
		startElements = $();
	},

	setEditableAttribute : function(on) {
		$(testContainerSelector).attr('contenteditable', on);
	},

	setLoadButton : function() {
		const value = loadValue(currentTabId),
			button = $('header button.load');

		if(value) button.removeClass('inactive');
		else button.addClass('inactive');

		return value;
	}
};

// DOM 'onclick' event
function checkSeparateGroups(elem) {
	const div = $(elem).parents('section').first().find('.ignoreGroups');

	if($(elem).prop('checked')) div.addClass('hide');
	else div.removeClass('hide');
}

// also DOM 'onclick' event
function checkIframes(elem) {
	const div = $(elem).parents('section').first().find('.iframesTimeout');

	if($(elem).prop('checked')) div.removeClass('hide');
	else div.addClass('hide');
}

// also DOM 'onclick' event
function checkAccuracy(elem) {
	const div = $(elem).parents('section').first().find('.accuracyObject');

	if(elem.value === 'object') div.removeClass('hide');
	else div.addClass('hide');
}

// DOM 'onclick' event
function selectArray(elem) {
	const info = tab.getSearchEditorInfo();
	if( !info) return;

	const array = $(elem).val();

	info.editor.updateCode(array);
}

// DOM 'onclick' event
function setTextMode() {
	tab.setTextMode();
}

// DOM 'onclick' event
function setHtmlMode() {
	tab.setHtmlMode(null, true);
}

// DOM 'onclick' event
function loadDefaultHtml() {
	tab.loadDefaultHtml();
}

// DOM 'onclick' event
function save() {
	const str = Json.buildJson();

	if(str) {
		saveValue(currentTabId, str);
		tab.setLoadButton();
	}
}

// DOM 'onclick' event
function load() {
	importer.loadOptions();
}

// DOM 'onclick' event
function exportJson() {
	const json = Json.buildJson(true);

	if(json) {
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
	if(editor) {
		editor.updateCode('');
	}
	$(elem).addClass('hide');

	scroll = false;
	runCode();
	scroll = true;
}

// DOM 'onclick' event
function clearJsonEditor() {
	jsonEditor.updateCode('');
	$('button.import-json').attr('disabled', true);
}

// DOM 'onclick' event
function clearEditor(elem) {
	const parent = elem.parentNode.parentNode,
		className = parent.className,
		obj = types[currentType];

	let editor = obj.editors[parent.className];

	if(editor) {
		editor.updateCode('');
	}
	if(className !== obj.queryEditor && className !== 'testString') {
		$(elem).addClass('hide');
	}
}

const importer = {

	loadOptions : function() {
		const str = loadValue(currentTabId);

		if(str) {
			this.loadJson(str);

		} else {
			log('\nSomething is wrong with the local storage', true);
		}
	},

	loadJson : function(str) {
		if(str) {
			const json = Json.parseJson(str);
			if( !json) {
				log('\nFailed to parse the JSON', true);
				return;
			}

			const type = json.section['type'];

			if(type && types[type]) {
				tab.selectTab(type);
				tab.initializeEditors();
				this.setOptions(json);

				if(types[currentType].testEditorMode === 'text') {
					runCode();
				}

			} else {
				log('\nSomething is wrong with the json', true);
			}
		}
	},

	setOptions : function(json) {
		const obj = types[currentType],
			textMode = obj.testEditorMode === 'text';

		let opt, editor, value,
			saved = json.library;

		if( !isNullOrUndefined(saved)) {
			$('#library').prop('checked', saved === 'advanced');
			switchLibrary($('#library')[0]);
		}

		obj.options.every(option => {
			if(oldLibrary && newOptions.indexOf(option) !== -1) return  false;

			const selector = `section.${currentType} .${option}`;

			value = defaultOptions[option];
			saved = json.section[option];

			if(isNullOrUndefined(saved)) {
				saved = value[0];
			}

			if(value) {
				switch(value[1]) {
					case 'checkbox' :
						$(selector + ' input').prop('checked', saved);
						break;

					case 'text' :
					case 'number' :
						$(selector + ' input').val(saved);
						break;

					case 'select' :
						$(selector + ' select').val(saved);
						break;

					default : break;
				}
			}
			return  true;
		});

		for(const key in obj.editors) {
			editor = obj.editors[key];
			saved = json.section[key];

			if(isNullOrUndefined(saved)) {
				editor.updateCode('');

			} else if(key === 'testString') {
				const mode = isNullOrUndefined(saved.mode) || saved.mode !== 'text' ? 'html' : saved.mode;
				const content = isNullOrUndefined(saved.content) ? '' : this.sanitizeHtml(saved.content);

				if(mode === 'text') {
					tab.setTextMode(content);

				} else {
					tab.setHtmlMode(content, false);
				}

			} else {
				editor.updateCode(saved);
			}
		}

		saved = json.section['customCode'];

		if( !isNullOrUndefined(saved)) {
			tab.updateCustomCode(saved);
		}

		if(textMode) {
			tab.setTextMode();
		}
	},

	sanitizeHtml : function(str) {
		const doc = new DOMParser().parseFromString(str, "text/html"),
			iterator = document.createNodeIterator(doc.documentElement, NodeFilter.SHOW_ALL),
			report = {};

		let node;
		while(node = iterator.nextNode()) {
			if(/^(?:head|script|style|link|meta|#comment)$/i.test(node.nodeName)) {
				node.parentNode.removeChild(node);
				add(`removed ${node.nodeType === 1 ? 'element' : ''} '${node.nodeName.toLowerCase()}'`);
				continue;
			}

			if(node.nodeType === 1) {
				checkAttributes(node);
			}
		}

		function checkAttributes(elem) {
			for(let i = 0; i < elem.attributes.length; i++) {
				const attr = elem.attributes[i],
					name = attr.name.toLowerCase();

				if(name === 'href' || name === 'src') {
					const val = decodeURIComponent(attr.value);

					if(/^(?!#).+/i.test(val)) {
						attr.value = '#';
						add(`replaced '${name}' attribute value by '#'`);
					}

				} else if(/\bjavascript(?::|&colon;)/i.test(attr.value)) {
					elem.removeAttribute(attr.name);
					add(`removed ${name} attribute containing 'javascript:'`);

				} else if(name === 'style') {
					if(/\burl\s*\(/i.test(attr.value)) {
						elem.removeAttribute(attr.name);
						add(`removed ${name} attribute containing 'url'`);
					}

				} else if(/^xlink:href/i.test(name)) {
					attr.value = '#';
					add(`replaced '${name}' attribute value by '#'`);

				} else if(/^on[a-z]+/i.test(name)) {    // on event attribute
					elem.removeAttribute(attr.name);
					add(`removed '${name}' attribute`);
				}
			}
		}

		function add(msg) {
			report[msg] = !report[msg] ? 1 : report[msg] + 1;
		}

		console.log(toText(report, 'Html sanitizer report:', ' Ok'));

		return  doc.body.innerHTML;
	}
};

function updateVariables(element, className) {
	previousButton = $(`section.${currentType} .testString .previous`);
	nextButton = $(`section.${currentType} .testString .next`);

	// requires to highlight the custom element
	markElement = element || 'mark';
	markElementSelector = `${testContainerSelector} ${markElement}[data-markjs]`;
}

// DOM 'onclick' event
function switchLibrary(elem) {
	const info = getLibrariesInfo();

	if($(elem).prop('checked')) {
		oldLibrary = false;
		jqueryMark = info.jquery === 'advanced';

	} else {
		oldLibrary = true;
		jqueryMark = info.jquery === 'standard';
	}

	saveValue('library', oldLibrary ? 'standard' : 'advanced');
	setVisibility();
	codeBuilder.initCodeSnippet();

	currentTabId = `${library}_section_${currentType}`;
	tab.setLoadButton();

	scroll = false;

	if(types[currentType].testEditorMode === 'text') runCode();
	else tab.setTextMode();

	scroll = true;
}

// DOM 'onclick' event
function unmarkMethod(elem) {
	codeBuilder.build('js-jq', $(elem).prop('checked'));
}

// DOM 'onclick' event
function buildCode() {
	tab.clear();
	codeBuilder.build('js-jq');
}

// also DOM 'onclick' event
function runCode() {
	//if(types[currentType].testEditorMode === 'html') return;

	tab.clear();

	const editor = types[currentType].customCodeEditor;

	if(editor && editor.toString().trim()) {
		const code = codeBuilder.build('internal');

		if(code) {
			// disable contenteditable attribute for performance reason
			tab.setEditableAttribute(false);

			log('Evaluating the whole code\n');

			try { eval(`'use strict'; ${code}`); } catch(e) {
				log('Failed to evaluate the code\n' + e.message, true);
				tab.setEditableAttribute(true);
			}

			$('.internal-code').removeClass('hide');
			$('.internal-code code').text(code);

			hljs.highlightElement($(`section.${currentType} .customCode .editor`)[0]);
			hljs.highlightElement($('.internal-code code')[0]);

			const val = loadValue('internal_code');
			if(val && val === 'opened') {
				$("#internal-code").attr('open', true);
			}
		}

	} else {
		highlighter.highlight();
	}
}

const codeBuilder = {
	comment : '// declare your variables here',
	defaultSnippet : `\n<<markjsCode>> // don't remove it\n\nfunction filter() {\n  return true;\n}\n\nfunction each() {}\n\nfunction done() {}`,
	snippet : '',

	build : function(kind) {
		const jsCode = this.buildCode('js');
		if( !jsCode) return  '';

		$('.generated-code pre>code').text(jsCode);

		const jqCode = this.buildCode('jq');
		if(jqCode) {
			$('.generated-code pre>code').append('\n\n' + jqCode);
		}

		hljs.highlightElement($('.generated-code pre>code')[0]);

		$('.internal-code').addClass('hide');

		if(kind === 'internal') {
			return  this.buildCode(kind);
		}
	},

	buildCode : function(kind) {
		const info = tab.getSearchEditorInfo();
		if( !info) return  null;

		const unmark = kind === 'internal' ? true : $('.unmark-method input').prop('checked'),
			optionCode = this.buildOptions(kind, unmark);

		let code = '',
			str = '',
			text;

		if(kind === 'jq') {
			code = `$('selector')` + (unmark ? `.unmark({\n  'done' : () => {\n    $('selector')` : '');

		} else if(kind === 'js') {
			code = `const instance = new Mark(document.querySelector('selector'));\ninstance` + (unmark ? `.unmark({\n  'done' : () => {\n    instance` : '');

		} else {
			const time = `\n    time = performance.now();`,
				selector = tab.getTestEditorInfo().selector;
			if(jqueryMark) {
				code = `let options;\nconst context = $('${selector}');\n`;
				code += `context.unmark({\n  done : () => {${time}\n    context`;

			} else {
				code = `let options;\nconst instance = new Mark(document.querySelector('${selector}'));\ninstance.unmark({\n  done : () => {${time}\n    instance`;
			}
		}

		if(info && (text = info.editor.toString().trim()).length) {
			switch(currentType) {
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
		}

		if( !str) {
			$('.generated-code code').text('');
			log(`Missing search parameter\n`, true);
			return  '';
		}

		code += str + (unmark ? '\n  }\n});' : '');

		code = this.buildCustomCode(code, kind);

		if(kind !== 'internal') {
			code = (kind === 'jq' ? '//jQuery\n' : kind === 'js' ? '//javascript\n' : '') + code;
		}

		return  code;
	},

	buildCustomCode : function(code, kind) {
		let text;
		const reg = /\s+/g,
			editor = types[currentType].customCodeEditor;

		if(editor && (text = editor.toString()) && /<<markjsCode>>/.test(text)) {
			if(kind === 'internal') {
				const ranges = currentType === 'ranges',
					every = ranges || !isChecked('acrossElements'),
					// necessary for the next/previous buttons functionality
					fn = `highlighter.flagStartElement(element, ${oldLibrary || ranges ? null : 'info'}, ${every})`,
					eachParam = this.getEachParameters(),
					doneParam = this.getDoneParameters();

				text = addCode(text, fn, eachParam, /\bfunction\s+each(\([^)]+\))\s*\{/);
				text = addCode(text, `highlighter.finish${doneParam}`, doneParam, /\bfunction\s+done(\([^)]+\))\s*\{/);
			}
			text = text.replace(this.comment, '');
			code = text.replace(/<<markjsCode>>(?:[ \t]\/\/.*)?/, code);
		}

		function addCode(text, fn, param, regex) {
			return  text.replace(regex, (m, gr1) => gr1.replace(reg, '') === param.replace(reg, '') ? `${m}\n  ${fn};\n` : m);
		}

		return  code;
	},

	buildOptions : function(kind, unmark) {
		const obj = types[currentType],
			indent = ' '.repeat(unmark ? 6 : 2),
			end = unmark ? ' '.repeat(4) : '';

		if( !obj) return  '{}';

		let opt, text, element, className, code = '';

		obj.options.forEach(option => {
			const selector = `section.${currentType} .${option}`,
				value = defaultOptions[option];

			if(value) {
				switch(value[1]) {
					case 'checkbox' :
						opt = $(selector + ' input').prop('checked');

						if(opt !== value[0]) {
							code += `${indent}${option} : ${opt},\n`;
						}
						break;

					case 'text' :
						text = $(selector + ' input').val();

						if(text && text !== value[0]) {
							code += `${indent}${option} : '${text}',\n`;

							if(option === 'element') {
								element = text;

							} else if(option === 'className') {
								className = text;
							}
						}
						break;

					case 'editor' :
						if(option !== 'accuracyObject') {
							const editor = tab.getOptionEditor(option);

							if(editor && (text = editor.toString().trim()).length) {
								code += `${indent}${option} : ${text},\n`;
							}
						}
						break;

					case 'select' :
						opt = $(selector + ' select').val();

						if(opt !== value[0]) {
							if(opt === 'object') {
								const editor = tab.getOptionEditor('accuracyObject');

								if(editor && (text = editor.toString().trim()).length > 30) {
									code += `${indent}${option} : ${text},\n`;
								}

							} else {
								code += `${indent}${option} : '${opt}',\n`;
							}
						}
						break;

					case 'number' :
						if(option === 'iframesTimeout' && !isChecked('iframes')) break;

						opt = $(selector + ' input').val();

						if(opt !== value[0]) {
							code += `${indent}${option} : ${opt},\n`;
						}
						break;

					default : break;
				}
			}
		});

		code += this.buildCallbacks(kind, unmark);
		code = kind === 'internal' ? `options = {\n${code}}` : `{\n${code}}`;

		updateVariables(element, className);

		return  code;
	},

	buildCallbacks : function(kind, unmark) {
		let code = '',
			indent = ' '.repeat(unmark ? 6 : 2),
			end = unmark ? ' '.repeat(4) : '';

		const editor = types[currentType].customCodeEditor;

		if(editor) {
			const text = editor.toString();

			if(/\bfunction\s+filter\s*\(/.test(text)) {
				code += `${indent}filter : filter,\n`;
			}

			if(/\bfunction\s+each\s*\(/.test(text)) {
				code += `${indent}each : each,\n`;
			}

			if(/\bfunction\s+done\s*\(/.test(text)) {
				code += `${indent}done : done\n`;
			}

		} else {
			if(kind === 'internal') {
				code = `${code}${indent}done : highlighter.finish\n${end}`;

			} else if($('#callbacks').prop('checked')) {
				code = `${indent}filter : ${this.getFilterParameters()} => {},\n`;
				code += `${indent}each : ${this.getEachParameters()} => {},\n`;
				code = `${code}${indent}done : ${this.getDoneParameters()} => {}\n`;
			}
		}

		code = `${code}${end}`;

		return  code;
	},

	getFilterParameters : function() {
		if(currentType === 'string_' || currentType === 'array') {
			return  `(node, term, marks, count${oldLibrary ? '' : ', info'})`;

		} else if(currentType === 'regexp') {
			return  `(node, matchString, count${oldLibrary ? '' : ', info'})`;

		}
		return  `(node, range, matchString, index)`;
	},

	getEachParameters : function() {
		if(currentType === 'ranges') {
			return  `(element, range)`;
		}
		return  `(element${oldLibrary ? '' : ', info'})`;
	},

	getDoneParameters : function() {
		if(oldLibrary) {
			return  `(totalMarks)`;

		} else {
			const stats = currentType === 'string_' || currentType === 'array';
			return  `(totalMarks, totalMatches${stats ? ', termStats' : ''})`;
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

		if(obj.testEditorMode === 'text') {
			tab.setHtmlMode(null, false);
			textMode = true;
		}

		let json = this.serialiseOptions(`{"version":"${version}","library":"${library}","section":{`),
			editor = tab.getOptionEditor(obj.queryEditor),
			text;

		json += this.serialiseCustomCode();

		if(editor && (text = editor.toString().trim()).length) {
			json += `,"${obj.queryEditor}":${JSON.stringify(text)}`;
		}

		const info = tab.getTestEditorInfo();

		if(info && (text = info.editor.toString()).trim().length) {
			const mode = types[currentType].testEditorMode;

			if(mode === 'html') {
				// removes all mark elements from the text
				const regex = new RegExp(`<${markElement} data-markjs=[^>]+>((?:(?!</${markElement}>)[^])+)</${markElement}>`, 'g');
				let max = 20;    // just to be on the safe side

				while(--max > 0 && regex.test(text)) {
					text = text.replace(regex, '$1');
				}
			}
			json += `,"testString":{"mode":"${mode}","content":${JSON.stringify(text)}}`;
		}
		json += '}}';

		const jsonObj = Json.parseJson(json);
		if( !jsonObj) return  null;

		if(format) {
			json = JSON.stringify(jsonObj, null, '    ');
		}

		if(textMode) {
			tab.setTextMode();
		}

		return  json;
	},

	serialiseOptions : function(json) {
		const obj = types[currentType];

		let opt, text;
		json += `"type":"${currentType}"`;

		obj.options.forEach(option => {
			const selector = `section.${currentType} .${option}`,
				value = defaultOptions[option];

			if(value) {
				switch(value[1]) {
					case 'checkbox' :
						opt = $(selector + ' input').prop('checked');

						if(opt !== value[0]) {
							json += `,"${option}":${opt}`;
						}
						break;

					case 'text' :
						text = $(selector + ' input').val();

						if(text && text !== value[0]) {
							json += `,"${option}":"${text}"`
						}
						break;

					case 'editor' :
						if(option !== 'accuracyObject') {
							const editor = tab.getOptionEditor(option);

							if(editor && (text = editor.toString().trim()).length > 2) {
								json += `,"${option}":${JSON.stringify(text)}`;
							}
						}
						break;

					case 'select' :
						opt = $(selector + ' select').val();

						if(opt !== value[0]) {
							json += `,"${option}":"${opt}"`;

							if(opt === 'object') {
								const editor = tab.getOptionEditor('accuracyObject');

								if(editor && (text = editor.toString().trim()).length > 30) {
									json += `,"accuracyObject":${JSON.stringify(text)}`;
								}
							}
						}
						break;

					case 'number' :
						if(option === 'iframesTimeout' && !isChecked('iframes')) break;

						opt = $(selector + ' input').val();

						if(opt !== value[0]) {
							json += `,"${option}":${opt }`;
						}
						break;

					default : break;
				}
			}
		});

		return  json;
	},

	serialiseCustomCode : function() {
		let code;
		const editor = types[currentType].customCodeEditor;

		if(editor && (code = editor.toString().trim())) {
			return  `,"customCode":${JSON.stringify(code)}`;
		}
		return  '';
	},

	parseJson : function(str) {
		let json;
		try { json = JSON.parse(str); } catch(e) {
			log('\nFailed to parse this json\n' + e.message, true);
		}
		return  json;
	}
};

const highlighter = {

	highlight : function() {
		currentIndex = 0;
		tab.clear();
		codeBuilder.build('js-jq');

		if(currentType === 'string_' || currentType === 'array') {
			this.markStringArray();

		} else if(currentType === 'regexp') {
			this.markRegExp();

		} else if(currentType === 'ranges') {
			this.markRanges();
		}
	},

	highlightRawHtml : function(selector, length, forbid) {
		tab.clear(true);
		time = performance.now();

		const limited = oldLibrary || !dFlagSupport,
			open = '<mark data-markjs=[^>]+>',
			pattern = `(?<=${open}\s*)[^<]+(?=</mark>|${open})|(?<=</mark>)\s*(?:(?!${open})[^])+?(?=</mark>)`,
			groupPattern = `(?<=(${open})\s*)([^<]+)(?=(</mark>|${open}))|(?<=(</mark>))\s*((?:(?!${open})[^])+?)(?=(</mark>))`,
			regex = new RegExp(limited ? pattern : groupPattern, (limited ? '' : 'd') + 'g');

		markElement = 'mark';
		markElementSelector = `${selector} mark[data-markjs]`;

		let totalMarks = 0,
			totalMatches = 0,
			max = Math.max(2000 - length / 1000, 200);

		if( !limited && /firefox/i.test(window.navigator.userAgent)) {
			max = forbid ? 200 : 1000;
		}

		getContext(selector, jqueryMark).markRegExp(regex, {
			'acrossElements' : true,
			'separateGroups' : !oldLibrary && dFlagSupport,
			'filter' : function(n, m, t, info) {
				if(limited || info && info.matchStart) totalMatches++;

				totalMarks++;
				return  totalMatches < max;
			},
			'each' : (elem, info) => {
				if(oldLibrary) {
					$(elem).attr('data-markjs', 'start-1');

				} else {
					if(info.matchStart) {
						$(elem).attr('data-markjs', 'start-1');
					}
					if(info.groupIndex === 1 || info.groupIndex === 3 || info.groupIndex === 4 || info.groupIndex === 6) {
						$(elem).addClass('mark-element');

					} else if(info.groupIndex === 2 || info.groupIndex === 5) {
						$(elem).addClass('groups');
					}
				}
			},
			done : () => {
				if(totalMatches > max) {
					log(`Total highlighted matches are limited to ${max}\n`, false, true);
				}
				this.finish(totalMarks, totalMatches, null);
			}
		});
	},

	markStringArray : function() {
		const obj = tab.getSearchEditorInfo();
		if( !obj) return;

		const searchParameter = obj.editor.toString();
		if( !searchParameter) return;

		const hl = this,
			section = `section.${currentType}`,
			settings = this.getCurrentSettings(section);

		let count = 1;

		const options = {
			'element' : settings.elementName,
			'className' : settings.className,
			'separateWordSearch' : settings.separateWordSearch,
			'diacritics' : settings.diacritics,
			'caseSensitive' : settings.caseSensitive,
			'ignoreJoiners' : settings.ignoreJoiners,
			'acrossElements' : settings.acrossElements,

			'accuracy' : settings.accuracy,
			'wildcards' : settings.wildcards,

			'synonyms' : settings.synonyms,
			'ignorePunctuation' : settings.ignorePunctuation,
			'exclude' : settings.exclude,

			'filter' : (node, term, marks, count, info) => {
				return  true;
			},
			'each' : (elem, info) => {
				hl.flagStartElement(elem, info, !settings.acrossElements);
			},
			'debug' : $(`${section} .debug input`).prop('checked'),
			'done' : hl.finish
		};

		let parameter;

		if(currentType === 'array') {
			if( !oldLibrary) {
				options.cacheTextNodes = $(`${section} .cacheTextNodes input`).prop('checked');
				options.wrapAllRanges = $(`${section} .wrapAllRanges input`).prop('checked');
			}

			const array = this.tryEvaluate(searchParameter, obj.selector, 'Array');
			if( !array) return;

			parameter = array;
			log(`Search parameter 'Array' : ${searchParameter}\n`);

		} else {
			parameter = searchParameter;
			log(`Search parameter 'String' : '${searchParameter}'\n`);
		}

		settings.context.unmark({
			'done' : () => {
				time = performance.now();
				settings.context.mark(parameter, options);
			}
		});
	},

	markRegExp : function() {
		const obj = tab.getSearchEditorInfo();
		if( !obj) return;

		const searchParameter = obj.editor.toString();
		if( !searchParameter) return;

		const hl = this,
			section = `section.${currentType}`,
			settings = this.getCurrentSettings(section);

		let count = 1;

		const options = {
			'element' : settings.elementName,
			'className' : settings.className,
			'acrossElements' : settings.acrossElements,
			'separateGroups' : settings.separateGroups,
			'blockElementsBoundary' : settings.blockElementsBoundary,
			'cacheTextNodes' : settings.cacheTextNodes,
			'wrapAllRanges' : settings.wrapAllRanges,
			'exclude' : settings.exclude,

			'filter' : (node, match, totalMarks, info) => {
				return  true;
			},
			'each' : (elem, info) => {
				hl.flagStartElement(elem, info, !settings.acrossElements);
			},
			'debug' : $(`${section} .debug input`).prop('checked'),
			'done' : hl.finish,
		};

		const regex = this.tryEvaluate(searchParameter, obj.selector, 'RegExp');
		if( !regex) return;

		log(`Search parameter 'RegExp' : ${searchParameter}\n`);

		settings.context.unmark({
			'done' : () => {
				time = performance.now();
				settings.context.markRegExp(regex, options);
			}
		});
	},

	markRanges : function() {
		const obj = tab.getSearchEditorInfo();
		if( !obj) return;

		const searchParameter = obj.editor.toString();
		if( !searchParameter) return;

		const hl = this,
			section = `section.${currentType}`,
			settings = this.getCurrentSettings(section);

		let count = 1;

		const options = {
			'element' : settings.elementName,
			'className' : settings.className,
			'exclude' : settings.exclude,
			'wrapAllRanges' : settings.wrapAllRanges,
			'filter' : (node, range, match, counter) => {
				return  true;
			},
			'each' : (elem, range) => {
				hl.flagStartElement(elem, null, true);
			},
			'debug' : $(`${section} .debug input`).prop('checked'),
			'done' : hl.finish
		};

		const ranges = this.tryEvaluate(searchParameter, obj.selector, 'Ranges');
		if( !ranges) return;

		log(`Search parameter 'Ranges' : ${searchParameter}\n`);

		settings.context.unmark({
			'done' : () => {
				time = performance.now();
				settings.context.markRanges(ranges, options);
			}
		});
	},

	flagStartElement : function(elem, info, every) {
		if(every || !info || info.matchStart) {
			$(elem).attr('data-markjs', 'start-1');
		}
	},

	getCurrentSettings : function(section) {
		// disable contenteditable attribute for performance reason
		tab.setEditableAttribute(false);

		const obj = {},
			context = getContext(testContainerSelector, jqueryMark),
			elementName = $(`${section} .element input`).val(),
			className = $(`${section} .className input`).val();

		updateVariables(elementName, className);

		obj.context = context;
		obj.elementName = elementName;
		obj.className = className;
		obj.exclude = this.tryToEvaluate('exclude', 4) || [];
		obj.acrossElements = $(`${section} .acrossElements input`).prop('checked');

		if(currentType === 'string_' || currentType === 'array') {
			obj.separateWordSearch = $(`${section} .separateWordSearch input`).prop('checked');
			obj.diacritics = $(`${section} .diacritics input`).prop('checked');
			obj.caseSensitive = $(`${section} .caseSensitive input`).prop('checked');
			obj.ignoreJoiners = $(`${section} .ignoreJoiners input`).prop('checked');
			obj.accuracy = $(`${section} .accuracy select`).val();
			obj.wildcards = $(`${section} .wildcards select`).val();

			obj.synonyms = this.tryToEvaluate('synonyms', 8) || {};
			obj.ignorePunctuation = this.tryToEvaluate('ignorePunctuation', 4) || [];

			if(obj.accuracy === 'object') {
				const accuracy = this.tryToEvaluate('accuracyObject', 30);
				if(accuracy) {
					obj.accuracy = accuracy;
				}
			}

		} else if(currentType === 'regexp') {
			obj.separateGroups = $(`${section} .separateGroups input`).prop('checked');
			obj.blockElementsBoundary = $(`${section} .blockElementsBoundary input`).prop('checked');
		}

		if(currentType === 'array') {
			obj.cacheTextNodes = $(`${section} .cacheTextNodes input`).prop('checked');
		}

		if(currentType === 'array' || currentType === 'regexp' || currentType === 'ranges') {
			obj.wrapAllRanges = $(`${section} .wrapAllRanges input`).prop('checked');
		}

		return  obj;
	},

	tryToEvaluate : function(option, minLength) {
		const editor = tab.getOptionEditor(option);
		let text;

		if(editor && (text = editor.toString().trim()).length > minLength) {
			try {
				return  eval(`'use strict'; (${text})`);

			} catch(e) {
				log(`Failed to evaluate ${option} object:\n${e.message}`, true);
				$(`${section} .${option} .editor`).addClass('warning');
			}
		}
		return  null;
	},

	tryEvaluate : function(parameter, selector, name) {
		try {
			return  eval("'use strict';" + parameter);

		} catch(e) {
			log(`Failed to evaluate the ${name}:\n${e.message}`, true);
			$(selector).addClass('warning');
		}
		return  null;
	},

	finish : function(totalMarks, totalMatches, termStats) {
		let matchCount = totalMatches ? `totalMatches = ${totalMatches}\n` : '',
			totalTime = (performance.now() - time) | 0,
			stats = termStats ? toText(termStats, '\n\nTerms statics:') : '';

		log(`${matchCount}totalMarks = ${totalMarks}\nmark time = ${totalTime} ms${stats}`);

		marks = $(markElementSelector);
		startElements = marks.filter((i, elem) => $(elem).data('markjs') === 'start-1');

		if(marks.length > 0) {
			highlightMatch(0);

			if(markElement !== 'mark') {
				$(markElementSelector).addClass('custom-element');
			}
		}
		previousButton.css('opacity', 0.5);
		nextButton.css('opacity', marks.length ? 1 : 0.5);
		// restore contenteditable attribute
		tab.setEditableAttribute(true);
	}
};

function registerEvents() {

	$("body").on('mouseup', function() {
		$('body *').removeClass('warning');
	});

	$(".mark-type li").on('click', function() {
		tab.selectTab($(this).data('type'));
		tab.initTab();
	});

	$("#internal-code").on('toggle', function(e) {
		const attr = $(this).attr('open');
		saveValue('internal_code', attr ? 'opened' : 'closed');
	});

	$(".customCode details, .customCode details>summary").on('toggle', function(e) {
		const button = $(this).parents('.customCode').first().find('button.clear');

		if($(this).attr('open')) {
			const editor = types[currentType].customCodeEditor;

			if( !editor || !editor.toString().trim()) {
				tab.updateCustomCode(codeBuilder.snippet);
				scroll = false;
				runCode();
				scroll = true;
			}
			button.removeClass('hide');

		} else {
			button.addClass('hide');
		}
	});

	$(".blockElementsBoundary input").on('change', function(e) {
		tab.switchElements($(this), '.blockElements');
	});

	$("div.actions>input.copy").on('mouseup', function(e) {
		document.getSelection().selectAllChildren($(this).parent().parent()[0]);
		document.execCommand('copy');
		document.getSelection().removeAllRanges();
	});

	$("input[type=checkbox], input[type=number], select[name]").on('change', function(e) {
		codeBuilder.build('js-jq');
	});

	$("input[name], select[name], option[name], div.editor[name]").on('mouseenter', function(e) {
		if(showTooltips || e.ctrlKey || e.metaKey) {
			showTooltip($(this), e);
		}
	}).on('mouseleave', function() {
		$(this).powerTip('hide', true);
	});

	$('button.open-json-form').on('click', function() {
		if($('.json-form:visible').length) {
			$('.json-form').css('display', 'none');

		} else {
			$('.json-form').css('display', 'block');

			if(jsonEditor === null) {
				jsonEditor = CodeJar($('.json-form .editor')[0], () => {});

				jsonEditor.onUpdate(code => {
					$('button.import-json').attr('disabled', code.trim().length ? false : true);
				});
			}
			$('button.import-json').attr('disabled', jsonEditor.toString().trim().length ? false : true);
		}
	});

	$('.json-form>.close').on('click', function() {
		$(this).parent().css('display', 'none');
	});

	$('button.open-file-form').on('click', function() {
		if($('.file-form:visible').length) {
			$('.file-form').css('display', 'none');

		} else {
			$('.file-form').css('display', 'block');
			$('.file-form .file-name').attr('placeholder', getFileName());
		}
	});

	$('.file-form>.close').on('click', function() {
		$(this).parent().css('display', 'none');
	});

	$('.file-form a.save-file').on('click', function(e) {
		const json = Json.buildJson(true);

		if(json) {
			let name = $('.file-form .file-name').val();

			if(name && !/\.json$/i.test(name)) {
				name = name.replace(/[.]+$/g, '') + '.json';
			}
			name = (name || getFileName());

			this.download = name;
			this.href = URL.createObjectURL(new Blob([json], { type : 'text/json' }));
			URL.revokeObjectURL(this.href);

			$('.file-form .file-name').val(name);
			saveValue(currentType + '-fileName', name);
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

function toText(obj, title, msg) {
	let text = '';

	for(let key in obj) {
		text += `\n${key} = ${obj[key]}`;
	}
	return  text ? title + text : msg ? title + msg : '';
}

function getFileName() {
	let name = loadValue(currentType + '-fileName');

	return  name || (currentType === 'string_' ? 'string' : currentType) + '-tab-session.json';
}

function showTooltip(elem, e) {
	const id = elem.attr('name');

	showHideInfo(id);

	if(elem.data('powertiptarget')) elem.powerTip('destroy');

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
	const separateGroups = isChecked('separateGroups'),
		acrossElements = isChecked('acrossElements'),
		info = $('article.options-info #' + id),
		elemsAE = info.find('.acrossElements').addClass('hide'),
		elemsSG = info.find('.separateGroups').addClass('hide');

	if(acrossElements) {
		elemsAE.each(function() {
			if($(this).hasClass('separateGroups')) {
				if(separateGroups) $(this).removeClass('hide');

			} else $(this).removeClass('hide');
		});
	}

	if(separateGroups) {
		elemsSG.each(function() {
			if($(this).hasClass('acrossElements')) {
				if(acrossElements) $(this).removeClass('hide');

			} else $(this).removeClass('hide');
		});
	}
}

function isChecked(option) {
	return  $(`section.${currentType} .${option} input`).prop('checked');
}

function log(message, error, warning) {
	if(error) {
		$('header .mark-type li.selected').addClass('warning');
		message = `<span style="color:red">${message}</span><br>`;
		$('.results code').html(message);
		return;

	} else if(warning) {
		message = `<span style="color:#ca5500">${message}</span><br>`;
	}

	$('.results code').append(message);
}

function isNullOrUndefined(prop) {
	return  typeof prop === 'undefined' || prop === null;
}

function previousMatch(elem) {
	if( !startElements.length) return;

	if(--currentIndex <= 0) {
		currentIndex = 0;
		previousButton.css('opacity', 0.5);
	}
	highlightMatch(currentIndex);

	nextButton.css('opacity', 1);
}

function nextMatch(elem) {
	if( !startElements.length) return;

	if(++currentIndex >= startElements.length - 1) {
		currentIndex = startElements.length - 1;
		nextButton.css('opacity', 0.5);
	}
	highlightMatch(currentIndex);

	previousButton.css('opacity', 1);
}

function highlightMatch(index) {
	marks.removeClass('current');

	let startElem = startElements.eq(index);
	if(startElem.length) {
		let found = false;

		marks.each(function(i, el) {
			if( !found) {
				if(el === startElem[0]) found = true;

			} else if($(this).data('markjs') === 'start-1') return  false;    // the start of the next 'start element' means the end of the current match

			if(found) {
				$(this).addClass('current');
				$(this).find(markElement + '[data-markjs]').addClass('current');
			}
		});

		scrollIntoView(startElem);
	}
}

function scrollIntoView(elem) {
	if(scroll && elem.length) {
		elem[0].scrollIntoView(true);
		window.scrollBy(0, -10000);
		//window.scrollBy(0, -60);
	}
}

function detectLibrary() {
	const info = getLibrariesInfo();
	let both = info.jquery && info.javascript && info.jquery !== info.javascript;

	if(both) {
		const lib = loadValue('library');

		if( !lib || lib === 'standard') {
			jqueryMark = info.jquery === 'standard';
			oldLibrary = true;

		} else if(lib && lib === 'advanced') {
			jqueryMark = info.jquery === 'advanced';
			oldLibrary = false;
		}

	} else {
		if(info.javascript) {
			jqueryMark = false;
			oldLibrary = info.javascript === 'standard';

		} else if(info.jquery) {
			jqueryMark = true;
			oldLibrary = info.jquery === 'standard';
		}
	}

	$('.switch-library').removeClass('hide');
	$('.switch-library input').prop('checked', !oldLibrary);

	if( !both) {
		$('.switch-library input').attr('disabled', true);
		$('.switch-library label').css('opacity', .4);
	}

	setVisibility();
}

function getLibrariesInfo() {
	const info = {};
	let jq = false, js = false;

	$('head script[src]').each(function(i, elem) {
		const src = elem.getAttribute('src');
		if(/\/jquery\.mark\./i.test(src)) jq = true;
		if(/\/mark\./i.test(src)) js = true;
	});

	if(jq) {
		info.jquery = isOldLibrary(true) ? 'standard' : 'advanced';
	}
	if(js) {
		info.javascript = isOldLibrary(false) ? 'standard' : 'advanced';
	}
	return  info;
}

function isOldLibrary(jquery) {
	let old = false;
	getContext('#playground-article h1', jquery).markRegExp(/^\s*\w/g, {
		'filter' : (n, m, t, info) => {
			if( !info) old = true;
			return  false;
		}
	});
	return  old;
}

function getContext(selector, jquery) {
	return  jquery ? $(selector) : new Mark(document.querySelector(selector));
}

function setVisibility() {
	if(oldLibrary) {
		$('.new').addClass('hide');
		$('.old-library').removeClass('hide');

	} else {
		$('.new').removeClass('hide');
		$('.old-library').addClass('hide');
	}
	$('.switch-library label').text((oldLibrary ? 'standard' : 'advanced') + ' library');

	library = oldLibrary ? 'standard' : 'advanced';
}

function loadValue(key) {
	try {
		return  localStorage.getItem(key);
	} catch(e) {
		log('localStorage ' + e.message);
	}
	return  null;
}

function saveValue(key, value) {
	try {
		const saved = localStorage.getItem(key);

		if(value !== saved) {
			localStorage.setItem(key, value);
		}
	} catch(e) {
		log('localStorage ' + e.message);
	}
}

function testSaveLoad() {
	let json, str, testStr;

	for(const type in types) {
		tab.selectTab(type);
		tab.initializeEditors();

		testStr = testJSONs[type];

		json = Json.parseJson(testStr);
		importer.setOptions(type, json);

		str = Json.buildJson();

		if( !str || str !== testStr) {
			console.log(`The 'save/load' test for ${type} is failed`);
			console.log(str);

		} else {
			console.log(`The 'save/load' test for ${type} is passed`);
		}
	}
}























