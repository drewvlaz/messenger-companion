import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { config } from '../../config';

const main = async () => {
    const client = new ChromaClient({
        path: 'http://localhost:8000',
    });

    const collection = await client.getOrCreateCollection({
        name: 'my_collection',
        // embeddingFunction: new OpenAIEmbeddingFunction({
        //     openai_api_key: config.env.OPENAI_API_KEY,
        //     openai_model: 'text-embedding-3-small',
        // }),
    });

    await collection.upsert({
        documents: [
            'This is a document about pineapple',
            'This is a document about oranges',
            'what should I do today',
            'skydiving is awesome',
        ],
        ids: ['id1', 'id2', 'id3', 'id4'],
    });

    const results = await collection.query({
        queryTexts: 'looking for something fun', // Chroma will embed this for you
        nResults: 2, // how many results to return
    });

    console.log(results);
};

if (require.main === module) {
    main();
}
