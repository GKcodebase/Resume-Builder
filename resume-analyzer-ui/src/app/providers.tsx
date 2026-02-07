"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ApiProvider } from "@/context/ApiContext"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <ApiProvider>
                {children}
            </ApiProvider>
        </QueryClientProvider>
    )
}
