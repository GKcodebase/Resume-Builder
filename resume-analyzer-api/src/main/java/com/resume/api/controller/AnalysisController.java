package com.resume.api.controller;

import com.resume.api.entity.JobAnalysis;
import com.resume.api.repository.JobAnalysisRepository;
import com.resume.api.service.AnalysisService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final JobAnalysisRepository jobAnalysisRepository;

    /**
     * POST /api/analysis - Initiate analysis (returns immediately)
     * The actual AI analysis happens asynchronously in the background
     */
    @PostMapping
    public ResponseEntity<JobAnalysis> analyzeJob(@RequestBody AnalysisRequest request) throws IOException {
        JobAnalysis analysis = analysisService.initiateAnalysis(
                request.getResumeId(),
                request.getJobDescription(),
                request.isUrl(),
                request.getProvider(),
                request.getApiKey(),
                request.getModel());
        return ResponseEntity.ok(analysis);
    }

    /**
     * GET /api/analysis/{id} - Get analysis status and results
     * Returns current status (PENDING, PROCESSING, COMPLETE, ERROR) and results if complete
     */
    @GetMapping("/{id}")
    public ResponseEntity<JobAnalysis> getAnalysis(@PathVariable UUID id) {
        return ResponseEntity.of(jobAnalysisRepository.findById(id));
    }

    /**
     * GET /api/analysis/resume/{resumeId} - Get analysis history for a resume
     */
    @GetMapping("/resume/{resumeId}")
    public List<JobAnalysis> getHistory(@PathVariable UUID resumeId) {
        return jobAnalysisRepository.findByResumeIdOrderByCreatedAtDesc(resumeId);
    }

    @Data
    public static class AnalysisRequest {
        private UUID resumeId;
        private String jobDescription; // text or url
        private boolean isUrl;
        private String provider; // GEMINI or OPENAI
        private String apiKey;
        private String model;
    }
}
