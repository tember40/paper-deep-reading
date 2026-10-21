// Own worked examples, not a simulation of the entire historical perceptron.
export function atLeastOneActive(probability, units) {
  if (!Number.isFinite(probability) || probability<0 || probability>1 || !Number.isInteger(units) || units<0) throw new Error('활성 확률/셀 수 범위 오류');
  if (units===0 || probability===0) return 0;
  if (probability===1) return 1;
  return -Math.expm1(units*Math.log1p(-probability));
}
export function conservedGain(total, active) {
  if (!Number.isInteger(total) || !Number.isInteger(active) || active<0 || total<1 || active>=total) throw new Error('보상할 비활성 셀이 필요합니다');
  return Array.from({length:total},(_,index)=>index<active?1:-active/(total-active));
}
export function lenet5Audit() {
  const channelPairs=6*3+6*4+3*4+6;
  return [
    {layer:'C1',shape:'6 × 28 × 28',formula:'6 × (25 + 1)',parameters:6*26},
    {layer:'S2',shape:'6 × 14 × 14',formula:'6 × (1 + 1)',parameters:6*2},
    {layer:'C3',shape:'16 × 10 × 10',formula:`${channelPairs} × 25 + 16`,parameters:channelPairs*25+16},
    {layer:'S4',shape:'16 × 5 × 5',formula:'16 × (1 + 1)',parameters:16*2},
    {layer:'C5',shape:'120 × 1 × 1',formula:'120 × (16 × 25 + 1)',parameters:120*(16*25+1)},
    {layer:'F6',shape:'84',formula:'84 × (120 + 1)',parameters:84*121}
  ];
}
export function sharedGradient(inputs,weight) {
  if (!Array.isArray(inputs) || !inputs.length || !inputs.every(Number.isFinite) || !Number.isFinite(weight)) throw new Error('공유 가중치 예제 입력 오류');
  const outputs=inputs.map(value=>value*weight);
  const parts=inputs.map((value,index)=>value*outputs[index]);
  return {outputs,parts,loss:outputs.reduce((sum,value)=>sum+.5*value*value,0),gradient:parts.reduce((sum,value)=>sum+value,0)};
}
export function squaredDistance(left,right) {
  if (!Array.isArray(left) || !Array.isArray(right) || !left.length || left.length!==right.length || ![...left,...right].every(Number.isFinite)) throw new Error('거리 예제 차원/값 오류');
  return left.reduce((sum,value,index)=>sum+(value-right[index])**2,0);
}
