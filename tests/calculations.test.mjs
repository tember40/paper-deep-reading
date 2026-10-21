import test from 'node:test';
import assert from 'node:assert/strict';
import {lenet5Audit,sharedGradient,squaredDistance} from '../src/calculations.mjs';
import {renderBlock} from '../src/render.mjs';

test('original LeNet trainable layers sum to60000; C3 differs from a fully connected channel pattern',()=>{
  const rows=lenet5Audit();
  assert.deepEqual(rows.map(row=>row.parameters),[156,12,1516,32,48120,10164]);
  assert.equal(rows.reduce((sum,row)=>sum+row.parameters,0),60000);
  assert.equal(6*16*25+16,2416);
  assert.equal((6*3+6*4+3*4+6)*25+16,1516);
  assert.equal(rows.find(row=>row.layer==='C3').parameters*100,151600);
  const html=renderBlock({type:'lenet-parameters'});
  assert.ok(html.includes('60,000'));
  assert.ok(html.includes('1,516'));
  assert.ok(html.includes('RBF 중심은 아래 합계에서 제외'));
});
test('shared-weight gradient matches central finite differences and rendered example',()=>{
  const result=sharedGradient([2,3],.1);
  assert.ok(Math.abs(result.loss-.065)<1e-14);
  assert.ok(Math.abs(result.gradient-1.3)<1e-14);
  const epsilon=1e-6;
  const derivative=(sharedGradient([2,3],.1+epsilon).loss-sharedGradient([2,3],.1-epsilon).loss)/(2*epsilon);
  assert.ok(Math.abs(derivative-result.gradient)<1e-9);
  assert.throws(()=>sharedGradient([],1));
  const html=renderBlock({type:'shared-gradient-example',inputs:[2,3],weight:.1});
  assert.ok(html.includes('0.400'));
  assert.ok(html.includes('0.900'));
  assert.ok(html.includes('dL/dw=1.300'));
});
test('distance penalties favor the smaller value, not the largest class logit',()=>{
  assert.equal(squaredDistance([.5,-.5],[1,-1]),.5);
  assert.equal(squaredDistance([.5,-.5],[-1,1]),4.5);
  assert.throws(()=>squaredDistance([1],[1,2]));
  assert.throws(()=>squaredDistance([NaN],[1]));
  const html=renderBlock({type:'distance-example',input:[.5,-.5],prototypes:[[1,-1],[-1,1]]});
  assert.ok(html.includes('0.500'));
  assert.ok(html.includes('4.500'));
});
