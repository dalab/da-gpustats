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
    useSortable({ id: machine._id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing active:z-10"
    >
      <MachineCard machine={machine} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export const App = () => {
  /* -------------------------------------------------------------- */
  /* 1. Subscribe to the backend                                    */
  /* -------------------------------------------------------------- */
  const rawMachines = useTracker(() => {
    const sub = Meteor.subscribe('machines');
    if (!sub.ready()) return [];
    // sorted deterministically (by _id) so order is stable for new installs
    return Machines.find({}, { sort: { _id: 1 } }).fetch();
  });

  /* -------------------------------------------------------------- */
  /* 2. Local order state (persisted in localStorage)               */
  /* -------------------------------------------------------------- */
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

  /* -------------------------------------------------------------- */
  /* 3. Assemble the ordered list                                   */
  /* -------------------------------------------------------------- */
  const machines = useMemo(() => {
    if (!rawMachines.length) return [];

    const map = Object.fromEntries(rawMachines.map((m) => [m._id, m]));

    // 3. Check if we have an order in localStorage
    if (!machineOrder) {
      // If we don't have an order, use the default order
      const defaultOrder = rawMachines.map((m) => m._id);
      setMachineOrder(defaultOrder);
      return rawMachines;
    }
    // 3a. Start with items we have an order for
    const ordered = machineOrder
      .map((id) => map[id])
      .filter(Boolean); // filter out machines that no longer exist

    // 3b. Append any new machines we’ve never seen
    const leftovers = rawMachines.filter((m) => !machineOrder.includes(m._id));

    return [...ordered, ...leftovers];
  }, [rawMachines, machineOrder]);

  /* -------------------------------------------------------------- */
  /* 4. dnd-kit sensors                                             */
  /* -------------------------------------------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* -------------------------------------------------------------- */
  /* 5. Handle drag-end                                             */
  /* -------------------------------------------------------------- */
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
  /* 6. Render                                                      */
  /* -------------------------------------------------------------- */
  return (
    <div className="p-4 bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Still alive?</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={machines.map((m) => m._id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <SortableMachineCard key={machine._id} machine={machine} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
