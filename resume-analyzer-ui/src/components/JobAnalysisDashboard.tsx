"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import type { Query } from "@tanstack/react-query"
import axios from "axios"
import { useApiConfig } from "@/context/ApiContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AnalysisResult } from "@/components/AnalysisResult"
import { Loader2, Settings, History, AlertCircle } from "lucide-react"
import Link from "next/link"

interface AnalysisResponse {
    id: string
    status: "PENDING" | "PROCESSING" | "COMPLETE" | "ERROR"
    analysisResultJson?: string
    errorMessage?: string
}

export function JobAnalysisDashboard({ uploadedResumeId }: { uploadedResumeId?: string }) {
    const { config, updateConfig } = useApiConfig()
    const [jobInput, setJobInput] = useState("")
    const [isUrl, setIsUrl] = useState(false)
    const [resumeId, setResumeId] = useState(uploadedResumeId || "")
    const [showSettings, setShowSettings] = useState(false)
    const [analysisId, setAnalysisId] = useState<string | null>(null)
    const [pollingActive, setPollingActive] = useState(false)

    // Fetch list of resumes
    const { data: resumes } = useQuery({
        queryKey: ["resumes"],
        queryFn: async () => (await axios.get("/api/resumes")).data
    })

    // Poll for analysis results when analysisId is set
    const { data: analysisResult, isLoading: isPolling } = useQuery<AnalysisResponse>({
        queryKey: ["analysis", analysisId],
        queryFn: async () => {
            if (!analysisId) throw new Error("No analysis ID")
            const res = await axios.get(`/api/analysis/${analysisId}`)
            return res.data
        },
        enabled: !!analysisId && pollingActive,
        // Use function form so we don't reference `analysisResult` before initialization
        refetchInterval: (q: Query<AnalysisResponse, Error, AnalysisResponse, readonly unknown[]>) => {
            const latestData = q.state.data as AnalysisResponse | undefined
            return (latestData?.status === "COMPLETE" || latestData?.status === "ERROR") ? false : 2000
        },
        refetchIntervalInBackground: true,
    })

    // Update polling status based on analysis result
    useEffect(() => {
        if (analysisResult?.status === "COMPLETE" || analysisResult?.status === "ERROR") {
            setPollingActive(false)
        }
    }, [analysisResult?.status])

    // Initiate Analysis Mutation
    const initiateAnalysisMutation = useMutation({
        mutationFn: async () => {
            const res = await axios.post("/api/analysis", {
                resumeId,
                jobDescription: jobInput,
                isUrl,
                provider: config.provider,
                apiKey: config.apiKey,
                model: config.model
            }, {
                timeout: 10000 // Quick timeout for initial request
            })
            return res.data
        },
        onSuccess: (data) => {
            setAnalysisId(data.id)
            setPollingActive(true)
        }
    })

    const handleSubmit = () => {
        if (!config.apiKey) {
            alert("Please provide an API Key in settings!")
            setShowSettings(true)
            return
        }
        if (!resumeId) {
            alert("Please select or upload a resume")
            return
        }
        initiateAnalysisMutation.mutate()
    }

    // Effect to update local resumeId if new one uploaded
    if (uploadedResumeId && resumeId !== uploadedResumeId) {
        setResumeId(uploadedResumeId)
    }
    const isAnalyzing = analysisResult?.status === "PENDING" || analysisResult?.status === "PROCESSING" || isPolling
    const isComplete = analysisResult?.status === "COMPLETE"
    const hasError = analysisResult?.status === "ERROR" || initiateAnalysisMutation.isError

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Job Analysis</h2>
                <div className="flex gap-2">
                    <Link href="/history">
                        <Button variant="outline" size="sm">
                            <History className="w-4 h-4 mr-2" />
                            History
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="w-4 h-4 mr-2" />
                        AI Settings
                    </Button>
                </div>
            </div>

            {showSettings && (
                <Card className="bg-muted/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base">AI Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Provider</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={config.provider}
                                onChange={(e) => updateConfig({ provider: e.target.value as any })}
                            >
                                <option value="GEMINI">Google Gemini</option>
                                <option value="OPENAI">OpenAI</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>API Key</Label>
                            <Input
                                type="password"
                                placeholder="Enter API Key"
                                value={config.apiKey}
                                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Model Name</Label>
                            <Input
                                placeholder="gemini-1.5-pro or gpt-4"
                                value={config.model}
                                onChange={(e) => updateConfig({ model: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-1">
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid gap-2">
                            <Label>Select Resume</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={resumeId}
                                onChange={(e) => setResumeId(e.target.value)}
                            >
                                <option value="">-- Select a Resume --</option>
                                {resumes?.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.filename} ({new Date(r.uploadDate).toLocaleDateString()})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Job Description</Label>
                            <div className="flex items-center gap-2 mb-2">
                                <Button
                                    variant={isUrl ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsUrl(true)}
                                >
                                    URL
                                </Button>
                                <Button
                                    variant={!isUrl ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setIsUrl(false)}
                                >
                                    Text
                                </Button>
                            </div>
                            {isUrl ? (
                                <Input
                                    placeholder="Paste Job URL (LinkedIn, Indeed...)"
                                    value={jobInput}
                                    onChange={(e) => setJobInput(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                            ) : (
                                <Textarea
                                    placeholder="Paste the full job description here..."
                                    className="min-h-[150px]"
                                    value={jobInput}
                                    onChange={(e) => setJobInput(e.target.value)}
                                    disabled={isAnalyzing}
                                />
                            )}
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={isAnalyzing || initiateAnalysisMutation.isPending}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {analysisResult?.status === "PENDING" ? "Queuing..." : "Analyzing..."}
                                </>
                            ) : (
                                "Analyze Fit"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {initiateAnalysisMutation.isError && (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold mb-1">Failed to initiate analysis</div>
                            {/* @ts-ignore */}
                            {initiateAnalysisMutation.error?.response?.data?.message || initiateAnalysisMutation.error?.message || "Please check your API Key and try again."}
                        </div>
                    </div>
                )}

                {hasError && analysisResult?.status === "ERROR" && (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <div className="font-semibold mb-1">Analysis failed</div>
                            {analysisResult.errorMessage || "An error occurred during analysis. Please try again."}
                        </div>
                    </div>
                )}

                {isAnalyzing && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <div>
                                    <div className="font-semibold text-blue-900">Analyzing your resume...</div>
                                    <div className="text-sm text-blue-700">
                                        {analysisResult?.status === "PENDING" ? "Waiting to process..." : "Processing with AI..."}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isComplete && analysisResult?.analysisResultJson && (
                    <AnalysisResult result={JSON.parse(analysisResult.analysisResultJson)} />
                )}
            </div>
        </div>
    )
}
