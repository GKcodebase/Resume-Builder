"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ApiProvider } from "@/context/ApiContext"
import { ResumeUpload } from "@/components/ResumeUpload"
import { JobAnalysisDashboard } from "@/components/JobAnalysisDashboard"

const queryClient = new QueryClient()

export default function Home() {
  const [uploadedResumeId, setUploadedResumeId] = useState<string | undefined>()

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider>
        <main className="min-h-screen bg-background p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="text-center space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Resume Analyzer</h1>
              <p className="text-muted-foreground text-lg">AI-powered job Application optimization</p>
            </header>

            <div className="grid gap-8 md:grid-cols-[300px_1fr]">
              <div className="space-y-6">
                <ResumeUpload onUploadSuccess={(id) => setUploadedResumeId(id)} />
                {/* Could add history list here later */}
              </div>

              <div className="space-y-6">
                <JobAnalysisDashboard uploadedResumeId={uploadedResumeId} />
              </div>
            </div>
          </div>
        </main>
      </ApiProvider>
    </QueryClientProvider>
  )
}
