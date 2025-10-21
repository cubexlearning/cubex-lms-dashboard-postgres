"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpen, CheckCircle, Clock, User, GraduationCap, MessageSquare } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface SyllabusItemVM {
  itemId: string
  title: string
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
}

interface SyllabusPhaseVM {
  phaseId: string
  phaseName: string
  items: SyllabusItemVM[]
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
}

interface SyllabusProgressProps {
  progress: SyllabusPhaseVM[]
  onMarkComplete?: (itemId: string) => void
  onAddNotes?: (phaseId: string) => void
}

export function SyllabusProgress({ 
  progress, 
  onMarkComplete, 
  onAddNotes 
}: SyllabusProgressProps) {
  const totalPhases = progress.length
  const completedPhases = progress.filter(p => p.completedByStudent && p.completedByTutor).length
  const studentCompleted = progress.filter(p => p.completedByStudent).length
  const tutorCompleted = progress.filter(p => p.completedByTutor).length
  const completionRate = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0

  const getPhaseStatus = (phase: SyllabusPhaseVM) => {
    const hasAnyCompletion = phase.items.some(it => it.completedByStudent || it.completedByTutor)
    const allTutor = phase.items.length > 0 && phase.items.every(it => it.completedByTutor)
    const allStudent = phase.items.length > 0 && phase.items.every(it => it.completedByStudent)

    if (phase.items.length > 0 && allTutor && allStudent) {
      return { status: 'COMPLETED', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    if (hasAnyCompletion) {
      return { status: 'PENDING', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    return { status: 'NOT_STARTED', color: 'bg-gray-100 text-gray-800', icon: BookOpen }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Syllabus Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{completedPhases}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{studentCompleted + tutorCompleted - completedPhases}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-600">{totalPhases - studentCompleted - tutorCompleted + completedPhases}</div>
            <div className="text-sm text-gray-700">Not Started</div>
          </div>
        </div>

        {/* Phases Accordion with item toggles */}
        <div>
          <h4 className="font-medium mb-3">Syllabus</h4>
          <Accordion type="multiple" className="w-full">
            {progress.map((phase, index) => {
              const phaseStatus = getPhaseStatus(phase)
              return (
                <AccordionItem key={phase.phaseId} value={phase.phaseId}>
                  <AccordionTrigger className="px-3 py-2">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{phase.phaseName}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {phase.completedAt && (
                            <span>Completed: {new Date(phase.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Badge className={phaseStatus.color}>{phaseStatus.status}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 p-2">
                      {phase.items.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2">No items in this phase.</div>
                      ) : (
                        phase.items.map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between p-2 border rounded">
                            <div className="text-sm">{item.title}</div>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end min-w-[120px]">
                                <span className="text-xs text-gray-600">Tutor completed</span>
                                {item.completedByTutor && item.completedAt && (
                                  <span className="text-[10px] text-gray-500">{new Date(item.completedAt).toLocaleString()}</span>
                                )}
                                {!item.completedByTutor && (
                                  <span className="text-[10px] text-gray-400">Not yet</span>
                                )}
                              </div>
                              {onMarkComplete && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">Mark completed</span>
                                  <Switch
                                    checked={Boolean(item.completedByStudent)}
                                    disabled={Boolean(item.completedByStudent || (item.completedByTutor && item.completedByStudent))}
                                    onCheckedChange={(val) => {
                                      if (val) onMarkComplete?.(item.itemId)
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>

        {/* Verification Status */}
        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-medium text-blue-600">{studentCompleted}</div>
            <div className="text-blue-700">Student Marked</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <div className="font-medium text-purple-600">{tutorCompleted}</div>
            <div className="text-purple-700">Tutor Marked</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
