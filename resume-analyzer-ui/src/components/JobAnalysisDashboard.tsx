"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useApiConfig } from "@/context/ApiContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AnalysisResult } from "@/components/AnalysisResult"
import { Loader2, Settings } from "lucide-react"

export function JobAnalysisDashboard({ uploadedResumeId }: { uploadedResumeId?: string }) {
    const { config, updateConfig } = useApiConfig()
    const [jobInput, setJobInput] = useState("")
    const [isUrl, setIsUrl] = useState(false)
    const [resumeId, setResumeId] = useState(uploadedResumeId || "")
    const [showSettings, setShowSettings] = useState(false)

    // Fetch list of resumes
    const { data: resumes } = useQuery({
        queryKey: ["resumes"],
        queryFn: async () => (await axios.get("/api/resumes")).data
    })

    // Analysis Mutation
    const analysisMutation = useMutation({
        mutationFn: async () => {
            const res = await axios.post("/api/analysis", {
                resumeId,
                jobDescription: jobInput,
                isUrl,
                provider: config.provider,
                apiKey: config.apiKey,
                model: config.model
            })
            return res.data
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
        analysisMutation.mutate()
    }

    // Effect to update local resumeId if new one uploaded
    if (uploadedResumeId && resumeId !== uploadedResumeId) {
        setResumeId(uploadedResumeId)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Job Analysis</h2>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="w-4 h-4 mr-2" />
                    AI Settings
                </Button>
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
                                />
                            ) : (
                                <Textarea
                                    placeholder="Paste the full job description here..."
                                    className="min-h-[150px]"
                                    value={jobInput}
                                    onChange={(e) => setJobInput(e.target.value)}
                                />
                            )}
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={analysisMutation.isPending}
                        >
                            {analysisMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                            ) : (
                                "Analyze Fit"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {analysisMutation.isError && (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                        {/* @ts-ignore */}
                        {analysisMutation.error?.response?.data?.message || analysisMutation.error?.message || "Analysis failed. Check your API Key and try again."}
                    </div>
                )}

                {analysisMutation.data && (
                    <AnalysisResult result={JSON.parse(analysisMutation.data.analysisResultJson)} />
                )}
            </div>
        </div>
    )
}
