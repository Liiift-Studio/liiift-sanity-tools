// Returns a zeroed-out fontkit-shaped placeholder object used when no font binary is available
import * as fontkit from 'fontkit';
import slugify from 'slugify';

/** Reads font files and returns name/subfamily metadata without writing to Sanity */
export async function getEmptyFontKit({ title, files, weightKeywordList, italicKeywordList }) {

	let fontNames = {};
	let subfamilies = {};

	for (var i = 0; i < files.length; i++) {

		const file = files[i];
		const fontBuffer = await readFontFile(file);
		const font = fontkit.create(fontBuffer);

		let weightName = font?.name?.records?.preferredSubfamily ? font?.name?.records?.preferredSubfamily : font?.name?.records?.fontSubfamily;
		weightName = weightName?.en ? weightName.en : weightName.constructor == Object ? weightName[Object.keys(weightName)[0]] : weightName;

		let variableFont = font?.variationAxes && Object.keys(font.variationAxes).length > 0 ? true : false;
		let subfamilyName = font.familyName.toLowerCase().trim().replace(title.toLowerCase().trim(), '').trim();
		let fontTitle = font?.fullName.toLowerCase().trim();

		weightKeywordList.forEach(keyword => {
			const kw = keyword.toLowerCase().trim();

			if (fontTitle.includes(kw)) {
				fontTitle = fontTitle.replace(kw, '');
			}
			if (subfamilyName.includes(kw)) {
				subfamilyName = subfamilyName.replace(kw, '');
			}
		});

		italicKeywordList.forEach(keyword => {
			const kw = keyword.toLowerCase().trim();

			if (subfamilyName.includes(kw)) {
				subfamilyName = subfamilyName.replace(kw, '');
			}
			if (fontTitle.includes(kw)) {
				fontTitle = fontTitle.replace(kw, '');
			}
		});

		fontTitle = fontTitle.trim().split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

		subfamilyName = subfamilyName.trim();
		subfamilyName = (subfamilyName == '') ? 'Regular' : subfamilyName.split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');


		let id = slugify(fontTitle.toLowerCase().trim());
		if (variableFont && !id.endsWith('-vf')) {
			id = id + '-vf';
			fontTitle = fontTitle + ' VF';
		}

		// add subfamily to list
		if (!subfamilies[id]) {
			subfamilies[id] = [subfamilyName];
		} else if (subfamilies[id].indexOf(subfamilyName) == -1) {
			subfamilies[id] = [...subfamilies[id], subfamilyName];
		}

		if (!fontNames[id]) {
			fontNames[id] = [{
				file: file.name,
				fullName: font.fullName,
				familyName: font.familyName,
				subFamily: subfamilyName,
			}];
		} else if (fontNames[id].indexOf(file.name) == -1) {
			fontNames[id].push({
				file: file.name,
				fullName: font.fullName,
				familyName: font.familyName,
				subFamily: subfamilyName,
			})
		}


	}

	console.log('font names : ', fontNames);
}

/** Reads a font file and returns its content as a Uint8Array */
const readFontFile = (file) => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			resolve(new Uint8Array(event.target.result));
		};

		reader.onerror = (error) => { reject(error); };
		reader.readAsArrayBuffer(file);
	});
};
