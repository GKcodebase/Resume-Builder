package com.resume.api.service;

import com.resume.api.entity.JobAnalysis;
import com.resume.api.entity.AnalysisStatus;
import com.resume.api.entity.Resume;
import com.resume.api.repository.JobAnalysisRepository;
import com.resume.api.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final ResumeRepository resumeRepository;
    private final JobAnalysisRepository jobAnalysisRepository;
    private final ScraperService scraperService;

    /**
     * Phase 1: Fast endpoint - validates and creates pending analysis record
     * Returns immediately without waiting for AI processing
     */
    public JobAnalysis initiateAnalysis(UUID resumeId, String jobDescriptionInput, boolean isUrl, 
                                       String provider, String apiKey, String model) throws IOException {
        
        // 1. Validate Resume exists
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        log.info("Initiating analysis for resume: {}", resumeId);

        // 2. Validate Job Description Input
        if (jobDescriptionInput == null || jobDescriptionInput.trim().isEmpty()) {
            throw new RuntimeException("Job description cannot be empty");
        }

        // 3. Try to scrape if URL (fail gracefully and store original URL)
        String jobDescriptionText = jobDescriptionInput;
        if (isUrl) {
            try {
                log.info("Pre-scraping job description from URL to validate...");
                jobDescriptionText = scraperService.scrapeJobDescription(jobDescriptionInput);
                log.info("URL scraped successfully, length: {}", jobDescriptionText.length());
            } catch (Exception e) {
                log.warn("Failed to pre-scrape URL, will retry during processing: {}", e.getMessage());
                // Don't fail here, let the background processor retry
            }
        }

        // 4. Create PENDING analysis record
        JobAnalysis analysis = JobAnalysis.builder()
                .resume(resume)
                .jobDescriptionEntry(jobDescriptionInput) // Store original input
                .analysisResultJson(null) // Will be filled by background processor
                .providerUsed(provider)
                .modelUsed(model != null && !model.isEmpty() ? model : "default")
                .apiKey(apiKey) // Store API key for background processing
                .status(AnalysisStatus.PENDING)
                .errorMessage(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        JobAnalysis savedAnalysis = jobAnalysisRepository.save(analysis);
        log.info("Analysis initiated with ID: {}, status: PENDING", savedAnalysis.getId());

        return savedAnalysis;
    }
}
