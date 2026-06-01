---
name: "blog-deploy-qa"
description: "Blog deployment quality assurance using browser automation. Invoke after git push to GitHub to verify blog functionality, UI rendering, comment system status, and overall site health. Automatically detects issues and generates detailed QA reports."
---

# Blog Deployment Quality Assurance (QA) Skill

This skill provides automated quality assurance testing for blog deployments using browser automation. It verifies that code changes have been successfully deployed and all features are working correctly.

## When to Use

**Automatically invoke this skill when:**
- ✅ Git push to GitHub has been successfully completed
- ✅ GitHub Actions deployment has finished (or after waiting period)
- ✅ User asks to verify deployment status
- ✅ User reports potential issues with the blog
- ✅ After any code changes affecting:
  - Comment system (Waline/Twikoo)
  - UI/CSS changes
  - JavaScript functionality
  - New pages or features

**Do NOT use when:**
- ❌ Code has not been pushed yet
- ❌ Only local testing is needed
- ❌ User wants to create/modify code (not test it)

## Prerequisites

Before invoking this skill, ensure:

1. **Deployment URL**: Blog must be accessible at `https://deepsleep.fun` (or configured URL)
2. **Push Confirmation**: Code has been successfully pushed to `origin/main`
3. **Wait Time**: Allow 5-8 minutes for CDN propagation if deployment just completed
4. **Browser Agent**: Browser use agent (`browser_use`) subagent type is available

## Testing Workflow

### Phase 1: Quick Health Check (0-10 seconds)

**Objective**: Verify basic page accessibility and load status

```
Task for browser_use agent:
1. Access target URL (default: https://deepsleep.fun/posts/1/)
2. Force refresh (Ctrl+Shift+R)
3. Check:
   - HTTP status (should be 200)
   - Page title loads correctly
   - No immediate crash/error pages
   - Basic layout renders
4. Record: Load time, page size, initial errors
```

### Phase 2: Feature-Specific Testing (10-25 seconds)

**Objective**: Test specific functionality based on recent changes

#### A. Comment System Verification (if comments.html modified)

```yaml
Checklist:
  - Comment container exists (#waline or #twikoo)
  - Input fields visible:
    - Nickname/Name field (if requiredMeta includes 'nick')
    - Email field (if requiredMeta includes 'email')
    - Comment content textarea
  - Submit button present and clickable
  - Console log shows initialization success:
    - Waline: "[Waline] 初始化成功"
    - Twikoo: No critical errors
  - No TypeError/ReferenceError in console
  - CSS styling applied correctly (golden theme, borders, etc.)
```

#### B. UI/Layout Verification (if CSS or layouts modified)

```yaml
Checklist:
  - Header displays correctly ("💬 发表评论")
  - Welcome text visible
  - Input boxes properly styled (borders, padding, border-radius)
  - Responsive design works (check mobile view if possible)
  - Color scheme matches theme (#D4AF37 gold accents)
  - No overlapping elements
  - Images/icons load properly
```

#### C. JavaScript Functionality (if JS modified)

```yaml
Checklist:
  - All scripts loaded (check Network tab)
  - No console errors (red text)
  - Interactive elements respond (buttons, inputs, toggles)
  - Dark mode toggle works (if applicable)
  - Search functionality operational (if modified)
  - Navigation menus functional
```

### Phase 3: Deep Diagnostics (25-40 seconds)

**Objective**: Identify root cause if any issues detected

```
Diagnostic Steps:
1. Check Network Requests:
   - Filter by JS/CSS/XHR
   - Verify all resources return HTTP 200
   - Note any 404/500 errors
   - Check resource sizes are reasonable
   
2. Console Analysis:
   - Copy ALL console output (errors + warnings + info)
   - Look for specific error patterns:
     * "is not defined" → Script loading issue
     * "is not a function" → API mismatch
     * "filter is not a function" → Data format issue
     * CORS errors → Domain configuration
     * Network failures → CDN/server issues
   
3. DOM Inspection:
   - Locate key elements via Elements tab
   - Verify element visibility (not display:none)
   - Check computed styles (opacity, visibility, dimensions)
   - Validate HTML structure matches expectations
   
4. Global Variable Checks (for Waline):
   ```
   typeof Waline → should be "object" or "function"
   typeof Waline.init → should be "function"
   Object.keys(Waline) → should show available methods
   ```
```

