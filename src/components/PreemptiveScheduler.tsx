import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface PreemptiveProcess {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

interface GanttSegment {
  processId: string;
  startTime: number;
  endTime: number;
}

interface ScheduledPreemptiveProcess extends PreemptiveProcess {
  waitingTime: number;
  turnaroundTime: number;
  completionTime: number;
}

const PreemptiveScheduler = () => {
  const [processes, setProcesses] = useState<PreemptiveProcess[]>([
    { id: "P1", arrivalTime: 0, burstTime: 5, priority: 3 },
    { id: "P2", arrivalTime: 1, burstTime: 7, priority: 1 },
    { id: "P3", arrivalTime: 2, burstTime: 4, priority: 2 },
  ]);
  
  const [ganttChart, setGanttChart] = useState<GanttSegment[] | null>(null);
  const [results, setResults] = useState<ScheduledPreemptiveProcess[] | null>(null);

  const handleInputChange = (index: number, field: keyof PreemptiveProcess, value: string) => {
    const newProcesses = [...processes];
    if (field === "id") {
      newProcesses[index][field] = value;
    } else {
      newProcesses[index][field] = Math.max(0, parseInt(value) || 0);
    }
    setProcesses(newProcesses);
  };

  const runPreemptiveScheduling = () => {
    const n = processes.length;
    const remainingBurst = processes.map(p => p.burstTime);
    const completionTime: number[] = new Array(n).fill(0);
    const gantt: GanttSegment[] = [];
    
    let currentTime = 0;
    let completed = 0;
    let lastProcess = -1;
    let segmentStart = 0;
    
    const maxTime = Math.max(...processes.map(p => p.arrivalTime)) + 
                    processes.reduce((sum, p) => sum + p.burstTime, 0);
    
    while (completed < n && currentTime < maxTime) {
      let highestPriorityIdx = -1;
      let highestPriority = Infinity;
      
      // Find highest priority process that has arrived and not completed
      for (let i = 0; i < n; i++) {
        if (processes[i].arrivalTime <= currentTime && 
            remainingBurst[i] > 0 && 
            processes[i].priority < highestPriority) {
          highestPriority = processes[i].priority;
          highestPriorityIdx = i;
        }
      }
      
      if (highestPriorityIdx === -1) {
        currentTime++;
        continue;
      }
      
      // Process switch - add previous segment to gantt
      if (lastProcess !== highestPriorityIdx && lastProcess !== -1) {
        gantt.push({
          processId: processes[lastProcess].id,
          startTime: segmentStart,
          endTime: currentTime
        });
        segmentStart = currentTime;
      } else if (lastProcess === -1) {
        segmentStart = currentTime;
      }
      
      // Execute for 1 time unit
      remainingBurst[highestPriorityIdx]--;
      currentTime++;
      
      // Check if process completed
      if (remainingBurst[highestPriorityIdx] === 0) {
        completed++;
        completionTime[highestPriorityIdx] = currentTime;
        gantt.push({
          processId: processes[highestPriorityIdx].id,
          startTime: segmentStart,
          endTime: currentTime
        });
        lastProcess = -1;
        segmentStart = currentTime;
      } else {
        lastProcess = highestPriorityIdx;
      }
    }
    
    // Calculate metrics
    const scheduled: ScheduledPreemptiveProcess[] = processes.map((process, index) => {
      const turnaroundTime = completionTime[index] - process.arrivalTime;
      const waitingTime = turnaroundTime - process.burstTime;
      
      return {
        ...process,
        completionTime: completionTime[index],
        turnaroundTime,
        waitingTime,
      };
    });
    
    setGanttChart(gantt);
    setResults(scheduled);
  };

  const averageWT = results ? results.reduce((sum, p) => sum + p.waitingTime, 0) / results.length : 0;
  const averageTAT = results ? results.reduce((sum, p) => sum + p.turnaroundTime, 0) / results.length : 0;

  const getProcessColor = (id: string) => {
    switch (id) {
      case "P1": return "process-1-bg";
      case "P2": return "process-2-bg";
      case "P3": return "process-3-bg";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-10 h-10 text-secondary" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Preemptive Priority Scheduler
          </h2>
        </div>
      </header>

      {/* Input Section */}
      <Card className="glass-card border-2">
        <CardHeader>
          <CardTitle>Process Details</CardTitle>
          <CardDescription>Enter process information with arrival times (lower priority number = higher priority)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-semibold">Process ID</th>
                  <th className="text-left p-3 font-semibold">Arrival Time</th>
                  <th className="text-left p-3 font-semibold">Burst Time</th>
                  <th className="text-left p-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="p-3">
                      <Input
                        value={process.id}
                        onChange={(e) => handleInputChange(index, "id", e.target.value)}
                        className="max-w-[100px]"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={process.arrivalTime}
                        onChange={(e) => handleInputChange(index, "arrivalTime", e.target.value)}
                        className="max-w-[120px]"
                        min="0"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={process.burstTime}
                        onChange={(e) => handleInputChange(index, "burstTime", e.target.value)}
                        className="max-w-[120px]"
                        min="1"
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        value={process.priority}
                        onChange={(e) => handleInputChange(index, "priority", e.target.value)}
                        className="max-w-[120px]"
                        min="1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Button 
            onClick={runPreemptiveScheduling} 
            className="w-full mt-6 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-lg py-6"
          >
            <Zap className="w-5 h-5 mr-2" />
            Run Preemptive Scheduling
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {ganttChart && results && (
        <div className="space-y-6 animate-scale-in">
          {/* Gantt Chart */}
          <Card className="glass-card border-2">
            <CardHeader>
              <CardTitle>Gantt Chart</CardTitle>
              <CardDescription>Process execution timeline with preemption</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-0 overflow-x-auto">
                  {ganttChart.map((segment, index) => {
                    const duration = segment.endTime - segment.startTime;
                    const totalTime = ganttChart[ganttChart.length - 1].endTime;
                    return (
                      <div
                        key={index}
                        className={`${getProcessColor(segment.processId)} text-white p-3 border-r-2 border-white/30 first:rounded-l-lg last:rounded-r-lg last:border-r-0 min-w-[60px] text-center font-semibold transition-all hover:scale-105`}
                        style={{ 
                          width: `${(duration / totalTime) * 100}%`,
                          minWidth: '60px'
                        }}
                      >
                        <div className="text-sm">{segment.processId}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Timeline markers */}
                <div className="flex gap-0 text-sm text-muted-foreground relative">
                  <div className="absolute left-0">0</div>
                  {ganttChart.map((segment, index) => {
                    const duration = segment.endTime - segment.startTime;
                    const totalTime = ganttChart[ganttChart.length - 1].endTime;
                    return (
                      <div
                        key={index}
                        className="text-right relative"
                        style={{ 
                          width: `${(duration / totalTime) * 100}%`,
                          minWidth: '60px'
                        }}
                      >
                        <span className="absolute right-0">{segment.endTime}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className="glass-card border-2">
            <CardHeader>
              <CardTitle>Scheduling Results</CardTitle>
              <CardDescription>Calculated metrics for each process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-3 font-semibold">Process</th>
                      <th className="text-left p-3 font-semibold">Arrival</th>
                      <th className="text-left p-3 font-semibold">Priority</th>
                      <th className="text-left p-3 font-semibold">Burst Time</th>
                      <th className="text-left p-3 font-semibold">Waiting Time</th>
                      <th className="text-left p-3 font-semibold">Turnaround Time</th>
                      <th className="text-left p-3 font-semibold">Completion Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((process, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="p-3">
                          <span className={`${getProcessColor(process.id)} text-white px-3 py-1 rounded-md font-semibold`}>
                            {process.id}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{process.arrivalTime}</td>
                        <td className="p-3 font-mono">{process.priority}</td>
                        <td className="p-3 font-mono">{process.burstTime}</td>
                        <td className="p-3 font-mono">{process.waitingTime}</td>
                        <td className="p-3 font-mono">{process.turnaroundTime}</td>
                        <td className="p-3 font-mono">{process.completionTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Averages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-accent/20 rounded-lg p-4 text-center border-2 border-accent/30">
                  <div className="text-sm text-muted-foreground mb-1">Average Waiting Time</div>
                  <div className="text-3xl font-bold text-accent">{averageWT.toFixed(2)}</div>
                </div>
                <div className="bg-secondary/20 rounded-lg p-4 text-center border-2 border-secondary/30">
                  <div className="text-sm text-muted-foreground mb-1">Average Turnaround Time</div>
                  <div className="text-3xl font-bold text-secondary">{averageTAT.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PreemptiveScheduler;
