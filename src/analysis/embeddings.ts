export type Embedding = readonly number[];

export function cosineSimilarity(left: Embedding, right: Embedding): number {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

type Group = { members: number[]; centroid: number[] };

function addToCentroid(group: Group, embedding: Embedding): void {
  const count = group.members.length;
  for (let index = 0; index < embedding.length; index += 1) {
    group.centroid[index] = ((group.centroid[index] ?? 0) * count + (embedding[index] ?? 0)) / (count + 1);
  }
}

export function clusterEmbeddings(embeddings: Embedding[], threshold = 0.52): number[][] {
  const groups: Group[] = [];
  // ponytail: O(n²) over the bounded 128-record model batch; replace with ANN only if this measured ceiling is reached.
  embeddings.forEach((embedding, index) => {
    if (!embedding.length) {
      groups.push({ members: [index], centroid: [] });
      return;
    }
    let best: Group | undefined;
    let bestScore = threshold;
    for (const group of groups) {
      const score = cosineSimilarity(embedding, group.centroid);
      if (score >= bestScore) {
        best = group;
        bestScore = score;
      }
    }
    if (best) {
      best.members.push(index);
      addToCentroid(best, embedding);
    } else {
      groups.push({ members: [index], centroid: [...embedding] });
    }
  });
  return groups.map((group) => group.members);
}
