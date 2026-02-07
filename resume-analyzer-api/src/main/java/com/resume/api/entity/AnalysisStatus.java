package com.resume.api.entity;

public enum AnalysisStatus {
    PENDING,      // Waiting to be processed
    PROCESSING,   // Currently being analyzed by AI
    COMPLETE,     // Successfully completed
    ERROR         // Failed during processing
}
