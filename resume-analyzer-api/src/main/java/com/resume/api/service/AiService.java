package com.resume.api.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@Slf4j
public class AiService {

    public String analyzeJob(String provider, String apiKey, String modelName, String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("API Key is required for provider: " + provider);
        }

        ChatLanguageModel chatModel;
        try {
            log.info("Initializing AI Model. Provider: {}, Model: {}", provider, modelName);

            if ("GEMINI".equalsIgnoreCase(provider)) {
                chatModel = GoogleAiGeminiChatModel.builder()
                        .apiKey(apiKey)
                        .modelName(modelName != null && !modelName.isEmpty() ? modelName : "gemini-1.5-pro")
                        .temperature(0.7)
                        .timeout(Duration.ofSeconds(120))
                        .build();
            } else if ("OPENAI".equalsIgnoreCase(provider)) {
                chatModel = OpenAiChatModel.builder()
                        .apiKey(apiKey)
                        .modelName(modelName != null && !modelName.isEmpty() ? modelName : "gpt-4o")
                        .temperature(0.7)
                        .timeout(Duration.ofSeconds(120))
                        .build();
            } else {
                throw new IllegalArgumentException("Unsupported provider: " + provider);
            }
        } catch (Exception e) {
            log.error("Failed to initialize AI model for provider: {}", provider, e);
            throw new RuntimeException("Failed to initialize AI provider: " + e.getMessage());
        }

        try {
            log.info("Sending request to AI provider...");
            String response = chatModel.generate(prompt);
            log.info("Received response from AI provider (length: {})", response != null ? response.length() : 0);
            return response;
        } catch (Exception e) {
            log.error("Error during AI generation. Provider: {}", provider, e);
            // Check for common errors usually wrapped in runtime exceptions by LangChain4j
            if (e.getMessage().contains("401")) {
                throw new RuntimeException("Authentication failed (401). Please check your API Key.");
            } else if (e.getMessage().contains("429")) {
                throw new RuntimeException("Rate limit exceeded (429). Please try again later.");
            } else if (e.getMessage().contains("quota")) {
                throw new RuntimeException("Quota exceeded. Please check your billing/usage.");
            }
            throw new RuntimeException("AI Generation failed: " + e.getMessage());
        }
    }
}
