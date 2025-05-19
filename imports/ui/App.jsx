import React, { useState, useEffect } from 'react';
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

import MachineCard from './components/MachineCard';

/* -------------------------------------------------------------------------- */
/* 1. Initial data (added a stable `id` for dnd-kit)                          */
/* -------------------------------------------------------------------------- */
const initialMachines = [
  {
    id: 'machine-1',
    name: 'Machine 1',
    timestamp: '2025-05-19 12:00:00',
    cpu: '25%',
    gpu: '40%',
    ram: '60%',
    hdd: '80%',
  },
  {
    id: 'machine-2',
    name: 'Machine 2',
    timestamp: '2025-05-19 12:01:00',
    cpu: '30%',
    gpu: '50%',
    ram: '70%',
    hdd: '90%',
  },
  {
    id: 'machine-3',
    name: 'Machine 3',
    timestamp: '2025-05-19 12:02:00',
    cpu: '20%',
    gpu: '30%',
    ram: '50%',
    hdd: '70%',
  },
  {
    id: 'machine-4',
    name: 'Machine 4',
    timestamp: '2025-05-19 12:03:00',
    cpu: '35%',
    gpu: '45%',
    ram: '65%',
    hdd: '85%',
  },
];

/* -------------------------------------------------------------------------- */
/* 2. Sortable wrapper around MachineCard                                     */
/* -------------------------------------------------------------------------- */
const SortableMachineCard = ({ machine }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: machine.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <MachineCard machine={machine} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. App with DndContext + SortableContext                                   */
/* -------------------------------------------------------------------------- */
export const App = () => {
  const [machines, setMachines] = useState(initialMachines);

  /* Load saved order from localStorage on init */
  useEffect(() => {
    const savedOrder = localStorage.getItem('machineOrder');
    if (savedOrder) {
      machineOrder = JSON.parse(savedOrder);
      idToMachineMap = Object.fromEntries(
        initialMachines.map((machine) => [machine.id, machine])
      );
      const orderedMachines = machineOrder.map((id) => idToMachineMap[id]);
      setMachines(orderedMachines);
    }
  }, []);

  /* Better mobile experience: only start dragging after 5 px movement */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setMachines((items) => {
        const oldIndex = items.findIndex((m) => m.id === active.id);
        const newIndex = items.findIndex((m) => m.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        const machineOrder = newOrder.map((machine) => machine.id);

        /* Save the new order to localStorage */
        localStorage.setItem('machineOrder', JSON.stringify(machineOrder));

        return newOrder;
      });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Still alive?</h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={machines} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <SortableMachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
