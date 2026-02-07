"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ResumeUpload({ onUploadSuccess }: { onUploadSuccess: (id: string) => void }) {
    const [file, setFile] = useState<File | null>(null)
    const queryClient = useQueryClient()

    const uploadMutation = useMutation({
        mutationFn: async (fileToUpload: File) => {
            const formData = new FormData()
            formData.append("file", fileToUpload)
            const res = await axios.post("/api/resumes/upload", formData)
            return res.data
        },
        onSuccess: (data) => {
            onUploadSuccess(data.id)
            queryClient.invalidateQueries({ queryKey: ["resumes"] })
            setFile(null)
        },
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>Upload your resume (PDF) to start analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                    />
                    <Button
                        onClick={() => file && uploadMutation.mutate(file)}
                        disabled={!file || uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
                    </Button>
                </div>

                {uploadMutation.isError && (
                    <div className="flex items-center text-red-500 text-sm">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        {/* @ts-ignore */}
                        {uploadMutation.error?.response?.data?.message || "Upload failed. Please try again."}
                    </div>
                )}

                {uploadMutation.isSuccess && (
                    <div className="flex items-center text-green-500 text-sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Resume uploaded successfully!
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
