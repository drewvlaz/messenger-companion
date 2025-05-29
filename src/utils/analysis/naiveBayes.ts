/**
 * Naive Bayes Classifier with Laplace Smoothing
 * Uses bag of words approach for text classification
 */

export interface TrainingData {
    text: string;
    category: string;
}

export class NaiveBayesClassifier {
    private vocabulary: Set<string> = new Set();
    private categoryDocCounts: Map<string, number> = new Map();
    private wordCounts: Map<string, Map<string, number>> = new Map();
    private totalDocuments: number = 0;
    private alpha: number = 1; // Laplace smoothing parameter

    /**
     * Tokenizes text into words (bag of words approach)
     */
    private tokenize(text: string): string[] {
        // Simple tokenization: lowercase and split by non-alphanumeric characters
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((word) => word.length > 0);
    }

    /**
     * Trains the classifier on the provided dataset
     */
    public train(trainingData: TrainingData[]): void {
        this.totalDocuments = trainingData.length;

        // Process each document
        for (const { text, category } of trainingData) {
            // Update category document count
            this.categoryDocCounts.set(category, (this.categoryDocCounts.get(category) || 0) + 1);

            // Initialize word count for category if needed
            if (!this.wordCounts.has(category)) {
                this.wordCounts.set(category, new Map());
            }

            // Process words in document
            const words = this.tokenize(text);
            for (const word of words) {
                // Add to vocabulary
                this.vocabulary.add(word);

                // Update word count for this category
                const categoryWordCounts = this.wordCounts.get(category)!;
                categoryWordCounts.set(word, (categoryWordCounts.get(word) || 0) + 1);
            }
        }
    }

    /**
     * Classifies text into the most probable category
     */
    public classify(text: string): { category: string; probability: number } {
        const words = this.tokenize(text);
        const categories = Array.from(this.categoryDocCounts.keys());
        let bestCategory = '';
        let highestScore = -Infinity;

        // Calculate score for each category
        for (const category of categories) {
            // Prior probability P(category)
            const categoryCount = this.categoryDocCounts.get(category) || 0;
            const prior = Math.log(categoryCount / this.totalDocuments);

            // Calculate likelihood using log probabilities to avoid underflow
            let logLikelihood = 0;
            const categoryWordCounts = this.wordCounts.get(category) || new Map();
            const totalWordsInCategory = Array.from(categoryWordCounts.values()).reduce(
                (sum, count) => sum + count,
                0,
            );

            // Calculate word probabilities with Laplace smoothing
            for (const word of words) {
                if (this.vocabulary.has(word)) {
                    const wordCount = categoryWordCounts.get(word) || 0;
                    // Apply Laplace smoothing: (count + alpha) / (total + alpha * |V|)
                    const smoothedProb =
                        (wordCount + this.alpha) /
                        (totalWordsInCategory + this.alpha * this.vocabulary.size);
                    logLikelihood += Math.log(smoothedProb);
                }
            }

            const score = prior + logLikelihood;
            if (score > highestScore) {
                highestScore = score;
                bestCategory = category;
            }
        }

        return {
            category: bestCategory,
            probability: Math.exp(highestScore), // Convert log probability back to probability
        };
    }

    /**
     * Sets the Laplace smoothing parameter (alpha)
     */
    public setSmoothing(alpha: number): void {
        if (alpha < 0) {
            throw new Error('Smoothing parameter must be non-negative');
        }
        this.alpha = alpha;
    }

    /**
     * Returns the most informative features for each category
     */
    public getInformativeFeatures(numFeatures: number = 10): Record<string, string[]> {
        const categories = Array.from(this.categoryDocCounts.keys());
        const result: Record<string, string[]> = {};

        for (const category of categories) {
            const categoryWordCounts = this.wordCounts.get(category) || new Map();
            const totalWordsInCategory = Array.from(categoryWordCounts.values()).reduce(
                (sum, count) => sum + count,
                0,
            );

            // Calculate word probabilities with smoothing
            const wordProbs: Array<[string, number]> = [];
            for (const word of this.vocabulary) {
                const wordCount = categoryWordCounts.get(word) || 0;
                const smoothedProb =
                    (wordCount + this.alpha) /
                    (totalWordsInCategory + this.alpha * this.vocabulary.size);
                wordProbs.push([word, smoothedProb]);
            }

            // Sort by probability (descending) and take top N
            wordProbs.sort((a, b) => b[1] - a[1]);
            result[category] = wordProbs.slice(0, numFeatures).map(([word]) => word);
        }

        return result;
    }
}
