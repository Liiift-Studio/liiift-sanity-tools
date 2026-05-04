// Sanity schema field definition for the OpenType features section — uses SetOTF component for auto-detection
import { SetOTF } from '../components/SetOTF.jsx';

export const openTypeField = {
	title: 'Opentype',
	name: 'openType',
	type: 'object',
	group: 'openType',
	hidden: false,
	components: { input: SetOTF },
	options: { collapsible: true },
	fields: [
	{
		title:'Features',
		name:'features',
		type:'array',
		of:[{type:'string'}],
		options:{
			list: [
				{ title: "All Alternates", value: "allAlternates"},
				{ title: "All Caps", value: "allCaps"},
				{ title: "Alternate Annotation", value: "alternateAnnotation"},
				{ title: "Alternative Fractions", value: "alternativeFractions"},
				{ title: "Capitals To Small Caps", value: "capitalsToSmallCaps"},
				{ title: "Capitals to Petite Caps", value: "capitalsToPetiteCaps"},
				{ title: "Case Sensitive Forms", value: "caseSensitiveForms"},
				{ title: "Contextual Alternates", value: "contextualAlternates"},
				{ title: "Contextual Ligatures", value: "contextualLigatures"},
				{ title: "Contextual Swash", value: "contextualSwash"},
				{ title: "Denominator", value: "denominator"},
				{ title: "Discretionary Ligatures", value: "discretionaryLigatures"},
				{ title: "Fractions", value: "fractions"},
				{ title: "Glyph Decomposition", value: "glyphDecomposition"},
				{ title: "Historical Forms", value: "historicalForms"},
				{ title: "Historical Ligatures", value: "historicalLigatures"},
				{ title: "Initial Form", value: "initialForm"},
				{ title: "Isolated Form", value: "isolatedForm"},
				{ title: "Justified Alternates", value: "justifiedAlternates"},
				{ title: "Localized Forms", value: "localizedForms"},
				{ title: "Mark Positioning", value: "markPositioning"},
				{ title: "Mark Positioning via Subs", value: "markPositioningViaSubs"},
				{ title: "Mark to Mark Positioning", value: "markToMarkPositioning"},
				{ title: "Mathematical Greek", value: "mathematicalGreek"},
				{ title: "Medial Form", value: "medialForm"},
				{ title: "Numerator", value: "numerator"},
				{ title: "Ordinals", value: "ordinals"},
				{ title: "Ornaments", value: "ornaments"},
				{ title: "Petite Caps", value: "petiteCaps"},
				{ title: "Proportional Lining", value: "proportionalLining"},
				{ title: "Proportional Oldstyle", value: "proportionalOldstyle"},
				{ title: "Required Ligatures", value: "requiredLigatures"},
				{ title: "Scientific Inferiors", value: "scientificInferiors"},
				{ title: "Slashed Zero", value: "slashedZero"},
				{ title: "Small Caps", value: "smallCaps"},
				{ title: "Standard Ligatures", value: "standardLigatures"},
				{ title: "Stylistic Alternates", value: "stylisticAlternates"},
				{ title: "Subscript", value: "subscript"},
				{ title: "Superscript", value: "superscript"},
				{ title: "Swash", value: "swash"},
				{ title: "Tabular Lining", value: "tabularLining"},
				{ title: "Tabular Oldstyle", value: "tabularOldstyle"},
				{ title: "Terminal Form", value: "terminalForm"},
				{ title: "Titling Alternates", value: "titlingAlternates"},
				{ title: "Unicase", value: "unicase"},
				{ title: "All Stylistic Sets", value: "allStylisticSets"},
				{ title: "Stylistic Set 1", value: "stylisticSet1"},
				{ title: "Stylistic Set 2", value: "stylisticSet2"},
				{ title: "Stylistic Set 3", value: "stylisticSet3"},
				{ title: "Stylistic Set 4", value: "stylisticSet4"},
				{ title: "Stylistic Set 5", value: "stylisticSet5"},
				{ title: "Stylistic Set 6", value: "stylisticSet6"},
				{ title: "Stylistic Set 7", value: "stylisticSet7"},
				{ title: "Stylistic Set 8", value: "stylisticSet8"},
				{ title: "Stylistic Set 9", value: "stylisticSet9"},
				{ title: "Stylistic Set 10", value: "stylisticSet10"},
				{ title: "Stylistic Set 11", value: "stylisticSet11"},
				{ title: "Stylistic Set 12", value: "stylisticSet12"},
				{ title: "Stylistic Set 13", value: "stylisticSet13"},
				{ title: "Stylistic Set 14", value: "stylisticSet14"},
				{ title: "Stylistic Set 15", value: "stylisticSet15"},
				{ title: "Stylistic Set 16", value: "stylisticSet16"},
				{ title: "Stylistic Set 17", value: "stylisticSet17"},
				{ title: "Stylistic Set 18", value: "stylisticSet18"},
				{ title: "Stylistic Set 19", value: "stylisticSet19"},
				{ title: "Stylistic Set 20", value: "stylisticSet20"}
			],
			layout: 'checkbox',
		},
	},
	{
		title:'All Alternates',
		name:'allAlternates',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("allAlternates"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. All Alternates',
				initialValue:'All Alternates',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. aalt',
				initialValue:'aalt',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'All Caps',
		name:'allCaps',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("allCaps"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. allCaps',
				initialValue:'allCaps',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. case cpsp',
				initialValue:'case cpsp',
			},	
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Alternate Annotation',
		name:'alternateAnnotation',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("alternateAnnotation"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Alternate Annotation',
				initialValue:'Alternate Annotation',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. nalt',
				initialValue:'nalt',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Alternative Fractions',
		name:'alternativeFractions',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("alternativeFractions"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Alternative Fractions',
				initialValue:'Alternative Fractions',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. afrc',
				initialValue:'afrc',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Capitals To Small Caps',
		name:'capitalsToSmallCaps',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("capitalsToSmallCaps"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Capitals to Small Caps',
				initialValue:'Capitals to Small Caps',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. c2sc',
				initialValue:'c2sc',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Capitals to Petite Caps',
		name:'capitalsToPetiteCaps',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("capitalsToPetiteCaps"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Capitals to Petite Caps',
				initialValue:'Capitals to Petite Caps',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. c2pc',
				initialValue:'c2pc',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Case Sensitive Forms',
		name:'caseSensitiveForms',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("caseSensitiveForms"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Case Sensitive Forms',
				initialValue:'Case Sensitive Forms',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. case',
				initialValue:'case',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	}, 
	{
		title:'Contextual Alternates',
		name:'contextualAlternates',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("contextualAlternates"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Contextual Alternates',
				initialValue:'Contextual Alternates',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. calt',
				initialValue:'calt',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Contextual Ligatures',
		name:'contextualLigatures',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("contextualLigatures"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Contextual Ligatures',
				initialValue:'Contextual Ligatures',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. clig',
				initialValue:'clig',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Contextual Swash',
		name:'contextualSwash',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("contextualSwash"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Contextual Swash',
				initialValue:'Contextual Swash',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. cswh',
				initialValue:'cswh',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Denominator',
		name:'denominator',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("denominator"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Denominator',
				initialValue:'Denominator',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. dnom',
				initialValue:'dnom',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Discretionary Ligatures',
		name:'discretionaryLigatures',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("discretionaryLigatures"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Discretionary Ligatures',
				initialValue:'Discretionary Ligatures',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. dlig',
				initialValue:'dlig',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Fractions',
		name:'fractions',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("fractions"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Fractions',
				initialValue:'Fractions',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. frac',
				initialValue:'frac',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Glyph Decomposition',
		name:'glyphDecomposition',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("glyphDecomposition"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Glyph Decomposition',
				initialValue:'Glyph Decomposition',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ccmp',
				initialValue:'ccmp',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Historical Forms',
		name:'historicalForms',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("historicalForms"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Historical Forms',
				initialValue:'Historical Forms',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. hist',
				initialValue:'hist',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Historical Ligatures',
		name:'historicalLigatures',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("historicalLigatures"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Historical Ligatures',
				initialValue:'Historical Ligatures',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. hlig',
				initialValue:'hlig',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Initial Form',
		name:'initialForm',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("initialForm"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Initial Form',
				initialValue:'Initial Form',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. init',
				initialValue:'init',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Isolated Form',
		name:'isolatedForm',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("isolatedForm"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Isolated Form',
				initialValue:'Isolated Form',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. isol',
				initialValue:'isol',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Justified Alternates',
		name:'justifiedAlternates',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("justifiedAlternates"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Justification Alternates',
				initialValue:'Justification Alternates',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. jalt',
				initialValue:'jalt',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Localized Forms',
		name:'localizedForms',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("localizedForms"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Localized Forms',
				initialValue:'Localized Forms',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. locl',
				initialValue:'locl',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Mark Positioning',
		name:'markPositioning',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("markPositioning"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Mark Positioning',
				initialValue:'Mark Positioning',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. mark',
				initialValue:'mark',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Mark Positioning via Subs',
		name:'markPositioningViaSubs',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("markPositioningViaSubs"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Mark Positioning via Subs',
				initialValue:'Mark Positioning via Subs',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. mset',
				initialValue:'mset',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Mark to Mark Positioning',
		name:'markToMarkPositioning',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("markToMarkPositioning"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Mark to Mark Positioning',
				initialValue:'Mark to Mark Positioning',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. mkmk',
				initialValue:'mkmk',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Mathematical Greek',
		name:'mathematicalGreek',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("mathematicalGreek"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Mathematical Greek',
				initialValue:'Mathematical Greek',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. mgrk',
				initialValue:'mgrk',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Medial Form',
		name:'medialForm',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("medialForm"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Medial Form',
				initialValue:'Medial Form',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. medi',
				initialValue:'medi',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Numerator',
		name:'numerator',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("numerator"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Numerator',
				initialValue:'Numerator',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. numr',
				initialValue:'numr',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Ordinals',
		name:'ordinals',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("ordinals"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Ordinals',
				initialValue:'Ordinals',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ordn',
				initialValue:'ordn',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Ornaments',
		name:'ornaments',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("ornaments"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Ornaments',
				initialValue:'Ornaments',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ornm',
				initialValue:'ornm',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Petite Caps',
		name:'petiteCaps',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("petiteCaps"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Petite Caps',
				initialValue:'Petite Caps',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. pcap',
				initialValue:'pcap',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Proportional Lining',
		name:'proportionalLining',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("proportionalLining"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Proportional Lining',
				initialValue:'Proportional Lining',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. pnum lnum',
				initialValue:'pnum lnum',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Proportional Oldstyle',
		name:'proportionalOldstyle',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("proportionalOldstyle"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Proportional Oldstyle',
				initialValue:'Proportional Oldstyle',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. pnum onum',
				initialValue:'pnum onum',
			},
			{
				title:'Show on Glyph Grid',
				name:'glyphGrid',
				type:'boolean',
				initialValue:false,
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Required Ligatures',
		name:'requiredLigatures',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("requiredLigatures"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Required Ligatures',
				initialValue:'Required Ligatures',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. rlig',
				initialValue:'rlig',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Scientific Inferiors',
		name:'scientificInferiors',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("scientificInferiors"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Scientific Inferiors',
				initialValue:'Scientific Inferiors',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. sinf',
				initialValue:'sinf',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Slashed Zero',
		name:'slashedZero',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("slashedZero"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Slashed Zero',
				initialValue:'Slashed Zero',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. zero',
				initialValue:'zero',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Small Caps',
		name:'smallCaps',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("smallCaps"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. smallCaps',
				initialValue:'Small Caps',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. smcp',
				initialValue:'smcp',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Standard Ligatures',
		name:'standardLigatures',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("standardLigatures"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. StandardLigatures',
				initialValue:'StandardLigatures',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. liga',
				initialValue:'liga',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Alternates',
		name:'stylisticAlternates',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticAlternates"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Alternates',
				initialValue:'Stylistic Alternates',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. salt',
				initialValue:'salt',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Subscript',
		name:'subscript',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("subscript"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Subscript',
				initialValue:'Subscript',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. subs',
				initialValue:'subs',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Superscript',
		name:'superscript',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("superscript"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Superscript',
				initialValue:'Superscript',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. sups',
				initialValue:'sups',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Swash',
		name:'swash',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("swash"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Swash',
				initialValue:'Swash',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. swsh',
				initialValue:'swsh',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},{
		title:'Tabular Lining',
		name:'tabularLining',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("tabularLining"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Tabular Lining',
				initialValue:'Tabular Lining',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. tnum lnum',
				initialValue:'tnum lnum',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Tabular Oldstyle',
		name:'tabularOldstyle',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("tabularOldstyle"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Tabular Oldstyle',
				initialValue:'Tabular Oldstyle',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. tnum onum',
				initialValue:'tnum onum',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Terminal Form',
		name:'terminalForm',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("terminalForm"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Terminal Form',
				initialValue:'Terminal Form',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. fina',
				initialValue:'fina',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Titling Alternates',
		name:'titlingAlternates',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("titlingAlternates"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Titling Alternates',
				initialValue:'Titling Alternates',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. titl',
				initialValue:'titl',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Unicase',
		name:'unicase',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("unicase"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Unicase',
				initialValue:'Unicase',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. unic',
				initialValue:'unic',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'All Stylistic Sets',
		name:'allStylisticSets',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("allStylisticSets"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. All Stylistic Sets',
				initialValue:'All Stylistic Sets',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss01 ss02 ss03 ss04 ss05 ss06 ss07 ss08 ss09 ss10 ss11 ss12 ss13 ss14 ss15 ss16 ss17 ss18 ss19 ss20',
				initialValue:'ss01 ss02 ss03 ss04 ss05 ss06 ss07 ss08 ss09 ss10 ss11 ss12 ss13 ss14 ss15 ss16 ss17 ss18 ss19 ss20',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 1',
		name:'stylisticSet1',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet1"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 1',
				initialValue:'Stylistic Set 1',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss01',
				initialValue:'ss01',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 2',
		name:'stylisticSet2',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet2"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 2',
				initialValue:'Stylistic Set 2',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss02',
				initialValue:'ss02',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 3',
		name:'stylisticSet3',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet3"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 3',
				initialValue:'Stylistic Set 3',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss03',
				initialValue:'ss03',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 4',
		name:'stylisticSet4',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet4"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 4',
				initialValue:'Stylistic Set 4',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss04',
				initialValue:'ss04',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 5',
		name:'stylisticSet5',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet5"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 5',
				initialValue:'Stylistic Set 5',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss05',
				initialValue:'ss05',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 6',
		name:'stylisticSet6',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet6"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 6',
				initialValue:'Stylistic Set 6',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss06',
				initialValue:'ss06',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 7',
		name:'stylisticSet7',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet7"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 7',
				initialValue:'Stylistic Set 7',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss07',
				initialValue:'ss07',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 8',
		name:'stylisticSet8',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet8"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 8',
				initialValue:'Stylistic Set 8',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss08',
				initialValue:'ss08',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 9',
		name:'stylisticSet9',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet9"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 9',
				initialValue:'Stylistic Set 9',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss09',
				initialValue:'ss09',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 10',
		name:'stylisticSet10',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet10"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set10',
				initialValue:'Stylistic Set10',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss10',
				initialValue:'ss10',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 11',
		name:'stylisticSet11',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet11"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 11',
				initialValue:'Stylistic Set 11',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss11',
				initialValue:'ss11',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 12',
		name:'stylisticSet12',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet12"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 12',
				initialValue:'Stylistic Set 12',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss12',
				initialValue:'ss12',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 13',
		name:'stylisticSet13',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet13"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 13',
				initialValue:'Stylistic Set 13',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss13',
				initialValue:'ss13',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 14',
		name:'stylisticSet14',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet14"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 14',
				initialValue:'Stylistic Set 14',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss14',
				initialValue:'ss14',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 15',
		name:'stylisticSet15',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet15"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 15',
				initialValue:'Stylistic Set 15',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss15',
				initialValue:'ss15',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 16',
		name:'stylisticSet16',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet16"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 16',
				initialValue:'Stylistic Set 16',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss16',
				initialValue:'ss16',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 17',
		name:'stylisticSet17',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet17"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 17',
				initialValue:'Stylistic Set 17',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss17',
				initialValue:'ss17',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 18',
		name:'stylisticSet18',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet18"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 18',
				initialValue:'Stylistic Set 18',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss18',
				initialValue:'ss18',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 19',
		name:'stylisticSet19',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet19"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 19',
				initialValue:'Stylistic Set 19',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss19',
				initialValue:'ss19',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},
	{
		title:'Stylistic Set 20',
		name:'stylisticSet20',
		type:'object',
		hidden: ({parent}) => !parent?.features?.includes("stylisticSet20"),
		fields:[
			{
				name:'title',
				type:'string',
				placeholder:'eg. Stylistic Set 20',
				initialValue:'Stylistic Set 20',
			},
			{
				name:'feature',
				type:'string',
				placeholder:'eg. ss20',
				initialValue:'ss20',
			},
			{
                            title: 'Custom Text',
                            description:'Use the field below to input a word to highlight the feature.',
                            name:'customText',
				hidden:true,
                            type:"string",
                            initialValue:'',
                        },
		]
	},

	],
};
