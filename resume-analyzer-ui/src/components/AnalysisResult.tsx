import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, FileText, AlertTriangle, Copy, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface AnalysisResultData {
    atsScore: number
    recruiterScore: number
    matchRatio: string
    missingKeywords: string[]
    matchingKeywords: string[]
    successProbability: string
    summary: string
    improvements: string[]
    preparationMaterials: Array<{ title: string; link: string }>
    coverLetter: string
    tailoredResume?: string
}

export function AnalysisResult({ result }: { result: AnalysisResultData }) {
    if (!result) return null

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert("Copied to clipboard!")
    }

    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
                    <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                    <TabsTrigger value="tailored-resume">Tailored Resume</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">ATS Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-primary">{result.atsScore}/100</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Recruiter Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-600">{result.recruiterScore}/100</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Keyword Match & Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2 text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Matching Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.matchingKeywords?.map(k => (
                                        <span key={k} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-red-600 flex items-center"><XCircle className="w-4 h-4 mr-2" /> Missing Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.missingKeywords?.map(k => (
                                        <span key={k} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-semibold mb-2">Summary</h4>
                                <p className="text-sm text-muted-foreground">{result.summary}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.improvements?.map((imp, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500 shrink-0 mt-0.5" />
                                        {imp}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preparation Materials</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {result.preparationMaterials?.map((mat, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                        <a href={mat.link.startsWith('http') ? mat.link : `https://google.com/search?q=${encodeURIComponent(mat.link)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                            <FileText className="w-4 h-4 mr-2 shrink-0" />
                                            {mat.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cover-letter">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Generated Cover Letter</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.coverLetter)}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => downloadFile(result.coverLetter, "Cover_Letter.txt")}>
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-sm font-mono p-4 bg-muted/50 rounded-md border">
                                {result.coverLetter}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tailored-resume">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Tailored Resume</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.tailoredResume || "")}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => downloadFile(result.tailoredResume || "", "Tailored_Resume.md")}>
                                    <Download className="w-4 h-4 mr-2" /> Download MD
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-sm font-mono p-4 bg-muted/50 rounded-md border h-[600px] overflow-y-auto">
                                {result.tailoredResume || "No tailored resume generated yet."}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
