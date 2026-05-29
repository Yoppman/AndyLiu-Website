import React, { createContext, useContext, useState, useCallback } from 'react';

interface MorphSource {
  rect: DOMRect;
  imageUrl: string;
  slug: string;
}

interface TransitionContextValue {
  morphSource: MorphSource | null;
  setMorphSource: (source: MorphSource) => void;
  clearMorph: () => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  morphSource: null,
  setMorphSource: () => {},
  clearMorph: () => {},
});

export const useTransition = () => useContext(TransitionContext);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [morphSource, setMorphSourceState] = useState<MorphSource | null>(null);

  const setMorphSource = useCallback((source: MorphSource) => {
    setMorphSourceState(source);
  }, []);

  const clearMorph = useCallback(() => {
    setMorphSourceState(null);
  }, []);

  return (
    <TransitionContext.Provider value={{ morphSource, setMorphSource, clearMorph }}>
      {children}
    </TransitionContext.Provider>
  );
};
