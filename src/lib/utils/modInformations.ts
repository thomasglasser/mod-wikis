export const MOD_VERSION = '1.0.0-beta15';

export const getShortVersion = (version: string = MOD_VERSION): string => {
	const match = version.match(/beta(\d+)/i);
	return match ? `Beta ${match[1]}` : version;
};

export const modInformations: { [x: string]: App.ModInformation } = {
	mineraculous: {
		texturePredicate: (filename: string) => {
			return filename.includes('textures/');
		},
		modonomiconCategoryPredicate: (filename: string) => {
			return filename.includes('modonomicon/books/wiki/categories/');
		},
		modonomiconEntryPredicate: (filename: string) => {
			return filename.includes('modonomicon/books/wiki/entries/');
		},
		recipePredicate: (filename: string) => {
			return filename.includes('recipe/');
		},
		languagePredicate: (filename: string) => {
			return filename.includes('lang/');
		},
		download: "https://modrinth.com/project/mineraculous",
		name: 'Mineraculous',
		},
	mineraculouskamikotizations: {
		texturePredicate: (filename: string) => {
			return filename.includes('textures/');
		},
		modonomiconCategoryPredicate: (filename: string) => {
			return filename.includes('modonomicon/books/wiki/categories/');
		},
		modonomiconEntryPredicate: (filename: string) => {
			return filename.includes('modonomicon/books/wiki/entries/');
		},
		recipePredicate: (filename: string) => {
			return filename.includes('recipe/');
		},
		languagePredicate: (filename: string) => {
			return filename.includes('lang/');
		},
		download: "https://modrinth.com/project/mineraculouskamikotizations",
		name: 'Mineraculous Expansion: Kamikotizations',
		icon: '/mineraculouskamikotizations.png'
	}
};

export const addonList = [
	'mineraculouskamikotizations',
];

export const modlist = ['mineraculous'].concat(addonList);
