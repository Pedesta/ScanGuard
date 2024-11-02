import { Visitor } from '@/types'
import { create } from 'zustand'

type VisitorStore = {
  capturing: boolean,
  visitors: Visitor[];
  setCapturing: (val: boolean) => void;
  addVisitor: (visitor: Visitor) => void;
  setVisitors: (visitors: Visitor[]) => void;
  updateVisitor: (updated: Visitor) => void;
  deleteVisitor: (id: string) => void;
};

export const useVisitorStore = create<VisitorStore>((set) => ({
  capturing: false,
  visitors: [],
  setCapturing: (capturing: boolean) => set({ capturing }),
  setVisitors: (visitors: Visitor[]) => set({visitors}),
  addVisitor: (visitor: Visitor) => set((state) => ({ visitors: [visitor, ...state.visitors] })),
  updateVisitor: (updated: Visitor) => set((state) => {
    const visitors = state.visitors.map((visitor) =>
      visitor._id === updated._id ? updated : visitor
    );
    return { visitors };
  }),
  deleteVisitor: (id: string) => set((state) => {
    const visitors = state.visitors.filter(v => v._id != id );
    return { visitors };
  })
}))

