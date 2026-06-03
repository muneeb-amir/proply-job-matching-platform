"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JobMatch, ProposalTone, ScoreProposalResponse } from "@/lib/api";

export type AppStep = 1 | 2 | 3;

export interface ProfileState {
  skills: string;
  experience_level: string;
  hourly_rate: string;
}

interface AppState {
  step: AppStep;
  profile: ProfileState;
  jobs: JobMatch[];
  selectedJob: JobMatch | null;
  sessionId: string | null;
  proposalId: string | null;
  proposal: string;
  proposalTone: ProposalTone;
  scores: ScoreProposalResponse | null;
  isMatching: boolean;
  isGenerating: boolean;
  isScoring: boolean;
  sheetOpen: boolean;
}

interface AppContextValue extends AppState {
  setProfile: (profile: Partial<ProfileState>) => void;
  setStep: (step: AppStep) => void;
  setJobs: (jobs: JobMatch[]) => void;
  setSessionId: (sessionId: string | null) => void;
  setProposalId: (proposalId: string | null) => void;
  selectJob: (job: JobMatch) => void;
  setProposal: (proposal: string) => void;
  setProposalTone: (tone: ProposalTone) => void;
  setScores: (scores: ScoreProposalResponse | null) => void;
  setIsMatching: (v: boolean) => void;
  setIsGenerating: (v: boolean) => void;
  setIsScoring: (v: boolean) => void;
  setSheetOpen: (v: boolean) => void;
  resetToProfile: () => void;
  closeSheet: () => void;
}

const defaultProfile: ProfileState = {
  skills: "",
  experience_level: "intermediate",
  hourly_rate: "",
};

const initialState: AppState = {
  step: 1,
  profile: defaultProfile,
  jobs: [],
  selectedJob: null,
  sessionId: null,
  proposalId: null,
  proposal: "",
  proposalTone: "professional",
  scores: null,
  isMatching: false,
  isGenerating: false,
  isScoring: false,
  sheetOpen: false,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setProfile = useCallback((profile: Partial<ProfileState>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }));
  }, []);

  const setStep = useCallback((step: AppStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const setJobs = useCallback((jobs: JobMatch[]) => {
    setState((s) => ({ ...s, jobs }));
  }, []);

  const setSessionId = useCallback((sessionId: string | null) => {
    setState((s) => ({ ...s, sessionId }));
  }, []);

  const setProposalId = useCallback((proposalId: string | null) => {
    setState((s) => ({ ...s, proposalId }));
  }, []);

  const selectJob = useCallback((job: JobMatch) => {
    setState((s) => ({
      ...s,
      selectedJob: job,
      step: 3,
      sheetOpen: true,
      proposal: "",
      proposalId: null,
      scores: null,
      proposalTone: "professional",
    }));
  }, []);

  const setProposal = useCallback((proposal: string) => {
    setState((s) => ({ ...s, proposal }));
  }, []);

  const setProposalTone = useCallback((proposalTone: ProposalTone) => {
    setState((s) => ({ ...s, proposalTone }));
  }, []);

  const setScores = useCallback((scores: ScoreProposalResponse | null) => {
    setState((s) => ({ ...s, scores }));
  }, []);

  const setIsMatching = useCallback((isMatching: boolean) => {
    setState((s) => ({ ...s, isMatching }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState((s) => ({ ...s, isGenerating }));
  }, []);

  const setIsScoring = useCallback((isScoring: boolean) => {
    setState((s) => ({ ...s, isScoring }));
  }, []);

  const setSheetOpen = useCallback((sheetOpen: boolean) => {
    setState((s) => ({ ...s, sheetOpen }));
  }, []);

  const resetToProfile = useCallback(() => {
    setState((s) => ({
      ...s,
      step: 1,
      jobs: [],
      selectedJob: null,
      sessionId: null,
      proposalId: null,
      sheetOpen: false,
      proposal: "",
      scores: null,
    }));
  }, []);

  const closeSheet = useCallback(() => {
    setState((s) => ({
      ...s,
      sheetOpen: false,
      step: 2,
      selectedJob: null,
    }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      setProfile,
      setStep,
      setJobs,
      setSessionId,
      setProposalId,
      selectJob,
      setProposal,
      setProposalTone,
      setScores,
      setIsMatching,
      setIsGenerating,
      setIsScoring,
      setSheetOpen,
      resetToProfile,
      closeSheet,
    }),
    [
      state,
      setProfile,
      setStep,
      setJobs,
      setSessionId,
      setProposalId,
      selectJob,
      setProposal,
      setProposalTone,
      setScores,
      setIsMatching,
      setIsGenerating,
      setIsScoring,
      setSheetOpen,
      resetToProfile,
      closeSheet,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
