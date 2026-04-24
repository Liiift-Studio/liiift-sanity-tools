// Font weight and style keyword lists with alternative spellings for font name parsing

const coreWeights = ["Hairline", "Thin", "Mager", "Maigre", "Light", "Chiaro", "Lite", "Leicht", "Demi", "Book", "Buch", "Regular", "Normal", "Medium", "Stark", "Thick", "Kräftig", "Viertelfett", "Halbfett", "Dreiviertelfett", "Dark", "Bold", "Neretto", "Gras", "Fett", "Black", "Nero", "Heavy", "Nerissimo", "Ultra", "Fat", "Poster"];
const modifiers = ["Demi", "Semi", "Extra", "Ultra", "Super", "Plus"];

const coreItalics = ["Italic", "Slant", "Oblique", "Cursive", "Rotalic", "Reverse", "Crab Claw", "Crabclaw", "South Paw", "Southpaw", "Backwards", "Backslant", "Backslanted"];

const alternativeSpelling = {
	Hairline: ["Hl", "Hln", "Hlnn", "Hlnne", "Hlnnne"],
	Extrathin: ["Xthin", "Xthn", "Xth", "Xt", "Xthin", "Xthn", "Xth", "Xtra", "Xtr", "XThin", "XThn", "XTh", "XT", "XThin", "XThn", "XTh"],
	Thin: ["Thn"],
	Extralight: ["Xlight", "XLight", "Xlt", "XLt", "Xlgt", "XLgt", "Xl", "XL", "Xlt", "XLt", "Xlght", "XLght"],
	Light: ["Lt", "Lght"],
	Regular: ["Reg", "Rg"],
	Dark: ["Drk"],
	Bold: ["Bd", "Bld"], // We're not using B because its too ambiguous
	Extrabold: ["Xbld", "XBld", "XBd", "Xbd", "XBold", "Xbold"],
	Black: ["Blak", "Blk"],
	Extrablack: ["XBlak", "XBlk", "XBlack", "Xblak", "Xblk", "Xblack"],
	Extra: ["Xt", "Xtra", "Xtr", "Ex"], // We're not using X because its too ambiguous
	Ultra: ["Ult", "Ultre", "Ul", "Ulta"],
	Super: ["Supr"],
	Plus: ["Pls"],
	Italic: ["Ital", "It"],
	Oblique: ["Obl"],
	Slant: ["Sl"],
	Cursive: ["Cur"],
	Rotalic: ["Rot"],
	Reverse: ["Rev"],
	Crabclaw: ["Crab", "Claw"],
	Southpaw: ["South", "Paw"],
	Backwards: ["Back", "Bck"],
	Backslant: ["Bsl"],
};

/** Maps an abbreviated font name string back to its full weight/style word */
export function reverseSpellingLookup(str) {
	let result = "";
	Object.keys(alternativeSpelling).forEach(function (key) {
		alternativeSpelling[key].forEach(function (alternative) {
			if (str.indexOf(alternative) !== -1) {
				result = key;
			}
		});
	});
	return result;
}

/** Generates comprehensive weight and italic keyword lists including alternative spellings */
export function generateStyleKeywords() {
	let weightKeywordList = [];
	let italicKeywordList = [];

	// All core weights
	weightKeywordList = [...coreWeights];
	italicKeywordList = [...coreItalics];


	// Add in modifiers
	coreWeights.forEach(function (weight) {
		modifiers.forEach(function (modifier) {
			weightKeywordList.push(modifier + weight);
			weightKeywordList.push(modifier + weight.toLowerCase());
		});
	});

	// Add in alternative spellings
	weightKeywordList = weightKeywordList.map(function (el) {
		var newEls = [];
		Object.keys(alternativeSpelling).forEach(function (key) {
			if (el.indexOf(key) !== -1) {
				alternativeSpelling[key].forEach(function (alternative) {
					let newSpelling = el.replace(key, alternative)
					newEls.push(newSpelling);

					// Check if there is a second word to replace
					Object.keys(alternativeSpelling).forEach(function (key2) {
						if (newSpelling.indexOf(key2) !== -1) {
							alternativeSpelling[key2].forEach(function (alternative2) {
								let newSpelling2 = newSpelling.replace(key2, alternative2)
								newEls.push(newSpelling2);


								// Check if there is a third word to replace
								Object.keys(alternativeSpelling).forEach(function (key3) {
									if (newSpelling2.indexOf(key3) !== -1) {
										alternativeSpelling[key3].forEach(function (alternative3) {
											let newSpelling3 = newSpelling2.replace(key3, alternative3)
											newEls.push(newSpelling3);
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

	// sort by longest to shortest
	weightKeywordList = weightKeywordList.sort(function (a, b) {
		return b.length - a.length;
	});

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

	// sort by longest to shortest
	italicKeywordList = italicKeywordList.sort(function (a, b) {
		return b.length - a.length;
	});

	// Remove duplicates
	weightKeywordList = weightKeywordList.filter(function (item, pos) {
		return weightKeywordList.indexOf(item) == pos;
	});
	italicKeywordList = italicKeywordList.filter(function (item, pos) {
		return italicKeywordList.indexOf(item) == pos;
	});

	return { weightKeywordList, italicKeywordList }

}
