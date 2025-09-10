//二つのSetが同一であることを検証する
export function setsAreEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

//string[]をSet<string>に
export function arrayToSet(array: string[]) {
  const set = new Set<string>();
  array.forEach((str: string) => {
    set.add(str);
  });
  return set;
}
