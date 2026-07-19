# ResumeAI-Pro Frontend UI Polish Checklist

## Planned implementation order

### 0) Foundation (SaaS look & shared UI)
- [ ] Create a base UI stylesheet (`app.css`) with shared components tokens (cards, buttons, inputs, page shell).
- [ ] Add reusable UI components: `Modal`, `Toast`, `CircularProgress`, `Badge` (reuse existing loader/spinner if present).
- [ ] Update Navbar to production-quality with active highlighting + authenticated links + Logout.

### 1) Dashboard
- [ ] Replace placeholder dashboard with metrics + quick actions.

### 2) Resume Builder
- [ ] Rework ResumeBuilder layout (55/45), sticky preview, fixed save button in form.
- [ ] Improve resume preview styling and hide empty sections.

### 3) My Resumes
- [ ] Replace list with resume cards (ATS badge, created/updated, view/edit/optimize/delete).
- [ ] Add loading + empty states.
- [ ] Add delete confirmation modal.

### 4) Upload Resume
- [ ] Drag/drop upload with PDF/DOCX validation.
- [ ] Upload progress bar.
- [ ] Success/error messages + uploaded file details.

### 5) Optimize Resume
- [ ] Circular ATS score, missing keywords, suggestions.
- [ ] Before/after comparison and download button.

### 6) Profile
- [ ] Full editable profile fields + avatar.
- [ ] Cancel, validation, loading indicator, success toast.

### 7) Verification
- [ ] Run `npm run build` in `frontend/frontend`.
- [ ] Smoke test all protected routes manually.

