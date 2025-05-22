import React, { useEffect, useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Machines } from '/imports/api/machines';
import MachineCard from './components/MachineCard';

/* ------------------------------------------------------------------ */
/*  Draggable wrapper                                                 */
/* ------------------------------------------------------------------ */
const SortableMachineCard = ({ machine }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: machine.machineId });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing active:z-10 self-start focus-visible:outline-3 outline-white/60 outline-offset-2 rounded-lg"
    >
      <MachineCard machine={machine} />
    </div>
  );
};


export const App = () => {
  /* -------------------------------------------------------------- */
  /* Machine logs                                                   */
  /* -------------------------------------------------------------- */
  const rawMachines = useTracker(() => {
    const sub = Meteor.subscribe('machines');
    if (!sub.ready()) return [];
    // sorted deterministically (by machineId) so order is stable for new installs
    return Machines.find({}, { sort: { machineId: 1 } }).fetch();
  });

  const [machineOrder, setMachineOrder] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('machineOrder') || 'null');
    } catch {
      console.error('Failed to parse machineOrder from localStorage:', e);
      return null;
    }
  });

  // Re-save whenever machineOrder changes
  useEffect(() => {
    localStorage.setItem('machineOrder', JSON.stringify(machineOrder));
  }, [machineOrder]);

  const machines = useMemo(() => {
    if (!rawMachines.length) return [];

    const map = Object.fromEntries(rawMachines.map((m) => [m.machineId, m]));

    // Check if we have an order in localStorage
    if (!machineOrder) {
      // If we don't have an order, use the default order
      const defaultOrder = rawMachines.map((m) => m.machineId);
      defaultOrder.sort();
      // save the default order to localStorage
      setMachineOrder(defaultOrder);
      return rawMachines;
    }
    // Start with items we have an order for
    const ordered = machineOrder
      .map((id) => map[id])
      .filter(Boolean); // filter out machines that no longer exist

    // Append any new machines we’ve never seen
    const leftovers = rawMachines.filter((m) => !machineOrder.includes(m.machineId));
    if (leftovers.length) {
      leftovers.sort((a, b) => a.machineId.localeCompare(b.machineId));
      setMachineOrder((prev) => [...prev, ...leftovers.map((m) => m.machineId)]);
    }

    return [...ordered, ...leftovers];
  }, [rawMachines, machineOrder]);

  /* -------------------------------------------------------------- */
  /* Drag-and-drop                                                  */
  /* -------------------------------------------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setMachineOrder((prev) => {
      const oldIndex = prev.indexOf(active.id);
      const newIndex = prev.indexOf(over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      // localStorage is written by the useEffect above
      return next;
    });
  };

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="p-4 bg-zinc-900 text-zinc-100 font-mono min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-zinc-300">Still alive?</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={machines.map((m) => m.machineId)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 xs:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(24.5rem,1fr))] gap-4">
            {machines.map((machine) => (
                <SortableMachineCard key={machine.machineId} machine={machine} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
