import sys
import json
import os
import re
import logging
import chromadb
from sentence_transformers import SentenceTransformer
from llama_cpp import Llama

# Configuration
CHROMA_DB_PATH = r'./chromadb'  # Relative path for Node.js compatibility
EMBEDDING_MODEL_PATH = r'all-MiniLM-L6-v2'
LLM_MODEL_PATH = r'D:\INNOVO\server\src\models\mistral-7b-instruct-v0.1.Q4_K_M.gguf'

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize SentenceTransformer
try:
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_PATH)
except Exception as e:
    logger.error(f"Error loading embedding model: {e}")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
except Exception as e:
    logger.error(f"Error initializing ChromaDB: {e}")
    sys.exit(1)

# Initialize LLM
try:
    llm = Llama(
        model_path=LLM_MODEL_PATH,
        n_ctx=2048,
        n_gpu_layers=0,
        verbose=False
    )
except Exception as e:
    logger.error(f"Error loading LLM: {e}")
    sys.exit(1)

def chunk_text(text, chunk_size=500, max_chunks=1000):
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    for word in words:
        current_chunk.append(word)
        current_length += len(word) + 1
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_length = 0
            if len(chunks) >= max_chunks:
                logger.warning("Reached maximum chunk limit.")
                break
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def generate_embeddings(text_chunks):
    try:
        embeddings = embedding_model.encode(text_chunks, convert_to_tensor=False)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return []

def generate_answer(query, contexts):
    try:
        context_text = "\n".join([ctx['text'] for ctx in contexts])
        prompt = (
            f"You are a helpful assistant. Based on the following context, answer the question concisely.\n\n"
            f"Context:\n{context_text}\n\nQuestion: {query}\n\nAnswer:"
        )
        response = llm(
            prompt,
            max_tokens=200,
            temperature=0.7,
            top_p=0.9,
            stop=["\n\n"]
        )
        return response['choices'][0]['text'].strip()
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return "Error generating response."

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No mode provided'}))
        sys.exit(1)

    mode = sys.argv[1]
    try:
        input_data = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({'success': False, 'error': 'Invalid input data'}))
        sys.exit(1)

    if mode == 'upload':
        text = input_data.get('text')
        filename = input_data.get('filename')
        collection_name = input_data.get('collection_name')
        if not all([text, filename, collection_name]):
            print(json.dumps({'success': False, 'error': 'Missing required fields'}))
            sys.exit(0)

        collection_name = re.sub(r'[^\w\-]', '_', collection_name)
        try:
            collection = chroma_client.get_or_create_collection(name=collection_name)
        except Exception as e:
            logger.error(f"Error accessing collection: {e}")
            print(json.dumps({'success': False, 'error': 'Failed to access collection'}))
            sys.exit(0)

        chunks = chunk_text(text)
        if not chunks:
            print(json.dumps({'success': False, 'error': 'No valid text chunks'}))
            sys.exit(0)

        embeddings = generate_embeddings(chunks)
        if not embeddings:
            print(json.dumps({'success': False, 'error': 'Failed to generate embeddings'}))
            sys.exit(0)

        document_id = f"{filename}_{len(chunks)}"
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=[{'filename': filename, 'collection': collection_name} for _ in chunks],
            ids=[f"{document_id}_{i}" for i in range(len(chunks))]
        )
        document = {
            'document_id': document_id,
            'metadata': {'filename': filename, 'collection': collection_name},
            'chunks': len(chunks)
        }
        print(json.dumps({'success': True, 'document': document}))

    elif mode == 'get_documents':
        try:
            collections = chroma_client.list_collections()
            documents = []
            for collection in collections:
                results = collection.get()
                seen_filenames = set()
                for i, metadata in enumerate(results['metadatas']):
                    filename = metadata.get('filename', 'Unknown')
                    doc_id = results['ids'][i].split('_')[0]
                    if filename not in seen_filenames:
                        seen_filenames.add(filename)
                        documents.append({
                            'document_id': doc_id,
                            'metadata': {'filename': filename, 'collection': collection.name},
                            'chunks': sum(1 for id_ in results['ids'] if id_.startswith(doc_id))
                        })
            print(json.dumps({'success': True, 'documents': documents}))
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            print(json.dumps({'success': False, 'error': str(e)}))

    elif mode == 'delete_collection':
        collection_name = input_data.get('collection_name')
        if not collection_name:
            print(json.dumps({'success': False, 'error': 'Missing collection_name'}))
            sys.exit(0)
        collection_name = re.sub(r'[^\w\-]', '_', collection_name)
        try:
            chroma_client.delete_collection(name=collection_name)
            print(json.dumps({'success': True, 'message': f'Collection {collection_name} deleted'}))
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            print(json.dumps({'success': False, 'error': str(e)}))

    elif mode == 'delete_file':
        collection_name = input_data.get('collection_name')
        document_id = input_data.get('document_id')
        if not all([collection_name, document_id]):
            print(json.dumps({'success': False, 'error': 'Missing required fields'}))
            sys.exit(0)
        collection_name = re.sub(r'[^\w\-]', '_', collection_name)
        try:
            collection = chroma_client.get_collection(name=collection_name)
            ids_to_delete = collection.get(where={'filename': document_id.split('_')[0]})['ids']
            if ids_to_delete:
                collection.delete(ids=ids_to_delete)
            print(json.dumps({'success': True, 'message': f'File {document_id} deleted from {collection_name}'}))
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            print(json.dumps({'success': False, 'error': str(e)}))

    elif mode == 'ask_question':
        query = input_data.get('question')
        collection_name = input_data.get('collection_name')
        if not query:
            print(json.dumps({'success': False, 'error': 'No question provided'}))
            sys.exit(0)

        collection_name = re.sub(r'[^\w\-]', '_', collection_name)
        try:
            collection = chroma_client.get_or_create_collection(name=collection_name)
        except Exception as e:
            logger.error(f"Error accessing collection: {e}")
            print(json.dumps({'success': False, 'error': 'Failed to access collection'}))
            sys.exit(0)

        query_embedding = generate_embeddings([query])
        if not query_embedding:
            print(json.dumps({'success': False, 'error': 'Failed to generate query embedding'}))
            sys.exit(0)

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=5
        )

        contexts = []
        for i in range(len(results['documents'][0])):
            contexts.append({
                'text': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i]
            })

        answer = generate_answer(query, contexts)

        print(json.dumps({
            'success': True,
            'answer': answer,
            'context_sources': len(contexts),
            'contexts': contexts
        }))

    else:
        print(json.dumps({'success': False, 'error': 'Invalid mode'}))