### Phase 4: Functionality Test (40-55 seconds)

**Objective**: Attempt actual user interactions

```
Interaction Tests:
1. Fill in test data (without submitting):
   - Nickname: "QA Tester"
   - Email: "qa@test.com"
   - Comment: "🤖 Automated QA test - [timestamp]"
   
2. Verify:
   - Input accepts characters
   - Character count updates
   - Validation messages appear if needed
   - No crashes on input
   
3. Optional: Click submit (only if user approves):
   - Observe success/error response
   - Check for loading states
   - Verify comment appears in list (if not moderated)
```

### Phase 5: Report Generation (55-60 seconds)

**Objective**: Generate comprehensive QA report

```markdown
## 📋 Blog Deployment QA Report

**Test Time**: [timestamp]
**Target URL**: [url]
**Commit**: [commit hash if known]
**Total Duration**: [seconds]

### ✅ Overall Status: PASS / FAIL / WARNING

---

### 1️⃣ Page Load Status
- **HTTP Status**: 
- **Load Time**: 
- **Page Size**: 
- **Result**: ✅ PASS / ❌ FAIL

### 2️⃣ Comment System
| Component | Status | Details |
|-----------|--------|---------|
| Container Display | ✅/❌ | |
| Name Input Field | ✅/❌ | |
| Email Input Field | ✅/❌ | |
| Comment Textarea | ✅/❌ | |
| Submit Button | ✅/❌ | |
| Initialization Log | ✅/❌ | |

### 3️⃣ Console Analysis
- **Errors Found**: [count]
- **Critical Errors**: 
- **Warnings**: 

**Complete Error List**:
[Copy all console errors here]

### 4️⃣ Network Request Summary
- **Total Resources**: 
- **Failed Requests**: 
- **CDN Resources**: ✅/❌
- **API Calls**: ✅/❌

**Failed Resources**:
[List any non-200 responses]

### 5️⃣ UI/UX Verification
- **Layout**: ✅/❌
- **Styling**: ✅/❌
- **Responsiveness**: ✅/❌
- **Theme Colors**: ✅/❌

### 6️⃣ Functionality Test
- **Input Acceptance**: ✅/❌
- **Form Validation**: ✅/❌
- **Button Interaction**: ✅/❌
- **Comment Submission**: ⏭️ Skipped / ✅ Success / ❌ Failed

---

### 🎯 Issues Detected

**Critical (Must Fix)**:
1. [Issue description]
   - Location: [file:line or URL]
   - Impact: [what's broken]
   - Suggestion: [how to fix]

**Warning (Should Fix)**:
1. [Issue description]
   - Suggestion: [improvement recommendation]

**Info (Nice to Have)**:
1. [Observation]
   - Suggestion: [optimization idea]

---

### 📊 Scorecard

| Category | Score | Max |
|----------|-------|-----|
| Accessibility | X/10 | 10 |
| Functionality | X/10 | 10 |
| Performance | X/10 | 10 |
| UI/UX | X/10 | 10 |
| Error-Free | X/10 | 10 |
| **TOTAL** | **X/50** | 50 |

---

### 🚀 Recommendations

**Immediate Actions**:
1. [Action item 1]
2. [Action item 2]

**Future Improvements**:
1. [Improvement 1]
2. [Improvement 2]

---

**Report Generated By**: Blog Deploy QA Skill
**Next Review**: After next deployment
```

## Usage Examples

### Example 1: After Waline Fix Deployment

```
User: "I just pushed the Waline fix, can you verify it works?"
AI: [Invokes blog-deploy-qa skill]
   → Browser agent tests https://deepsleep.fun/posts/1/
   → Verifies comment input fields exist
   → Checks console for "[Waline] 初始化成功"
   → Reports: "✅ PASS - Comment system fully operational"
```

### Example 2: After CSS Changes

