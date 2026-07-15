import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import KanbanCard from "./KanbanCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KanbanColumn({ 
  status, 
  title, 
  color, 
  tasks, 
  engineers, 
  onTaskClick, 
  onAddTask 
}) {
  const engineerMap = engineers.reduce((acc, eng) => {
    acc[eng.id] = eng;
    return acc;
  }, {});

  const columnTasks = tasks.filter(t => t.status === status);

  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 min-w-80"
        >
          <Card className={`bg-gradient-to-b ${color} rounded-xl overflow-hidden flex flex-col h-full`}>
            {/* Header */}
            <div className="p-4 border-b bg-white/50 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs min-h-[44px]"
                onClick={() => onAddTask?.(status)}
              >
                <Plus className="w-3 h-3 ml-1" />
                إضافة مهمة
              </Button>
            </div>

            {/* Droppable Area */}
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-4 space-y-3 overflow-y-auto min-h-96 ${
                snapshot.isDraggingOver ? 'bg-slate-100/50' : ''
              }`}
            >
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  لا توجد مهام
                </div>
              ) : (
                columnTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                      >
                        <KanbanCard
                          task={task}
                          engineer={engineerMap[task.assigned_to]}
                          onClick={() => onTaskClick?.(task)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          </Card>
        </motion.div>
      )}
    </Droppable>
  );
}