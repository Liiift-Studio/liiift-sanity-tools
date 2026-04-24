// Font weight and style keyword lists with alternative spellings for font name parsing

const coreWeights = ["Hairline", "ExtraThin", "Thin", "Mager", "Maigre", "ExtraLight", "Light", "Chiaro", "Lite", "Leicht", "Demi", "Book", "Buch", "Regular", "Normal", "Medium", "Stark", "Thick", "Kräftig", "Viertelfett", "Halbfett", "Dreiviertelfett", "Dark", "Bold", "Neretto", "Gras", "Fett", "Extrafett", "Black", "Nero", "Heavy", "Nerissimo", "Ultra", "Fat", "Poster"];
const modifiers = ["Demi", "Semi", "Extra", "Ultra", "Super", "Plus"];

const coreItalics = ["Italic", "Slant", "Oblique", "Cursive", "Rotalic", "Reverse", "Crab Claw", "Crabclaw", "South Paw", "Southpaw", "Backwards", "Backslant", "Backslanted", "Back Slant"];

/** All known abbreviation-to-canonical-name mappings, sorted alphabetically */
const alternativeSpelling = {
	Backslant: ["Bsl"],
	Backwards: ["Bck"],
	Black: ["Blak", "Blk"],
	Bold: ["Bd", "Bld"], // B omitted — too ambiguous
	Condensed: ["Cond", "Cnd"],
	Crabclaw: ["Crab", "Claw"],
	Cursive: ["Cur"],
	Dark: ["Drk"],
	Expanded: ["Exp"],
	Extra: ["Xt", "Xtra", "Xtr", "X"], // X omitted as standalone — too ambiguous
	ExtraBlack: ["Xblk", "XBlk", "Xblck", "XBlck"],
	ExtraBold: ["Xbd", "XBd", "Xbld", "XBld", "Xbold", "XBold", "ExBold", "Exbold", "Exbd", "ExBd", "Exbld", "ExBld"],
	ExtraCondensed: ["XCond", "Xcnd"],
	ExtraExpanded: ["XExp"],
	ExtraLight: ["Xlight", "XLight", "Xlt", "XLt", "Xlgt", "XLgt", "Xl", "XL", "Xlght", "XLght"],
	ExtraThin: ["Xthin", "Xthn", "Xth", "XThin", "XThn", "XTh", "XT"],
	Extended: ["Ext"],
	Hairline: ["Hl", "Hln", "Hlnn", "Hlnne", "Hlnnne"],
	Italic: ["Ital", "It"],
	Light: ["Lt", "Lght"],
	Medium: ["Med", "Md", "md", "med"],
	Oblique: ["Obl"],
	Plus: ["Pls"],
	Regular: ["Reg", "Rg"],
	Reverse: ["Rev"],
	Rotalic: ["Rot"],
	SemiBold: ["SmBd", "Sb", "Sbd", "Sbld", "Sbold", "Semibd", "SemiBd", "Semibld", "SemiBld", "semiBd", "semiBld"],
	Slant: ["Sl"],
	Southpaw: ["South", "Paw"],
	Super: ["Supr"],
	Thin: ["Thn"],
	Ultra: ["Ult", "Ultre", "Ul", "Ulta"],
	XX: ["XXt", "XXtra", "XXtr", "XX"],
	XXBlack: ["XXblk", "XXBlk", "XXblck", "XXBlck"],
	XXLight: ["XXlight", "XXLight", "XXlt", "XXLt", "XXlgt", "XXLgt", "XXl", "XXL", "XXlght", "XXLght"],
	XXX: ["XXXt", "XXXtra", "XXXtr", "XXX"],
	XXXLight: ["XXXlight", "XXXLight", "XXXlt", "XXXLt", "XXXlgt", "XXXLgt", "XXXl", "XXXL", "XXXlght", "XXXLght"],
};

