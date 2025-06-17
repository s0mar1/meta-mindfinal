// backend/src/prompts/autoAnalysis/format.js

const autoAnalysisFormat = `
[분석 요청]
1. 잘한 점 (Good Point): 이 플레이어의 덱 구성, 아이템 활용, 또는 운영 판단에서 칭찬할 만한 점을 1~2가지 **챌린저의 관점에서** 찾아주세요.
2. 아쉬운 점 (Improvement Point): 더 높은 등수를 위해 개선할 수 있었던 점을 1~2가지 **구체적인 전략적 대안과 함께** 제안해주세요. 특히, **총 피해량** 데이터를 참고하여 고점 운영에 대한 통찰력을 추가하고, **다른 플레이어들의 덱과의 상성**을 고려한 피드백도 포함해주세요. (남은 골드는 직접적인 판단 근거로 사용하지 않습니다.)
`;

export default autoAnalysisFormat;