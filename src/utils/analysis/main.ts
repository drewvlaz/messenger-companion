import * as fs from 'fs';
import * as path from 'path';
import { NaiveBayesClassifier, TrainingData } from './naiveBayes';

/**
 * Main class to handle text classification using the Naive Bayes classifier
 */
export class InterjectionClassifier {
    private classifier: NaiveBayesClassifier;
    private dataLoaded: boolean = false;

    constructor() {
        this.classifier = new NaiveBayesClassifier();
    }

    /**
     * Loads training data from the specified JSON file
     */
    public loadTrainingData(
        filePath: string = path.join(__dirname, 'data', 'interject.json'),
    ): void {
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);

            // Prepare training data
            const trainingData: TrainingData[] = [];

            // Process all examples in the data
            Object.entries(data).forEach(([key, examples]) => {
                if (Array.isArray(examples)) {
                    examples.forEach((example: any) => {
                        if (example.text && example.category) {
                            // If the data is already in the correct format with text and category
                            trainingData.push(example);
                        } else {
                            // If the example is just text and the category is the key
                            trainingData.push({
                                text: example,
                                category: key
                            });
                        }
                    });
                }
            });

            // Train the classifier
            this.classifier.train(trainingData);
            this.dataLoaded = true;

            console.log(`Loaded ${trainingData.length} training examples`);
            console.log(
                `Categories: ${Array.from(new Set(trainingData.map((item) => item.category))).join(', ')}`,
            );
        } catch (error) {
            console.error('Error loading training data:', error);
            throw new Error('Failed to load training data');
        }
    }

    /**
     * Classifies a given text and returns the result
     */
    public classify(text: string): { category: string; probability: number } {
        if (!this.dataLoaded) {
            throw new Error('Training data must be loaded before classification');
        }

        return this.classifier.classify(text);
    }

    /**
     * Gets the most informative features for each category
     */
    public getInformativeFeatures(numFeatures: number = 10): Record<string, string[]> {
        if (!this.dataLoaded) {
            throw new Error('Training data must be loaded before getting features');
        }

        return this.classifier.getInformativeFeatures(numFeatures);
    }

    /**
     * Sets the smoothing parameter for the classifier
     */
    public setSmoothing(alpha: number): void {
        this.classifier.setSmoothing(alpha);
    }
}

// Example usage when run directly
if (require.main === module) {
    const classifier = new InterjectionClassifier();

    // Load training data
    classifier.loadTrainingData();

    // Show informative features
    console.log('\nMost informative features:');
    const features = classifier.getInformativeFeatures(5);
    for (const [category, words] of Object.entries(features)) {
        console.log(`${category}: ${words.join(', ')}`);
    }

    // Example classifications
    const examples = [
        'Can you help me with my homework?',
        "I'll be there in 5 minutes",
        "What's the meaning of life?",
        "Don't forget to call mom",
    ];

    console.log('\nClassification examples:');
    for (const example of examples) {
        const result = classifier.classify(example);
        console.log(`"${example}" => ${result.category} (${result.probability.toFixed(4)})`);
    }

    // Interactive mode
    if (process.argv.includes('--interactive')) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log('\nEnter text to classify (Ctrl+C to exit):');
        rl.prompt();

        rl.on('line', (line: string) => {
            if (line.trim()) {
                const result = classifier.classify(line);
                console.log(`=> ${result.category} (${result.probability.toFixed(4)})`);
            }
            rl.prompt();
        });

        rl.on('close', () => {
            console.log('Goodbye!');
            process.exit(0);
        });
    }
}
