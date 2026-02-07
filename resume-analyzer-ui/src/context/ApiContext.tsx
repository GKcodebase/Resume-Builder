"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface ApiConfig {
    provider: "GEMINI" | "OPENAI"
    apiKey: string
    model: string
}

interface ApiContextType {
    config: ApiConfig
    updateConfig: (config: Partial<ApiConfig>) => void
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export function ApiProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<ApiConfig>({
        provider: "GEMINI",
        apiKey: "",
        model: "gemini-1.5-pro",
    })

    useEffect(() => {
        const stored = localStorage.getItem("apiConfig")
        if (stored) {
            setConfig(JSON.parse(stored))
        }
    }, [])

    const updateConfig = (newConfig: Partial<ApiConfig>) => {
        setConfig((prev) => {
            const updated = { ...prev, ...newConfig }
            localStorage.setItem("apiConfig", JSON.stringify(updated))
            return updated
        })
    }

    return (
        <ApiContext.Provider value={{ config, updateConfig }}>
            {children}
        </ApiContext.Provider>
    )
}

export const useApiConfig = () => {
    const context = useContext(ApiContext)
    if (!context) throw new Error("useApiConfig must be used within ApiProvider")
    return context
}
