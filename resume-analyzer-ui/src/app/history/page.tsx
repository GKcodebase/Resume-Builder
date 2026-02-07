"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalysisResult } from "@/components/AnalysisResult"
import { ChevronLeft, Calendar, User, Briefcase } from "lucide-react"
import Link from "next/link"

interface JobAnalysisHistory {
    id: string
    resume: {
        id: string
        filename: string
    }
    jobDescriptionEntry: string
    analysisResultJson: string
    providerUsed: string
    modelUsed: string
    createdAt: string
}

export default function HistoryPage() {
    const [selectedAnalysis, setSelectedAnalysis] = useState<JobAnalysisHistory | null>(null)

    // optimized: fetches ALL resumes to then fetch history for each. 
    // In a real app, you'd want a single endpoint for all history.
    const { data: resumes } = useQuery({
        queryKey: ["resumes"],
        queryFn: async () => (await axios.get("/api/resumes")).data
    })

    // Fetch history for the first resume or all (simplified for now to just show strategy)
    // Creating a new component to fetch history by resume ID would be cleaner,
    // but for now let's just fetch all history if possible.
    // Since the backend only supports `findByResumeId`, we need to pick a resume first.

    const [selectedResumeId, setSelectedResumeId] = useState<string>("")

    const { data: history, isLoading } = useQuery({
        queryKey: ["history", selectedResumeId],
        queryFn: async () => {
            if (!selectedResumeId) return []
            return (await axios.get(`/api/analysis/resume/${selectedResumeId}`)).data as JobAnalysisHistory[]
        },
        enabled: !!selectedResumeId
    })

    if (selectedAnalysis) {
        return (
            <div className="container mx-auto py-8 space-y-6">
                <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to History
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Analysis Detail</CardTitle>
                        <CardDescription>
                            {new Date(selectedAnalysis.createdAt).toLocaleString()} - {selectedAnalysis.modelUsed}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnalysisResult result={JSON.parse(selectedAnalysis.analysisResultJson)} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Analysis History</h1>
                <Link href="/">
                    <Button variant="outline">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Resume</CardTitle>
                    <CardDescription>Select a resume to view its analysis history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                    >
                        <option value="">-- Select a Resume --</option>
                        {resumes?.map((r: any) => (
                            <option key={r.id} value={r.id}>{r.filename}</option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {selectedResumeId && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Past Analyses</h2>
                    {isLoading ? (
                        <div className="text-center py-4">Loading history...</div>
                    ) : history?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No history found for this resume.</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {history?.map((item) => (
                                <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedAnalysis(item)}>
                                    <CardHeader className="space-y-1">
                                        <CardTitle className="text-base line-clamp-1">
                                            {/* Parse JSON to get job title if possible, or use date */}
                                            Job Analysis
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground line-clamp-3">
                                            {item.jobDescriptionEntry.substring(0, 100)}...
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 bg-primary/10 rounded-full">{item.providerUsed}</span>
                                            <span className="px-2 py-1 bg-muted rounded-full">{item.modelUsed}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
