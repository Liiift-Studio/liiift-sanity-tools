// Sanity schema field definition for displaying the total style count — uses StyleCountInput component
import { StyleCountInput } from '../components/StyleCountInput.jsx';

export const styleCountField = {
	name: 'styleCount',
	type: 'number',
	group: 'styles',
	components: {
		input: StyleCountInput,
	},
	readOnly: true,
};
