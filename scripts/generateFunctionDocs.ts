import { Project, SyntaxKind } from 'ts-morph';
import { promises as fs } from 'fs';
import path from 'path';

// Root of the project (directory containing this script is /scripts)
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const project = new Project({
    tsConfigFilePath: path.join(ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false
  });

  // Collect function info
  type FnInfo = { name: string; file: string; description: string };
  const functions: FnInfo[] = [];

  project.getSourceFiles().forEach(sf => {
    const filePath = path.relative(ROOT, sf.getFilePath());

    // Top-level functions
    sf.getFunctions().forEach(fn => {
      const name = fn.getName() || '(anonymous)';
      const docs = fn.getJsDocs()[0]?.getDescription().split('\n')[0].trim() || '';
      functions.push({ name, file: filePath, description: docs });
    });

    // Class methods
    sf.getClasses().forEach(cls => {
      cls.getMethods().forEach(method => {
        const name = `${cls.getName() || 'AnonymousClass'}.${method.getName()}`;
        const docs = method.getJsDocs()[0]?.getDescription().split('\n')[0].trim() || '';
        functions.push({ name, file: filePath, description: docs });
      });
    });
  });

  // Sort by name
  functions.sort((a, b) => a.name.localeCompare(b.name));

  // Build markdown
  const lines: string[] = [
    '# Entire App – Function Index',
    '',
    'Generated automatically by `npm run docs:functions`.',
    ''
  ];
  functions.forEach(fn => {
    lines.push(`- **${fn.name}** (${fn.file}) – ${fn.description || 'No description.'}`);
  });

  const outputPath = path.join(ROOT, 'docs', 'functions', 'entire-app.md');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, lines.join('\n'));
  // eslint-disable-next-line no-console
  console.log(`✅ Wrote ${functions.length} entries to ${outputPath}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
