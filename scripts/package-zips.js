import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const MINERACULOUS_DIR = process.env.MINERACULOUS_DIR || 'C:/Users/tjgla/IdeaProjects/Mineraculous';
const EXPANSION_DIR = process.env.EXPANSION_DIR || 'C:/Users/tjgla/IdeaProjects/Mineraculous-Expansion-Kamikotizations';
const STATIC_DIR = path.resolve('static');

function addDirectoryToZip(zip, baseDir, zipPrefix) {
    if (!fs.existsSync(baseDir)) {
        console.warn(`Directory not found: ${baseDir}`);
        return;
    }

    function walk(currentDir) {
        const files = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(currentDir, file.name);
            if (file.isDirectory()) {
                walk(fullPath);
            } else if (file.isFile()) {
                const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
                const zipPath = zipPrefix ? `${zipPrefix}/${relativePath}` : relativePath;
                zip.file(zipPath, fs.readFileSync(fullPath));
            }
        }
    }

    walk(baseDir);
}

async function packageZip(zipName, mappings) {
    const zip = new JSZip();
    for (const { src, prefix } of mappings) {
        addDirectoryToZip(zip, src, prefix);
    }

    const fileCount = Object.keys(zip.files).filter(k => !zip.files[k].dir).length;
    console.log(`Packaging ${zipName} (${fileCount} files)...`);

    const content = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
    });

    const destPath = path.join(STATIC_DIR, zipName);
    fs.writeFileSync(destPath, content);
    console.log(`Wrote ${destPath} (${content.length} bytes)`);
}

async function run() {
    // 1. Mineraculous
    await packageZip('mineraculous.zip', [
        {
            src: path.join(MINERACULOUS_DIR, 'src/generated/resources/assets/mineraculous/lang'),
            prefix: 'lang'
        },
        {
            src: path.join(MINERACULOUS_DIR, 'src/generated/resources/data/mineraculous/modonomicon/books/wiki'),
            prefix: 'modonomicon/books/wiki'
        },
        {
            src: path.join(MINERACULOUS_DIR, 'src/main/resources/assets/mineraculous/textures'),
            prefix: 'textures'
        }
    ]);

    // 2. Mineraculous Expansion: Kamikotizations
    let expansionWikiData = path.join(EXPANSION_DIR, 'src/generated/resources/data/mineraculous/modonomicon/books/wiki');
    if (!fs.existsSync(expansionWikiData)) {
        expansionWikiData = path.join(EXPANSION_DIR, 'src/generated/resources/data/mineraculouskamikotizations/modonomicon/books/wiki');
    }

    await packageZip('mineraculouskamikotizations.zip', [
        {
            src: path.join(EXPANSION_DIR, 'src/generated/resources/assets/mineraculouskamikotizations/lang'),
            prefix: 'lang'
        },
        {
            src: expansionWikiData,
            prefix: 'modonomicon/books/wiki'
        },
        {
            src: path.join(EXPANSION_DIR, 'src/main/resources/assets/mineraculouskamikotizations/textures'),
            prefix: 'textures'
        }
    ]);

    console.log('Packaging complete!');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
