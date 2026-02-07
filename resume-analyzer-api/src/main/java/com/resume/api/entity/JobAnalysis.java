package com.resume.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    private String jobTitle;
    
    private String companyName;

    @Lob
    @Column(length = 10000)
    private String jobDescriptionEntry; // The raw input (text, url, etc)

    @Lob
    @Column(columnDefinition = "TEXT")
    private String analysisResultJson; // JSON string of the result

    private String providerUsed; // "GEMINI" or "OPENAI"
    
    private String modelUsed;

    @Column(length = 1000)
    private String apiKey; // Store API key for background processing

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AnalysisStatus status = AnalysisStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String errorMessage; // Error details if status is ERROR

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
