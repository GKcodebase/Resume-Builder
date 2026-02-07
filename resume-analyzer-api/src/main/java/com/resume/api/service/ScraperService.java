package com.resume.api.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class ScraperService {

    public String scrapeJobDescription(String url) throws IOException {
        Document doc = Jsoup.connect(url)
                .userAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .get();

        // Basic scraping: get title and body text. Can be improved with heuristics.
        String title = doc.title();
        String body = doc.body().text();

        return "Title: " + title + "\n\nBody: " + body;
    }
}
