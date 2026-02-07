package com.resume.api.controller;

import com.resume.api.entity.Resume;
import com.resume.api.repository.ResumeRepository;
import com.resume.api.service.PdfExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow all for dev/firebase
public class ResumeController {

    private final ResumeRepository resumeRepository;
    private final PdfExtractionService pdfExtractionService;

    @PostMapping("/upload")
    public ResponseEntity<Resume> uploadResume(@RequestParam("file") MultipartFile file) throws IOException {
        String content = "";
        if (file.getOriginalFilename() != null && file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            content = pdfExtractionService.extractTextFromPdf(file.getInputStream());
        } else {
            // Assume text or docx (not impl yet) - just storing bytes as string for now if
            // text
            content = new String(file.getBytes());
        }

        Resume resume = Resume.builder()
                .filename(file.getOriginalFilename())
                .content(content)
                .build();

        return ResponseEntity.ok(resumeRepository.save(resume));
    }

    @GetMapping
    public List<Resume> getAllResumes() {
        return resumeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resume> getResume(@PathVariable UUID id) {
        return ResponseEntity.of(resumeRepository.findById(id));
    }
}
