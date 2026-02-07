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

    @PostMapping
    public ResponseEntity<JobAnalysis> analyzeJob(@RequestBody AnalysisRequest request) throws IOException {
        JobAnalysis analysis = analysisService.analyze(
                request.getResumeId(),
                request.getJobDescription(),
                request.isUrl(),
                request.getProvider(),
                request.getApiKey(),
                request.getModel());
        return ResponseEntity.ok(analysis);
    }

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