```
User: "Updated the golden theme colors, please check"
AI: [Invokes blog-deploy-qa skill]
   → Validates #D4AF37 color applied correctly
   → Checks responsive layout
   → Tests dark mode toggle
   → Reports: "⚠️ WARNING - Mobile view needs padding adjustment"
```

### Example 3: Routine Post-Deploy Check

```
User: "Just pushed commit abc1234"
AI: [Invokes blog-deploy-qa skill]
   → Full health check
   → All systems nominal
   → Reports: "✅ PASS - 50/50 score, no issues detected"
```

## Configuration

### Default Settings

```yaml
blog_url: "https://deepsleep.fun"
test_page: "/posts/1/"  # Default test article
wait_time: 8  # Seconds to wait before testing (for CDN)
timeout: 60  # Maximum test duration in seconds
screenshot: true  # Capture screenshots on failure
```

### Custom Test Pages

You can specify different URLs based on what was changed:

| Change Type | Recommended Test URL |
|-------------|----------------------|
| Comment system | `/posts/1/` (article page) |
| Homepage layout | `/` (home) |
| Archive page | `/archives/` |
| About page | `/about/` |
| Forum feature | `/forum/` |
| Search functionality | `/search/` |

## Integration with Workflow

### Ideal Workflow Pattern

```
1. Make code changes
2. Commit changes
3. Push to GitHub (git push origin main)
4. [AUTOMATICALLY INVOKE] blog-deploy-qa skill
   ↓
5. Wait 5-8 minutes (CDN propagation)
6. Browser agent executes full QA suite
7. Generate detailed report
8. Present results to user
9. If issues found → Fix → Repeat from step 1
10. If all pass → Deployment verified ✅
```

## Error Handling

### Common Failures and Auto-Diagnosis

| Error Pattern | Likely Cause | Auto-Fix Suggestion |
|--------------|-------------|-------------------|
| `Waline is not defined` | Wrong JS file format (ESM vs UMD) | Switch to `waline.umd.min.js` |
| `Waline is not a function` | v3 API change | Use `Waline.init()` instead of `Waline()` |
| `e.filter is not a function` | Config data type mismatch | Hardcode arrays instead of Hugo template |
| Input fields missing | CSS `display:none` hiding them | Remove `.wl-header { display: none }` |
| 404 on JS/CSS file | Wrong CDN path or version | Verify jsDelivr/unpkg URL |
| CORS error | ALLOWED_DOMAINS misconfigured | Set `ALLOWED_DOMAINS=*` |
| Blank comment area | Initialization crashed | Check console for specific error |

## Best Practices

1. **Always wait for CDN**: Don't test immediately after push; allow 5-8 minutes
2. **Force refresh**: Use Ctrl+Shift+R to bypass cache during testing
3. **Check multiple browsers**: If possible, test in Chrome + Firefox
4. **Document everything**: Screenshots + console logs + network info
5. **Test edge cases**: Empty inputs, very long text, special characters
6. **Verify mobile**: Check responsive design on small screens
7. **Validate security**: Ensure no sensitive data in console/logs
8. **Performance check**: Note load times, flag if >5 seconds

## Maintenance

### Updating This Skill

When blog architecture changes:
- Add new test cases for new features
- Update expected console logs
- Modify checklist items
- Adjust scoring criteria

### Version History

- **v1.0** (2026-05-31): Initial creation for DeepSleep blog
  - Focus: Waline comment system verification
  - Includes: UI checks, console analysis, functionality tests
  - Browser-based automation using browser_use agent

## Troubleshooting

### If Browser Agent Fails

**Problem**: Cannot launch browser or access site

**Solutions**:
1. Check internet connectivity
2. Verify blog URL is accessible manually
3. Try alternative browser agent configuration
4. Fall back to manual testing instructions

### If Tests Are Inconclusive

**Problem**: Some tests pass, some fail intermittently

**Solutions**:
1. Re-run tests 2-3 times for consistency
2. Increase wait time for slow CDNs
3. Check if issue is cache-related
4. Test at different times of day (server load)

---

## Support

For issues with this skill or false positives/negatives:
- Review the generated report carefully
- Manually verify reported issues
- Update test criteria as needed
- Contribute improvements to this skill definition

---

**Remember**: This skill ensures your blog deployments are production-ready! 🚀
