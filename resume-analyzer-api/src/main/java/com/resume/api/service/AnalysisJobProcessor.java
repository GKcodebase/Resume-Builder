package com.resume.api.service;

import com.resume.api.entity.AnalysisStatus;
import com.resume.api.entity.JobAnalysis;
import com.resume.api.entity.Resume;
import com.resume.api.repository.JobAnalysisRepository;
import com.resume.api.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisJobProcessor {

    private final JobAnalysisRepository jobAnalysisRepository;
    private final ResumeRepository resumeRepository;
    private final ScraperService scraperService;
    private final AiService aiService;

    @Scheduled(fixedDelay = 2000) // Run every 2 seconds
    @Transactional
    public void processPendingAnalyses() {
        List<JobAnalysis> pendingAnalyses = jobAnalysisRepository.findByStatusOrderByCreatedAtAsc(AnalysisStatus.PENDING);
        
        if (!pendingAnalyses.isEmpty()) {
            log.info("Found {} pending analyses to process", pendingAnalyses.size());
        }

        for (JobAnalysis analysis : pendingAnalyses) {
            try {
                processAnalysis(analysis);
            } catch (Exception e) {
                log.error("Error processing analysis {}: {}", analysis.getId(), e.getMessage(), e);
                analysis.setStatus(AnalysisStatus.ERROR);
                analysis.setErrorMessage(e.getMessage());
                analysis.setUpdatedAt(LocalDateTime.now());
                jobAnalysisRepository.save(analysis);
            }
        }
    }

    private void processAnalysis(JobAnalysis analysis) throws Exception {
        log.info("Processing analysis: {}", analysis.getId());
        
        // Update status to PROCESSING
        analysis.setStatus(AnalysisStatus.PROCESSING);
        analysis.setUpdatedAt(LocalDateTime.now());
        jobAnalysisRepository.save(analysis);

        // Fetch resume
        Resume resume = resumeRepository.findById(analysis.getResume().getId())
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        // Process job description (scrape if URL)
        String jobDescriptionText = analysis.getJobDescriptionEntry();
        try {
            // Simple heuristic: if it starts with http, treat as URL
            if (jobDescriptionText.startsWith("http://") || jobDescriptionText.startsWith("https://")) {
                log.info("Scraping job description from URL");
                jobDescriptionText = scraperService.scrapeJobDescription(jobDescriptionText);
            }
        } catch (Exception e) {
            log.warn("Failed to scrape URL, using original text: {}", e.getMessage());
            // Continue with original text
        }

        // Construct prompt
        String prompt = constructPrompt(resume.getContent(), jobDescriptionText);

        // Call AI
        log.info("Calling AI service for analysis");
        String analysisJson = aiService.analyzeJob(
                analysis.getProviderUsed(),
                analysis.getApiKey(),
                analysis.getModelUsed(),
                prompt
        );

        // Update with results
        analysis.setAnalysisResultJson(analysisJson);
        analysis.setStatus(AnalysisStatus.COMPLETE);
        analysis.setErrorMessage(null);
        analysis.setUpdatedAt(LocalDateTime.now());
        jobAnalysisRepository.save(analysis);
        
        log.info("Analysis completed successfully: {}", analysis.getId());
    }

    private String constructPrompt(String resumeText, String jobDescription) {
        return """
                You are an expert Resume Analyzer and Career Coach.
                Analyze the following Resume against the Job Description.

                JOB DESCRIPTION:
                %s

                RESUME:
                %s

                Output the result strictly in JSON format with the following structure:
                {
                  "atsScore": 0-100,
                  "recruiterScore": 0-100,
                  "matchRatio": "0-100%%",
                  "missingKeywords": ["list", "of", "keywords"],
                  "matchingKeywords": ["list", "of", "keywords"],
                  "successProbability": "Low/Medium/High",
                  "summary": "Brief summary of fit",
                  "improvements": ["bullet", "points"],
                  "preparationMaterials": [
                     {"title": "Topic", "link": "search query or url"}
                  ],
                  "coverLetter": "Draft a professional cover letter...",
                  "tailoredResume": "Rewrite the resume in Markdown format, highlighting experience relevant to the job description..."
                }
                Do not include markdown formatting like ```json ... ```, just the raw JSON.
                """
                .formatted(jobDescription, resumeText);
    }
}
