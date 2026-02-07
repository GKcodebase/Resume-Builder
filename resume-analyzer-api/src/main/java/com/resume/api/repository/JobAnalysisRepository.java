package com.resume.api.repository;

import com.resume.api.entity.JobAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface JobAnalysisRepository extends JpaRepository<JobAnalysis, UUID> {
    List<JobAnalysis> findByResumeIdOrderByCreatedAtDesc(UUID resumeId);
}
