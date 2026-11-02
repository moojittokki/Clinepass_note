import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { RAGEngine } from '../core/rag/ragEngine'

export type RAGContextType = {
  getRAGEngine: () => Promise<RAGEngine>
}

const RAGContext = createContext<RAGContextType | null>(null)

export function RAGProvider({
  getRAGEngine,
  children,
}: PropsWithChildren<{ getRAGEngine: () => Promise<RAGEngine> }>) {
  useEffect(() => {
    // start initialization of ragEngine in the background
    // Note: on mobile (and when no embedding provider is configured) this can
    // reject. Catch it so it does not surface as an unhandled promise rejection;
    // chat still works without RAG.
    void getRAGEngine().catch((error) => {
      console.warn('Failed to initialize the RAG engine', error)
    })
  }, [getRAGEngine])

  const value = useMemo(() => {
    return { getRAGEngine }
  }, [getRAGEngine])

  return <RAGContext.Provider value={value}>{children}</RAGContext.Provider>
}

export function useRAG() {
  const context = useContext(RAGContext)
  if (!context) {
    throw new Error('useRAG must be used within a RAGProvider')
  }
  return context
}
