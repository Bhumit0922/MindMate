"use client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Activity, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const HomeView = () => {
  const trpc = useTRPC();
  
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery(
    trpc.meetings.getMany.queryOptions({ page: 1, pageSize: 5 })
  );
  
  const { data: agentsData, isLoading: agentsLoading } = useQuery(
    trpc.agents.getMany.queryOptions({ page: 1, pageSize: 5 })
  );

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back to Meet AI. Here is an overview of your activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingsLoading ? "-" : meetingsData?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meetings recorded and summarized
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentsLoading ? "-" : agentsData?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI assistants available for meetings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Integrations</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected to OpenAI API
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Meetings */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg">Recent Meetings</CardTitle>
              <CardDescription>Your latest recorded sessions</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/meetings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {meetingsLoading ? (
              <div className="text-sm text-muted-foreground">Loading meetings...</div>
            ) : meetingsData?.items && meetingsData.items.length > 0 ? (
              <div className="space-y-6">
                {meetingsData.items.slice(0, 4).map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{meeting.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(meeting.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-muted-foreground capitalize bg-secondary/50 px-2 py-1 rounded-md">
                        {meeting.status}
                      </div>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/meetings/${meeting.id}`}><ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-10 w-10 mb-3 text-muted-foreground/30" />
                No meetings found.<br/>Create one to get started!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Agents */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-lg">Your Agents</CardTitle>
              <CardDescription>AI assistants ready for deployment</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/agents">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {agentsLoading ? (
              <div className="text-sm text-muted-foreground">Loading agents...</div>
            ) : agentsData?.items && agentsData.items.length > 0 ? (
              <div className="space-y-6">
                {agentsData.items.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{agent.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                          {agent.instructions}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Link href={`/agents`}><ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-6 text-center">
                <Users className="h-10 w-10 mb-3 text-muted-foreground/30" />
                No agents configured yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
