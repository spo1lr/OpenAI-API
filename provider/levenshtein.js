function calculateKeywordSimilarity(data, testKeywords) {
    function levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;

        if (m === 0) return n;
        if (n === 0) return m;

        // 비교 키워드가 두 글자 이하일 때, 모두 일치할 경우만 유사성 인정 (distance: 0)
        if (m <= 2) {
            if (str1 === str2) return 0;
            else return;
        }

        const dp = [];
        for (let i = 0; i <= m; i++) {
            dp.push(new Array(n + 1));
            dp[i][0] = i;
        }
        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + 1,
                        dp[i][j - 1] + 1,
                        dp[i - 1][j] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    for (const item of data) {
        const {keywords} = item;
        const similarityKeywords = new Set();
        ;
        let similarityCount = 0;

        for (const testKeyword of testKeywords) {
            let minDistance = Infinity;
            let mostSimilarKeyword = '';

            for (const keyword of keywords) {
                const distance = levenshteinDistance(keyword, testKeyword);
                if (distance < minDistance) {
                    minDistance = distance;
                    mostSimilarKeyword = keyword;
                }
            }

            if (minDistance <= 3) { // 임계값 설정 (1~3)
                // similarityCount++;
                similarityKeywords.add(mostSimilarKeyword);
            }
        }

        // item.similarity = similarityCount;
        item.similarityKeywords = Array.from(similarityKeywords);
        item.similarity = item.similarityKeywords.length;
    }

    return data;
}

module.exports = {
    calculateKeywordSimilarity
};