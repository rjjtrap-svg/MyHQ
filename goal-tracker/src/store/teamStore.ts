import { create } from 'zustand';
import { Membership, Team } from '@/src/types';
import { regenerateInviteCode, subscribeMembers, subscribeTeam, updateTeamGoal } from '@/src/firebase/teams';

interface TeamState {
  teamId: string | null;
  team: Team | null;
  members: Membership[];
  subscribe: (teamId: string) => () => void;
  updateGoal: (partial: Partial<Team>) => Promise<void>;
  regenerateCode: () => Promise<string>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teamId: null,
  team: null,
  members: [],

  subscribe: (teamId) => {
    set({ teamId, team: null, members: [] });
    const unsubTeam = subscribeTeam(teamId, (team) => set({ team }));
    const unsubMembers = subscribeMembers(teamId, (members) => set({ members }));
    return () => {
      unsubTeam();
      unsubMembers();
    };
  },

  updateGoal: async (partial) => {
    const { teamId } = get();
    if (!teamId) return;
    await updateTeamGoal(teamId, partial);
  },

  regenerateCode: async () => {
    const { teamId } = get();
    if (!teamId) throw new Error('No team loaded.');
    return regenerateInviteCode(teamId);
  },
}));
