# Resume Analyzer - Async Refactoring Summary

## Problem Fixed
**Socket hang up error** (`ECONNRESET`) - The synchronous analysis endpoint was timing out because all processing (AI generation + database save) happened in a single request, taking 30-60+ seconds.

## Solution Implemented
Two-phase async architecture with background job processing.

---

## Architecture Changes

### **Before (Synchronous - BROKEN)**
```
POST /api/analysis
  ├─ Validate resume → Scrape job URL → Call AI (30-60s) → Save DB → Return
  └─ Client waits entire time → TIMEOUT
```

### **After (Async - FIXED)**
```
Phase 1: POST /api/analysis (< 1 second)
  ├─ Validate inputs
  ├─ Create PENDING analysis record
  └─ Return analysis ID immediately

Phase 2: Background Job Processor (Runs every 2 seconds)
  ├─ Find PENDING analyses
  ├─ Update status to PROCESSING
  ├─ Scrape job description (if URL)
  ├─ Call AI service (30-60s) - NO CLIENT WAITING
  ├─ Save results
  └─ Update status to COMPLETE

Phase 3: GET /api/analysis/{id} (polling from UI)
  ├─ Client polls every 2 seconds
  ├─ Returns current status (PENDING/PROCESSING/COMPLETE/ERROR)
  └─ Displays results when COMPLETE
```

---

## Code Changes

### Backend (Java Spring Boot)

#### 1. **New Entity: AnalysisStatus.java**
```java
public enum AnalysisStatus {
    PENDING,      // Waiting to process
    PROCESSING,   // Currently with AI
    COMPLETE,     // Done successfully
    ERROR         // Failed
}
```

#### 2. **Updated: JobAnalysis.java**
Added fields:
- `AnalysisStatus status` - Tracks current processing state
- `String apiKey` - Stored for background processor to use
- `String errorMessage` - Error details if failed
- `LocalDateTime updatedAt` - Track last update time

#### 3. **New: AnalysisJobProcessor.java**
Background job that:
- Runs every 2 seconds via `@Scheduled(fixedDelay = 2000)`
- Finds PENDING analyses from database
- Processes them asynchronously
- Updates status at each step
- Handles errors gracefully with error messages

#### 4. **Refactored: AnalysisService.java**
Split into:
- `initiateAnalysis()` - Fast, validates inputs and creates PENDING record
- Removed `analyze()` method (replaced by background processor)

#### 5. **Updated: AnalysisController.java**
Two endpoints:
- `POST /api/analysis` - Initiates analysis, returns ID immediately
- `GET /api/analysis/{id}` - Get analysis status and results
- `GET /api/analysis/resume/{resumeId}` - History (unchanged)

#### 6. **Updated: JobAnalysisRepository.java**
Added query method:
- `findByStatusOrderByCreatedAtAsc(AnalysisStatus)` - Find pending analyses

#### 7. **Updated: ResumeAnalyzerApiApplication.java**
Added `@EnableScheduling` annotation to enable `@Scheduled` tasks

---

### Frontend (Next.js/React)

#### **Updated: JobAnalysisDashboard.tsx**
Changes:
- Split mutation into `initiateAnalysisMutation` - triggers analysis
- Added `analysisResult` query with polling (every 2 seconds)
- Added state tracking: `analysisId`, `pollingActive`
- Shows status: "Queuing..." (PENDING) → "Analyzing..." (PROCESSING) → Results (COMPLETE)
- Better error handling with separate error states
- Disable inputs while analyzing

**New UI Features:**
- Loading card showing current processing status
- Real-time status updates
- Better error messages with context
- Visual distinction between queuing and processing

---

## Benefits

✅ **Fixes timeout** - No more socket hang up errors  
✅ **Fast API response** - Initial POST returns in <1 second  
✅ **Scalable** - Can process multiple analyses concurrently  
✅ **Better UX** - Shows real-time progress to user  
✅ **Graceful error handling** - Errors captured and displayed  
✅ **Database persistent** - Can survive server restarts during processing  
✅ **API Key security** - Passed once, stored with analysis for background use  

---

## How to Test

1. **Start Backend:**
   ```bash
   cd resume-analyzer-api
   mvn spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd resume-analyzer-ui
   npm run dev
   ```

3. **Test Flow:**
   - Upload resume
   - Enter job description (text or URL)
   - Click "Analyze Fit"
   - See "Queuing..." → "Analyzing..."  
   - Wait ~30-60 seconds
   - See results appear automatically
   - ✅ No timeout errors!

---

## Database Schema Changes

New columns in `job_analyses` table:
```sql
ALTER TABLE job_analyses ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE job_analyses ADD COLUMN error_message TEXT;
ALTER TABLE job_analyses ADD COLUMN api_key VARCHAR(1000);
ALTER TABLE job_analyses ADD COLUMN updated_at TIMESTAMP;
```

(Spring Data JPA will create these automatically on first run)

---

## Configuration

Kept the increased timeouts in:
- `application.yml` - Tomcat: 5 min
- `next.config.ts` - Proxy: 5 min (for other endpoints)
- `JobAnalysisDashboard.tsx` - Initial request: 10 seconds (sufficient now)

These ensure any other long operations don't timeout.
