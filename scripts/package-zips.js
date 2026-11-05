import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const MINERACULOUS_ROOT = process.env.MINERACULOUS_DIR || path.resolve(REPO_ROOT, '../../IdeaProjects/Mineraculous');
const EXPANSION_ROOT = process.env.EXPANSION_DIR || path.resolve(REPO_ROOT, '../../IdeaProjects/Mineraculous-Expansion-Kamikotizations');
const STATIC_DIR = path.resolve(REPO_ROOT, 'static');

/**
 * Recursively adds files from srcDir into the JSZip instance under zipPrefix.
 * Ensures all zip paths strictly use forward slashes ('/').
 */
function addDirectoryToZip(zip, srcDir, zipPrefix) {
	if (!fs.existsSync(srcDir)) {
		console.warn(`[WARN] Source directory does not exist: ${srcDir}`);
		return;
	}

	function walk(dir) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.isFile()) {
				const relativePath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
				const zipPath = zipPrefix ? `${zipPrefix}/${relativePath}` : relativePath;
				zip.file(zipPath, fs.readFileSync(fullPath));
			}
		}
	}

	walk(srcDir);
}

async function buildZip(destFile, sections) {
	const zip = new JSZip();

	for (const { srcDir, zipPrefix } of sections) {
		addDirectoryToZip(zip, srcDir, zipPrefix);
	}

	const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
	const backslashEntries = files.filter((name) => name.includes('\\'));
	if (backslashEntries.length > 0) {
		throw new Error(`Found ${backslashEntries.length} entries with backslashes in ${destFile}: ${backslashEntries.slice(0, 5).join(', ')}`);
	}

	console.log(`Packaging ${path.basename(destFile)} with ${files.length} files...`);

	const content = await zip.generateAsync({
		type: 'nodebuffer',
		compression: 'DEFLATE',
		compressionOptions: { level: 9 },
	});

	fs.writeFileSync(destFile, content);
	console.log(`Successfully generated ${destFile} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);

	// Validation against mod-wikis predicates
	const langFiles = files.filter((f) => f.includes('lang/'));
	const categoryFiles = files.filter((f) => f.includes('modonomicon/books/wiki/categories/'));
	const entryFiles = files.filter((f) => f.includes('modonomicon/books/wiki/entries/'));
	const textureFiles = files.filter((f) => f.includes('textures/'));

	console.log(`  - lang: ${langFiles.length}`);
	console.log(`  - categories: ${categoryFiles.length}`);
	console.log(`  - entries: ${entryFiles.length}`);
	console.log(`  - textures: ${textureFiles.length}`);

	if (langFiles.length === 0 || textureFiles.length === 0) {
		throw new Error(`Validation failed for ${destFile}: missing required files!`);
	}
}

async function main() {
	// 1. mineraculous.zip
	await buildZip(path.join(STATIC_DIR, 'mineraculous.zip'), [
		{
			srcDir: path.join(MINERACULOUS_ROOT, 'src/generated/resources/assets/mineraculous/lang'),
			zipPrefix: 'lang',
		},
		{
			srcDir: path.join(MINERACULOUS_ROOT, 'src/generated/resources/data/mineraculous/modonomicon/books/wiki'),
			zipPrefix: 'modonomicon/books/wiki',
		},
		{
			srcDir: path.join(MINERACULOUS_ROOT, 'src/main/resources/assets/mineraculous/textures'),
			zipPrefix: 'textures',
		},
	]);

	// 2. mineraculouskamikotizations.zip
	let expModonomicon = path.join(EXPANSION_ROOT, 'src/generated/resources/data/mineraculous/modonomicon/books/wiki');
	if (!fs.existsSync(expModonomicon)) {
		expModonomicon = path.join(EXPANSION_ROOT, 'src/generated/resources/data/mineraculouskamikotizations/modonomicon/books/wiki');
	}

	await buildZip(path.join(STATIC_DIR, 'mineraculouskamikotizations.zip'), [
		{
			srcDir: path.join(EXPANSION_ROOT, 'src/generated/resources/assets/mineraculouskamikotizations/lang'),
			zipPrefix: 'lang',
		},
		{
			srcDir: expModonomicon,
			zipPrefix: 'modonomicon/books/wiki',
		},
		{
			srcDir: path.join(EXPANSION_ROOT, 'src/main/resources/assets/mineraculouskamikotizations/textures'),
			zipPrefix: 'textures',
		},
	]);

	console.log('\nAll static wiki zips packaged and validated successfully!');
}

main().catch((err) => {
	console.error('Packaging failed:', err);
	process.exit(1);
});
