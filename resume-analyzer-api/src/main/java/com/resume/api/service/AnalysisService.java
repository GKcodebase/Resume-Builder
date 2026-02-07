package com.resume.api.service;

import com.resume.api.entity.JobAnalysis;
import com.resume.api.entity.Resume;
import com.resume.api.repository.JobAnalysisRepository;
import com.resume.api.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final ResumeRepository resumeRepository;
    private final JobAnalysisRepository jobAnalysisRepository;
    private final ScraperService scraperService;
    private final AiService aiService;

    public JobAnalysis analyze(UUID resumeId, String jobDescriptionInput, boolean isUrl, String provider, String apiKey,
            String model) throws IOException {
        // 1. Fetch Resume
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        // 2. Process Job Description
        String jobDescriptionText = jobDescriptionInput;
        if (isUrl) {
            try {
                jobDescriptionText = scraperService.scrapeJobDescription(jobDescriptionInput);
            } catch (Exception e) {
                log.error("Failed to scrape URL", e);
                throw new RuntimeException("Failed to scrape Job URL: " + e.getMessage());
            }
        }

        // 3. Construct Prompt
        String prompt = constructPrompt(resume.getContent(), jobDescriptionText);

        // 4. Call AI
        String analysisJson = aiService.analyzeJob(provider, apiKey, model, prompt);

        // 5. Save Result
        JobAnalysis analysis = JobAnalysis.builder()
                .resume(resume)
                .jobDescriptionEntry(jobDescriptionInput) // Save the original input (URL or text)
                .analysisResultJson(analysisJson)
                .providerUsed(provider)
                .modelUsed(model)
                .build();

        return jobAnalysisRepository.save(analysis);
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
                  "coverLetter": "Draft text..."
                }
                Do not include markdown formatting like ```json ... ```, just the raw JSON.
                """.formatted(jobDescription, resumeText);
    }
}
