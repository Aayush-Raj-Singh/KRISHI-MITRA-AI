from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class RetrievedDocument:
    name: str
    reference: str
    text: str
    score: float


@dataclass
class _DocChunk:
    name: str
    reference: str
    text: str


class KnowledgeBaseRetriever:
    def __init__(self) -> None:
        self._base_path = Path(__file__).resolve().parent / "knowledge_base"
        self._chunks: List[_DocChunk] = []

        self._tfidf_vectorizer: TfidfVectorizer | None = None
        self._tfidf_matrix = None

        self._semantic_model = None
        self._semantic_matrix = None

        self._load_documents()

    @staticmethod
    def _chunk_text(text: str, max_chars: int = 1200) -> List[str]:
        paragraphs = [part.strip() for part in text.split("\n\n") if part.strip()]
        if not paragraphs:
            return []

        chunks: List[str] = []
        buffer = ""
        for paragraph in paragraphs:
            if not buffer:
                buffer = paragraph
                continue
            if len(buffer) + len(paragraph) + 2 <= max_chars:
                buffer = f"{buffer}\n\n{paragraph}"
            else:
                chunks.append(buffer)
                buffer = paragraph
        if buffer:
            chunks.append(buffer)
        return chunks

    def _load_documents(self) -> None:
        if not self._base_path.exists():
            self._base_path.mkdir(parents=True, exist_ok=True)

        chunks: List[_DocChunk] = []
        for path in sorted(self._base_path.glob("*.txt")):
            raw_text = path.read_text(encoding="utf-8", errors="ignore").strip()
            if not raw_text:
                continue
            source_reference = f"kb://{path.name}"
            for idx, chunk_text in enumerate(self._chunk_text(raw_text), start=1):
                chunks.append(
                    _DocChunk(
                        name=path.name,
                        reference=f"{source_reference}#chunk-{idx}",
                        text=chunk_text,
                    )
                )

        if not chunks:
            self._chunks = []
            logger.warning("rag_no_documents_loaded", path=str(self._base_path))
            return

        self._chunks = chunks
        corpus = [item.text for item in chunks]

        self._tfidf_vectorizer = TfidfVectorizer(
            stop_words="english", max_features=12000, ngram_range=(1, 2)
        )
        self._tfidf_matrix = self._tfidf_vectorizer.fit_transform(corpus)

        logger.info(
            "rag_documents_loaded",
            total_documents=len({item.name for item in chunks}),
            total_chunks=len(chunks),
        )

    def _ensure_semantic_model(self) -> bool:
        if self._semantic_model is not None and self._semantic_matrix is not None:
            return True
        if not self._chunks:
            return False

        try:
            from sentence_transformers import SentenceTransformer

            model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            self._semantic_model = SentenceTransformer(model_name)
            corpus = [item.text for item in self._chunks]
            self._semantic_matrix = self._semantic_model.encode(
                corpus, convert_to_numpy=True, normalize_embeddings=True
            )
            logger.info("rag_semantic_model_loaded", model_name=model_name, embeddings=len(corpus))
            return True
        except Exception as exc:
            logger.warning("rag_semantic_model_unavailable", error=str(exc))
            self._semantic_model = None
            self._semantic_matrix = None
            return False

    def _rank_with_tfidf(self, query: str, top_k: int) -> List[RetrievedDocument]:
        if self._tfidf_vectorizer is None or self._tfidf_matrix is None:
            return []

        query_vector = self._tfidf_vectorizer.transform([query])
        similarities = (self._tfidf_matrix @ query_vector.T).toarray().flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results: List[RetrievedDocument] = []
        for idx in top_indices:
            score = float(similarities[int(idx)])
            if score <= 0.02:
                continue
            chunk = self._chunks[int(idx)]
            results.append(
                RetrievedDocument(
                    name=chunk.name,
                    reference=chunk.reference,
                    text=chunk.text,
                    score=round(score, 4),
                )
            )
        return results

    def _rank_with_semantic(self, query: str, top_k: int) -> List[RetrievedDocument]:
        if not self._ensure_semantic_model():
            return []

        query_embedding = self._semantic_model.encode(
            [query], convert_to_numpy=True, normalize_embeddings=True
        )
        similarities = cosine_similarity(self._semantic_matrix, query_embedding).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results: List[RetrievedDocument] = []
        for idx in top_indices:
            score = float(similarities[int(idx)])
            if score <= 0.18:
                continue
            chunk = self._chunks[int(idx)]
            results.append(
                RetrievedDocument(
                    name=chunk.name,
                    reference=chunk.reference,
                    text=chunk.text,
                    score=round(score, 4),
                )
            )
        return results

    def _retrieve_opensearch_stub(self, query: str, top_k: int) -> List[RetrievedDocument]:
        logger.info("rag_opensearch_stub_active")
        semantic = self._rank_with_semantic(query, top_k)
        if semantic:
            return semantic
        return self._rank_with_tfidf(query, top_k)

    def retrieve(self, query: str, top_k: int | None = None) -> List[RetrievedDocument]:
        if not settings.feature_rag_enabled:
            return []
        if not query.strip() or not self._chunks:
            return []

        top_k = max(1, top_k or settings.rag_top_k)
        backend = (settings.rag_backend or "local_semantic").strip().lower()

        if backend == "opensearch_stub":
            return self._retrieve_opensearch_stub(query, top_k=top_k)
        if backend == "local_tfidf":
            return self._rank_with_tfidf(query, top_k)

        semantic_results = self._rank_with_semantic(query, top_k)
        if semantic_results:
            return semantic_results
        return self._rank_with_tfidf(query, top_k)
