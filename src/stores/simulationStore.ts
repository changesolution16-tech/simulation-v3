import { create } from 'zustand';

interface SimulationSession {
  simulationId: string;
  instanceId: string;
  currentScenarioIndex: number;
  currentScenarioId?: string;
  selectedOptionId?: string;
  difficulty?: string;
  assignmentId?: string;
  assignmentLearnerId?: string;
}

interface SimulationStore {
  activeSession: SimulationSession | null;
  selectedTopic: string | null;
  selectedDifficulty: string | null;

  // Actions
  setActiveSession: (session: SimulationSession | null) => void;
  setSelectedTopic: (topic: string | null) => void;
  setSelectedDifficulty: (difficulty: string | null) => void;
  updateSessionScenarioIndex: (index: number, scenarioId?: string) => void;
  clearSession: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  activeSession: null,
  selectedTopic: null,
  selectedDifficulty: null,

  setActiveSession: (session) => set({ activeSession: session }),

  setSelectedTopic: (topic) => set({ selectedTopic: topic }),

  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  updateSessionScenarioIndex: (index, scenarioId) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            currentScenarioIndex: index,
            currentScenarioId: scenarioId,
          }
        : null,
    })),

  clearSession: () =>
    set({
      activeSession: null,
      selectedTopic: null,
      selectedDifficulty: null,
    }),
}));
