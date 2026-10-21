import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateLibrary} from '../src/model.mjs';
import {homePage,paperPage,informationPage} from '../src/render.mjs';
import {writeGenerated} from '../src/output.mjs';

export const root = fileURLToPath(new URL('../',import.meta.url));
export async function loadLibrary() {
  const readJson = async name => JSON.parse(await readFile(path.join(root,'content',name),'utf8'));
  const catalog = await readJson('catalog.json');
  const questions = await readJson('questions.json');
  // Validate path-bearing IDs before reading any author-controlled filename.
  for (const entry of catalog.papers) if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) throw new Error('잘못된 논문 ID');
  const papers = new Map();
  for (const entry of catalog.papers.filter(p=>p.status==='ready')) papers.set(entry.id,await readJson(`papers/${entry.id}.json`));
  validateLibrary(catalog,papers,questions);
  return {catalog,papers,questions};
}
export async function build() {
  const {catalog,papers,questions} = await loadLibrary();
  const dist = path.join(root,'dist');
  const outputs=new Map([
    ['index.html',homePage(catalog,papers,questions)],
    ['guide.html',informationPage(catalog,'guide')],
    ['rights.html',informationPage(catalog,'rights')]
  ]);
  for (const entry of catalog.papers.filter(p=>p.status==='ready')) {
    outputs.set(`papers/${entry.id}/index.html`,paperPage(catalog,entry,papers.get(entry.id),questions));
  }
  for (const asset of ['styles.css','reader.mjs','favicon.svg','model.mjs','calculations.mjs']) outputs.set(`assets/${asset}`,await readFile(path.join(root,'src',asset)));
  outputs.set('.nojekyll','');
  const obsolete=await writeGenerated(dist,outputs);
  if (obsolete.length) console.log(`Removed obsolete generated pages: ${obsolete.join(', ')}. Rebuild from content to restore.`);
  console.log(`Built ${papers.size} paper analyses; ${questions.length} user questions. Output: ${dist}`);
  return dist;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