/** Maps an abbreviated font name word back to its canonical weight/style name */
export function reverseSpellingLookup(str) {
	// Exact match first to avoid partial collisions
	let exactMatch = "";
	Object.keys(alternativeSpelling).forEach(function (key) {
		alternativeSpelling[key].forEach(function (alternative) {
			if (str === alternative) {
				exactMatch = key;
			}
		});
	});
	if (exactMatch) return exactMatch;

	// Fall back to longest word-boundary match
	let result = "";
	let longestMatch = 0;
	Object.keys(alternativeSpelling).forEach(function (key) {
		alternativeSpelling[key].forEach(function (alternative) {
			const regex = new RegExp(`\\b${alternative}\\b`);
			if (regex.test(str) && alternative.length > longestMatch) {
				result = key;
				longestMatch = alternative.length;
			}
		});
	});
	return result;
}

/** Expands each word in a string from abbreviation to its canonical weight/style name */
export function expandAbbreviations(str) {
	if (!str) return str;
	return str.split(' ')
		.map(word => {
			const expanded = reverseSpellingLookup(word);
			return expanded || word;
		})
		.join(' ');
}

/** Removes weight and style keywords from a string, returning only the remainder */
export function removeWeightNames(str) {
	if (!str) return str;
	return str.split(' ')
		.map(word => {
			coreWeights.forEach((weight) => {
				if (word === weight) word = "";
				modifiers.forEach((modifier) => {
					if (word === modifier || modifier + weight === word) word = "";
				});
			});
			const expanded = reverseSpellingLookup(word);
			if (expanded) return "";
			return word;
		})
		.join(' ')
		.trim();
}

/** Generates comprehensive weight and italic keyword lists including all alternative spellings */
export function generateStyleKeywords() {
	let weightKeywordList = [];
	let italicKeywordList = [];

	// Start with all core weights
	weightKeywordList = [...coreWeights];

	// Add all modifier + weight combinations
	modifiers.forEach(modifier => {
		coreWeights.forEach(weight => {
			weightKeywordList.push(modifier + weight);
		});
	});

	// Add standalone modifiers
	weightKeywordList = [...weightKeywordList, ...modifiers];

	// Set up italic keywords
	italicKeywordList = [...coreItalics];

	// Expand weight list with alternative spellings
	weightKeywordList = weightKeywordList.map(function (el) {
		var newEls = [];
		Object.keys(alternativeSpelling).forEach(function (key) {
			if (el.indexOf(key) !== -1) {
				alternativeSpelling[key].forEach(function (alternative) {
					let newSpelling = el.replace(key, alternative);
					newEls.push(newSpelling);
					Object.keys(alternativeSpelling).forEach(function (key2) {
						if (newSpelling.indexOf(key2) !== -1) {
							alternativeSpelling[key2].forEach(function (alternative2) {
								let newSpelling2 = newSpelling.replace(key2, alternative2);
								newEls.push(newSpelling2);
								Object.keys(alternativeSpelling).forEach(function (key3) {
									if (newSpelling2.indexOf(key3) !== -1) {
										alternativeSpelling[key3].forEach(function (alternative3) {
											newEls.push(newSpelling2.replace(key3, alternative3));
										});
									}
								});
							});
						}
					});
				});
			}
		});
		newEls.push(el);
		return newEls;
	}).reduce(function (a, b) {
		return a.concat(b);
	});

	// Expand italic list with alternative spellings
	italicKeywordList = italicKeywordList.map(function (el) {
		var newEls = [];
		Object.keys(alternativeSpelling).forEach(function (key) {
			if (el.indexOf(key) !== -1) {
				alternativeSpelling[key].forEach(function (alternative) {
					newEls.push(el.replace(key, alternative));
				});
			}
		});
		newEls.push(el);
		return newEls;
	}).reduce(function (a, b) {
		return a.concat(b);
	});

	// Sort longest to shortest so more specific matches win
	weightKeywordList = weightKeywordList.sort((a, b) => b.length - a.length);
	italicKeywordList = italicKeywordList.sort((a, b) => b.length - a.length);

	// Deduplicate
	weightKeywordList = weightKeywordList.filter((item, pos) => weightKeywordList.indexOf(item) === pos);
	italicKeywordList = italicKeywordList.filter((item, pos) => italicKeywordList.indexOf(item) === pos);

	return { weightKeywordList, italicKeywordList };
}
