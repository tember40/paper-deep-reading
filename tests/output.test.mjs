import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {writeGenerated} from '../src/output.mjs';

test('rebuild removes only previously generated obsolete pages and refreshes removed questions',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'paper-reading-output-'));
  await writeGenerated(folder,new Map([['index.html','old question'],['papers/fixture/index.html','old private draft']]));
  await writeFile(path.join(folder,'personal-notes.txt'),'keep');
  const removed=await writeGenerated(folder,new Map([['index.html','no question']]));
  assert.deepEqual(removed,['papers/fixture/index.html']);
  await assert.rejects(access(path.join(folder,'papers/fixture/index.html')));
  assert.equal(await readFile(path.join(folder,'personal-notes.txt'),'utf8'),'keep');
  assert.equal(await readFile(path.join(folder,'index.html'),'utf8'),'no question');
});
test('traversal or a corrupted deletion manifest fails before changing existing output',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'paper-reading-output-'));
  await writeFile(path.join(folder,'index.html'),'preserve');
  await assert.rejects(writeGenerated(folder,new Map([['../index.html','bad']])));
  await writeFile(path.join(folder,'.generated-files.json'),'["../personal-notes.txt"]');
  await assert.rejects(writeGenerated(folder,new Map([['index.html','bad']])));
  assert.equal(await readFile(path.join(folder,'index.html'),'utf8'),'preserve');
});
